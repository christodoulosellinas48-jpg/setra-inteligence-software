import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Store } from 'lucide-react';
import VendorsPage from './Vendors';
import PurchaseOrdersPage from './PurchaseOrders';
import { useBusiness } from '@/components/business/BusinessContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { BarChart2, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function SpendAnalysis({ currentBusiness }) {
  const sym = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr', AUD: '$', CAD: '$' }[currentBusiness?.currency] || '€';

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers', currentBusiness?.id],
    queryFn: () => base44.entities.Supplier.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness,
  });

  const top = [...suppliers]
    .filter(s => s.total_spend > 0)
    .sort((a, b) => b.total_spend - a.total_spend)
    .slice(0, 10);

  const totalSpend = suppliers.reduce((s, sup) => s + (sup.total_spend || 0), 0);

  const categoryTotals = suppliers.reduce((acc, s) => {
    const cat = s.category || 'other';
    acc[cat] = (acc[cat] || 0) + (s.total_spend || 0);
    return acc;
  }, {});

  const catData = Object.entries(categoryTotals)
    .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Spend Analysis</h2>
        <p className="text-slate-500 text-sm">Total recorded spend across all suppliers</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-xs text-slate-500 mb-1">Total Spend</p>
          <p className="text-2xl font-bold text-white">{sym}{totalSpend.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">{suppliers.length} suppliers</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-slate-500 mb-1">Top Supplier</p>
          <p className="text-lg font-bold text-white truncate">{top[0]?.name || '—'}</p>
          <p className="text-xs text-emerald-400 mt-1">{top[0] ? `${sym}${top[0].total_spend.toLocaleString()}` : '—'}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-slate-500 mb-1">Top Category</p>
          <p className="text-lg font-bold text-white capitalize">{catData[0]?.name || '—'}</p>
          <p className="text-xs text-emerald-400 mt-1">{catData[0] ? `${sym}${catData[0].value.toLocaleString()}` : '—'}</p>
        </Card>
      </div>

      {top.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-[#C084FC]" />
            Top Suppliers by Spend
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={top} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${sym}${v.toLocaleString()}`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={120} />
              <Tooltip
                contentStyle={{ background: '#151528', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                labelStyle={{ color: '#fff' }}
                formatter={v => [`${sym}${v.toLocaleString()}`, 'Spend']}
              />
              <Bar dataKey="total_spend" fill="#7B3BFF" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {top.length === 0 && (
        <Card className="p-12 text-center">
          <BarChart2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">No spend data yet. Add invoices via VAT &amp; Bookkeeping to populate this view.</p>
        </Card>
      )}
    </div>
  );
}

const TABS = [
  { id: 'directory', label: 'Directory' },
  { id: 'orders',    label: 'Purchase Orders' },
  { id: 'spend',     label: 'Spend Analysis' },
];

export default function Suppliers() {
  const location = useLocation();
  const { currentBusiness } = useBusiness();

  const getInitialTab = () => {
    const param = new URLSearchParams(location.search).get('tab');
    if (param === 'orders') return 'orders';
    if (param === 'spend')  return 'spend';
    return 'directory';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    const param = new URLSearchParams(location.search).get('tab');
    if (param === 'orders') setActiveTab('orders');
    else if (param === 'spend') setActiveTab('spend');
  }, [location.search]);

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      <div className="border-b border-white/5 bg-[#0B0B12]/95 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-1 py-1">
            <div className="flex items-center gap-2 mr-4">
              <Store className="w-4 h-4 text-[#C084FC]" />
              <span className="text-sm font-semibold text-white">Suppliers</span>
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

      {activeTab === 'directory' && <VendorsPage />}
      {activeTab === 'orders'    && <PurchaseOrdersPage />}
      {activeTab === 'spend'     && <SpendAnalysis currentBusiness={currentBusiness} />}
    </div>
  );
}