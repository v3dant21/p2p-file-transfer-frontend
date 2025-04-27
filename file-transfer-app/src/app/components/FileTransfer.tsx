// src/components/FileTransfer.tsx

'use client';

import { useWebSocket } from 'contexts/WebSocketContext';
import React, { useState, useRef } from 'react';


const FileTransfer: React.FC = () => {
  const {
    connected,
    targetId,
    setTargetId,
    sendFile,
    fileProgress,
  } = useWebSocket();

  const [targetInput, setTargetInput] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTargetInput(e.target.value);
  };

  const handleSetTarget = () => {
    if (targetInput.trim()) {
      setTargetId(targetInput.trim());
      setMessage(`Target set to: ${targetInput.trim()}`);
    } else {
      setMessage('Please enter a valid target ID.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFileSend = async () => {
    if (!selectedFile) {
      setMessage('Please select a file first.');
      return;
    }

    if (!targetId) {
      setMessage('Please set a target connection ID first.');
      return;
    }

    try {
      setIsTransferring(true);
      await sendFile(selectedFile);
      setMessage(`File "${selectedFile.name}" sent successfully!`);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setMessage(`Failed to send file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      {/* Target ID Input */}
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium">Target Connection ID</label>
        <div className="flex">
          <input
            type="text"
            value={targetInput}
            onChange={handleTargetChange}
            className="flex-grow border rounded-l p-2"
            placeholder="Enter target ID"
          />
          <button
            onClick={handleSetTarget}
            className="bg-gray-800 text-white px-4 py-2 rounded-r hover:bg-gray-700"
          >
            Set
          </button>
        </div>
        {targetId && (
          <p className="mt-2 text-sm">Current target: <span className="font-mono bg-gray-100 p-1 rounded">{targetId}</span></p>
        )}
      </div>

      {/* File Selection */}
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium">Select File to Send</label>
        <input
          type="file"
          onChange={handleFileChange}
          className="w-full border p-2 rounded"
          ref={fileInputRef}
        />
        {selectedFile && (
          <p className="mt-2 text-sm">Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)</p>
        )}
        <button
          onClick={handleFileSend}
          disabled={!selectedFile || isTransferring || !targetId}
          className={`w-full mt-4 py-2 px-4 rounded text-white ${
            !selectedFile || isTransferring || !targetId 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isTransferring ? 'Sending...' : 'Send File'}
        </button>
        
        {/* Progress Bar */}
        {isTransferring && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${fileProgress}%` }}
              ></div>
            </div>
            <p className="text-right text-sm mt-1">{fileProgress}%</p>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {message && (
        <div className={`p-3 rounded ${message.includes('Failed') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default FileTransfer;