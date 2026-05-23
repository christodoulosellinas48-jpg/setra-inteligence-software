import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, FileText, CheckCircle, AlertCircle, Loader2,
  Eye, Trash2, Sparkles, Package, Building2, ChevronRight,
  Clock, CheckCircle2, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import InvoiceReviewModal from './InvoiceReviewModal';

const STATUS_CONFIG = {
  new:          { label: 'New',          className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  parsed:       { label: 'AI Parsed',    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  needs_review: { label: 'Needs Review', className: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  approved:     { label: 'Approved',     className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  posted:       { label: 'Posted ✓',     className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
};

export default function InboxTab({ businessId }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [reviewDoc, setReviewDoc] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [autoBulkProcessing, setAutoBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, current: '' });
  const fileInputRef = useRef(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', businessId],
    queryFn: () => base44.entities.Document.filter({ business_id: businessId }, '-created_date')
  });

  const deleteMutation = useMutation({
    mutationFn: (docId) => base44.entities.Document.delete(docId),
    onSuccess: () => {
      queryClient.invalidateQueries(['documents', businessId]);
      toast.success('Document deleted');
    }
  });

  const processFiles = async (files) => {
    if (files.length === 0) return;
    setUploading(true);
    const progress = files.map(f => ({ name: f.name, status: 'uploading' }));
    setUploadProgress(progress);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'extracting' } : p));

        // Upload file
        const { file_url } = await base44.integrations.Core.UploadFile({ file });

        // Deep AI extraction — line items, category, VAT number, etc.
        const parseResult = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an expert accountant. Analyze this invoice/receipt document and extract ALL data.

Return a JSON object with:
- supplier_name: string (business name on invoice)
- supplier_vat_number: string or null (VAT/tax registration number of supplier)
- invoice_number: string or null
- invoice_date: string YYYY-MM-DD or null
- due_date: string YYYY-MM-DD or null
- type: "invoice", "receipt", or "credit_note"
- gross_total: number (total including VAT)
- net_total: number (total excluding VAT)
- vat_total: number (VAT amount)
- expense_category: one of: "food_beverage", "packaging", "utilities", "fixed_costs", "staff_costs", "operating_expenses", "other"
  - Use "food_beverage" for food, drink, ingredients
  - Use "packaging" for boxes, bags, containers, wrapping
  - Use "utilities" for electricity, gas, water, internet, phone
  - Use "fixed_costs" for rent, lease, insurance
  - Use "staff_costs" for wages, salary, HR
  - Use "operating_expenses" for general supplies, equipment, repairs
- line_items: array of objects, each with:
  - description: string (item name)
  - quantity: number
  - unit: string ("kg", "g", "l", "ml", "pc", "box", "case") or null
  - unit_price: number or null
  - total: number or null
  - vat_rate_code: "0", "5", "19", "exempt" or null

Be thorough. Extract every line item visible. If a field cannot be determined, set it to null.`,
          file_urls: [file_url],
          response_json_schema: {
            type: "object",
            properties: {
              supplier_name: { type: "string" },
              supplier_vat_number: { type: "string" },
              invoice_number: { type: "string" },
              invoice_date: { type: "string" },
              due_date: { type: "string" },
              type: { type: "string" },
              gross_total: { type: "number" },
              net_total: { type: "number" },
              vat_total: { type: "number" },
              expense_category: { type: "string" },
              line_items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    description: { type: "string" },
                    quantity: { type: "number" },
                    unit: { type: "string" },
                    unit_price: { type: "number" },
                    total: { type: "number" },
                    vat_rate_code: { type: "string" }
                  }
                }
              }
            }
          }
        });

        // Score confidence
        const coreFields = ['supplier_name', 'invoice_date', 'gross_total', 'net_total', 'vat_total', 'expense_category'];
        const filled = coreFields.filter(f => parseResult[f] !== null && parseResult[f] !== undefined).length;
        const confidence = filled / coreFields.length;

        const lineItemsJson = parseResult.line_items ? JSON.stringify(parseResult.line_items) : null;

        await base44.entities.Document.create({
          business_id: businessId,
          file_url,
          status: confidence < 0.7 ? 'needs_review' : 'parsed',
          confidence_score: confidence,
          type: parseResult.type || 'invoice',
          supplier_name: parseResult.supplier_name,
          supplier_vat_number: parseResult.supplier_vat_number,
          invoice_number: parseResult.invoice_number,
          invoice_date: parseResult.invoice_date,
          due_date: parseResult.due_date,
          gross_total: parseResult.gross_total,
          net_total: parseResult.net_total,
          vat_total: parseResult.vat_total,
          raw_text: lineItemsJson, // reuse raw_text to store line items JSON
        });

        // Mirror to ExpenseDocument so it also appears in Expenses page
        await base44.entities.ExpenseDocument.create({
          business_id: businessId,
          supplier_name: parseResult.supplier_name,
          supplier_vat_number: parseResult.supplier_vat_number || '',
          invoice_number: parseResult.invoice_number || '',
          invoice_date: parseResult.invoice_date || '',
          due_date: parseResult.due_date || '',
          invoice_total: parseResult.gross_total || 0,
          net_amount: parseResult.net_total || 0,
          vat_amount: parseResult.vat_total || 0,
          expense_category: parseResult.expense_category || 'operating_expenses',
          document_url: file_url,
          status: confidence < 0.7 ? 'needs_review' : 'pending',
          confidence_score: confidence,
        });

        // Store category + line_items on document via a custom update after create
        // (we'll pass them through raw_text as JSON payload and read them in modal)
        setUploadProgress(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'done' } : p));
      }

      queryClient.invalidateQueries(['documents', businessId]);
      toast.success(`${files.length} document${files.length > 1 ? 's' : ''} extracted — review & approve to propagate data`);
    } catch (error) {
      toast.error('Processing failed: ' + error.message);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress([]), 2000);
    }
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f =>
      f.type.match(/pdf|image/) || f.name.match(/\.(pdf|jpg|jpeg|png)$/i)
    );
    processFiles(files);
  };

  const openReview = (doc) => {
    // Parse line_items from raw_text if stored there
    let lineItems = [];
    if (doc.raw_text) {
      try { lineItems = JSON.parse(doc.raw_text); } catch {}
    }
    setReviewDoc({ ...doc, line_items: Array.isArray(lineItems) ? lineItems : [] });
  };

  const handleAutoApproveAll = async () => {
    const pending = documents.filter(d => ['parsed', 'needs_review', 'new'].includes(d.status));
    if (pending.length === 0) return;
    setAutoBulkProcessing(true);
    setBulkProgress({ done: 0, total: pending.length, current: 'Categorising all...' });

    // Step 1: categorize ALL in parallel
    const categorized = await Promise.all(pending.map(async (doc) => {
      let lineItems = [];
      if (doc.raw_text) { try { lineItems = JSON.parse(doc.raw_text); } catch {} }
      try {
        const catResult = await base44.functions.invoke('categorizeInvoice', {
          business_id: doc.business_id,
          supplier_name: doc.supplier_name || '',
          line_items: Array.isArray(lineItems) ? lineItems : [],
          gross_total: doc.gross_total,
          raw_text: null,
        });
        return { doc, lineItems, category: catResult?.data?.category || 'operating_expenses' };
      } catch {
        return { doc, lineItems, category: 'operating_expenses' };
      }
    }));

    setBulkProgress({ done: 0, total: pending.length, current: 'Approving all...' });

    // Step 2: process ALL in parallel
    const results = await Promise.allSettled(categorized.map(({ doc, lineItems, category }) =>
      base44.functions.invoke('processInvoice', {
        business_id: doc.business_id,
        document_id: doc.id,
        supplier_name: doc.supplier_name || '',
        supplier_vat_number: doc.supplier_vat_number || '',
        invoice_date: doc.invoice_date || '',
        due_date: doc.due_date || '',
        invoice_number: doc.invoice_number || '',
        expense_category: category,
        line_items: Array.isArray(lineItems) ? lineItems : [],
        invoice_total: doc.gross_total || 0,
        vat_amount: doc.vat_total || 0,
        net_amount: doc.net_total || 0,
      })
    ));

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.length - succeeded;

    setBulkProgress({ done: pending.length, total: pending.length, current: '' });
    queryClient.invalidateQueries(['documents', businessId]);
    queryClient.invalidateQueries(['suppliers', businessId]);
    queryClient.invalidateQueries(['ledgerEntries', businessId]);
    queryClient.invalidateQueries(['vatPeriods', businessId]);
    queryClient.invalidateQueries(['inventory', businessId]);
    setAutoBulkProcessing(false);
    if (failed === 0) toast.success(`✅ ${succeeded} invoices auto-categorised & approved!`);
    else toast.success(`✅ ${succeeded} approved, ${failed} failed — review those manually`);
  };

  const pendingDocs = documents.filter(d => ['parsed', 'needs_review', 'new'].includes(d.status));
  const processedDocs = documents.filter(d => ['approved', 'posted'].includes(d.status));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#7B3BFF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card
        className={`border-2 border-dashed transition-all duration-200 p-10 text-center cursor-pointer ${
          dragOver ? 'border-[#7B3BFF] bg-[#7B3BFF]/10' : 'border-white/10 bg-[#151528]/50 hover:border-[#7B3BFF]/50 hover:bg-[#7B3BFF]/5'
        }`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileInput}
          className="hidden"
          disabled={uploading}
        />
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 flex items-center justify-center mx-auto mb-4">
          {uploading ? <Loader2 className="w-8 h-8 text-[#C084FC] animate-spin" /> : <Sparkles className="w-8 h-8 text-[#C084FC]" />}
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">
          {uploading ? 'AI Extracting Data...' : 'Drop Invoices Here'}
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          PDF, JPG, PNG supported. AI will extract supplier, amounts, VAT, and all line items automatically.
        </p>
        {!uploading && (
          <Button variant="outline" className="border-[#7B3BFF]/40 text-[#A855F7] hover:bg-[#7B3BFF]/10">
            <Upload className="w-4 h-4 mr-2" /> Choose Files
          </Button>
        )}

        {/* Upload Progress */}
        {uploadProgress.length > 0 && (
          <div className="mt-6 space-y-2 max-w-sm mx-auto">
            {uploadProgress.map((p, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2 text-sm text-left">
                {p.status === 'uploading' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />}
                {p.status === 'extracting' && <Sparkles className="w-4 h-4 text-[#A855F7] animate-pulse flex-shrink-0" />}
                {p.status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                <span className="text-slate-300 truncate flex-1">{p.name}</span>
                <span className="text-slate-500 text-xs">
                  {p.status === 'uploading' ? 'Uploading...' : p.status === 'extracting' ? 'AI Extracting...' : 'Done'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Automation flow info */}
      <Card className="bg-[#7B3BFF]/5 border-[#7B3BFF]/20 p-4">
        <p className="text-xs font-semibold text-[#A855F7] mb-2 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" /> How automation works
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
          {[
            'Upload invoice',
            'AI extracts all data',
            'Review & correct if needed',
            'Approve → auto-fills Suppliers, Ledger, VAT, Inventory, Purchases'
          ].map((step, idx, arr) => (
            <React.Fragment key={idx}>
              <span className="bg-white/5 rounded px-2 py-1">{idx + 1}. {step}</span>
              {idx < arr.length - 1 && <ChevronRight className="w-3 h-3 mt-1 text-[#7B3BFF]" />}
            </React.Fragment>
          ))}
        </div>
      </Card>

      {/* Pending Review */}
      {pendingDocs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-semibold text-white">Pending Review ({pendingDocs.length})</h3>
            </div>
            <Button
              size="sm"
              onClick={handleAutoApproveAll}
              disabled={autoBulkProcessing}
              className="h-8 px-3 text-xs bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-900/30"
            >
              {autoBulkProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  {bulkProgress.current ? `${bulkProgress.done}/${bulkProgress.total} — ${bulkProgress.current}` : 'Processing...'}
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 mr-1.5" />
                  Auto-categorise & Approve All
                </>
              )}
            </Button>
          </div>
          {pendingDocs.map((doc, idx) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              idx={idx}
              onReview={() => openReview(doc)}
              onDelete={() => deleteMutation.mutate(doc.id)}
              deleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Processed */}
      {processedDocs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">Processed ({processedDocs.length})</h3>
          </div>
          {processedDocs.map((doc, idx) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              idx={idx}
              onReview={() => openReview(doc)}
              onDelete={() => deleteMutation.mutate(doc.id)}
              deleting={deleteMutation.isPending}
              readonly
            />
          ))}
        </div>
      )}

      {documents.length === 0 && (
        <Card className="bg-slate-900/30 border-slate-800 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No documents yet. Upload your first invoice above.</p>
        </Card>
      )}

      {/* Review Modal */}
      {reviewDoc && (
        <InvoiceReviewModal
          doc={reviewDoc}
          onClose={() => setReviewDoc(null)}
          onApproved={() => {
            queryClient.invalidateQueries(['documents', businessId]);
            queryClient.invalidateQueries(['suppliers', businessId]);
            queryClient.invalidateQueries(['ledgerEntries', businessId]);
            queryClient.invalidateQueries(['vatPeriods', businessId]);
            queryClient.invalidateQueries(['inventory', businessId]);
          }}
        />
      )}
    </div>
  );
}

function DocumentRow({ doc, idx, onReview, onDelete, deleting, readonly }) {
  const cfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.new;
  const hasLineItems = (() => {
    if (!doc.raw_text) return false;
    try { const p = JSON.parse(doc.raw_text); return Array.isArray(p) && p.length > 0; } catch { return false; }
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
    >
      <Card className="bg-[#151528]/80 border-white/5 p-4 hover:border-[#7B3BFF]/20 transition-colors">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#7B3BFF]/10 border border-[#7B3BFF]/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-[#C084FC]" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h4 className="font-medium text-white truncate">{doc.supplier_name || 'Unknown Supplier'}</h4>
                <Badge className={`text-xs border ${cfg.className}`}>{cfg.label}</Badge>
                {doc.confidence_score > 0 && (
                  <span className="text-xs text-slate-500">{Math.round(doc.confidence_score * 100)}% AI confidence</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                {doc.invoice_number && <span>#{doc.invoice_number}</span>}
                {doc.invoice_date && <span>{new Date(doc.invoice_date).toLocaleDateString()}</span>}
                {doc.type && <span className="capitalize">{doc.type.replace('_', ' ')}</span>}
                {hasLineItems && (
                  <span className="flex items-center gap-1 text-[#A855F7]">
                    <Package className="w-3 h-3" />
                    {(() => { try { return JSON.parse(doc.raw_text).length; } catch { return 0; } })()} line items
                  </span>
                )}
                {doc.supplier_vat_number && (
                  <span className="text-slate-400">VAT: {doc.supplier_vat_number}</span>
                )}
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-lg font-semibold text-white">€{(doc.gross_total || 0).toFixed(2)}</p>
              {doc.vat_total > 0 && (
                <p className="text-xs text-slate-500">VAT: €{doc.vat_total.toFixed(2)}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {doc.file_url && (
              <Button variant="ghost" size="icon" onClick={() => window.open(doc.file_url, '_blank')} className="text-slate-400 hover:text-white h-8 w-8">
                <Eye className="w-4 h-4" />
              </Button>
            )}
            {!readonly && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReview}
                className="text-[#A855F7] hover:bg-[#7B3BFF]/10 hover:text-[#C084FC] h-8 px-3"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Review & Approve
              </Button>
            )}
            {readonly && (
              <Button variant="ghost" size="sm" onClick={onReview} className="text-slate-400 hover:text-white h-8 px-3">
                <Eye className="w-3.5 h-3.5 mr-1" /> View
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={deleting}
              className="text-slate-500 hover:text-rose-400 h-8 w-8"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}