// src/components/TabNavigation.tsx

'use client';

import React from 'react';

interface TabProps {
  activeTab: 'send' | 'receive';
  setActiveTab: (tab: 'send' | 'receive') => void;
}

const TabNavigation: React.FC<TabProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex border-b border-gray-200 mb-6">
      <button
        className={`py-2 px-4 font-medium text-sm ${
          activeTab === 'send'
            ? 'border-b-2 border-blue-500 text-blue-600'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        onClick={() => setActiveTab('send')}
      >
        Send Files
      </button>
      <button
        className={`py-2 px-4 font-medium text-sm ${
          activeTab === 'receive'
            ? 'border-b-2 border-blue-500 text-blue-600'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        onClick={() => setActiveTab('receive')}
      >
        Receive Files
      </button>
    </div>
  );
};

export default TabNavigation;