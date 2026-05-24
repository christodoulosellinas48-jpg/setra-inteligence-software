import React, { useState, useRef } from 'react';
import { useBusiness } from '@/components/business/BusinessContext';
import { base44 } from '@/api/base44Client';
import { Upload, X, CheckCircle, AlertCircle, FileText, Receipt, Users, BookOpen, Building2, ChevronDown, TrendingUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const DOC_TYPES = {
  invoice:       { label: 'Invoice',       icon: Receipt,     color: 'text-blue-400',    route: '/Expenses',           destination: 'Expenses' },
  payslip:       { label: 'Payslip',       icon: Users,       color: 'text-emerald-400', route: '/Payroll',            destination: 'Payroll' },
  menu:          { label: 'Menu',          icon: BookOpen,    color: 'text-orange-400',  route: '/MenuEngineering',    destination: 'Menu Engineering' },
  receipt:       { label: 'Receipt',       icon: Receipt,     color: 'text-yellow-400',  route: '/Expenses',           destination: 'Expenses' },
  income_report: { label: 'Income Report', icon: TrendingUp,  color: 'text-violet-400',  route: '/Reports',            destination: 'Reports' },
  document:      { label: 'Document',      icon: FileText,    color: 'text-slate-400',   route: '/VATAndBookkeeping',  destination: 'Bookkeeping Inbox' },
};

async function processFile(file, activeBusiness) {
  const { file_url } = await base44.integrations.Core.UploadFile({ file });

  const classification = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a document classifier for a restaurant finance platform. Analyze the document and classify it.

Business: ${activeBusiness.name}
File name: ${file.name}

Classify as ONE of: invoice, payslip, menu, receipt, income_report, document

IMPORTANT: Classify as "income_report" if the document contains a header like "Monthly Income Report" followed by a venue name and month/year (e.g. "Souvla Lane · June 2025"), AND contains a row labeled "Total Revenue (Gross)" or similar revenue summary. Do NOT classify these as "document".

For invoice/receipt: also extract supplier_name, invoice_date (YYYY-MM-DD), invoice_total (number), expense_category (food_beverage|staff_costs|fixed_costs|utilities|operating_expenses|one_off_expenses).
For payslip: extract employee_name, pay_period, net_pay (number).
For income_report: extract venue_name (string), report_period (YYYY-MM format, e.g. "2025-06"), monthly_revenue (number from "Total Revenue (Gross)" row), days_open (number, if present), total_covers (number, if present), average_ticket (number, if present).

Respond with JSON only.`,
    file_urls: [file_url],
    response_json_schema: {
      type: 'object',
      properties: {
        doc_type: { type: 'string', enum: ['invoice', 'payslip', 'menu', 'receipt', 'income_report', 'document'] },
        supplier_name: { type: 'string' },
        invoice_date: { type: 'string' },
        invoice_total: { type: 'number' },
        expense_category: { type: 'string' },
        employee_name: { type: 'string' },
        pay_period: { type: 'string' },
        net_pay: { type: 'number' },
        venue_name: { type: 'string' },
        report_period: { type: 'string' },
        monthly_revenue: { type: 'number' },
        days_open: { type: 'number' },
        total_covers: { type: 'number' },
        average_ticket: { type: 'number' },
        confidence: { type: 'number' },
        notes: { type: 'string' }
      },
      required: ['doc_type']
    }
  });

  const docType = classification.doc_type || 'document';
  const typeConfig = DOC_TYPES[docType] || DOC_TYPES.document;

  if (docType === 'invoice' || docType === 'receipt') {
    await base44.entities.ExpenseDocument.create({
      business_id: activeBusiness.id,
      supplier_name: classification.supplier_name || file.name.replace(/\.[^.]+$/, ''),
      invoice_date: classification.invoice_date || new Date().toISOString().split('T')[0],
      invoice_total: classification.invoice_total || 0,
      expense_category: classification.expense_category || 'operating_expenses',
      document_url: file_url,
      status: 'pending',
      confidence_score: classification.confidence || 0.8,
      notes: `Smart upload — ${classification.notes || 'auto-classified'}`
    });
  } else if (docType === 'payslip') {
    await base44.entities.ExpenseDocument.create({
      business_id: activeBusiness.id,
      supplier_name: classification.employee_name || 'Employee',
      invoice_date: new Date().toISOString().split('T')[0],
      invoice_total: classification.net_pay || 0,
      expense_category: 'staff_costs',
      document_url: file_url,
      status: 'pending',
      notes: `Payslip — ${classification.pay_period || ''} — Smart upload`
    });
  } else if (docType === 'income_report') {
    const period = classification.report_period;
    let periodStart, periodEnd;
    if (period && /^\d{4}-\d{2}$/.test(period)) {
      const [year, month] = period.split('-').map(Number);
      periodStart = new Date(year, month - 1, 1).toISOString().split('T')[0];
      periodEnd = new Date(year, month, 0).toISOString().split('T')[0];
    } else {
      const now = new Date();
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    }
    const existing = await base44.entities.FinancialSnapshot.filter({ business_id: activeBusiness.id }, '-period_start', 100);
    const existingMatch = existing.find(s => s.period_start === periodStart);
    const snapshotData = {
      business_id: activeBusiness.id, period_start: periodStart, period_end: periodEnd,
      period_type: 'monthly', monthly_revenue: classification.monthly_revenue || 0, created_by_email: '',
    };
    if (classification.days_open) snapshotData.days_open = classification.days_open;
    if (classification.total_covers) snapshotData.total_covers = classification.total_covers;
    if (classification.average_ticket) snapshotData.average_ticket = classification.average_ticket;
    if (existingMatch) {
      await base44.entities.FinancialSnapshot.update(existingMatch.id, snapshotData);
    } else {
      await base44.entities.FinancialSnapshot.create(snapshotData);
    }
  } else {
    await base44.entities.Document.create({
      business_id: activeBusiness.id, type: 'invoice',
      supplier_name: classification.supplier_name || file.name.replace(/\.[^.]+$/, ''),
      file_url, status: 'new', raw_text: classification.notes || ''
    });
  }

  return { typeConfig, docType, classification, fileName: file.name };
}

export default function SmartUploadButton() {
  const { businesses, currentBusiness } = useBusiness();
  const [open, setOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [bizDropOpen, setBizDropOpen] = useState(false);
  // Venue confirmation: when a file's filename suggests a different venue, ask before committing
  const [pendingConfirm, setPendingConfirm] = useState(null); // { file, resolvedBusiness, detectedVenueName }
  const [confirmQueue, setConfirmQueue] = useState([]); // remaining files after confirmation

  // Multi-file state
  const [queue, setQueue] = useState([]); // [{ file, status: 'pending'|'processing'|'done'|'error', result, error }]
  const [processing, setProcessing] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const fileRef = useRef(null);
  const navigate = useNavigate();

  const activeBusiness = selectedBusiness || currentBusiness;

  const reset = () => {
    setQueue([]);
    setProcessing(false);
    setAllDone(false);
    setSelectedBusiness(null);
    setBizDropOpen(false);
    setPendingConfirm(null);
  };

  // Try to detect a venue name hint from the filename (e.g. payslip_Mar2026_FORNO_...)
  const detectVenueFromFilename = (filename) => {
    if (!businesses?.length) return null;
    const upper = filename.toUpperCase();
    return businesses.find(b => {
      // Check if any word in the business name appears in the filename
      const words = b.name.toUpperCase().split(/\s+/).filter(w => w.length > 3);
      return words.some(w => upper.includes(w));
    }) || null;
  };

  const handleFiles = async (files) => {
    if (!files?.length || !activeBusiness) return;
    const fileArray = Array.from(files);

    // Check first file for venue mismatch before starting
    const suggestedBusiness = detectVenueFromFilename(fileArray[0].name);
    if (suggestedBusiness && suggestedBusiness.id !== activeBusiness.id) {
      // Pause and ask for confirmation
      setPendingConfirm({
        files: fileArray,
        suggestedBusiness,
        currentBusiness: activeBusiness,
      });
      return;
    }

    await processFileArray(fileArray, activeBusiness);
  };

  const processFileArray = async (fileArray, targetBusiness) => {
    const initialQueue = fileArray.map(f => ({ file: f, status: 'pending', result: null, error: null }));
    setQueue(initialQueue);
    setProcessing(true);
    setAllDone(false);

    const updatedQueue = [...initialQueue];
    for (let i = 0; i < fileArray.length; i++) {
      updatedQueue[i] = { ...updatedQueue[i], status: 'processing' };
      setQueue([...updatedQueue]);
      try {
        const res = await processFile(fileArray[i], targetBusiness);
        updatedQueue[i] = { ...updatedQueue[i], status: 'done', result: res };
      } catch (err) {
        updatedQueue[i] = { ...updatedQueue[i], status: 'error', error: err.message || 'Failed' };
      }
      setQueue([...updatedQueue]);
    }
    setProcessing(false);
    setAllDone(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  const doneCount = queue.filter(q => q.status === 'done').length;
  const errorCount = queue.filter(q => q.status === 'error').length;
  const totalCount = queue.length;

  // Primary route to navigate to after completion
  const primaryRoute = queue.find(q => q.result?.typeConfig?.route)?.result?.typeConfig?.route || '/Expenses';

  const isIdle = queue.length === 0;

  return (
    <>
      <button
        onClick={() => { reset(); setOpen(true); }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#7B3BFF]/40 bg-[#7B3BFF]/10 hover:bg-[#7B3BFF]/20 hover:border-[#7B3BFF]/70 transition-all duration-200 text-sm font-medium text-[#C084FC]"
      >
        <Upload className="w-3.5 h-3.5" />
        <span className="hidden sm:block">Smart Upload</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget && !processing) { setOpen(false); reset(); } }}
        >
          <div className="bg-[#151528] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            {!processing && (
              <button onClick={() => { setOpen(false); reset(); }} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}

            <h3 className="text-white font-semibold text-base mb-1">Smart Document Upload</h3>
            <p className="text-slate-400 text-xs mb-4">AI detects document types and saves them to the right place. Upload multiple files at once.</p>

            {/* Business selector */}
            {businesses.length > 1 && isIdle && (
              <div className="mb-4 relative">
                <p className="text-xs text-slate-500 mb-1.5">Save to business:</p>
                <button
                  onClick={() => setBizDropOpen(o => !o)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm text-white transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-[#C084FC]" />
                    {activeBusiness?.name || 'Select business'}
                  </span>
                  <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 transition-transform', bizDropOpen && 'rotate-180')} />
                </button>
                {bizDropOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl z-10 overflow-hidden">
                    {businesses.map(b => (
                      <button
                        key={b.id}
                        onClick={() => { setSelectedBusiness(b); setBizDropOpen(false); }}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 text-sm text-white transition-colors"
                      >
                        <span>{b.name}</span>
                        {activeBusiness?.id === b.id && <CheckCircle className="w-3.5 h-3.5 text-[#C084FC]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Venue mismatch confirmation */}
            {pendingConfirm && (
              <div className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <p className="text-amber-300 text-sm font-medium mb-1">⚠ Venue mismatch detected</p>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    The filename suggests this may belong to <span className="text-white font-medium">"{pendingConfirm.suggestedBusiness.name}"</span>, but you're currently working in <span className="text-white font-medium">"{pendingConfirm.currentBusiness.name}"</span>.
                  </p>
                  <p className="text-slate-500 text-xs mt-1">Save to which venue?</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setPendingConfirm(null); processFileArray(pendingConfirm.files, pendingConfirm.suggestedBusiness); }}
                    className="px-3 py-2.5 rounded-xl bg-[#7B3BFF]/20 border border-[#7B3BFF]/40 hover:bg-[#7B3BFF]/30 text-white text-xs font-medium text-center transition-colors"
                  >
                    {pendingConfirm.suggestedBusiness.name}
                    <span className="block text-[#C084FC] text-[10px] mt-0.5">From filename</span>
                  </button>
                  <button
                    onClick={() => { setPendingConfirm(null); processFileArray(pendingConfirm.files, pendingConfirm.currentBusiness); }}
                    className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-medium text-center transition-colors"
                  >
                    {pendingConfirm.currentBusiness.name}
                    <span className="block text-slate-500 text-[10px] mt-0.5">Currently selected</span>
                  </button>
                </div>
                <button
                  onClick={() => setPendingConfirm(null)}
                  className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Drop zone — only shown when idle and no pending confirm */}
            {isIdle && !pendingConfirm && (
              <div
                className="border-2 border-dashed border-white/10 hover:border-[#7B3BFF]/50 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all group"
                onClick={() => fileRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="w-12 h-12 rounded-xl bg-[#7B3BFF]/10 flex items-center justify-center group-hover:bg-[#7B3BFF]/20 transition-colors">
                  <Upload className="w-6 h-6 text-[#C084FC]" />
                </div>
                <div className="text-center">
                  <p className="text-white text-sm font-medium">Click or drag & drop</p>
                  <p className="text-slate-500 text-xs mt-1">Multiple files supported · Invoice · Payslip · Menu · Receipt</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xlsx,.csv"
                  multiple
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>
            )}


            {/* File queue progress */}
            {queue.length > 0 && (
              <div className="space-y-3">
                {/* Overall progress bar */}
                {totalCount > 1 && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                      <span>{processing ? `Processing ${queue.findIndex(q => q.status === 'processing') + 1} of ${totalCount}…` : `${doneCount} of ${totalCount} complete`}</span>
                      {errorCount > 0 && <span className="text-rose-400">{errorCount} failed</span>}
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-[#7B3BFF] to-[#A855F7] transition-all duration-500"
                        style={{ width: `${((doneCount + errorCount) / totalCount) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Per-file list */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {queue.map((item, i) => {
                    const TypeIcon = item.result?.typeConfig?.icon || FileText;
                    return (
                      <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/5">
                        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                          {item.status === 'processing' && <Loader2 className="w-4 h-4 text-[#C084FC] animate-spin" />}
                          {item.status === 'done' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                          {item.status === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
                          {item.status === 'pending' && <FileText className="w-4 h-4 text-slate-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate">{item.file.name}</p>
                          <p className={cn('text-[10px] mt-0.5 truncate', {
                            'text-slate-500': item.status === 'pending',
                            'text-[#C084FC]': item.status === 'processing',
                            'text-emerald-400': item.status === 'done',
                            'text-rose-400': item.status === 'error',
                          })}>
                            {item.status === 'pending' && 'Waiting…'}
                            {item.status === 'processing' && 'Reading & classifying…'}
                            {item.status === 'done' && `${item.result?.typeConfig?.label || 'Saved'} → ${item.result?.typeConfig?.destination || 'saved'}`}
                            {item.status === 'error' && (item.error || 'Failed')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Done CTA */}
                {allDone && (
                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => { navigate(primaryRoute); setOpen(false); reset(); }}
                      className="flex-1 px-4 py-2 rounded-xl bg-[#7B3BFF] hover:bg-[#6d2ff7] text-white text-sm font-medium transition-colors"
                    >
                      {doneCount === 1 ? `View in ${queue.find(q => q.status === 'done')?.result?.typeConfig?.destination || 'app'} →` : `View results →`}
                    </button>
                    <button
                      onClick={() => { reset(); }}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm transition-colors"
                    >
                      Upload more
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}