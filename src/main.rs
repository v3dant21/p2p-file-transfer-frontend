use std::time::Duration;
use std::{collections::HashMap, sync::Arc};
use axum::extract::ws::{Message, WebSocket};
use axum::extract::{State, WebSocketUpgrade};
use axum::response::IntoResponse;
use axum::{Router, routing::get};
use tokio::sync::{broadcast, mpsc, Mutex};
use tokio::time::interval; 
use serde_json::{Value,json};
use tower_http::services::ServeDir;
use futures_util::{StreamExt, SinkExt};
use serde::{Deserialize, Serialize};


use uuid::Uuid;
#[derive(Serialize, Deserialize)]
struct FileMetadata {
    name: String,
    size: u64,
    mime_type: String,
} 
#[derive(Clone)]
struct PeerInfo {
    tx: broadcast::Sender<Message>,
    role: String,
}

#[derive(Clone)]
struct AppState {
    connection: Arc<Mutex<HashMap<String, PeerInfo>>>,
}
#[tokio::main]
async fn main() {
    let state = AppState{
        connection: Arc::new(Mutex::new(HashMap::new()))
    };
    
    // Fix the router configuration
    let app = Router::new()
        .route("/ws", get(WebSocket_handler))
        .nest_service("/", ServeDir::new("./"))
        .with_state(state);

    let listner = tokio::net::TcpListener::bind("0.0.0.0:8000").await.unwrap();
    println!("server is running at http://localhost:8000");
    axum::serve(listner, app).await.unwrap();
}   
 
async fn WebSocket_handler (
    ws : WebSocketUpgrade,
    State(state): State<AppState>,
)    -> impl IntoResponse {
    ws.on_upgrade(move|socket| handle_socket(socket, state))
}




async fn handle_socket(socket: WebSocket, state: AppState) {
    let conn_id = Uuid::new_v4().to_string();
    let conn_id_clone = conn_id.clone();
    println!("new connection {}", conn_id);

    let (tx, mut rx) = broadcast::channel(100);
    let (mut sender, mut receiver) = socket.split();
    let (message_tx, mut message_rx) = mpsc::channel::<Message>(100);

    let sender_task = tokio::spawn (async move{
        while let Some(msg) = message_rx.recv().await{
            if sender.send(msg).await.is_err(){
                break;
            }

        }
    
    
    });  

    let ping_tx = message_tx.clone();
    let ping_task = tokio::spawn(async move {
        let mut intervel = interval(Duration::from_secs(30));
        loop{
            intervel.tick().await;
            if ping_tx.send(Message::Ping(vec![])).await.is_err(){
                break;
            }
        } 
    });

    let forward_tx = message_tx.clone();
    let forward_task = tokio::spawn(async move {
        while let Ok(msg)= rx.recv().await{
            if forward_tx.send(msg).await.is_err(){

            }
        }
    });
    let receive_task = tokio::spawn({
        let state = state.clone();
        let tx = tx.clone();
        let mut target_map: HashMap<String, String> = HashMap::new();
        
        async move {
            while let Some(Ok(msg)) = receiver.next().await {
                match msg {
                    Message::Text(text) => {
                        if let Ok(data) = serde_json::from_str::<Value>(&text) {
                            if data["type"] == "register" {
                                if let (Some(id), Some(role)) = (data["connectionId"].as_str(), data["role"].as_str()) {
                                    let peer_info = PeerInfo {
                                        tx: tx.clone(),
                                        role: role.to_string(),
                                    };
                                    state.connection.lock().await.insert(id.to_string(), peer_info);
                                    println!("Registered {} as {}", id, role);

                                    // Notify sender when receiver connects
                                    if role == "receiver" {
                                        if let Some(sender_tx) = state.connection.lock().await.get(id) {
                                            let _ = sender_tx.tx.send(Message::Text(json!({
                                                "type": "recipient_connected"
                                            }).to_string()));
                                        }
                                    }
                                }
                                continue;
                            } 
                            
                            // Handle file metadata
                            if data["type"] == "file_info" {
                                if let Some(target_id) = data["target_id"].as_str() {
                                    target_map.insert(conn_id.clone(), target_id.to_string());
                                    if let Some(target_tx) = state.connection.lock().await.get(target_id) {
                                        let _ = target_tx.tx.send(Message::Text(text));
                                    }
                                }
                                continue;
                            }

                            // Forward regular messages
                            if let Some(target_id) = data["target_id"].as_str() {
                                target_map.insert(conn_id.clone(), target_id.to_string());
                                if let Some(target_tx) = state.connection.lock().await.get(target_id) {
                                    let _ = target_tx.tx.send(Message::Text(text));
                                }
                            }
                        }
                    }
                    Message::Binary(bin_data) => {
                        if let Some(target_id) = target_map.get(&conn_id) {
                            if let Some(target_tx) = state.connection.lock().await.get(target_id) {
                                println!("Forwarding binary chunk of size: {}", bin_data.len());
                                let _ = target_tx.tx.send(Message::Binary(bin_data));
                            }
                        } else {
                            println!("No target set for binary transfer from {}", conn_id);
                        }
                    }
                    Message::Close(_) => break,
                    _ => continue,
                }
            }
        }
    });
    tokio::select! {
        _= sender_task => {},
        _=ping_task => {},
        _= forward_task=> {},
        _= receive_task=>{},
    }
    state.connection.lock().await.remove(&conn_id_clone);
    println!("connection closed{}", conn_id_clone)



}
