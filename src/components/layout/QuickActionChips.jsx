import React, { useState } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import ManualExpenseModal from '@/components/expenses/ManualExpenseModal';
import { useBusiness } from '@/components/business/BusinessContext';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Simple inline waste log modal
function LogWasteModal({ open, onClose, businessId }) {
  const [form, setForm] = useState({ ingredient_name: '', qty: '', reason: '' });
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    if (!form.ingredient_name || !form.qty) return;
    setSaving(true);
    try {
      // Find the inventory item and update its stock
      const items = await base44.entities.InventoryItem.filter({ business_id: businessId });
      const match = items.find(i => i.ingredient_name.toLowerCase() === form.ingredient_name.toLowerCase());
      if (match) {
        const newStock = Math.max(0, (match.current_stock || 0) - Math.abs(parseFloat(form.qty)));
        await base44.entities.InventoryItem.update(match.id, {
          current_stock: newStock,
          notes: `Waste logged: ${form.qty} ${form.reason ? '— ' + form.reason : ''}. ${match.notes || ''}`.trim()
        });
      }
    } finally {
      setSaving(false);
      onClose();
      setForm({ ingredient_name: '', qty: '', reason: '' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#151528] border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="w-5 h-5 text-amber-400" />
          <h3 className="text-white font-semibold">Log Waste</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-slate-400 text-xs block mb-1">Ingredient / Item *</label>
            <input
              value={form.ingredient_name}
              onChange={e => setForm(f => ({ ...f, ingredient_name: e.target.value }))}
              placeholder="e.g. Chicken breast"
              className="w-full bg-[#0B0B12] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#7B3BFF]/40"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-1">Quantity wasted *</label>
            <input
              type="number"
              value={form.qty}
              onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
              placeholder="0.00"
              className="w-full bg-[#0B0B12] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#7B3BFF]/40"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-1">Reason (optional)</label>
            <input
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="e.g. Expired, over-portioned"
              className="w-full bg-[#0B0B12] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#7B3BFF]/40"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!form.ingredient_name || !form.qty || saving} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {saving ? 'Saving…' : 'Log Waste'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuickActionChips() {
  const { currentBusiness, user } = useBusiness();
  const qc = useQueryClient();
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [wasteOpen, setWasteOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setExpenseOpen(true)}
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-200 text-sm font-medium text-emerald-400 whitespace-nowrap"
      >
        <PlusCircle className="w-3.5 h-3.5" />
        Add expense
      </button>

      <button
        onClick={() => setWasteOpen(true)}
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all duration-200 text-sm font-medium text-amber-400 whitespace-nowrap"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Log waste
      </button>

      <ManualExpenseModal
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        businessId={currentBusiness?.id}
        userEmail={user?.email}
        onSave={() => qc.invalidateQueries(['expenses'])}
      />

      <LogWasteModal
        open={wasteOpen}
        onClose={() => setWasteOpen(false)}
        businessId={currentBusiness?.id}
      />
    </>
  );
}