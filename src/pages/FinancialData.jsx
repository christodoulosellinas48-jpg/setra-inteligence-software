import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Expenses from './Expenses';
import Income from './Income';
import { DollarSign, TrendingDown, TrendingUp, ArrowLeftRight } from 'lucide-react';
import { useBusiness } from '@/components/business/BusinessContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import SavedViews from '@/components/shared/SavedViews';

const FINANCIAL_DEFAULT_VIEWS = [
  { name: 'This month',          filters: { period: 'month' } },
  { name: 'This quarter',        filters: { period: 'quarter' } },
  { name: 'Last 12 months',      filters: { period: 'year' } },
  { name: 'Food & Beverage only',filters: { category: 'food_beverage' } },
];

const TABS = [
  { id: 'expenses', label: 'Out — Expenses', icon: TrendingDown },
  { id: 'income',   label: 'In — Income',   icon: TrendingUp },
  { id: 'net',      label: 'Net View',       icon: ArrowLeftRight },
];

function NetView({ currentBusiness }) {
  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses-full', currentBusiness?.id],
    queryFn: () => base44.entities.ExpenseDocument.filter({ business_id: currentBusiness.id }, '-created_date', 500),
    enabled: !!currentBusiness,
  });
  const { data: snapshots = [] } = useQuery({
    queryKey: ['financialSnapshots', currentBusiness?.id],
    queryFn: () => base44.entities.FinancialSnapshot.filter({ business_id: currentBusiness.id }, '-period_start', 60),
    enabled: !!currentBusiness,
  });

  const cur = currentBusiness?.currency || 'EUR';
  const sym = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr', AUD: '$', CAD: '$' }[cur] || '€';

  const totalIn  = snapshots.reduce((s, sn) => s + (sn.monthly_revenue || 0), 0);
  const totalOut = expenses.reduce((s, e) => s + (e.invoice_total || 0), 0);
  const net      = totalIn - totalOut;

  const stats = [
    { label: 'Total Revenue In',  value: `${sym}${totalIn.toLocaleString()}`,  color: 'text-emerald-400', sub: `${snapshots.length} months recorded` },
    { label: 'Total Expenses Out', value: `${sym}${totalOut.toLocaleString()}`, color: 'text-rose-400',    sub: `${expenses.length} invoices` },
    { label: 'Net Position',       value: `${sym}${Math.abs(net).toLocaleString()}`, color: net >= 0 ? 'text-emerald-400' : 'text-rose-400', sub: net >= 0 ? 'Surplus' : 'Deficit' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Net Cash Position</h2>
        <p className="text-slate-500 text-sm">All recorded revenue vs. all recorded expenses</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="p-5">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.sub}</p>
          </Card>
        ))}
      </div>
      <p className="text-xs text-slate-600">
        Note: Revenue is based on monthly snapshots entered in the Income tab. Expenses are all uploaded invoices. For a full P&amp;L reconciled to your bank, see VAT &amp; Bookkeeping → P&amp;L.
      </p>
    </div>
  );
}

export default function FinancialData() {
  useEffect(() => {
    document.title = 'Financial Data | Setra — Intelligence Platform';
  }, []);

  const location = useLocation();
  const { currentBusiness, user } = useBusiness();
  const [activeFilters, setActiveFilters] = useState({});

  const getInitialTab = () => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab === 'income') return 'income';
    if (tab === 'net') return 'net';
    return 'expenses';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab === 'income') setActiveTab('income');
    else if (tab === 'net') setActiveTab('net');
  }, [location.search]);

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      {/* Tab bar */}
      <div className="border-b border-white/5 bg-[#0B0B12]/95 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Saved views row */}
          <div className="pt-3 pb-1">
            <SavedViews
              pageKey="financial_data"
              currentFilters={activeFilters}
              onApplyView={setActiveFilters}
              defaultViews={FINANCIAL_DEFAULT_VIEWS}
              hasActiveFilters={Object.keys(activeFilters).length > 0}
              userId={user?.id}
              businessId={currentBusiness?.id}
            />
          </div>
          <div className="flex items-center gap-1 py-1 overflow-x-auto">
            <div className="flex items-center gap-2 mr-4 shrink-0">
              <DollarSign className="w-4 h-4 text-[#C084FC]" />
              <span className="text-sm font-semibold text-white">Financial Data</span>
            </div>
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 shrink-0 ${
                    activeTab === tab.id
                      ? 'border-[#7B3BFF] text-white'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'expenses' && <Expenses />}
      {activeTab === 'income'   && <Income />}
      {activeTab === 'net'      && <NetView currentBusiness={currentBusiness} />}
    </div>
  );
}