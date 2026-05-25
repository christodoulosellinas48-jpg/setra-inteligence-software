import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const WASTE_REASONS = [
  { value: 'spoilage',     label: 'Spoilage / expired' },
  { value: 'over_prep',    label: 'Over-preparation' },
  { value: 'spill',        label: 'Spill / accident' },
  { value: 'returns',      label: 'Customer return' },
  { value: 'quality',      label: 'Quality issue' },
  { value: 'other',        label: 'Other' },
];

const EMPTY = { item_id: '', quantity: '', reason: '', notes: '' };

export default function LogWasteModal({ open, onOpenChange, businessId }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !businessId) return;
    base44.entities.InventoryItem.filter({ business_id: businessId })
      .then(setItems)
      .catch(() => setItems([]));
  }, [open, businessId]);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const selectedItem = items.find(i => i.id === form.item_id);

  const handleSubmit = async () => {
    if (!form.item_id || !form.quantity || !form.reason) return;
    setSaving(true);
    const qty = parseFloat(form.quantity);
    // Create a waste InventoryAdjustment record
    await base44.entities.InventoryAdjustment.create({
      business_id: businessId,
      inventory_item_id: form.item_id,
      adjustment_type: 'waste',
      quantity_change: -Math.abs(qty),
      reason: form.reason,
      notes: form.notes,
      adjustment_date: new Date().toISOString().split('T')[0],
    });
    // Decrement current stock
    if (selectedItem) {
      const newStock = Math.max(0, (selectedItem.current_stock || 0) - qty);
      await base44.entities.InventoryItem.update(form.item_id, { current_stock: newStock });
    }
    setSaving(false);
    onOpenChange(false);
    setForm(EMPTY);
  };

  const canSave = form.item_id && form.quantity && form.reason && !saving;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0F0F1E] border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-white flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-amber-400" />
            Log Waste
          </DialogTitle>
          <p className="text-slate-400 text-sm">Record spoilage or waste to keep inventory accurate.</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-slate-400 text-sm mb-1.5 block">Item *</Label>
            <Select value={form.item_id} onValueChange={v => setField('item_id', v)}>
              <SelectTrigger className="bg-[#151528] border-white/10 text-white">
                <SelectValue placeholder="Select item" />
              </SelectTrigger>
              <SelectContent className="bg-[#151528] border-white/10 max-h-52">
                {items.map(i => (
                  <SelectItem key={i.id} value={i.id} className="text-white">
                    {i.ingredient_name} ({i.current_stock} {i.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-400 text-sm mb-1.5 block">
                Quantity{selectedItem ? ` (${selectedItem.unit})` : ''} *
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.quantity}
                onChange={e => setField('quantity', e.target.value)}
                className="bg-[#151528] border-white/10 text-white"
                placeholder="0.00"
              />
            </div>
            <div>
              <Label className="text-slate-400 text-sm mb-1.5 block">Reason *</Label>
              <Select value={form.reason} onValueChange={v => setField('reason', v)}>
                <SelectTrigger className="bg-[#151528] border-white/10 text-white">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-[#151528] border-white/10">
                  {WASTE_REASONS.map(r => (
                    <SelectItem key={r.value} value={r.value} className="text-white">{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-slate-400 text-sm mb-1.5 block">Notes (optional)</Label>
            <Input
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              className="bg-[#151528] border-white/10 text-white"
              placeholder="Any additional detail..."
            />
          </div>

          <Button onClick={handleSubmit} disabled={!canSave} className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Log Waste'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}