import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  CheckCircle, AlertCircle, Loader2, Sparkles, Package,
  Building2, Receipt, Calendar, Hash, Percent, Tag, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'food_beverage', label: 'Food & Beverage' },
  { value: 'packaging', label: 'Packaging & Supplies' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'fixed_costs', label: 'Fixed Costs / Rent' },
  { value: 'staff_costs', label: 'Staff Costs' },
  { value: 'operating_expenses', label: 'Operating Expenses' },
  { value: 'eu_acquisition', label: 'EU Acquisition (Reverse Charge)' },
  { value: 'other', label: 'Other' },
];

// Detect if a supplier VAT number is from an EU country outside Cyprus
function isEUNonCyprusVAT(vatNumber) {
  if (!vatNumber) return false;
  const s = vatNumber.trim().toUpperCase();
  // Cyprus starts with CY — all others are EU reverse charge candidates
  const EU_PREFIXES = ['AT','BE','BG','HR','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'];
  return EU_PREFIXES.some(p => s.startsWith(p));
}

export default function InvoiceReviewModal({ doc, onClose, onApproved }) {
  // Auto-detect reverse charge from supplier VAT on open
  const detectedRC = isEUNonCyprusVAT(doc.supplier_vat_number);
  const [form, setForm] = useState({
    supplier_name: doc.supplier_name || '',
    supplier_vat_number: doc.supplier_vat_number || '',
    invoice_number: doc.invoice_number || '',
    invoice_date: doc.invoice_date || '',
    due_date: doc.due_date || '',
    gross_total: doc.gross_total || 0,
    net_total: doc.net_total || 0,
    vat_total: doc.vat_total || 0,
    expense_category: detectedRC ? 'eu_acquisition' : (doc.expense_category || 'other'),
    reverse_charge: detectedRC,
    line_items: doc.line_items || []
  });
  const [processing, setProcessing] = useState(false);
  const [automationResults, setAutomationResults] = useState(null);

  const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  // When supplier VAT changes, auto-detect reverse charge
  const handleVatNumberChange = (val) => {
    const rc = isEUNonCyprusVAT(val);
    setForm(prev => ({
      ...prev,
      supplier_vat_number: val,
      reverse_charge: rc,
      expense_category: rc ? 'eu_acquisition' : (prev.expense_category === 'eu_acquisition' ? 'other' : prev.expense_category)
    }));
  };

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const response = await base44.functions.invoke('processInvoice', {
        business_id: doc.business_id,
        document_id: doc.id,
        supplier_name: form.supplier_name,
        supplier_vat_number: form.supplier_vat_number,
        invoice_date: form.invoice_date,
        due_date: form.due_date,
        invoice_number: form.invoice_number,
        expense_category: form.expense_category,
        reverse_charge: form.reverse_charge,
        line_items: form.line_items,
        invoice_total: parseFloat(form.gross_total) || 0,
        vat_amount: parseFloat(form.vat_total) || 0,
        net_amount: parseFloat(form.net_total) || 0,
      });

      const results = response.data?.results;
      setAutomationResults(results);
      toast.success('Invoice processed & data propagated across all modules!');
      onApproved?.();
    } catch (error) {
      toast.error('Processing failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const totalAutomated = automationResults
    ? 1 + // supplier
      (automationResults.ledger_entry ? 1 : 0) +
      (automationResults.vat_line ? 1 : 0) +
      (automationResults.inventory_updates?.length || 0) +
      (automationResults.inventory_created?.length || 0) +
      (automationResults.purchase_records?.length || 0)
    : 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-[#0F0F1A] border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#7B3BFF]/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#C084FC]" />
            </div>
            AI Invoice Review
            {doc.confidence_score > 0 && (
              <Badge className={doc.confidence_score >= 0.8 ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}>
                {Math.round(doc.confidence_score * 100)}% confidence
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Success state */}
        {automationResults && (
          <Card className="bg-emerald-500/10 border-emerald-500/30 p-4 mb-2">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-emerald-300 mb-2">
                  ✨ {totalAutomated} records auto-populated across your system
                </p>
                <div className="space-y-1 text-sm text-emerald-400/80">
                  {automationResults.supplier && (
                    <p className="flex items-center gap-2">
                      <Building2 className="w-3 h-3" /> Supplier "{form.supplier_name}" {automationResults.supplier_action === 'created' ? 'added to' : 'updated in'} Vendors
                    </p>
                  )}
                  {automationResults.ledger_entry && (
                    <p className="flex items-center gap-2">
                      <Receipt className="w-3 h-3" /> Ledger entry posted to bookkeeping
                    </p>
                  )}
                  {automationResults.vat_line && (
                    <p className="flex items-center gap-2">
                      <Percent className="w-3 h-3" /> Input VAT recorded in open VAT period
                    </p>
                  )}
                  {automationResults.reverse_charge_vat && (
                    <p className="flex items-center gap-2 text-amber-300">
                      <Percent className="w-3 h-3" /> Reverse Charge: Output + Input VAT self-assessed (net €0)
                    </p>
                  )}
                  {automationResults.inventory_created?.length > 0 && (
                    <p className="flex items-center gap-2">
                      <Package className="w-3 h-3" /> {automationResults.inventory_created.length} new inventory items created: {automationResults.inventory_created.join(', ')}
                    </p>
                  )}
                  {automationResults.inventory_updates?.length > 0 && (
                    <p className="flex items-center gap-2">
                      <Package className="w-3 h-3" /> {automationResults.inventory_updates.length} inventory items restocked: {automationResults.inventory_updates.join(', ')}
                    </p>
                  )}
                  {automationResults.purchase_records?.length > 0 && (
                    <p className="flex items-center gap-2">
                      <Tag className="w-3 h-3" /> {automationResults.purchase_records.length} purchase records logged
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-5">
          {/* Supplier Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-400 text-xs mb-1 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Supplier Name
              </Label>
              <Input
                value={form.supplier_name}
                onChange={e => updateField('supplier_name', e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-400 text-xs mb-1">Supplier VAT Number</Label>
              <Input
                value={form.supplier_vat_number}
                onChange={e => handleVatNumberChange(e.target.value)}
                placeholder="CY12345678X or FR/IT/DE…"
                className="bg-white/5 border-white/10 text-white"
              />
              {form.reverse_charge && (
                <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                  ⚡ EU supplier detected — Reverse Charge applies
                </p>
              )}
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-slate-400 text-xs mb-1 flex items-center gap-1">
                <Hash className="w-3 h-3" /> Invoice #
              </Label>
              <Input
                value={form.invoice_number}
                onChange={e => updateField('invoice_number', e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-400 text-xs mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Invoice Date
              </Label>
              <Input
                type="date"
                value={form.invoice_date}
                onChange={e => updateField('invoice_date', e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-400 text-xs mb-1">Due Date</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={e => updateField('due_date', e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-slate-400 text-xs mb-1">Net Total (ex-VAT)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.net_total}
                onChange={e => updateField('net_total', e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-400 text-xs mb-1 flex items-center gap-1">
                <Percent className="w-3 h-3" /> VAT Amount
              </Label>
              <Input
                type="number"
                step="0.01"
                value={form.vat_total}
                onChange={e => updateField('vat_total', e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-400 text-xs mb-1">Gross Total (inc-VAT)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.gross_total}
                onChange={e => updateField('gross_total', e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <Label className="text-slate-400 text-xs mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Expense Category
              <span className="ml-1 text-[#A855F7]">— determines where data flows</span>
            </Label>
            <Select value={form.expense_category} onValueChange={v => updateField('expense_category', v)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A2E] border-white/10">
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value} className="text-white hover:bg-white/5">
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 mt-1">
              {form.expense_category === 'food_beverage' && '→ Will update Inventory, Purchases & Suppliers'}
              {form.expense_category === 'packaging' && '→ Will update Inventory & Suppliers'}
              {form.expense_category === 'operating_expenses' && '→ Will update Inventory & Suppliers'}
              {['utilities', 'fixed_costs', 'staff_costs'].includes(form.expense_category) && '→ Will update Suppliers & Ledger'}
              {form.expense_category === 'eu_acquisition' && '→ Reverse Charge: records self-assessed Output VAT + Input VAT (net €0 effect)'}
              {form.expense_category === 'other' && '→ Will update Suppliers & Ledger'}
            </p>
          </div>

          {/* Line Items */}
          {form.line_items?.length > 0 && (
            <div>
              <Label className="text-slate-400 text-xs mb-2 flex items-center gap-1">
                <Package className="w-3 h-3" /> Line Items ({form.line_items.length} extracted)
              </Label>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {form.line_items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2 text-sm">
                    <span className="text-slate-300 flex-1">{item.description}</span>
                    <span className="text-slate-500">×{item.quantity || 1}</span>
                    <span className="text-[#C084FC] font-medium">€{(item.total || item.line_net || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Flow Preview */}
          {!automationResults && (
            <Card className="bg-[#7B3BFF]/5 border-[#7B3BFF]/20 p-4">
              <p className="text-xs font-semibold text-[#A855F7] mb-2 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" /> When you approve, we'll automatically:
              </p>
              <div className="grid grid-cols-2 gap-1 text-xs text-slate-400">
              <span className="flex items-center gap-1"><ChevronRight className="w-3 h-3 text-[#A855F7]" /> Create/update Supplier record</span>
              <span className="flex items-center gap-1"><ChevronRight className="w-3 h-3 text-[#A855F7]" /> Post to Ledger / P&L</span>
              {form.expense_category === 'eu_acquisition' ? (
                <>
                  <span className="flex items-center gap-1 text-amber-400"><ChevronRight className="w-3 h-3 text-amber-400" /> Self-assess Output VAT (RC)</span>
                  <span className="flex items-center gap-1 text-amber-400"><ChevronRight className="w-3 h-3 text-amber-400" /> Record matching Input VAT (RC)</span>
                </>
              ) : (
                <span className="flex items-center gap-1"><ChevronRight className="w-3 h-3 text-[#A855F7]" /> Record Input VAT in open period</span>
              )}
              {['food_beverage', 'packaging', 'operating_expenses'].includes(form.expense_category) && (
                <span className="flex items-center gap-1"><ChevronRight className="w-3 h-3 text-[#A855F7]" /> Update Inventory stock levels</span>
              )}
              {form.expense_category === 'food_beverage' && (
                <span className="flex items-center gap-1"><ChevronRight className="w-3 h-3 text-[#A855F7]" /> Log Purchase records</span>
              )}
              </div>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={processing}>
            {automationResults ? 'Close' : 'Cancel'}
          </Button>
          {!automationResults && (
            <Button onClick={handleApprove} disabled={processing || !form.supplier_name}>
              {processing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Approve & Auto-populate All</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}