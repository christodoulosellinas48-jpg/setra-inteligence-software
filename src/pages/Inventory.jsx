import React, { useState } from 'react';
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
import { Plus, AlertTriangle, Package, DollarSign, Trash2, Edit2, RefreshCw } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

const CATEGORIES = [
  { value: 'produce', label: 'Produce' },
  { value: 'meat_fish', label: 'Meat & Fish' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'dry_goods', label: 'Dry Goods' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'other', label: 'Other' }
];

const UNITS = ['kg', 'g', 'l', 'ml', 'pc', 'lb', 'oz'];

const EMPTY_FORM = {
  ingredient_name: '', category: 'other', unit: 'kg',
  current_stock: '', reorder_threshold: '', unit_cost: '',
  supplier_name: '', last_restocked_date: '', notes: ''
};

function InventoryContent() {
  const { currentBusiness, canEdit } = useBusiness();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState('all');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory', currentBusiness?.id],
    queryFn: () => base44.entities.InventoryItem.filter({ business_id: currentBusiness.id }),
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
    setForm({ ...item, current_stock: item.current_stock ?? '', reorder_threshold: item.reorder_threshold ?? '', unit_cost: item.unit_cost ?? '' });
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
  const totalValue = items.reduce((sum, i) => sum + (i.current_stock * i.unit_cost), 0);

  const filtered = filter === 'low' ? lowStock : filter === 'all' ? items
    : items.filter(i => i.category === filter);

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
              <Package className="w-6 h-6 text-[#C084FC]" /> Inventory
            </h1>
            <p className="text-slate-500 text-sm mt-1">Track stock levels and ingredient costs</p>
          </div>
          {canEdit() && (
            <Button onClick={openAdd}>
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 bg-[#151528]/80 border-white/5">
            <p className="text-slate-400 text-sm mb-1">Total Items</p>
            <p className="text-3xl font-bold text-white">{items.length}</p>
          </Card>
          <Card className="p-5 bg-rose-500/10 border-rose-500/30">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <p className="text-rose-400 text-sm">Low Stock Alerts</p>
            </div>
            <p className="text-3xl font-bold text-rose-400">{lowStock.length}</p>
          </Card>
          <Card className="p-5 bg-[#151528]/80 border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <p className="text-slate-400 text-sm">Total Stock Value</p>
            </div>
            <p className="text-3xl font-bold text-emerald-400">€{totalValue.toFixed(2)}</p>
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
          <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-[#7B3BFF] animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No items found"
            description="Add your first inventory item to start tracking stock levels."
          />
        ) : (
          <Card className="bg-[#151528]/80 border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Ingredient', 'Category', 'Stock', 'Threshold', 'Unit Cost', 'Stock Value', 'Status', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => {
                    const isLow = item.current_stock <= item.reorder_threshold && item.reorder_threshold > 0;
                    return (
                      <tr key={item.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-white font-medium">{item.ingredient_name}</p>
                          {item.supplier_name && <p className="text-xs text-slate-500">{item.supplier_name}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-400 text-sm capitalize">{item.category?.replace('_', ' ')}</span>
                        </td>
                        <td className="px-4 py-3 text-white font-mono">{item.current_stock} {item.unit}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono">{item.reorder_threshold} {item.unit}</td>
                        <td className="px-4 py-3 text-slate-300">€{item.unit_cost?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-emerald-400 font-medium">€{(item.current_stock * item.unit_cost).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          {isLow
                            ? <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">⚠ Reorder</Badge>
                            : <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">OK</Badge>
                          }
                        </td>
                        <td className="px-4 py-3">
                          {canEdit() && (
                            <div className="flex items-center gap-2">
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
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{editing ? 'Edit Item' : 'Add Inventory Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-slate-400 mb-1.5 block">Ingredient Name</Label>
                <Input value={form.ingredient_name} onChange={e => setForm({ ...form, ingredient_name: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Tomatoes" />
              </div>
              <div>
                <Label className="text-slate-400 mb-1.5 block">Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value} className="text-white">{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-400 mb-1.5 block">Unit</Label>
                <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {UNITS.map(u => <SelectItem key={u} value={u} className="text-white">{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-400 mb-1.5 block">Current Stock</Label>
                <Input type="number" value={form.current_stock} onChange={e => setForm({ ...form, current_stock: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="0" />
              </div>
              <div>
                <Label className="text-slate-400 mb-1.5 block">Reorder Threshold</Label>
                <Input type="number" value={form.reorder_threshold} onChange={e => setForm({ ...form, reorder_threshold: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="0" />
              </div>
              <div>
                <Label className="text-slate-400 mb-1.5 block">Unit Cost (€)</Label>
                <Input type="number" value={form.unit_cost} onChange={e => setForm({ ...form, unit_cost: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="0.00" />
              </div>
              <div>
                <Label className="text-slate-400 mb-1.5 block">Last Restocked</Label>
                <Input type="date" value={form.last_restocked_date} onChange={e => setForm({ ...form, last_restocked_date: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="col-span-2">
                <Label className="text-slate-400 mb-1.5 block">Supplier</Label>
                <Input value={form.supplier_name} onChange={e => setForm({ ...form, supplier_name: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="Supplier name" />
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={!form.ingredient_name || saveMutation.isPending} className="w-full">
              {saveMutation.isPending ? 'Saving...' : editing ? 'Update Item' : 'Add Item'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Inventory() {
  return <BusinessProvider><InventoryContent /></BusinessProvider>;
}