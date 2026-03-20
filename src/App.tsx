/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { OCRScanner } from './components/OCRScanner';
import { GhostBillModal } from './components/GhostBillModal';
import { SubscriptionAuditor } from './components/SubscriptionAuditor';
import { Settings } from './components/Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isGhostModalOpen, setIsGhostModalOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    if (tab === 'ghost-bill') {
      setIsGhostModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="flex h-screen bg-navy-900 overflow-hidden font-sans text-slate-200">
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />
      
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'ocr' && <OCRScanner />}
        {activeTab === 'subscriptions' && <SubscriptionAuditor />}
        {activeTab === 'crystal-ball' && (
          <div className="flex-1 p-8 flex items-center justify-center text-slate-400">
            <p>Crystal Ball detailed view coming soon...</p>
          </div>
        )}
        {activeTab === 'alerts' && (
          <div className="flex-1 p-8 flex items-center justify-center text-slate-400">
            <p>Cycle Alerts coming soon...</p>
          </div>
        )}
        {activeTab === 'settings' && <Settings />}
      </main>

      <GhostBillModal 
        isOpen={isGhostModalOpen} 
        onClose={() => setIsGhostModalOpen(false)} 
      />
    </div>
  );
}
