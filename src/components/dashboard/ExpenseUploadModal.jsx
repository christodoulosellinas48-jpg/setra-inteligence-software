import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Loader2, Sparkles, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import AutomationResultBanner from './AutomationResultBanner';

const EXPENSE_CATEGORIES = [
  { value: 'food_beverage', label: 'Food & Beverage' },
  { value: 'staff_costs', label: 'Staff Costs' },
  { value: 'fixed_costs', label: 'Fixed Costs' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'operating_expenses', label: 'Operating Expenses' },
  { value: 'one_off_expenses', label: 'One-Off Expenses' }
];

const CATEGORY_KEYWORDS = {
  food_beverage: ['food', 'restaurant', 'catering', 'bakery', 'meat', 'fish', 'dairy', 'produce', 'beverage', 'drink', 'wine', 'beer', 'grocery', 'supplier', 'fresh', 'ingredient'],
  utilities: ['electric', 'electricity', 'water', 'gas', 'energy', 'power', 'telecom', 'internet', 'phone'],
  fixed_costs: ['rent', 'insurance', 'lease', 'mortgage', 'rates', 'license', 'subscription'],
  staff_costs: ['staff', 'payroll', 'salary', 'wage', 'agency', 'recruitment', 'uniform'],
  operating_expenses: ['cleaning', 'maintenance', 'repair', 'packaging', 'office', 'supplies', 'advertising', 'marketing']
};

function inferCategory(supplierName, lineItems, rawText) {
  const combined = [supplierName, ...(lineItems || []).map(i => i.description || ''), rawText || ''].join(' ').toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => combined.includes(k))) return cat;
  }
  return 'operating_expenses';
}

function ConfidencePill({ score }) {
  if (score == null) return null;
  const pct = Math.round(score * 100);
  const color = pct >= 85 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    : pct >= 60 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    : 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  return <Badge className={`text-xs ${color}`}>{pct}% confidence</Badge>;
}

export default function ExpenseUploadModal({ open, onOpenChange, onSave, businessId, userEmail }) {
  const [file, setFile] = useState(null);
  const [stage, setStage] = useState('idle'); // idle | uploading | analyzing | ready
  const [documentUrl, setDocumentUrl] = useState('');
  const [aiData, setAiData] = useState(null); // raw AI extraction result
  const [showLineItems, setShowLineItems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [automationResult, setAutomationResult] = useState(null);

  const [form, setForm] = useState({
    supplier_name: '',
    invoice_number: '',
    invoice_date: '',
    invoice_total: '',
    net_amount: '',
    vat_amount: '',
    vat_rate: '',
    vat_included: false,
    expense_category: '',
    notes: ''
  });

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const analyzeWithAI = async (fileUrl, fileName) => {
    setStage('analyzing');
    try {
      // Step 1: Extract raw structured data from document
      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: {
          type: 'object',
          properties: {
            supplier_name: { type: 'string' },
            supplier_vat_number: { type: 'string' },
            invoice_number: { type: 'string' },
            invoice_date: { type: 'string', description: 'YYYY-MM-DD format' },
            due_date: { type: 'string', description: 'YYYY-MM-DD format' },
            gross_total: { type: 'number', description: 'Total including VAT' },
            net_total: { type: 'number', description: 'Total excluding VAT' },
            vat_total: { type: 'number', description: 'Total VAT amount' },
            vat_rate: { type: 'number', description: 'VAT percentage (e.g. 19)' },
            currency: { type: 'string' },
            line_items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  description: { type: 'string' },
                  quantity: { type: 'number' },
                  unit: { type: 'string' },
                  unit_price: { type: 'number' },
                  total: { type: 'number' },
                  vat_rate: { type: 'number' }
                }
              }
            },
            confidence_score: { type: 'number', description: '0 to 1, how confident the extraction is' },
            needs_review: { type: 'boolean', description: 'True if document is unclear or incomplete' },
            review_reason: { type: 'string', description: 'Why manual review is needed' }
          }
        }
      });

      if (extracted.status !== 'success' || !extracted.output) {
        setStage('ready');
        return;
      }

      const data = extracted.output;

      // Step 2: Use LLM to intelligently categorize and validate
      const categoryResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert bookkeeper for hospitality businesses. Based on this invoice data, determine the best expense category.

Supplier: ${data.supplier_name || 'Unknown'}
Line items: ${(data.line_items || []).map(i => i.description).join(', ') || 'None listed'}
Invoice total: ${data.gross_total || 0}

Available categories:
- food_beverage: Ingredients, beverages, produce, meat, dairy, dry goods for the business
- staff_costs: Wages, payroll, recruitment, uniforms, staff agency fees
- fixed_costs: Rent, insurance, equipment leases, licenses, subscriptions
- utilities: Electricity, water, gas, internet, phone bills
- operating_expenses: Cleaning supplies, packaging, maintenance, marketing, miscellaneous

Reply with ONLY a JSON object: {"category": "...", "reason": "one sentence why", "confidence": 0.0-1.0}`,
        response_json_schema: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            reason: { type: 'string' },
            confidence: { type: 'number' }
          }
        }
      });

      const suggestedCategory = categoryResult?.category || inferCategory(data.supplier_name, data.line_items);

      setAiData({ ...data, category_suggestion: categoryResult });

      // Pre-fill form with extracted data
      setForm({
        supplier_name: data.supplier_name || '',
        invoice_number: data.invoice_number || '',
        invoice_date: data.invoice_date || '',
        invoice_total: data.gross_total != null ? String(data.gross_total) : '',
        net_amount: data.net_total != null ? String(data.net_total) : '',
        vat_amount: data.vat_total != null ? String(data.vat_total) : '',
        vat_rate: data.vat_rate != null ? String(data.vat_rate) : '',
        vat_included: (data.vat_total > 0) || false,
        expense_category: suggestedCategory || '',
        notes: [
          data.invoice_number ? `Invoice #${data.invoice_number}` : '',
          data.supplier_vat_number ? `Supplier VAT: ${data.supplier_vat_number}` : '',
          data.needs_review ? `⚠️ ${data.review_reason}` : ''
        ].filter(Boolean).join(' | ')
      });

      setStage('ready');
    } catch (err) {
      console.error('AI extraction error:', err);
      setStage('ready');
    }
  };

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setStage('uploading');
    setAiData(null);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
    setDocumentUrl(file_url);
    await analyzeWithAI(file_url, selectedFile.name);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFileUpload({ target: { files: e.dataTransfer.files } });
  };

  const handleSubmit = async () => {
    setSaving(true);
    setAutomationResult(null);

    // 1. Save the ExpenseDocument first to get its ID
    const expenseDoc = await base44.entities.ExpenseDocument.create({
      supplier_name: form.supplier_name,
      supplier_vat_number: aiData?.supplier_vat_number || '',
      invoice_number: form.invoice_number,
      invoice_date: form.invoice_date,
      due_date: aiData?.due_date || '',
      invoice_total: parseFloat(form.invoice_total) || 0,
      net_amount: parseFloat(form.net_amount) || 0,
      vat_amount: parseFloat(form.vat_amount) || 0,
      vat_rate: parseFloat(form.vat_rate) || 0,
      vat_included: form.vat_included,
      expense_category: form.expense_category,
      document_url: documentUrl,
      status: 'pending',
      confidence_score: aiData?.confidence_score || 0,
      notes: form.notes,
      business_id: businessId,
      uploaded_by: userEmail,
      last_edited_by: userEmail,
      last_edited_at: new Date().toISOString()
    });

    // 2. Run full automation — await it so we can show results
    try {
      const response = await base44.functions.invoke('processInvoice', {
        business_id: businessId,
        expense_document_id: expenseDoc.id,
        supplier_name: form.supplier_name,
        supplier_vat_number: aiData?.supplier_vat_number || '',
        invoice_number: form.invoice_number,
        invoice_date: form.invoice_date,
        due_date: aiData?.due_date || '',
        expense_category: form.expense_category,
        invoice_total: parseFloat(form.invoice_total) || 0,
        net_amount: parseFloat(form.net_amount) || 0,
        vat_amount: parseFloat(form.vat_amount) || 0,
        vat_rate: parseFloat(form.vat_rate) || 0,
        vat_included: form.vat_included,
        line_items: aiData?.line_items || []
      });
      if (response?.data?.results) {
        setAutomationResult(response.data.results);
      }
    } catch (err) {
      console.error('Automation error:', err);
    }

    onSave?.();
    setSaving(false);
  };

  const handleReset = () => {
    setFile(null);
    setStage('idle');
    setDocumentUrl('');
    setAiData(null);
    setShowLineItems(false);
    setAutomationResult(null);
    setForm({ supplier_name: '', invoice_number: '', invoice_date: '', invoice_total: '', net_amount: '', vat_amount: '', vat_rate: '', vat_included: false, expense_category: '', notes: '' });
  };

  const needsReview = aiData?.needs_review;
  const confidence = aiData?.confidence_score;
  const lineItems = aiData?.line_items || [];
  const canSave = form.supplier_name && form.invoice_total && form.expense_category && !saving;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleReset(); onOpenChange(v); }}>
      <DialogContent className="bg-[#0F0F1E] border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C084FC]" />
            AI Expense Capture
          </DialogTitle>
          <p className="text-slate-400 text-sm">Upload an invoice or receipt — AI will extract and categorize everything automatically.</p>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="relative"
          >
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={stage === 'uploading' || stage === 'analyzing'}
            />
            <div className={`border-2 border-dashed rounded-xl p-7 text-center transition-colors ${
              stage === 'ready' && !needsReview ? 'border-emerald-500/40 bg-emerald-500/5'
              : needsReview ? 'border-amber-500/40 bg-amber-500/5'
              : stage !== 'idle' ? 'border-[#7B3BFF]/40 bg-[#7B3BFF]/5'
              : 'border-white/10 hover:border-white/20'
            }`}>
              <AnimatePresence mode="wait">
                {stage === 'uploading' && (
                  <motion.div key="up" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                    <Loader2 className="w-9 h-9 text-[#C084FC] animate-spin mb-2" />
                    <p className="text-slate-300 font-medium">Uploading document...</p>
                  </motion.div>
                )}
                {stage === 'analyzing' && (
                  <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                    <div className="relative mb-2">
                      <div className="w-9 h-9 rounded-full border-2 border-[#7B3BFF]/30 border-t-[#7B3BFF] animate-spin" />
                      <Sparkles className="w-4 h-4 text-[#C084FC] absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <p className="text-[#C084FC] font-medium">AI Reading & Categorising...</p>
                    <p className="text-slate-500 text-sm mt-1">Extracting supplier, amounts, VAT, line items</p>
                  </motion.div>
                )}
                {stage === 'ready' && (
                  <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-1">
                    {needsReview
                      ? <AlertCircle className="w-9 h-9 text-amber-400 mb-1" />
                      : <CheckCircle2 className="w-9 h-9 text-emerald-400 mb-1" />
                    }
                    <p className="text-white font-medium">{file?.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {needsReview
                        ? <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">Needs Review</Badge>
                        : <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30"><Sparkles className="w-3 h-3 mr-1" />AI Extracted</Badge>
                      }
                      <ConfidencePill score={confidence} />
                    </div>
                    <p className="text-slate-500 text-xs mt-1">Click to replace document</p>
                  </motion.div>
                )}
                {stage === 'idle' && (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                    <Upload className="w-9 h-9 text-slate-500 mb-2" />
                    <p className="text-slate-300">Drop invoice / receipt here or click to browse</p>
                    <p className="text-slate-500 text-sm mt-1">PDF, JPG, PNG — AI will auto-fill all fields</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Review Warning */}
          {needsReview && aiData?.review_reason && (
            <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-amber-300 text-sm">{aiData.review_reason}</p>
            </div>
          )}

          {/* Category AI Suggestion */}
          {aiData?.category_suggestion?.reason && (
            <div className="flex items-start gap-3 p-3 bg-[#7B3BFF]/10 border border-[#7B3BFF]/20 rounded-xl">
              <Sparkles className="w-4 h-4 text-[#C084FC] mt-0.5 flex-shrink-0" />
              <p className="text-slate-300 text-sm"><span className="text-[#C084FC] font-medium">Category rationale:</span> {aiData.category_suggestion.reason}</p>
            </div>
          )}

          {/* Main Form Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-slate-400 mb-1.5 block text-sm">Supplier Name *</Label>
              <div className="relative">
                <Input value={form.supplier_name} onChange={e => setField('supplier_name', e.target.value)}
                  className="bg-[#151528] border-white/10 text-white pr-8" placeholder="e.g. Metro Cash & Carry" />
                {stage === 'ready' && form.supplier_name && <Edit3 className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />}
              </div>
            </div>

            <div>
              <Label className="text-slate-400 mb-1.5 block text-sm">Invoice Date</Label>
              <Input type="date" value={form.invoice_date} onChange={e => setField('invoice_date', e.target.value)}
                className="bg-[#151528] border-white/10 text-white" />
            </div>

            <div>
              <Label className="text-slate-400 mb-1.5 block text-sm">Invoice Number</Label>
              <Input value={form.invoice_number} onChange={e => setField('invoice_number', e.target.value)}
                className="bg-[#151528] border-white/10 text-white" placeholder="e.g. INV-00123" />
            </div>

            {/* VAT Breakdown */}
            <div>
              <Label className="text-slate-400 mb-1.5 block text-sm">Gross Total (incl. VAT) *</Label>
              <Input type="number" value={form.invoice_total} onChange={e => setField('invoice_total', e.target.value)}
                className="bg-[#151528] border-white/10 text-white" placeholder="0.00" />
            </div>

            <div>
              <Label className="text-slate-400 mb-1.5 block text-sm">Net Total (excl. VAT)</Label>
              <Input type="number" value={form.net_amount} onChange={e => setField('net_amount', e.target.value)}
                className="bg-[#151528] border-white/10 text-white" placeholder="0.00" />
            </div>

            <div>
              <Label className="text-slate-400 mb-1.5 block text-sm">VAT Amount</Label>
              <Input type="number" value={form.vat_amount} onChange={e => setField('vat_amount', e.target.value)}
                className="bg-[#151528] border-white/10 text-white" placeholder="0.00" />
            </div>

            <div>
              <Label className="text-slate-400 mb-1.5 block text-sm">VAT Rate (%)</Label>
              <Input type="number" value={form.vat_rate} onChange={e => setField('vat_rate', e.target.value)}
                className="bg-[#151528] border-white/10 text-white" placeholder="e.g. 19" />
            </div>

            <div className="col-span-2">
              <Label className="text-slate-400 mb-1.5 block text-sm">Expense Category *</Label>
              <Select value={form.expense_category} onValueChange={v => setField('expense_category', v)}>
                <SelectTrigger className="bg-[#151528] border-white/10 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-[#151528] border-white/10">
                  {EXPENSE_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value} className="text-white">{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 flex items-center justify-between p-3 bg-[#151528]/60 border border-white/5 rounded-xl">
              <div>
                <Label className="text-slate-300 text-sm">VAT Included in Total</Label>
                <p className="text-slate-500 text-xs">Toggle on if gross total already includes VAT</p>
              </div>
              <Switch checked={form.vat_included} onCheckedChange={v => setField('vat_included', v)} />
            </div>

            <div className="col-span-2">
              <Label className="text-slate-400 mb-1.5 block text-sm">Notes</Label>
              <Input value={form.notes} onChange={e => setField('notes', e.target.value)}
                className="bg-[#151528] border-white/10 text-white" placeholder="Optional notes" />
            </div>
          </div>

          {/* Line Items Collapsible */}
          {lineItems.length > 0 && (
            <div className="rounded-xl border border-white/5 overflow-hidden">
              <button
                onClick={() => setShowLineItems(s => !s)}
                className="w-full flex items-center justify-between p-4 bg-[#151528]/60 hover:bg-[#151528] transition-colors text-left"
              >
                <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#C084FC]" />
                  {lineItems.length} Line Item{lineItems.length > 1 ? 's' : ''} Extracted
                </span>
                {showLineItems ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              <AnimatePresence>
                {showLineItems && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-white/5 bg-[#0B0B12]/40">
                            <th className="text-left px-4 py-2.5 text-slate-500 font-medium">Description</th>
                            <th className="text-right px-4 py-2.5 text-slate-500 font-medium">Qty</th>
                            <th className="text-right px-4 py-2.5 text-slate-500 font-medium">Unit Price</th>
                            <th className="text-right px-4 py-2.5 text-slate-500 font-medium">Total</th>
                            <th className="text-right px-4 py-2.5 text-slate-500 font-medium">VAT%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lineItems.map((item, i) => (
                            <tr key={i} className="border-b border-white/5 last:border-0">
                              <td className="px-4 py-2.5 text-slate-300">{item.description}</td>
                              <td className="px-4 py-2.5 text-right text-slate-400">{item.quantity ?? '—'}</td>
                              <td className="px-4 py-2.5 text-right text-slate-400">{item.unit_price != null ? `€${item.unit_price.toFixed(2)}` : '—'}</td>
                              <td className="px-4 py-2.5 text-right text-white font-medium">{item.total != null ? `€${item.total.toFixed(2)}` : '—'}</td>
                              <td className="px-4 py-2.5 text-right text-slate-400">{item.vat_rate != null ? `${item.vat_rate}%` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="px-4 py-2.5 text-xs text-slate-500 bg-[#0B0B12]/20 border-t border-white/5">
                      Line items will be used to update inventory automatically.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Automation Result */}
          {automationResult && (
            <AutomationResultBanner result={{
              supplier: automationResult.supplier_action,
              ledger: automationResult.ledger_entry ? 'created' : null,
              vat_updated: automationResult.vat_period_updated,
              inventory_updated: automationResult.inventory_updates?.length || 0,
              inventory_created: automationResult.inventory_created?.length || 0,
              purchases: automationResult.purchase_records?.length || 0,
              snapshot: automationResult.snapshot_updated
            }} />
          )}

          {automationResult ? (
            <Button onClick={() => { handleReset(); onOpenChange(false); }} className="w-full h-11">
              Done
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canSave} className="w-full h-11">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing & updating system...</> : 'Save & Process Invoice'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}