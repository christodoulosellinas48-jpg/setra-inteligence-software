import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { BusinessProvider, useBusiness } from '@/components/business/BusinessContext';
import { Trash2, Plus, RefreshCw, AlertTriangle, DollarSign, TrendingDown, Package } from 'lucide-react';
import { format, subDays, startOfMonth } from 'date-fns';

const REASONS = ['waste', 'spoilage', 'stocktake', 'transfer', 'other'];
const REASON_STYLES = {
  waste:     'bg-rose-500/20 text-rose-400 border-rose-500/30',
  spoilage:  'bg-orange-500/20 text-orange-400 border-orange-500/30',
  stocktake: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  transfer:  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  other:     'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

function WasteManagementContent() {
  const { currentBusiness, canEdit } = useBusiness();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ inventory_item_id: '', ingredient_name: '', adjustment_qty: '', reason: 'waste', notes: '', date: format(new Date(), 'yyyy-MM-dd') });
  const [filterReason, setFilterReason] = useState('all');

  const { data: adjustments = [], isLoading } = useQuery({
    queryKey: ['adjustments', currentBusiness?.id],
    queryFn: () => base44.entities.InventoryAdjustment.filter({ business_id: currentBusiness.id }, '-date', 200),
    enabled: !!currentBusiness
  });

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory', currentBusiness?.id],
    queryFn: () => base44.entities.InventoryItem.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness
  });

  const logMutation = useMutation({
    mutationFn: async (data) => {
      // Create adjustment record
      await base44.entities.InventoryAdjustment.create({
        business_id: currentBusiness.id,
        date: data.date,
        ingredient_name: data.ingredient_name,
        adjustment_qty: -(Math.abs(parseFloat(data.adjustment_qty))), // always negative for waste
        reason: data.reason,
        notes: data.notes
      });
      // Update inventory stock level if linked to an inventory item
      if (data.inventory_item_id) {
        const item = inventoryItems.find(i => i.id === data.inventory_item_id);
        if (item) {
          const newStock = Math.max(0, (item.current_stock || 0) - Math.abs(parseFloat(data.adjustment_qty)));
          await base44.entities.InventoryItem.update(data.inventory_item_id, { current_stock: newStock, last_restocked_date: item.last_restocked_date });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries(['adjustments', currentBusiness?.id]);
      qc.invalidateQueries(['inventory', currentBusiness?.id]);
      setShowModal(false);
      setForm({ inventory_item_id: '', ingredient_name: '', adjustment_qty: '', reason: 'waste', notes: '', date: format(new Date(), 'yyyy-MM-dd') });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InventoryAdjustment.delete(id),
    onSuccess: () => qc.invalidateQueries(['adjustments', currentBusiness?.id])
  });

  const handleInventorySelect = (invId) => {
    const inv = inventoryItems.find(i => i.id === invId);
    setForm(f => ({ ...f, inventory_item_id: invId, ingredient_name: inv?.ingredient_name || '' }));
  };

  // Compute financial impact using live unit costs
  const getFinancialImpact = (adj) => {
    const inv = inventoryItems.find(i => i.ingredient_name?.toLowerCase() === adj.ingredient_name?.toLowerCase());
    const unitCost = inv?.unit_cost || 0;
    return Math.abs(adj.adjustment_qty) * unitCost;
  };

  const wasteAdjustments = useMemo(() => adjustments.filter(a => a.adjustment_qty < 0), [adjustments]);
  const filtered = useMemo(() =>
    filterReason === 'all' ? wasteAdjustments : wasteAdjustments.filter(a => a.reason === filterReason),
    [wasteAdjustments, filterReason]
  );

  // KPIs
  const totalWasteCost = useMemo(() => wasteAdjustments.reduce((s, a) => s + getFinancialImpact(a), 0), [wasteAdjustments, inventoryItems]);
  const thisMonthWaste = useMemo(() => {
    const start = startOfMonth(new Date());
    return wasteAdjustments.filter(a => new Date(a.date) >= start).reduce((s, a) => s + getFinancialImpact(a), 0);
  }, [wasteAdjustments, inventoryItems]);
  const last30Waste = useMemo(() => {
    const cutoff = subDays(new Date(), 30);
    return wasteAdjustments.filter(a => new Date(a.date) >= cutoff).reduce((s, a) => s + getFinancialImpact(a), 0);
  }, [wasteAdjustments, inventoryItems]);

  // Top wasted ingredients
  const topWasted = useMemo(() => {
    const byIngredient = {};
    wasteAdjustments.forEach(a => {
      const key = a.ingredient_name;
      if (!byIngredient[key]) byIngredient[key] = { name: key, qty: 0, cost: 0 };
      byIngredient[key].qty += Math.abs(a.adjustment_qty);
      byIngredient[key].cost += getFinancialImpact(a);
    });
    return Object.values(byIngredient).sort((a, b) => b.cost - a.cost).slice(0, 5);
  }, [wasteAdjustments, inventoryItems]);

  if (!currentBusiness) return (
    <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center">
      <p className="text-slate-400">Please select a business first.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Trash2 className="w-6 h-6 text-[#C084FC]" /> Waste Management
            </h1>
            <p className="text-slate-500 text-sm mt-1">Log spoilage, track financial impact, and adjust inventory automatically</p>
          </div>
          {canEdit() && (
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" /> Log Waste
            </Button>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 bg-[#151528]/80 border-white/5">
            <p className="text-slate-400 text-xs mb-1">Total Records</p>
            <p className="text-2xl font-bold text-white">{wasteAdjustments.length}</p>
          </Card>
          <Card className="p-4 bg-rose-500/10 border-rose-500/20">
            <div className="flex items-center gap-1 mb-1">
              <DollarSign className="w-3 h-3 text-rose-400" />
              <p className="text-rose-300 text-xs">This Month</p>
            </div>
            <p className="text-2xl font-bold text-rose-400">€{thisMonthWaste.toFixed(0)}</p>
          </Card>
          <Card className="p-4 bg-rose-500/10 border-rose-500/20">
            <div className="flex items-center gap-1 mb-1">
              <TrendingDown className="w-3 h-3 text-rose-400" />
              <p className="text-rose-300 text-xs">Last 30 Days</p>
            </div>
            <p className="text-2xl font-bold text-rose-400">€{last30Waste.toFixed(0)}</p>
          </Card>
          <Card className="p-4 bg-[#151528]/80 border-white/5">
            <p className="text-slate-400 text-xs mb-1">All-Time Loss</p>
            <p className="text-2xl font-bold text-rose-300">€{totalWasteCost.toFixed(0)}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Wasted */}
          <Card className="bg-[#151528]/80 border-white/5 p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Top Wasted Items
            </h2>
            {topWasted.length === 0 ? (
              <p className="text-slate-500 text-sm">No waste logged yet.</p>
            ) : (
              <div className="space-y-3">
                {topWasted.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="text-slate-600 text-xs w-4">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{item.name}</p>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-rose-500 h-1.5 rounded-full"
                          style={{ width: `${(item.cost / topWasted[0].cost) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-rose-400 text-sm font-medium shrink-0">€{item.cost.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Waste Log Table */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold">Waste Log</h2>
              <Select value={filterReason} onValueChange={setFilterReason}>
                <SelectTrigger className="w-36 h-8 bg-slate-800 border-slate-700 text-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white text-xs">All reasons</SelectItem>
                  {REASONS.map(r => <SelectItem key={r} value={r} className="text-white text-xs capitalize">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Card className="bg-[#151528]/80 border-white/5 overflow-hidden">
              {isLoading ? (
                <div className="flex justify-center py-10"><RefreshCw className="w-5 h-5 text-[#7B3BFF] animate-spin" /></div>
              ) : filtered.length === 0 ? (
                <div className="p-10 text-center">
                  <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500">No waste records yet. Start logging to track financial impact.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        {['Date', 'Ingredient', 'Qty Lost', 'Reason', 'Cost Impact', ''].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(adj => {
                        const inv = inventoryItems.find(i => i.ingredient_name?.toLowerCase() === adj.ingredient_name?.toLowerCase());
                        const impact = getFinancialImpact(adj);
                        return (
                          <tr key={adj.id} className="border-b border-white/5 hover:bg-white/2">
                            <td className="px-4 py-3 text-slate-400">{adj.date ? format(new Date(adj.date), 'dd MMM yy') : '—'}</td>
                            <td className="px-4 py-3">
                              <p className="text-white">{adj.ingredient_name}</p>
                              {adj.notes && <p className="text-xs text-slate-500">{adj.notes}</p>}
                            </td>
                            <td className="px-4 py-3 text-slate-300 font-mono">{Math.abs(adj.adjustment_qty)} {inv?.unit || ''}</td>
                            <td className="px-4 py-3">
                              <Badge className={`text-xs ${REASON_STYLES[adj.reason] || REASON_STYLES.other}`}>{adj.reason}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              {impact > 0 ? (
                                <span className="text-rose-400 font-medium">-€{impact.toFixed(2)}</span>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {canEdit() && (
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-rose-400" onClick={() => deleteMutation.mutate(adj.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Log Waste Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader><DialogTitle className="text-white">Log Waste / Spoilage</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-slate-400 mb-1.5 block">Link to Inventory Item (for auto stock adjustment)</Label>
              <Select value={form.inventory_item_id || ''} onValueChange={handleInventorySelect}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select item (optional)" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {inventoryItems.map(i => (
                    <SelectItem key={i.id} value={i.id} className="text-white">{i.ingredient_name} (stock: {i.current_stock} {i.unit})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-400 mb-1.5 block">Ingredient Name</Label>
              <Input value={form.ingredient_name} onChange={e => setForm({ ...form, ingredient_name: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Salmon fillet" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400 mb-1.5 block">Quantity Wasted</Label>
                <Input type="number" min="0" value={form.adjustment_qty} onChange={e => setForm({ ...form, adjustment_qty: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="0" />
              </div>
              <div>
                <Label className="text-slate-400 mb-1.5 block">Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
              </div>
            </div>
            <div>
              <Label className="text-slate-400 mb-1.5 block">Reason</Label>
              <Select value={form.reason} onValueChange={v => setForm({ ...form, reason: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {REASONS.map(r => <SelectItem key={r} value={r} className="text-white capitalize">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-400 mb-1.5 block">Notes (optional)</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Expired delivery, fridge failure…" />
            </div>

            {/* Cost preview */}
            {form.inventory_item_id && form.adjustment_qty && (() => {
              const inv = inventoryItems.find(i => i.id === form.inventory_item_id);
              const cost = (inv?.unit_cost || 0) * Math.abs(parseFloat(form.adjustment_qty || 0));
              return cost > 0 ? (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <p className="text-rose-300 text-sm">Estimated financial impact: <strong>-€{cost.toFixed(2)}</strong></p>
                </div>
              ) : null;
            })()}

            <Button
              onClick={() => logMutation.mutate(form)}
              disabled={!form.ingredient_name || !form.adjustment_qty || logMutation.isPending}
              className="w-full bg-rose-600 hover:bg-rose-700"
            >
              {logMutation.isPending ? 'Logging...' : 'Log Waste & Adjust Stock'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function WasteManagement() {
  return <BusinessProvider><WasteManagementContent /></BusinessProvider>;
}