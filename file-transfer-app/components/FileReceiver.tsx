// src/components/FileReceiver.tsx

'use client';

import { useWebSocket } from 'contexts/WebSocketContext';
import React, { useState, useEffect } from 'react';
import wsManager from 'utils/websocketManager';


interface FileInfo {
  filename: string;
  size: number;
  content_type: string;
}

const FileReceiver: React.FC = () => {
  const { connected } = useWebSocket();
  const [receivedFiles, setReceivedFiles] = useState<{ name: string; url: string; size: number }[]>([]);
  const [currentFile, setCurrentFile] = useState<FileInfo | null>(null);
  const [fileChunks, setFileChunks] = useState<Uint8Array[]>([]);
  const [receiveProgress, setReceiveProgress] = useState<number>(0);
  const [totalBytesReceived, setTotalBytesReceived] = useState<number>(0);

  useEffect(() => {
    if (!connected) return;

    const handleMessage = (data: any) => {
      console.log("Received text message:", data);
      
      if (data.type === 'file_info') {
        // Start receiving a new file
        console.log("Starting to receive file:", data.filename);
        setCurrentFile({
          filename: data.filename,
          size: data.size,
          content_type: data.content_type
        });
        setFileChunks([]);
        setTotalBytesReceived(0);
        setReceiveProgress(0);
      } else if (data.type === 'file_complete') {
        // File transfer completed, assemble the file
        console.log("File transfer complete, assembling file");
        if (currentFile && fileChunks.length > 0) {
          assembleFile();
        }
      }
    };

    const handleBinaryMessage = (data: ArrayBuffer) => {
      console.log("Received binary chunk of size:", data.byteLength);
      if (currentFile) {
        const chunk = new Uint8Array(data);
        setFileChunks(prev => [...prev, chunk]);
        
        // Calculate progress
        const newTotalBytes = totalBytesReceived + chunk.length;
        setTotalBytesReceived(newTotalBytes);
        
        const progress = Math.min(100, Math.round((newTotalBytes / currentFile.size) * 100));
        setReceiveProgress(progress);
      } else {
        console.log("Received binary data but no current file is being processed");
      }
    };

    // Set up message handlers
    const unsubscribeMessage = wsManager.onMessage(handleMessage);
    const unsubscribeBinary = wsManager.onBinaryMessage(handleBinaryMessage);
    
    return () => {
      unsubscribeMessage();
      unsubscribeBinary();
    };
  }, [connected, currentFile, totalBytesReceived]);

  const assembleFile = () => {
    if (!currentFile) return;

    // Calculate total length
    const totalLength = fileChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    
    // Create a new buffer and copy all chunks into it
    const completeBuffer = new Uint8Array(totalLength);
    let offset = 0;
    fileChunks.forEach(chunk => {
      completeBuffer.set(chunk, offset);
      offset += chunk.length;
    });

    // Create a file object and URL
    const blob = new Blob([completeBuffer], { type: currentFile.content_type || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    // Add to received files
    setReceivedFiles(prev => [
      ...prev,
      {
        name: currentFile.filename,
        url,
        size: totalLength
      }
    ]);

    // Reset current file state
    setCurrentFile(null);
    setFileChunks([]);
    setTotalBytesReceived(0);
    setReceiveProgress(0);
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Received Files</h2>

      {/* Connection status */}
      <div className="mb-4 flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span>{connected ? 'Ready to receive files' : 'Connect to start receiving files'}</span>
      </div>

      {/* Progress for currently receiving file */}
      {currentFile && (
        <div className="mb-6 p-4 border rounded bg-blue-50">
          <p className="font-medium">Receiving: {currentFile.filename}</p>
          <p className="text-sm text-gray-600 mb-2">
            {(totalBytesReceived / 1024).toFixed(2)} KB of {(currentFile.size / 1024).toFixed(2)} KB
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${receiveProgress}%` }}
            ></div>
          </div>
          <p className="text-right text-sm mt-1">{receiveProgress}%</p>
        </div>
      )}

      {/* List of received files */}
      {receivedFiles.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {receivedFiles.map((file, index) => (
            <li key={index} className="py-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
              <button
                onClick={() => handleDownload(file.url, file.name)}
                className="bg-green-500 text-white py-1 px-3 rounded hover:bg-green-600"
              >
                Download
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500">No files received yet</p>
      )}
    </div>
  );
};

export default FileReceiver;