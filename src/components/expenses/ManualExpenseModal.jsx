import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CATEGORIES = [
  { value: 'food_beverage', label: 'Food & Beverage' },
  { value: 'staff_costs', label: 'Staff Costs' },
  { value: 'fixed_costs', label: 'Fixed Costs' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'operating_expenses', label: 'Operating Expenses' },
  { value: 'one_off_expenses', label: 'One-Off Expenses' },
];

const VAT_RATES = [0, 5, 9, 19];

const EMPTY = {
  supplier_name: '',
  expense_category: '',
  invoice_date: new Date().toISOString().slice(0, 10),
  invoice_total: '',
  net_amount: '',
  vat_amount: '',
  vat_rate: '',
  notes: '',
};

export default function ManualExpenseModal({ open, onOpenChange, onSave, businessId, userEmail }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleVatRateChange = (rate) => {
    setField('vat_rate', rate);
    const gross = parseFloat(form.invoice_total);
    if (!isNaN(gross) && rate) {
      const net = gross / (1 + parseFloat(rate) / 100);
      setField('net_amount', net.toFixed(2));
      setField('vat_amount', (gross - net).toFixed(2));
    }
  };

  const handleGrossChange = (gross) => {
    setField('invoice_total', gross);
    const rate = parseFloat(form.vat_rate);
    if (!isNaN(parseFloat(gross)) && rate) {
      const net = parseFloat(gross) / (1 + rate / 100);
      setField('net_amount', net.toFixed(2));
      setField('vat_amount', (parseFloat(gross) - net).toFixed(2));
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    await base44.entities.ExpenseDocument.create({
      business_id: businessId,
      supplier_name: form.supplier_name,
      expense_category: form.expense_category,
      invoice_date: form.invoice_date,
      invoice_total: parseFloat(form.invoice_total) || 0,
      net_amount: parseFloat(form.net_amount) || 0,
      vat_amount: parseFloat(form.vat_amount) || 0,
      vat_rate: parseFloat(form.vat_rate) || 0,
      vat_included: true,
      notes: form.notes,
      status: 'pending',
      confidence_score: 1,
      uploaded_by: userEmail,
      last_edited_by: userEmail,
      last_edited_at: new Date().toISOString(),
    });

    // Mirror to Document entity so it appears in VAT & Bookkeeping Inbox
    await base44.entities.Document.create({
      business_id: businessId,
      type: 'invoice',
      supplier_name: form.supplier_name,
      invoice_date: form.invoice_date,
      gross_total: parseFloat(form.invoice_total) || 0,
      net_total: parseFloat(form.net_amount) || 0,
      vat_total: parseFloat(form.vat_amount) || 0,
      status: 'parsed',
      confidence_score: 1,
    });

    setSaving(false);
    onSave?.();
    onOpenChange(false);
    setForm(EMPTY);
  };

  const canSave = form.supplier_name && form.expense_category && form.invoice_total && !saving;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0F0F1E] border-white/10 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl text-white flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-[#C084FC]" />
            Add Expense Manually
          </DialogTitle>
          <p className="text-slate-400 text-sm">For cash purchases, petty cash, or anything without a digital receipt.</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-slate-400 text-sm mb-1.5 block">Supplier / Payee *</Label>
            <Input value={form.supplier_name} onChange={e => setField('supplier_name', e.target.value)}
              className="bg-[#151528] border-white/10 text-white" placeholder="e.g. Local market, petty cash" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-400 text-sm mb-1.5 block">Date *</Label>
              <Input type="date" value={form.invoice_date} onChange={e => setField('invoice_date', e.target.value)}
                className="bg-[#151528] border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-slate-400 text-sm mb-1.5 block">Category *</Label>
              <Select value={form.expense_category} onValueChange={v => setField('expense_category', v)}>
                <SelectTrigger className="bg-[#151528] border-white/10 text-white">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-[#151528] border-white/10">
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value} className="text-white">{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-400 text-sm mb-1.5 block">Gross Total (incl. VAT) *</Label>
              <Input type="number" value={form.invoice_total} onChange={e => handleGrossChange(e.target.value)}
                className="bg-[#151528] border-white/10 text-white" placeholder="0.00" />
            </div>
            <div>
              <Label className="text-slate-400 text-sm mb-1.5 block">VAT Rate</Label>
              <Select value={String(form.vat_rate)} onValueChange={handleVatRateChange}>
                <SelectTrigger className="bg-[#151528] border-white/10 text-white">
                  <SelectValue placeholder="Select rate" />
                </SelectTrigger>
                <SelectContent className="bg-[#151528] border-white/10">
                  <SelectItem value={null} className="text-white">None / exempt</SelectItem>
                  {VAT_RATES.map(r => (
                    <SelectItem key={r} value={String(r)} className="text-white">{r}%</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(form.net_amount || form.vat_amount) && (
            <div className="flex items-center gap-6 px-4 py-3 bg-[#151528]/60 rounded-xl border border-white/5 text-sm">
              <div><span className="text-slate-500">Net: </span><span className="text-white font-medium">€{form.net_amount}</span></div>
              <div><span className="text-slate-500">VAT: </span><span className="text-white font-medium">€{form.vat_amount}</span></div>
            </div>
          )}

          <div>
            <Label className="text-slate-400 text-sm mb-1.5 block">Notes (optional)</Label>
            <Input value={form.notes} onChange={e => setField('notes', e.target.value)}
              className="bg-[#151528] border-white/10 text-white" placeholder="What was this for?" />
          </div>

          <Button onClick={handleSubmit} disabled={!canSave} className="w-full h-11">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Add Expense'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}