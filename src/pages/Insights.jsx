import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Lightbulb } from 'lucide-react';
import ReportsPage from './Reports';
import AuditPage from './Audit';

const TABS = [
  { id: 'reports', label: 'Reports' },
  { id: 'audit',   label: 'Audit' },
];

export default function Insights() {
  const location = useLocation();

  const getInitialTab = () => {
    const param = new URLSearchParams(location.search).get('tab');
    if (param === 'audit') return 'audit';
    return 'reports';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    const param = new URLSearchParams(location.search).get('tab');
    if (param === 'audit') setActiveTab('audit');
  }, [location.search]);

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      <div className="border-b border-white/5 bg-[#0B0B12]/95 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-1 py-1">
            <div className="flex items-center gap-2 mr-4">
              <Lightbulb className="w-4 h-4 text-[#C084FC]" />
              <span className="text-sm font-semibold text-white">Insights</span>
            </div>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-[#7B3BFF] text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'reports' && <ReportsPage />}
      {activeTab === 'audit'   && <AuditPage />}
    </div>
  );
}