// utils/websocketManager.ts

class WebSocketManager {
  socket: WebSocket | null = null;
  private connectionId: string | null = null;
  private targetId: string | null = null;
  private messageHandlers: ((data: any) => void)[] = [];
  private binaryMessageHandlers: ((data: ArrayBuffer) => void)[] = [];
  private fileProgressHandlers: ((progress: number) => void)[] = [];
  private connectionStatusHandlers: ((status: boolean) => void)[] = [];

  constructor() {
    // Initialize as disconnected
    this.socket = null;
    this.connectionId = null;
  }

  connect(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Close any existing connection
        if (this.socket) {
          this.socket.close();
        }

        // Connect to the WebSocket server
        this.socket = new WebSocket('ws://localhost:8000/ws');
        
        this.socket.onopen = () => {
          console.log('WebSocket connection established');
          // Generate a unique connection ID
          this.connectionId = this.generateId();
          
          // Register the connection ID with the server
          this.socket?.send(JSON.stringify({
            type: 'register',
            connectionId: this.connectionId
          }));
          
          // Notify connection status handlers
          this.connectionStatusHandlers.forEach(handler => handler(true));
          
          resolve(this.connectionId);
        };

        this.socket.onclose = () => {
          console.log('WebSocket connection closed');
          // Notify connection status handlers
          this.connectionStatusHandlers.forEach(handler => handler(false));
          this.socket = null;
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.socket.onmessage = (event) => {
          if (event.data instanceof ArrayBuffer) {
            // Handle binary data
            this.binaryMessageHandlers.forEach(handler => handler(event.data));
          } else if (typeof event.data === 'string') {
            // Handle text data
            try {
              const data = JSON.parse(event.data);
              console.log('Received message:', data);
              this.messageHandlers.forEach(handler => handler(data));
            } catch (error) {
              console.error('Error parsing message:', error);
            }
          }
        };
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.connectionId = null;
      this.targetId = null;
    }
  }

  setTargetId(targetId: string) {
    this.targetId = targetId;
  }

  getConnectionId(): string | null {
    return this.connectionId;
  }

  getTargetId(): string | null {
    return this.targetId;
  }

  sendMessage(message: any) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    if (!this.targetId) {
      throw new Error('No target ID set');
    }

    const messageWithTarget = {
      ...message,
      target_id: this.targetId
    };

    this.socket.send(JSON.stringify(messageWithTarget));
  }

  sendFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'));
        return;
      }

      if (!this.targetId) {
        reject(new Error('No target ID set'));
        return;
      }

      // First send a message with file metadata
      this.sendMessage({
        type: 'file_info',
        filename: file.name,
        size: file.size,
        content_type: file.type
      });

      // Then read and send the file in chunks
      const chunkSize = 64 * 1024; // 64KB chunks
      const fileReader = new FileReader();
      let offset = 0;

      const readNextChunk = () => {
        const slice = file.slice(offset, offset + chunkSize);
        fileReader.readAsArrayBuffer(slice);
      };

      fileReader.onload = (e) => {
        if (!e.target?.result || !this.socket) {
          reject(new Error('Failed to read file chunk'));
          return;
        }

        // Send the chunk as binary data
        const arrayBuffer = e.target.result as ArrayBuffer;
        this.socket.send(arrayBuffer);

        // Update progress
        offset += arrayBuffer.byteLength;
        const progress = Math.min(100, Math.round((offset / file.size) * 100));
        this.fileProgressHandlers.forEach(handler => handler(progress));

        // If not finished, read the next chunk
        if (offset < file.size) {
          readNextChunk();
        } else {
          // Finished sending file
          this.sendMessage({
            type: 'file_complete',
            filename: file.name
          });
          resolve();
        }
      };

      fileReader.onerror = (error) => {
        reject(error);
      };

      // Start reading the first chunk
      readNextChunk();
    });
  }

  onMessage(handler: (data: any) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  onBinaryMessage(handler: (data: ArrayBuffer) => void) {
    this.binaryMessageHandlers.push(handler);
    return () => {
      this.binaryMessageHandlers = this.binaryMessageHandlers.filter(h => h !== handler);
    };
  }

  onFileProgress(handler: (progress: number) => void) {
    this.fileProgressHandlers.push(handler);
    return () => {
      this.fileProgressHandlers = this.fileProgressHandlers.filter(h => h !== handler);
    };
  }

  onConnectionStatus(handler: (status: boolean) => void) {
    this.connectionStatusHandlers.push(handler);
    return () => {
      this.connectionStatusHandlers = this.connectionStatusHandlers.filter(h => h !== handler);
    };
  }

  private generateId(): string {
    // Generate a random string for connection ID
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}

// Create a singleton instance
const wsManager = new WebSocketManager();

export default wsManager;