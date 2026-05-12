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
import {
  Trash2, Plus, RefreshCw, AlertTriangle, DollarSign,
  TrendingDown, Package, Search, Lightbulb, Calendar,
  TrendingUp, BarChart3
} from 'lucide-react';
import { format, subDays, startOfMonth } from 'date-fns';

// Hospitality-standard reason taxonomy
const REASONS = [
  { value: 'spoilage',         label: 'Spoilage',          desc: 'Went off naturally',            color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { value: 'expired',          label: 'Expired',           desc: 'Past use-by date',              color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { value: 'breakage',         label: 'Breakage',          desc: 'Dropped, broken, contaminated', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { value: 'prep_waste',       label: 'Prep Waste',        desc: 'Trim, off-cuts',                color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'over_portion',     label: 'Over-portion',      desc: 'Kitchen made too much',         color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { value: 'customer_return',  label: 'Customer Return',   desc: 'Sent back, disposed',           color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'comped_meal',      label: 'Comped Meal',       desc: 'Given away free',               color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { value: 'theft_suspected',  label: 'Theft Suspected',   desc: 'Flag for investigation',        color: 'bg-rose-600/20 text-rose-300 border-rose-600/30' },
  { value: 'other',            label: 'Other',             desc: 'See notes',                     color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
];

const REASON_MAP = Object.fromEntries(REASONS.map(r => [r.value, r]));

// Industry waste benchmarks as % of revenue
const WASTE_BENCHMARKS = {
  restaurant: { low: 2, high: 5, label: 'Restaurant' },
  bar: { low: 1, high: 3, label: 'Bar' },
  coffee_shop: { low: 1.5, high: 3, label: 'Coffee Shop' },
  canteen: { low: 3, high: 6, label: 'Canteen' },
  default: { low: 2, high: 5, label: 'Hospitality' },
};

function WasteManagementContent() {
  const { currentBusiness, canEdit } = useBusiness();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({
    inventory_item_id: '',
    ingredient_name: '',
    adjustment_qty: '',
    unit: 'kg',
    reason: 'spoilage',
    notes: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });
  const [filterReason, setFilterReason] = useState('all');
  const [dateRange, setDateRange] = useState('30'); // days

  const { data: adjustments = [], isLoading } = useQuery({
    queryKey: ['adjustments', currentBusiness?.id],
    queryFn: () => base44.entities.InventoryAdjustment.filter({ business_id: currentBusiness.id }, '-date', 500),
    enabled: !!currentBusiness,
  });

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory', currentBusiness?.id],
    queryFn: () => base44.entities.InventoryItem.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness,
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales-recent', currentBusiness?.id],
    queryFn: () => base44.entities.Sale.filter({ business_id: currentBusiness.id }, '-date', 200),
    enabled: !!currentBusiness,
  });

  const logMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.InventoryAdjustment.create({
        business_id: currentBusiness.id,
        date: data.date,
        ingredient_name: data.ingredient_name,
        adjustment_qty: -(Math.abs(parseFloat(data.adjustment_qty))),
        reason: data.reason,
        notes: data.notes,
      });
      if (data.inventory_item_id) {
        const item = inventoryItems.find(i => i.id === data.inventory_item_id);
        if (item) {
          const newStock = Math.max(0, (item.current_stock || 0) - Math.abs(parseFloat(data.adjustment_qty)));
          await base44.entities.InventoryItem.update(data.inventory_item_id, { current_stock: newStock });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries(['adjustments', currentBusiness?.id]);
      qc.invalidateQueries(['inventory', currentBusiness?.id]);
      setShowModal(false);
      setForm({ inventory_item_id: '', ingredient_name: '', adjustment_qty: '', unit: 'kg', reason: 'spoilage', notes: '', date: format(new Date(), 'yyyy-MM-dd') });
      setSearchQuery('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InventoryAdjustment.delete(id),
    onSuccess: () => qc.invalidateQueries(['adjustments', currentBusiness?.id]),
  });

  const handleInventorySelect = (invId) => {
    const inv = inventoryItems.find(i => i.id === invId);
    setForm(f => ({ ...f, inventory_item_id: invId, ingredient_name: inv?.ingredient_name || '', unit: inv?.unit || 'kg' }));
    setSearchQuery(inv?.ingredient_name || '');
  };

  const getFinancialImpact = (adj) => {
    const inv = inventoryItems.find(i => i.ingredient_name?.toLowerCase() === adj.ingredient_name?.toLowerCase());
    return Math.abs(adj.adjustment_qty) * (inv?.unit_cost || 0);
  };

  // Selected inventory item for cost preview
  const selectedInv = inventoryItems.find(i => i.id === form.inventory_item_id);
  const costPreview = selectedInv && form.adjustment_qty
    ? (selectedInv.unit_cost || 0) * Math.abs(parseFloat(form.adjustment_qty || 0))
    : 0;

  // Filter waste adjustments
  const wasteAdjustments = useMemo(() => adjustments.filter(a => a.adjustment_qty < 0), [adjustments]);

  // Date range filter
  const rangeCutoff = useMemo(() => {
    if (dateRange === 'all') return null;
    return subDays(new Date(), parseInt(dateRange));
  }, [dateRange]);

  const filtered = useMemo(() => {
    let list = wasteAdjustments;
    if (filterReason !== 'all') list = list.filter(a => a.reason === filterReason);
    if (rangeCutoff) list = list.filter(a => new Date(a.date) >= rangeCutoff);
    return list;
  }, [wasteAdjustments, filterReason, rangeCutoff]);

  // KPIs
  const thisMonthWaste = useMemo(() => {
    const start = startOfMonth(new Date());
    return wasteAdjustments.filter(a => new Date(a.date) >= start).reduce((s, a) => s + getFinancialImpact(a), 0);
  }, [wasteAdjustments, inventoryItems]);

  const last30Waste = useMemo(() =>
    wasteAdjustments.filter(a => new Date(a.date) >= subDays(new Date(), 30)).reduce((s, a) => s + getFinancialImpact(a), 0),
    [wasteAdjustments, inventoryItems]
  );

  const totalWasteCost = useMemo(() =>
    wasteAdjustments.reduce((s, a) => s + getFinancialImpact(a), 0),
    [wasteAdjustments, inventoryItems]
  );

  // Revenue for benchmark
  const last30Revenue = useMemo(() => {
    const cutoff = subDays(new Date(), 30);
    return sales.filter(s => new Date(s.date) >= cutoff).reduce((s, sale) => s + (sale.net_revenue || 0), 0);
  }, [sales]);

  const wastePct = last30Revenue > 0 ? (last30Waste / last30Revenue) * 100 : null;
  const benchmark = WASTE_BENCHMARKS[currentBusiness?.industry_group] || WASTE_BENCHMARKS.default;
  const benchmarkStatus = wastePct === null ? 'no-data'
    : wastePct <= benchmark.low ? 'green'
    : wastePct <= benchmark.high ? 'amber'
    : 'red';

  // Top wasted ingredients
  const topWasted = useMemo(() => {
    const byIngredient = {};
    wasteAdjustments.forEach(a => {
      const k = a.ingredient_name;
      if (!byIngredient[k]) byIngredient[k] = { name: k, qty: 0, cost: 0 };
      byIngredient[k].qty += Math.abs(a.adjustment_qty);
      byIngredient[k].cost += getFinancialImpact(a);
    });
    return Object.values(byIngredient).sort((a, b) => b.cost - a.cost).slice(0, 5);
  }, [wasteAdjustments, inventoryItems]);

  // Pattern detection
  const patterns = useMemo(() => {
    const results = [];
    if (wasteAdjustments.length < 3) return results;

    // Most wasted item
    if (topWasted.length > 0) {
      results.push({ icon: '📦', text: `${topWasted[0].name} is your highest-cost waste item — €${topWasted[0].cost.toFixed(0)} lost.` });
    }

    // Dominant reason
    const reasonCounts = {};
    wasteAdjustments.forEach(a => { reasonCounts[a.reason] = (reasonCounts[a.reason] || 0) + 1; });
    const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0];
    if (topReason && topReason[1] >= 3) {
      const r = REASON_MAP[topReason[0]];
      results.push({ icon: '🔁', text: `${r?.label || topReason[0]} is your most common waste reason (${topReason[1]} entries) — a pattern worth investigating.` });
    }

    // Month-over-month trend
    const thisMonth = startOfMonth(new Date());
    const lastMonthStart = startOfMonth(subDays(thisMonth, 1));
    const thisMonthCost = wasteAdjustments.filter(a => new Date(a.date) >= thisMonth).reduce((s, a) => s + getFinancialImpact(a), 0);
    const lastMonthCost = wasteAdjustments.filter(a => new Date(a.date) >= lastMonthStart && new Date(a.date) < thisMonth).reduce((s, a) => s + getFinancialImpact(a), 0);
    if (lastMonthCost > 0 && thisMonthCost > lastMonthCost * 1.25) {
      results.push({ icon: '📈', text: `Waste cost is up significantly vs last month (€${thisMonthCost.toFixed(0)} vs €${lastMonthCost.toFixed(0)}) — check what changed.` });
    }

    return results;
  }, [wasteAdjustments, topWasted, inventoryItems]);

  // Filtered inventory items for search
  const filteredInventory = useMemo(() =>
    inventoryItems.filter(i => i.ingredient_name?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 8),
    [inventoryItems, searchQuery]
  );

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
          {/* Total Records — neutral */}
          <Card className="p-4 bg-[#151528]/80 border-white/5">
            <p className="text-slate-400 text-xs mb-1">Total Records</p>
            <p className="text-2xl font-bold text-white">{wasteAdjustments.length}</p>
            <p className="text-xs text-slate-600 mt-1">all time</p>
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
          {/* Waste as % of revenue */}
          <Card className={`p-4 border ${
            benchmarkStatus === 'green' ? 'bg-emerald-500/10 border-emerald-500/20' :
            benchmarkStatus === 'amber' ? 'bg-amber-500/10 border-amber-500/20' :
            benchmarkStatus === 'red' ? 'bg-rose-500/10 border-rose-500/20' :
            'bg-[#151528]/80 border-white/5'
          }`}>
            <div className="flex items-center gap-1 mb-1">
              <BarChart3 className={`w-3 h-3 ${benchmarkStatus === 'green' ? 'text-emerald-400' : benchmarkStatus === 'amber' ? 'text-amber-400' : benchmarkStatus === 'red' ? 'text-rose-400' : 'text-slate-400'}`} />
              <p className={`text-xs ${benchmarkStatus === 'green' ? 'text-emerald-300' : benchmarkStatus === 'amber' ? 'text-amber-300' : benchmarkStatus === 'red' ? 'text-rose-300' : 'text-slate-400'}`}>
                Waste % of Revenue
              </p>
            </div>
            {wastePct !== null ? (
              <>
                <p className={`text-2xl font-bold ${benchmarkStatus === 'green' ? 'text-emerald-400' : benchmarkStatus === 'amber' ? 'text-amber-400' : 'text-rose-400'}`}>
                  {wastePct.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-tight">
                  {benchmark.label} benchmark: {benchmark.low}–{benchmark.high}%
                  {benchmarkStatus === 'green' && ' ✓'}
                  {benchmarkStatus === 'red' && ' ↑ above range'}
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-slate-500">—</p>
                <p className="text-xs text-slate-600 mt-1">Add sales data to compare</p>
              </>
            )}
          </Card>
        </div>

        {/* Pattern Detection */}
        {patterns.length > 0 && (
          <Card className="bg-amber-500/5 border-amber-500/20 p-5">
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
              <Lightbulb className="w-4 h-4 text-amber-400" /> Patterns Detected
            </h2>
            <div className="space-y-2">
              {patterns.map((p, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="text-base leading-none mt-0.5">{p.icon}</span>
                  <p className="text-slate-300 leading-snug">{p.text}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Wasted */}
          <Card className="bg-[#151528]/80 border-white/5 p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2 text-sm">
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
                        <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${(item.cost / topWasted[0].cost) * 100}%` }} />
                      </div>
                    </div>
                    <span className="text-rose-400 text-sm font-medium shrink-0">€{item.cost.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Waste Log */}
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h2 className="text-white font-semibold text-sm">Waste Log</h2>
              <div className="flex flex-wrap gap-2">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-32 h-8 bg-[#151528] border-white/10 text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#151528] border-white/10">
                    <SelectItem value="7" className="text-white text-xs">Last 7 days</SelectItem>
                    <SelectItem value="30" className="text-white text-xs">Last 30 days</SelectItem>
                    <SelectItem value="90" className="text-white text-xs">Last 90 days</SelectItem>
                    <SelectItem value="all" className="text-white text-xs">All time</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterReason} onValueChange={setFilterReason}>
                  <SelectTrigger className="w-36 h-8 bg-[#151528] border-white/10 text-white text-xs">
                    <SelectValue placeholder="All reasons" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#151528] border-white/10">
                    <SelectItem value="all" className="text-white text-xs">All reasons</SelectItem>
                    {REASONS.map(r => (
                      <SelectItem key={r.value} value={r.value} className="text-white text-xs">{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Card className="bg-[#151528]/80 border-white/5 overflow-hidden">
              {isLoading ? (
                <div className="flex justify-center py-10"><RefreshCw className="w-5 h-5 text-[#7B3BFF] animate-spin" /></div>
              ) : filtered.length === 0 ? (
                <div className="p-10 text-center">
                  <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No waste records yet. Start logging to track financial impact.</p>
                  <p className="text-slate-600 text-xs mt-1">Add items in Recipe Manager first to enable cost calculations.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        {['Date', 'Ingredient', 'Qty', 'Reason', 'Cost', ''].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(adj => {
                        const inv = inventoryItems.find(i => i.ingredient_name?.toLowerCase() === adj.ingredient_name?.toLowerCase());
                        const impact = getFinancialImpact(adj);
                        const reasonDef = REASON_MAP[adj.reason];
                        return (
                          <tr key={adj.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                              {adj.date ? format(new Date(adj.date), 'dd MMM yy') : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-white">{adj.ingredient_name}</p>
                              {adj.notes && <p className="text-xs text-slate-500 mt-0.5">{adj.notes}</p>}
                            </td>
                            <td className="px-4 py-3 text-slate-300 font-mono text-xs whitespace-nowrap">
                              {Math.abs(adj.adjustment_qty)} {inv?.unit || ''}
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={`text-xs border ${reasonDef?.color || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                                {reasonDef?.label || adj.reason}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {impact > 0
                                ? <span className="text-rose-400 font-medium text-xs">-€{impact.toFixed(2)}</span>
                                : <span className="text-slate-600 text-xs">—</span>
                              }
                            </td>
                            <td className="px-4 py-3">
                              {canEdit() && (
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:text-rose-400" onClick={() => deleteMutation.mutate(adj.id)}>
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

      {/* Log Waste Modal — mobile-first */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[#0F0F1E] border-white/10 max-w-md w-full mx-4">
          <DialogHeader>
            <DialogTitle className="text-white">Log Waste</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">

            {/* Inventory search */}
            <div>
              <Label className="text-slate-400 text-xs mb-1.5 block">Ingredient</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <Input
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setForm(f => ({ ...f, inventory_item_id: '', ingredient_name: e.target.value })); }}
                  placeholder="Search inventory or type name…"
                  className="bg-[#151528] border-white/10 text-white pl-9"
                />
              </div>
              {searchQuery && filteredInventory.length > 0 && !form.inventory_item_id && (
                <div className="mt-1 bg-[#151528] border border-white/10 rounded-lg overflow-hidden">
                  {filteredInventory.map(i => (
                    <button
                      key={i.id}
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/5 flex items-center justify-between"
                      onClick={() => handleInventorySelect(i.id)}
                    >
                      <span>{i.ingredient_name}</span>
                      <span className="text-xs text-slate-500">{i.current_stock} {i.unit} · €{i.unit_cost}/unit</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Qty + unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-400 text-xs mb-1.5 block">Quantity Wasted</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.adjustment_qty}
                  onChange={e => setForm({ ...form, adjustment_qty: e.target.value })}
                  className="bg-[#151528] border-white/10 text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs mb-1.5 block">Unit</Label>
                <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v })}>
                  <SelectTrigger className="bg-[#151528] border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#151528] border-white/10">
                    {['kg', 'g', 'l', 'ml', 'pc', 'bottle', 'case'].map(u => (
                      <SelectItem key={u} value={u} className="text-white">{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Reason chips */}
            <div>
              <Label className="text-slate-400 text-xs mb-2 block">Reason</Label>
              <div className="grid grid-cols-2 gap-2">
                {REASONS.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setForm(f => ({ ...f, reason: r.value }))}
                    className={`text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                      form.reason === r.value
                        ? r.color + ' font-semibold'
                        : 'bg-white/[0.03] border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="font-medium">{r.label}</div>
                    <div className="text-[10px] opacity-70 mt-0.5">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date + Notes */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-400 text-xs mb-1.5 block">Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="bg-[#151528] border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs mb-1.5 block">Notes (optional)</Label>
                <Input
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="bg-[#151528] border-white/10 text-white"
                  placeholder="e.g. fridge failure"
                />
              </div>
            </div>

            {/* Cost preview */}
            {costPreview > 0 && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <p className="text-rose-300 text-sm">
                  Estimated cost: <strong>-€{costPreview.toFixed(2)}</strong>
                  <span className="text-rose-400/60 ml-1 text-xs">(stock will update automatically)</span>
                </p>
              </div>
            )}

            <Button
              onClick={() => logMutation.mutate(form)}
              disabled={!form.ingredient_name || !form.adjustment_qty || logMutation.isPending}
              className="w-full bg-rose-600 hover:bg-rose-700 h-12 text-base"
            >
              {logMutation.isPending ? 'Logging…' : 'Log Waste & Adjust Stock'}
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