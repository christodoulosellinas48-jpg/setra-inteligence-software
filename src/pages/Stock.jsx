import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Package } from 'lucide-react';
import InventoryPage from './Inventory';
import WasteManagementPage from './WasteManagement';
import { useBusiness } from '@/components/business/BusinessContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function LowStockAlerts({ currentBusiness }) {
  const navigate = useNavigate();
  const sym = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr', AUD: '$', CAD: '$' }[currentBusiness?.currency] || '€';

  const { data: items = [] } = useQuery({
    queryKey: ['inventory', currentBusiness?.id],
    queryFn: () => base44.entities.InventoryItem.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness,
  });

  const lowStock = items.filter(i => i.current_stock <= i.reorder_threshold && i.reorder_threshold > 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Low Stock Alerts</h2>
          <p className="text-slate-500 text-sm">Items at or below reorder threshold</p>
        </div>
        {lowStock.length > 0 && (
          <Button onClick={() => navigate('/Suppliers?tab=orders')} className="gap-2">
            <ShoppingCart className="w-4 h-4" />
            Create Purchase Order
          </Button>
        )}
      </div>

      {lowStock.length === 0 ? (
        <Card className="p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No low stock alerts</p>
          <p className="text-slate-600 text-sm mt-1">All items are above their reorder thresholds.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-white">{lowStock.length} item{lowStock.length !== 1 ? 's' : ''} need restocking</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-[#0B0B12]/40">
                  {['Item', 'Category', 'On Hand', 'Reorder At', 'Unit Cost', 'Supplier'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lowStock.map(item => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white font-medium">{item.ingredient_name}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-400 capitalize">{(item.category || '').replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/20 border text-xs">
                        {item.current_stock} {item.unit}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{item.reorder_threshold} {item.unit}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {item.unit_cost ? `${sym}${item.unit_cost}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{item.supplier_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

const TABS = [
  { id: 'items', label: 'Items' },
  { id: 'waste', label: 'Waste Log' },
  { id: 'alerts', label: 'Low Stock Alerts' },
];

export default function Stock() {
  const location = useLocation();
  const { currentBusiness } = useBusiness();

  const getInitialTab = () => {
    const param = new URLSearchParams(location.search).get('tab');
    if (param === 'waste')  return 'waste';
    if (param === 'alerts') return 'alerts';
    return 'items';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    const param = new URLSearchParams(location.search).get('tab');
    if (param === 'waste')  setActiveTab('waste');
    else if (param === 'alerts') setActiveTab('alerts');
  }, [location.search]);

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      <div className="border-b border-white/5 bg-[#0B0B12]/95 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-1 py-1">
            <div className="flex items-center gap-2 mr-4">
              <Package className="w-4 h-4 text-[#C084FC]" />
              <span className="text-sm font-semibold text-white">Stock</span>
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

      {activeTab === 'items'  && <InventoryPage />}
      {activeTab === 'waste'  && <WasteManagementPage />}
      {activeTab === 'alerts' && <LowStockAlerts currentBusiness={currentBusiness} />}
    </div>
  );
}