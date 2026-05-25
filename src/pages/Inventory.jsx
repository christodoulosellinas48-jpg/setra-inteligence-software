import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import usePullToRefresh from '@/hooks/usePullToRefresh';
import PullToRefreshIndicator from '@/components/ui/PullToRefreshIndicator';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useBusiness } from '@/components/business/BusinessContext';
import { Plus, AlertTriangle, Package, DollarSign, Trash2, Edit2, RefreshCw, ClipboardList, Link2 } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import StockTakeModal from '@/components/inventory/StockTakeModal';
import SkeletonRows from '@/components/ui/SkeletonRows';

const CATEGORIES = [
  { value: 'produce',      label: 'Produce' },
  { value: 'meat_fish',    label: 'Meat & Fish' },
  { value: 'dairy',        label: 'Dairy' },
  { value: 'dry_goods',    label: 'Dry Goods' },
  { value: 'wine',         label: 'Wine' },
  { value: 'spirits_beer', label: 'Spirits & Beer' },
  { value: 'soft_drinks',  label: 'Soft Drinks' },
  { value: 'cleaning',     label: 'Cleaning' },
  { value: 'packaging',    label: 'Packaging' },
  { value: 'other',        label: 'Other' }
];

const UNITS = ['kg', 'g', 'l', 'ml', 'pc', 'bottle', 'case', 'lb', 'oz'];

const EMPTY_FORM = {
  ingredient_name: '', category: 'other', unit: 'kg',
  current_stock: '', reorder_threshold: '', unit_cost: '',
  supplier_name: '', last_restocked_date: '', notes: '',
  track_expiry: false
};

function InventoryContent() {
  const { currentBusiness, canEdit } = useBusiness();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showStockTake, setShowStockTake] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState('all');

  const { isRefreshing, pullDistance, containerRef } = usePullToRefresh(async () => {
    await qc.invalidateQueries(['inventory', currentBusiness?.id]);
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory', currentBusiness?.id],
    queryFn: () => base44.entities.InventoryItem.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness
  });

  // Load recipes to show linkage counts
  const { data: recipes = [] } = useQuery({
    queryKey: ['recipes', currentBusiness?.id],
    queryFn: () => base44.entities.Recipe.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.InventoryItem.update(editing.id, data)
      : base44.entities.InventoryItem.create(data),
    onSuccess: () => { qc.invalidateQueries(['inventory', currentBusiness?.id]); closeModal(); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InventoryItem.delete(id),
    onSuccess: () => qc.invalidateQueries(['inventory', currentBusiness?.id])
  });

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({ ...EMPTY_FORM, ...item, current_stock: item.current_stock ?? '', reorder_threshold: item.reorder_threshold ?? '', unit_cost: item.unit_cost ?? '' });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditing(null); setForm(EMPTY_FORM); };

  const handleSubmit = () => {
    saveMutation.mutate({
      ...form,
      business_id: currentBusiness.id,
      current_stock: parseFloat(form.current_stock) || 0,
      reorder_threshold: parseFloat(form.reorder_threshold) || 0,
      unit_cost: parseFloat(form.unit_cost) || 0
    });
  };

  const lowStock = items.filter(i => i.current_stock <= i.reorder_threshold && i.reorder_threshold > 0);
  const totalValue = items.reduce((sum, i) => sum + (i.current_stock * (i.unit_cost || 0)), 0);

  const filtered = filter === 'low' ? lowStock
    : filter === 'all' ? items
    : items.filter(i => i.category === filter);

  // Recipe linkage count per inventory item
  const recipeLinks = items.reduce((map, item) => {
    const count = recipes.filter(r => r.inventory_item_id === item.id || r.ingredient_name?.toLowerCase() === item.ingredient_name?.toLowerCase()).length;
    map[item.id] = count;
    return map;
  }, {});

  if (!currentBusiness) return (
    <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center">
      <p className="text-slate-400">Please select a business first.</p>
    </div>
  );

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0B0B12]">
      <PullToRefreshIndicator isRefreshing={isRefreshing} pullDistance={pullDistance} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Package className="w-6 h-6 text-[#C084FC]" /> Inventory
            </h1>
            <p className="text-slate-500 text-sm mt-1">{currentBusiness.name} · Track stock levels and ingredient costs</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canEdit() && (
              <Button variant="outline" onClick={() => setShowStockTake(true)} className="gap-2">
                <ClipboardList className="w-4 h-4" /> Stock Take
              </Button>
            )}
            {canEdit() && (
              <Button onClick={openAdd}>
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 bg-[#151528]/80 border-white/5">
            <p className="text-slate-400 text-sm mb-1">Total Items</p>
            <p className="text-3xl font-bold text-white">{items.length}</p>
          </Card>
          {/* Low stock: only red when > 0 */}
          <Card className={`p-5 border ${lowStock.length > 0 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-[#151528]/80 border-white/5'}`}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className={`w-4 h-4 ${lowStock.length > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
              <p className={`text-sm ${lowStock.length > 0 ? 'text-rose-400' : 'text-slate-400'}`}>Low Stock Alerts</p>
            </div>
            <p className={`text-3xl font-bold ${lowStock.length > 0 ? 'text-rose-400' : 'text-white'}`}>{lowStock.length}</p>
          </Card>
          <Card className="p-5 bg-[#151528]/80 border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <p className="text-slate-400 text-sm">Total Stock Value</p>
            </div>
            <p className="text-3xl font-bold text-emerald-400">
              €{totalValue === 0 ? '0' : totalValue.toFixed(2)}
            </p>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {[{ value: 'all', label: 'All' }, { value: 'low', label: '⚠ Low Stock' }, ...CATEGORIES].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === f.value ? 'bg-[#7B3BFF] text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Items Table */}
        {isLoading ? (
          <SkeletonRows count={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title={filter === 'all' ? 'No inventory items yet' : 'No items in this category'}
            description={filter === 'all' ? 'Add your first item to start tracking stock. Link items to recipes for live food-cost calculations.' : 'Try a different category filter or add items.'}
            action={filter === 'all' && canEdit() ? { label: 'Add first item', onClick: openAdd } : undefined}
          />
        ) : (
          <Card className="bg-[#151528]/80 border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0B0B12]/40">
                    {['Ingredient', 'Category', 'Stock', 'Par Level', 'Unit Cost', 'Stock Value', 'Recipes', 'Status', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => {
                    const isLow = item.current_stock <= item.reorder_threshold && item.reorder_threshold > 0;
                    const linkedRecipes = recipeLinks[item.id] || 0;
                    return (
                      <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-white font-medium">{item.ingredient_name}</p>
                          {item.supplier_name && <p className="text-xs text-slate-500">{item.supplier_name}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-400 text-sm capitalize">{CATEGORIES.find(c => c.value === item.category)?.label || item.category}</span>
                        </td>
                        <td className="px-4 py-3 text-white font-mono">{item.current_stock} {item.unit}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono">{item.reorder_threshold > 0 ? `${item.reorder_threshold} ${item.unit}` : '—'}</td>
                        <td className="px-4 py-3 text-slate-300">€{(item.unit_cost || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-emerald-400 font-medium">€{(item.current_stock * (item.unit_cost || 0)).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          {linkedRecipes > 0 ? (
                            <span className="flex items-center gap-1 text-xs text-[#C084FC]">
                              <Link2 className="w-3 h-3" />{linkedRecipes}
                            </span>
                          ) : (
                            <span className="text-slate-700 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isLow
                            ? <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-xs">⚠ Reorder</Badge>
                            : <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">OK</Badge>
                          }
                        </td>
                        <td className="px-4 py-3">
                          {canEdit() && (
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(item)} className="h-8 w-8 text-slate-400 hover:text-white">
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)} className="h-8 w-8 text-slate-400 hover:text-rose-400">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[#0F0F1E] border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">{editing ? 'Edit Item' : 'Add Inventory Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-slate-400 mb-1.5 block text-xs">Ingredient Name *</Label>
                <Input value={form.ingredient_name} onChange={e => setForm({ ...form, ingredient_name: e.target.value })}
                  className="bg-[#151528] border-white/10 text-white" placeholder="e.g. Tomatoes" />
              </div>
              <div>
                <Label className="text-slate-400 mb-1.5 block text-xs">Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="bg-[#151528] border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#151528] border-white/10">
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value} className="text-white">{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-400 mb-1.5 block text-xs">Unit</Label>
                <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v })}>
                  <SelectTrigger className="bg-[#151528] border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#151528] border-white/10">
                    {UNITS.map(u => <SelectItem key={u} value={u} className="text-white">{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-400 mb-1.5 block text-xs">Current Stock</Label>
                <Input type="number" value={form.current_stock} onChange={e => setForm({ ...form, current_stock: e.target.value })}
                  className="bg-[#151528] border-white/10 text-white" placeholder="0" />
              </div>
              <div>
                <Label className="text-slate-400 mb-1.5 block text-xs">Par Level (reorder at)</Label>
                <Input type="number" value={form.reorder_threshold} onChange={e => setForm({ ...form, reorder_threshold: e.target.value })}
                  className="bg-[#151528] border-white/10 text-white" placeholder="0" />
              </div>
              <div>
                <Label className="text-slate-400 mb-1.5 block text-xs">Unit Cost (€)</Label>
                <Input type="number" value={form.unit_cost} onChange={e => setForm({ ...form, unit_cost: e.target.value })}
                  className="bg-[#151528] border-white/10 text-white" placeholder="0.00" />
              </div>
              <div>
                <Label className="text-slate-400 mb-1.5 block text-xs">Last Restocked</Label>
                <Input type="date" value={form.last_restocked_date} onChange={e => setForm({ ...form, last_restocked_date: e.target.value })}
                  className="bg-[#151528] border-white/10 text-white" />
              </div>
              <div className="col-span-2">
                <Label className="text-slate-400 mb-1.5 block text-xs">Supplier</Label>
                <Input value={form.supplier_name} onChange={e => setForm({ ...form, supplier_name: e.target.value })}
                  className="bg-[#151528] border-white/10 text-white" placeholder="Supplier name" />
              </div>
              {/* Expiry tracking toggle */}
              <div className="col-span-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, track_expiry: !form.track_expiry })}
                  className="flex items-center gap-3 w-full p-3 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${form.track_expiry ? 'bg-[#7B3BFF]' : 'bg-white/10'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${form.track_expiry ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <div className="text-left">
                    <p className="text-white text-sm font-medium">Track expiry dates</p>
                    <p className="text-slate-500 text-xs">For perishables — get alerts before use-by</p>
                  </div>
                </button>
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={!form.ingredient_name || saveMutation.isPending} className="w-full">
              {saveMutation.isPending ? 'Saving...' : editing ? 'Update Item' : 'Add Item'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock Take Modal */}
      <StockTakeModal
        open={showStockTake}
        onClose={() => setShowStockTake(false)}
        items={items}
        businessId={currentBusiness?.id}
      />
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Inventory failed to load</h2>
            <p className="text-slate-400 text-sm mb-4">{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <button onClick={() => this.setState({ hasError: false, error: null })} className="px-4 py-2 bg-[#7B3BFF] text-white rounded-xl text-sm hover:bg-[#6B2BEF] transition-colors">
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Inventory() {
  return <ErrorBoundary><InventoryContent /></ErrorBoundary>;
}