'use client';

import FileReceiver from 'components/FileReceiver';
import FileTransfer from 'components/FileTransfer';
import TabNavigation from 'contexts/TabNavigation';
import { useWebSocket } from 'contexts/WebSocketContext';
import { useState } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send');
  const { connected, connectionId, connect, disconnect } = useWebSocket();

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-4">P2P File Transfer</h1>
        
        {/* Connection Status */}
        <div className="max-w-md mx-auto mb-6 p-4 bg-white rounded-lg shadow-md">
          <div className="flex items-center mb-2">
            <div className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
          
          {connected ? (
            <div>
              <p className="mb-2">Your Connection ID: <span className="font-mono bg-gray-100 p-1 rounded">{connectionId}</span></p>
              <button 
                onClick={disconnect}
                className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button 
              onClick={() => connect()}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Connect to Server
            </button>
          )}
        </div>
        
        {/* Only show tabs when connected */}
        {connected && (
          <div className="max-w-md mx-auto">
            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
            
            {activeTab === 'send' ? <FileTransfer /> : <FileReceiver />}
          </div>
        )}
      </div>
    </main>
  );
}