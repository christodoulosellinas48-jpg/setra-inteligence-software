import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { BusinessProvider, useBusiness } from '@/components/business/BusinessContext';
import { ShoppingCart, Zap, Mail, Plus, Trash2, RefreshCw, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_STYLES = {
  draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  sent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  received: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
};

function PurchaseOrdersContent() {
  const { currentBusiness, canEdit } = useBusiness();
  const qc = useQueryClient();
  const [viewingPO, setViewingPO] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  const [generatingPOs, setGeneratingPOs] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['purchaseOrders', currentBusiness?.id],
    queryFn: () => base44.entities.PurchaseOrder.filter({ business_id: currentBusiness.id }, '-created_date', 50),
    enabled: !!currentBusiness
  });

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory', currentBusiness?.id],
    queryFn: () => base44.entities.InventoryItem.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PurchaseOrder.delete(id),
    onSuccess: () => qc.invalidateQueries(['purchaseOrders', currentBusiness?.id])
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.PurchaseOrder.update(id, { status }),
    onSuccess: () => qc.invalidateQueries(['purchaseOrders', currentBusiness?.id])
  });

  // Low stock items grouped by supplier
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
        unit_cost: item.unit_cost || 0
      }));
      const totalCost = orderItems.reduce((s, i) => s + i.qty * i.unit_cost, 0);
      await base44.entities.PurchaseOrder.create({
        business_id: currentBusiness.id,
        supplier_name: supplierName,
        supplier_email: items[0]?.supplier_email || '',
        status: 'draft',
        items_json: JSON.stringify(orderItems),
        total_cost: totalCost,
        notes: `Auto-generated on ${format(new Date(), 'dd MMM yyyy')} — ${items.length} item(s) below reorder threshold`
      });
    }
    qc.invalidateQueries(['purchaseOrders', currentBusiness?.id]);
    setGeneratingPOs(false);
  };

  const sendPO = async (po) => {
    if (!po.supplier_email) {
      alert('No supplier email configured. Please edit the PO and add a supplier email.');
      return;
    }
    setSendingId(po.id);
    const items = JSON.parse(po.items_json || '[]');
    const itemList = items.map(i => `  • ${i.ingredient_name}: ${i.qty} ${i.unit} @ €${i.unit_cost}/unit = €${(i.qty * i.unit_cost).toFixed(2)}`).join('\n');
    const emailBody = `Dear ${po.supplier_name},\n\nWe would like to place the following purchase order:\n\n${itemList}\n\nTotal: €${po.total_cost?.toFixed(2)}\n\nNotes: ${po.notes || ''}\n\nPlease confirm receipt and expected delivery date.\n\nBest regards,\n${currentBusiness.name}`;
    await base44.integrations.Core.SendEmail({
      to: po.supplier_email,
      subject: `Purchase Order from ${currentBusiness.name}`,
      body: emailBody
    });
    await base44.entities.PurchaseOrder.update(po.id, { status: 'sent', sent_at: new Date().toISOString() });
    qc.invalidateQueries(['purchaseOrders', currentBusiness?.id]);
    setSendingId(null);
  };

  const parsedItems = viewingPO ? JSON.parse(viewingPO.items_json || '[]') : [];

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
          {canEdit() && lowStockItems.length > 0 && (
            <Button onClick={generatePOs} disabled={generatingPOs} className="bg-amber-600 hover:bg-amber-700">
              {generatingPOs ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
              Generate from Low Stock ({lowStockItems.length} items)
            </Button>
          )}
        </div>

        {/* Low Stock Alert Banner */}
        {lowStockItems.length > 0 && (
          <Card className="p-4 bg-amber-500/10 border-amber-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-300 font-medium">{lowStockItems.length} items below reorder threshold across {Object.keys(groupedBySupplier).length} supplier(s)</p>
                <p className="text-amber-500 text-sm mt-0.5">
                  {lowStockItems.map(i => i.ingredient_name).join(', ')}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Orders', value: orders.length, color: 'text-white' },
            { label: 'Draft', value: orders.filter(o => o.status === 'draft').length, color: 'text-slate-400' },
            { label: 'Sent', value: orders.filter(o => o.status === 'sent').length, color: 'text-blue-400' },
            { label: 'Received', value: orders.filter(o => o.status === 'received').length, color: 'text-emerald-400' }
          ].map(s => (
            <Card key={s.label} className="p-4 bg-[#151528]/80 border-white/5">
              <p className="text-slate-400 text-xs mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </Card>
          ))}
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-[#7B3BFF] animate-spin" /></div>
        ) : orders.length === 0 ? (
          <Card className="p-12 text-center bg-[#151528]/80 border-white/5">
            <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No purchase orders yet.</p>
            <p className="text-slate-500 text-sm mt-1">Click "Generate from Low Stock" when inventory items fall below their reorder threshold.</p>
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
                  {orders.map(po => {
                    const items = JSON.parse(po.items_json || '[]');
                    return (
                      <tr key={po.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-white font-medium">{po.supplier_name}</p>
                          {po.supplier_email && <p className="text-xs text-slate-500">{po.supplier_email}</p>}
                        </td>
                        <td className="px-4 py-3 text-slate-300">{items.length} items</td>
                        <td className="px-4 py-3 text-emerald-400 font-medium">€{po.total_cost?.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <Badge className={STATUS_STYLES[po.status] || STATUS_STYLES.draft}>{po.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-sm">
                          {po.created_date ? format(new Date(po.created_date), 'dd MMM yyyy') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button variant="ghost" size="sm" onClick={() => setViewingPO(po)} className="h-7 text-slate-400 hover:text-white text-xs px-2">
                              <Eye className="w-3 h-3 mr-1" /> View
                            </Button>
                            {canEdit() && po.status === 'draft' && (
                              <Button size="sm" onClick={() => sendPO(po)} disabled={sendingId === po.id} className="h-7 text-xs px-2 bg-blue-600 hover:bg-blue-700">
                                {sendingId === po.id ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Mail className="w-3 h-3 mr-1" />}
                                Send
                              </Button>
                            )}
                            {canEdit() && po.status === 'sent' && (
                              <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: po.id, status: 'received' })} className="h-7 text-xs px-2 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Received
                              </Button>
                            )}
                            {canEdit() && (
                              <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(po.id)} className="h-7 text-xs px-2 text-slate-500 hover:text-rose-400">
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

      {/* View PO Modal */}
      <Dialog open={!!viewingPO} onOpenChange={() => setViewingPO(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Purchase Order — {viewingPO?.supplier_name}</DialogTitle>
          </DialogHeader>
          {viewingPO && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={STATUS_STYLES[viewingPO.status]}>{viewingPO.status}</Badge>
                {viewingPO.supplier_email && <span className="text-slate-400 text-sm">{viewingPO.supplier_email}</span>}
              </div>
              {viewingPO.notes && <p className="text-slate-400 text-sm bg-slate-800/50 rounded-lg p-3">{viewingPO.notes}</p>}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 text-slate-500">Ingredient</th>
                    <th className="text-left py-2 text-slate-500">Order Qty</th>
                    <th className="text-right py-2 text-slate-500">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-white/5">
                      <td className="py-2 text-white">{item.ingredient_name}</td>
                      <td className="py-2 text-slate-300">{item.qty} {item.unit}</td>
                      <td className="py-2 text-right text-emerald-400">€{(item.qty * item.unit_cost).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} className="pt-3 text-white font-semibold">Total</td>
                    <td className="pt-3 text-right text-emerald-400 font-bold">€{viewingPO.total_cost?.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
              {canEdit() && viewingPO.status === 'draft' && (
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs block">Supplier Email (to send order)</Label>
                  <div className="flex gap-2">
                    <Input
                      defaultValue={viewingPO.supplier_email}
                      onChange={e => setViewingPO({ ...viewingPO, supplier_email: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white text-sm"
                      placeholder="supplier@example.com"
                    />
                    <Button onClick={async () => {
                      await base44.entities.PurchaseOrder.update(viewingPO.id, { supplier_email: viewingPO.supplier_email });
                      qc.invalidateQueries(['purchaseOrders', currentBusiness?.id]);
                    }} size="sm" variant="outline">Save</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PurchaseOrders() {
  return <BusinessProvider><PurchaseOrdersContent /></BusinessProvider>;
}