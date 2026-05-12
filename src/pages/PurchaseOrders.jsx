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
import { useBusiness } from '@/components/business/BusinessContext';
import {
  ShoppingCart, Zap, Mail, Plus, Trash2, RefreshCw,
  CheckCircle2, AlertTriangle, Eye, X, Package
} from 'lucide-react';
import { format } from 'date-fns';

const STATUS_STYLES = {
  draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  sent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  received: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  partially_received: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  closed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'partially_received', label: 'Partially Received' },
  { value: 'received', label: 'Received' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const UNITS = ['kg', 'g', 'l', 'ml', 'pc', 'bottle', 'case', 'lb', 'oz'];

const EMPTY_LINE = { ingredient_name: '', qty: '', unit: 'kg', unit_cost: '' };

function NewPOModal({ open, onClose, businessId, suppliers, onSuccess }) {
  const [form, setForm] = useState({
    supplier_name: '',
    supplier_email: '',
    expected_delivery: '',
    notes: '',
  });
  const [lines, setLines] = useState([{ ...EMPTY_LINE }]);
  const qc = useQueryClient();

  const totalCost = lines.reduce((s, l) => s + (parseFloat(l.qty) || 0) * (parseFloat(l.unit_cost) || 0), 0);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PurchaseOrder.create(data),
    onSuccess: () => {
      qc.invalidateQueries(['purchaseOrders', businessId]);
      onSuccess?.();
      onClose();
      setForm({ supplier_name: '', supplier_email: '', expected_delivery: '', notes: '' });
      setLines([{ ...EMPTY_LINE }]);
    },
  });

  const setLine = (idx, key, val) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [key]: val } : l));
  };

  const addLine = () => setLines(prev => [...prev, { ...EMPTY_LINE }]);
  const removeLine = (idx) => setLines(prev => prev.filter((_, i) => i !== idx));

  // Auto-fill email when supplier is selected
  const onSupplierSelect = (name) => {
    const s = suppliers.find(sup => sup.name === name);
    setForm(f => ({ ...f, supplier_name: name, supplier_email: s?.contact_email || f.supplier_email }));
  };

  const handleSave = (asDraft) => {
    const validLines = lines.filter(l => l.ingredient_name.trim() && parseFloat(l.qty) > 0);
    createMutation.mutate({
      business_id: businessId,
      supplier_name: form.supplier_name,
      supplier_email: form.supplier_email,
      status: 'draft',
      items_json: JSON.stringify(validLines.map(l => ({
        ingredient_name: l.ingredient_name,
        qty: parseFloat(l.qty),
        unit: l.unit,
        unit_cost: parseFloat(l.unit_cost) || 0,
      }))),
      total_cost: totalCost,
      notes: form.notes,
      expected_delivery: form.expected_delivery || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#151528] border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-[#A855F7]" /> New Purchase Order
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Supplier row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-400 text-xs mb-1.5 block">Supplier Name *</Label>
              {suppliers.length > 0 ? (
                <Select value={form.supplier_name} onValueChange={onSupplierSelect}>
                  <SelectTrigger className="bg-[#0B0B12] border-white/10 text-white">
                    <SelectValue placeholder="Select supplier…" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#151528] border-white/10">
                    {suppliers.map(s => (
                      <SelectItem key={s.id} value={s.name} className="text-white">{s.name}</SelectItem>
                    ))}
                    <SelectItem value="__other__" className="text-slate-400">Other / type below</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={form.supplier_name}
                  onChange={e => setForm(f => ({ ...f, supplier_name: e.target.value }))}
                  className="bg-[#0B0B12] border-white/10 text-white"
                  placeholder="Supplier name"
                />
              )}
              {form.supplier_name === '__other__' && (
                <Input
                  className="bg-[#0B0B12] border-white/10 text-white mt-2"
                  placeholder="Type supplier name…"
                  onChange={e => setForm(f => ({ ...f, supplier_name: e.target.value }))}
                />
              )}
            </div>
            <div>
              <Label className="text-slate-400 text-xs mb-1.5 block">Supplier Email</Label>
              <Input
                value={form.supplier_email}
                onChange={e => setForm(f => ({ ...f, supplier_email: e.target.value }))}
                className="bg-[#0B0B12] border-white/10 text-white"
                placeholder="supplier@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-400 text-xs mb-1.5 block">Expected Delivery</Label>
              <Input
                type="date"
                value={form.expected_delivery}
                onChange={e => setForm(f => ({ ...f, expected_delivery: e.target.value }))}
                className="bg-[#0B0B12] border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-400 text-xs mb-1.5 block">Notes</Label>
              <Input
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="bg-[#0B0B12] border-white/10 text-white"
                placeholder="Special instructions…"
              />
            </div>
          </div>

          {/* Line items */}
          <div>
            <Label className="text-slate-400 text-xs mb-2 block">Order Items *</Label>
            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <Input
                    className="bg-[#0B0B12] border-white/10 text-white col-span-4"
                    placeholder="Item name"
                    value={line.ingredient_name}
                    onChange={e => setLine(idx, 'ingredient_name', e.target.value)}
                  />
                  <Input
                    className="bg-[#0B0B12] border-white/10 text-white col-span-2"
                    placeholder="Qty"
                    type="number"
                    min="0"
                    value={line.qty}
                    onChange={e => setLine(idx, 'qty', e.target.value)}
                  />
                  <Select value={line.unit} onValueChange={v => setLine(idx, 'unit', v)}>
                    <SelectTrigger className="bg-[#0B0B12] border-white/10 text-white col-span-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#151528] border-white/10">
                      {UNITS.map(u => <SelectItem key={u} value={u} className="text-white">{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input
                    className="bg-[#0B0B12] border-white/10 text-white col-span-3"
                    placeholder="Unit cost €"
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unit_cost}
                    onChange={e => setLine(idx, 'unit_cost', e.target.value)}
                  />
                  <button
                    onClick={() => removeLine(idx)}
                    disabled={lines.length === 1}
                    className="col-span-1 text-slate-600 hover:text-rose-400 disabled:opacity-30 transition-colors flex justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addLine} className="mt-2 text-xs text-[#A855F7] hover:text-[#C084FC] flex items-center gap-1 transition-colors">
              <Plus className="w-3 h-3" /> Add item
            </button>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
            <span className="text-slate-400 text-sm">Order Total</span>
            <span className="text-white font-bold text-lg">€{totalCost.toFixed(2)}</span>
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.supplier_name || form.supplier_name === '__other__' || lines.every(l => !l.ingredient_name.trim()) || createMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending ? 'Saving…' : 'Save as Draft'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ViewPOModal({ po, onClose, canEdit, onSend, sendingId, onStatusChange, businessId }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState(po?.supplier_email || '');
  const items = useMemo(() => {
    try { return JSON.parse(po?.items_json || '[]'); } catch { return []; }
  }, [po]);

  if (!po) return null;

  const saveEmail = async () => {
    await base44.entities.PurchaseOrder.update(po.id, { supplier_email: email });
    qc.invalidateQueries(['purchaseOrders', businessId]);
  };

  return (
    <Dialog open={!!po} onOpenChange={onClose}>
      <DialogContent className="bg-[#151528] border-white/10 max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Purchase Order — {po.supplier_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className={`${STATUS_STYLES[po.status] || STATUS_STYLES.draft} capitalize border`}>
              {po.status?.replace(/_/g, ' ')}
            </Badge>
            {po.created_date && (
              <span className="text-slate-500 text-xs">
                Created {format(new Date(po.created_date), 'dd MMM yyyy')}
              </span>
            )}
            {po.expected_delivery && (
              <span className="text-slate-500 text-xs">
                Expected: {po.expected_delivery}
              </span>
            )}
          </div>
          {po.notes && (
            <p className="text-slate-400 text-sm bg-white/[0.03] rounded-lg p-3">{po.notes}</p>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 text-slate-500">Item</th>
                <th className="text-left py-2 text-slate-500">Qty</th>
                <th className="text-right py-2 text-slate-500">Line Cost</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-white/5">
                  <td className="py-2 text-white">{item.ingredient_name}</td>
                  <td className="py-2 text-slate-300">{item.qty} {item.unit}</td>
                  <td className="py-2 text-right text-emerald-400">
                    €{((item.qty || 0) * (item.unit_cost || 0)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="pt-3 text-white font-semibold">Total</td>
                <td className="pt-3 text-right text-emerald-400 font-bold">€{po.total_cost?.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Email field for draft */}
          {canEdit && po.status === 'draft' && (
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs block">Supplier Email</Label>
              <div className="flex gap-2">
                <Input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-[#0B0B12] border-white/10 text-white text-sm"
                  placeholder="supplier@example.com"
                />
                <Button onClick={saveEmail} size="sm" variant="outline">Save</Button>
              </div>
            </div>
          )}

          {/* Actions */}
          {canEdit && (
            <div className="flex flex-wrap gap-2 pt-1">
              {po.status === 'draft' && (
                <Button
                  size="sm"
                  onClick={() => { onSend(po); onClose(); }}
                  disabled={sendingId === po.id}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {sendingId === po.id ? <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" /> : <Mail className="w-3 h-3 mr-1.5" />}
                  Send to Supplier
                </Button>
              )}
              {po.status === 'sent' && (
                <Button size="sm" variant="outline" onClick={() => { onStatusChange(po.id, 'partially_received'); onClose(); }}
                  className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10">
                  Partially Received
                </Button>
              )}
              {(po.status === 'sent' || po.status === 'partially_received') && (
                <Button size="sm" variant="outline" onClick={() => { onStatusChange(po.id, 'received'); onClose(); }}
                  className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
                  <CheckCircle2 className="w-3 h-3 mr-1.5" /> Mark Received
                </Button>
              )}
              {po.status === 'received' && (
                <Button size="sm" variant="outline" onClick={() => { onStatusChange(po.id, 'closed'); onClose(); }}
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                  Close PO
                </Button>
              )}
              {['draft', 'sent'].includes(po.status) && (
                <Button size="sm" variant="ghost" onClick={() => { onStatusChange(po.id, 'cancelled'); onClose(); }}
                  className="text-rose-400 hover:bg-rose-500/10">
                  Cancel PO
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PurchaseOrders() {
  const { currentBusiness, canEdit } = useBusiness();
  const qc = useQueryClient();
  const [viewingPO, setViewingPO] = useState(null);
  const [showNewPO, setShowNewPO] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [generatingPOs, setGeneratingPOs] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['purchaseOrders', currentBusiness?.id],
    queryFn: () => base44.entities.PurchaseOrder.filter({ business_id: currentBusiness.id }, '-created_date', 50),
    enabled: !!currentBusiness,
  });

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory', currentBusiness?.id],
    queryFn: () => base44.entities.InventoryItem.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers', currentBusiness?.id],
    queryFn: () => base44.entities.Supplier.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PurchaseOrder.delete(id),
    onSuccess: () => qc.invalidateQueries(['purchaseOrders', currentBusiness?.id]),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.PurchaseOrder.update(id, { status }),
    onSuccess: () => qc.invalidateQueries(['purchaseOrders', currentBusiness?.id]),
  });

  const lowStockItems = useMemo(() =>
    inventoryItems.filter(i => i.reorder_threshold > 0 && i.current_stock <= i.reorder_threshold),
    [inventoryItems]
  );

  const groupedBySupplier = useMemo(() => {
    const groups = {};
    lowStockItems.forEach(item => {
      const supplier = item.supplier_name || 'Unknown Supplier';
      if (!groups[supplier]) groups[supplier] = [];
      groups[supplier].push(item);
    });
    return groups;
  }, [lowStockItems]);

  const generatePOs = async () => {
    setGeneratingPOs(true);
    for (const [supplierName, items] of Object.entries(groupedBySupplier)) {
      const orderItems = items.map(item => ({
        inventory_item_id: item.id,
        ingredient_name: item.ingredient_name,
        current_stock: item.current_stock,
        qty: Math.max(item.reorder_threshold * 2 - item.current_stock, item.reorder_threshold),
        unit: item.unit,
        unit_cost: item.unit_cost || 0,
      }));
      const totalCost = orderItems.reduce((s, i) => s + i.qty * i.unit_cost, 0);
      await base44.entities.PurchaseOrder.create({
        business_id: currentBusiness.id,
        supplier_name: supplierName,
        supplier_email: items[0]?.supplier_email || '',
        status: 'draft',
        items_json: JSON.stringify(orderItems),
        total_cost: totalCost,
        notes: `Auto-generated ${format(new Date(), 'dd MMM yyyy')} — ${items.length} item(s) below reorder threshold`,
      });
    }
    qc.invalidateQueries(['purchaseOrders', currentBusiness?.id]);
    setGeneratingPOs(false);
  };

  const sendPO = async (po) => {
    if (!po.supplier_email) {
      alert('No supplier email configured. Open the PO and add a supplier email first.');
      return;
    }
    setSendingId(po.id);
    const items = JSON.parse(po.items_json || '[]');
    const itemList = items.map(i =>
      `  • ${i.ingredient_name}: ${i.qty} ${i.unit} @ €${i.unit_cost}/unit = €${(i.qty * i.unit_cost).toFixed(2)}`
    ).join('\n');
    const emailBody = `Dear ${po.supplier_name},\n\nWe would like to place the following purchase order:\n\n${itemList}\n\nTotal: €${po.total_cost?.toFixed(2)}\n\nNotes: ${po.notes || ''}\n\nPlease confirm receipt and expected delivery date.\n\nBest regards,\n${currentBusiness.name}`;
    await base44.integrations.Core.SendEmail({
      to: po.supplier_email,
      subject: `Purchase Order from ${currentBusiness.name}`,
      body: emailBody,
    });
    await base44.entities.PurchaseOrder.update(po.id, { status: 'sent', sent_at: new Date().toISOString() });
    qc.invalidateQueries(['purchaseOrders', currentBusiness?.id]);
    setSendingId(null);
  };

  const filteredOrders = useMemo(() =>
    statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter),
    [orders, statusFilter]
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
              <ShoppingCart className="w-6 h-6 text-[#C084FC]" /> Purchase Orders
            </h1>
            <p className="text-slate-500 text-sm mt-1">Auto-generate and email orders to suppliers</p>
          </div>
          {canEdit() && (
            <div className="flex flex-wrap gap-2">
              <div className="relative group">
                <Button
                  variant="outline"
                  onClick={lowStockItems.length > 0 ? generatePOs : undefined}
                  disabled={generatingPOs || lowStockItems.length === 0}
                  className={lowStockItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  {generatingPOs
                    ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    : <Zap className="w-4 h-4 mr-2" />
                  }
                  Generate from Low Stock
                  {lowStockItems.length > 0 && (
                    <span className="ml-1.5 bg-amber-500/20 text-amber-400 text-xs px-1.5 py-0.5 rounded-full">
                      {lowStockItems.length}
                    </span>
                  )}
                </Button>
                {lowStockItems.length === 0 && (
                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-[#1A1A30] border border-white/10 rounded-xl p-3 text-xs text-slate-400 w-64 shadow-xl z-10">
                    No inventory items below their reorder threshold yet.{' '}
                    <a href="/Inventory" className="text-[#A855F7] underline hover:text-[#C084FC]">Set reorder points →</a>
                  </div>
                )}
              </div>
              <Button onClick={() => setShowNewPO(true)}>
                <Plus className="w-4 h-4 mr-2" /> New PO
              </Button>
            </div>
          )}
        </div>

        {/* Low Stock Alert Banner */}
        {lowStockItems.length > 0 && (
          <Card className="p-4 bg-amber-500/10 border-amber-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-300 font-medium">
                  {lowStockItems.length} items below reorder threshold across {Object.keys(groupedBySupplier).length} supplier(s)
                </p>
                <p className="text-amber-500/80 text-xs mt-0.5">
                  {lowStockItems.map(i => i.ingredient_name).join(' · ')}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Orders', value: orders.length, color: 'text-white' },
            { label: 'Draft', value: orders.filter(o => o.status === 'draft').length, color: 'text-slate-400' },
            { label: 'Sent', value: orders.filter(o => o.status === 'sent').length, color: 'text-blue-400' },
            { label: 'Received', value: orders.filter(o => ['received', 'closed'].includes(o.status)).length, color: 'text-emerald-400' },
          ].map(s => (
            <Card key={s.label} className="p-4 bg-[#151528]/80 border-white/5">
              <p className="text-slate-400 text-xs mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </Card>
          ))}
        </div>

        {/* Filter bar */}
        {orders.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  statusFilter === opt.value
                    ? 'bg-[#7B3BFF]/20 text-[#C084FC] border-[#7B3BFF]/40'
                    : 'bg-white/[0.03] text-slate-400 border-white/10 hover:border-white/20'
                }`}
              >
                {opt.label}
                {opt.value !== 'all' && (
                  <span className="ml-1.5 opacity-60">
                    {orders.filter(o => o.status === opt.value).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Orders List */}
        {isLoading ? (
          <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-[#7B3BFF] animate-spin" /></div>
        ) : orders.length === 0 ? (
          <Card className="p-12 text-center bg-[#151528]/80 border-white/5">
            <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-300 font-medium mb-1">No purchase orders yet</p>
            <p className="text-slate-500 text-sm mt-1 mb-5">
              Create a PO manually, or generate automatically when inventory items fall below their reorder threshold.
            </p>
            {canEdit() && (
              <div className="flex gap-3 justify-center flex-wrap">
                <Button onClick={() => setShowNewPO(true)}>
                  <Plus className="w-4 h-4 mr-2" /> New PO
                </Button>
                <Button variant="outline" disabled={lowStockItems.length === 0} onClick={generatePOs}>
                  <Package className="w-4 h-4 mr-2" />
                  {lowStockItems.length === 0 ? 'No low stock items' : `Generate from Low Stock (${lowStockItems.length})`}
                </Button>
              </div>
            )}
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card className="p-8 text-center bg-[#151528]/80 border-white/5">
            <p className="text-slate-400">No orders with status "{statusFilter.replace(/_/g, ' ')}".</p>
          </Card>
        ) : (
          <Card className="bg-[#151528]/80 border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Supplier', 'Items', 'Total', 'Status', 'Created', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(po => {
                    const items = (() => { try { return JSON.parse(po.items_json || '[]'); } catch { return []; } })();
                    return (
                      <tr key={po.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-white font-medium">{po.supplier_name}</p>
                          {po.supplier_email && <p className="text-xs text-slate-500">{po.supplier_email}</p>}
                        </td>
                        <td className="px-4 py-3 text-slate-300 text-sm">{items.length} item{items.length !== 1 ? 's' : ''}</td>
                        <td className="px-4 py-3 text-emerald-400 font-medium">€{(po.total_cost || 0).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <Badge className={`capitalize border ${STATUS_STYLES[po.status] || STATUS_STYLES.draft}`}>
                            {po.status?.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-sm">
                          {po.created_date ? format(new Date(po.created_date), 'dd MMM yy') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Button variant="ghost" size="sm" onClick={() => setViewingPO(po)}
                              className="h-7 text-slate-400 hover:text-white text-xs px-2">
                              <Eye className="w-3 h-3 mr-1" /> View
                            </Button>
                            {canEdit() && po.status === 'draft' && (
                              <Button size="sm" onClick={() => sendPO(po)} disabled={sendingId === po.id}
                                className="h-7 text-xs px-2 bg-blue-600 hover:bg-blue-700">
                                {sendingId === po.id
                                  ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                  : <Mail className="w-3 h-3 mr-1" />
                                }
                                Send
                              </Button>
                            )}
                            {canEdit() && po.status === 'sent' && (
                              <Button size="sm" variant="outline"
                                onClick={() => updateStatusMutation.mutate({ id: po.id, status: 'received' })}
                                className="h-7 text-xs px-2 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Received
                              </Button>
                            )}
                            {canEdit() && (
                              <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(po.id)}
                                className="h-7 text-xs px-1 text-slate-600 hover:text-rose-400">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
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

      <NewPOModal
        open={showNewPO}
        onClose={() => setShowNewPO(false)}
        businessId={currentBusiness.id}
        suppliers={suppliers}
      />

      <ViewPOModal
        po={viewingPO}
        onClose={() => setViewingPO(null)}
        canEdit={canEdit()}
        onSend={sendPO}
        sendingId={sendingId}
        onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
        businessId={currentBusiness.id}
      />
    </div>
  );
}