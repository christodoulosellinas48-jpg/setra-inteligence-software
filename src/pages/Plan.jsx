import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Target } from 'lucide-react';
import BudgetingPage from './Budgeting';
import ForecastingPage from './Forecasting';
import ScenariosTab from '@/components/plan/ScenariosTab';

const TABS = [
  { id: 'budget',    label: 'Budget' },
  { id: 'forecast',  label: '6-Month Forecast' },
  { id: 'scenarios', label: 'Scenarios' },
];

export default function Plan() {
  const location = useLocation();

  useEffect(() => {
    document.title = 'Plan | Setra — Intelligence Platform';
  }, []);

  const getInitialTab = () => {
    const param = new URLSearchParams(location.search).get('tab');
    if (param === 'forecast') return 'forecast';
    if (param === 'scenarios') return 'scenarios';
    return 'budget';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    const param = new URLSearchParams(location.search).get('tab');
    if (param === 'forecast') setActiveTab('forecast');
    else if (param === 'scenarios') setActiveTab('scenarios');
  }, [location.search]);

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      <div className="border-b border-white/5 bg-[#0B0B12]/95 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-1 py-1 overflow-x-auto">
            <div className="flex items-center gap-2 mr-4 shrink-0">
              <Target className="w-4 h-4 text-[#C084FC]" />
              <span className="text-sm font-semibold text-white">Plan</span>
            </div>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 shrink-0 ${
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

      {activeTab === 'budget'    && <BudgetingPage />}
      {activeTab === 'forecast'  && <ForecastingPage />}
      {activeTab === 'scenarios' && <ScenariosTab />}
    </div>
  );
}