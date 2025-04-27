// src/contexts/WebSocketContext.tsx

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import wsManager from 'utils/websocketManager';


interface WebSocketContextType {
  connected: boolean;
  connectionId: string | null;
  targetId: string | null;
  connect: () => Promise<string>;
  disconnect: () => void;
  setTargetId: (id: string) => void;
  sendMessage: (message: any) => void;
  sendFile: (file: File) => Promise<void>;
  fileProgress: number;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState<boolean>(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [fileProgress, setFileProgress] = useState<number>(0);

  useEffect(() => {
    // Set up WebSocket event handlers
    const unsubscribeConnection = wsManager.onConnectionStatus((status) => {
      setConnected(status);
      if (!status) {
        setConnectionId(null);
      }
    });

    const unsubscribeFileProgress = wsManager.onFileProgress((progress) => {
      setFileProgress(progress);
    });

    // Clean up event handlers on unmount
    return () => {
      unsubscribeConnection();
      unsubscribeFileProgress();
      wsManager.disconnect();
    };
  }, []);

  const connect = async (): Promise<string> => {
    try {
      const id = await wsManager.connect();
      setConnectionId(id);
      return id;
    } catch (error) {
      console.error('Failed to connect:', error);
      throw error;
    }
  };

  const disconnect = () => {
    wsManager.disconnect();
    setConnectionId(null);
    setTargetId(null);
  };

  const handleSetTargetId = (id: string) => {
    wsManager.setTargetId(id);
    setTargetId(id);
  };

  const sendMessage = (message: any) => {
    try {
      wsManager.sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  const sendFile = async (file: File): Promise<void> => {
    setFileProgress(0);
    try {
      await wsManager.sendFile(file);
    } catch (error) {
      console.error('Failed to send file:', error);
      throw error;
    }
  };

  const value = {
    connected,
    connectionId,
    targetId,
    connect,
    disconnect,
    setTargetId: handleSetTargetId,
    sendMessage,
    sendFile,
    fileProgress,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};