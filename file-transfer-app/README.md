# 📁 P2P File Transfer – Frontend

This is the **frontend** of the [P2P File Transfer](https://github.com/v3dant21/p2p-file-transfer-frontend) project, built using **Next.js 13** with the App Router. It allows users to send and receive files in real-time over WebSockets, powered by a **Rust + Axum** backend.

## 🔥 Features

- ✅ Built with **Next.js 13 App Router**
- ✅ Real-time communication using **WebSockets**
- ✅ **Peer-to-peer (P2P)** file transfers
- ✅ Supports **large file** transfers
- ✅ Clean and minimal **UI/UX**

## 🛠️ Technologies Used

- **Next.js 13** – Frontend framework
- **React Hooks** – State management
- **WebSockets** – Real-time file transfer
- **TypeScript** – Ensures type safety

## 🚀 Getting Started

1. **Clone the repo**
   ```bash
   git clone https://github.com/v3dant21/p2p-file-transfer-frontend.git
   cd p2p-file-transfer-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Ensure the Rust backend is running**  
   Backend repo: [p2p-FTS](https://github.com/v3dant21/p2p-FTS)

## 📆 Project Structure

```
/app        # Next.js 13 App Router structure
/components # Reusable UI components
/hooks      # Custom React hooks
/utils      # Utility functions
/public     # Static files
```

## 🧹 Backend Integration

This frontend connects to a **Rust Axum backend** for WebSocket-based file exchange. Make sure the backend is up and reachable at the correct endpoint.

## 📜 License

This project is licensed under the [MIT License](LICENSE).

## 🙌 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to open a pull request or issue.

## 🔗 Links

- 🌐 **Frontend Repo**: [p2p-file-transfer-frontend](https://github.com/v3dant21/p2p-file-transfer-frontend)
- 🧠 **Backend Repo**:[p2p-file-transfer-backend](https://github.com/v3dant21/p2p-file-transfer-backend)
