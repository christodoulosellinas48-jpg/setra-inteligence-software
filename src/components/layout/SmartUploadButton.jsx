import React, { useState, useRef } from 'react';
import { useBusiness } from '@/components/business/BusinessContext';
import { base44 } from '@/api/base44Client';
import { Upload, X, CheckCircle, AlertCircle, FileText, Receipt, Users, BookOpen, Building2, ChevronDown, TrendingUp } from 'lucide-react';
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

export default function SmartUploadButton() {
  const { businesses, currentBusiness } = useBusiness();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [bizDropOpen, setBizDropOpen] = useState(false);
  const fileRef = useRef(null);
  const navigate = useNavigate();

  const activeBusiness = selectedBusiness || currentBusiness;

  const reset = () => {
    setStatus('idle');
    setResult(null);
    setError(null);
    setSelectedBusiness(null);
    setBizDropOpen(false);
  };

  const handleFile = async (file) => {
    if (!file || !activeBusiness) return;
    setOpen(true);
    setStatus('uploading');
    setError(null);
    setResult(null);

    try {
      // 1. Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // 2. Classify with AI — include income_report as a possible type
      setStatus('classifying');
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

      // 3. Save to the right entity
      setStatus('saving');

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
        // Parse period to get start/end dates
        const period = classification.report_period; // e.g. "2025-06"
        let periodStart, periodEnd;
        if (period && /^\d{4}-\d{2}$/.test(period)) {
          const [year, month] = period.split('-').map(Number);
          periodStart = new Date(year, month - 1, 1).toISOString().split('T')[0];
          periodEnd = new Date(year, month, 0).toISOString().split('T')[0]; // last day of month
        } else {
          // fallback to current month
          const now = new Date();
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        }

        // Check for existing snapshot for this business+period to upsert
        const existing = await base44.entities.FinancialSnapshot.filter({
          business_id: activeBusiness.id
        }, '-period_start', 100);

        const existingMatch = existing.find(s => s.period_start === periodStart);

        const snapshotData = {
          business_id: activeBusiness.id,
          period_start: periodStart,
          period_end: periodEnd,
          period_type: 'monthly',
          monthly_revenue: classification.monthly_revenue || 0,
          created_by_email: '',
        };
        if (classification.days_open) snapshotData.days_open = classification.days_open;
        if (classification.total_covers) snapshotData.total_covers = classification.total_covers;
        if (classification.average_ticket) snapshotData.average_ticket = classification.average_ticket;

        if (existingMatch) {
          await base44.entities.FinancialSnapshot.update(existingMatch.id, snapshotData);
        } else {
          await base44.entities.FinancialSnapshot.create(snapshotData);
        }

        setResult({
          ...typeConfig,
          fileName: file.name,
          docType,
          classification,
          snapshotPeriod: period,
          venueName: classification.venue_name || activeBusiness.name,
          savedTo: 'snapshot',
        });
        setStatus('done');
        return;

      } else {
        // Generic document — save to bookkeeping inbox (Document entity)
        await base44.entities.Document.create({
          business_id: activeBusiness.id,
          type: 'invoice',
          supplier_name: classification.supplier_name || file.name.replace(/\.[^.]+$/, ''),
          file_url,
          status: 'new',
          raw_text: classification.notes || ''
        });
      }

      setResult({ ...typeConfig, fileName: file.name, docType, classification, savedTo: docType });
      setStatus('done');
    } catch (err) {
      setError(err.message || 'Upload failed');
      setStatus('error');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const goToResult = () => {
    if (result?.route) navigate(result.route);
    setOpen(false);
    reset();
  };

  // Determine what destination label to show on the CTA button
  const getCtaLabel = () => {
    if (!result) return 'View';
    if (result.docType === 'income_report') return 'View in Reports →';
    if (result.docType === 'payslip') return 'View in Payroll →';
    if (result.docType === 'menu') return 'View in Menu Engineering →';
    if (result.docType === 'invoice' || result.docType === 'receipt') return 'View in Expenses →';
    if (result.docType === 'document') return 'View in Bookkeeping →';
    return `View in ${result.destination} →`;
  };

  // Honest description of where it was saved
  const getSavedDescription = () => {
    if (!result) return '';
    if (result.docType === 'income_report') {
      return `Income report for ${result.venueName}${result.snapshotPeriod ? ` · ${result.snapshotPeriod}` : ''} → saved as Financial Snapshot`;
    }
    if (result.docType === 'document') {
      return `Stored in Bookkeeping Inbox for ${activeBusiness?.name} — review under VAT & Bookkeeping`;
    }
    return `Detected as ${result.label}${result.classification?.supplier_name ? ` from ${result.classification.supplier_name}` : ''} → saved to ${activeBusiness?.name}`;
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => { reset(); setOpen(true); }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#7B3BFF]/40 bg-[#7B3BFF]/10 hover:bg-[#7B3BFF]/20 hover:border-[#7B3BFF]/70 transition-all duration-200 text-sm font-medium text-[#C084FC]"
      >
        <Upload className="w-3.5 h-3.5" />
        <span className="hidden sm:block">Smart Upload</span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) { setOpen(false); reset(); } }}>
          <div className="bg-[#151528] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            {/* Close */}
            <button onClick={() => { setOpen(false); reset(); }} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-white font-semibold text-base mb-1">Smart Document Upload</h3>
            <p className="text-slate-400 text-xs mb-4">AI detects the document type and saves it to the right place automatically.</p>

            {/* Business selector — always visible */}
            {businesses.length > 1 && status === 'idle' && (
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

            {/* States */}
            {status === 'idle' && (
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
                  <p className="text-slate-500 text-xs mt-1">Invoice · Payslip · Menu · Receipt · Income Report · Any document</p>
                </div>
                <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.xlsx,.csv" onChange={(e) => handleFile(e.target.files[0])} />
              </div>
            )}

            {(status === 'uploading' || status === 'classifying' || status === 'saving') && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="relative w-14 h-14">
                  <svg className="absolute inset-0 w-14 h-14 animate-spin" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(123,59,255,0.2)" strokeWidth="3" />
                    <circle cx="28" cy="28" r="24" fill="none" stroke="#7B3BFF" strokeWidth="3" strokeDasharray="30 120" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-2 rounded-full bg-[#7B3BFF]/10 flex items-center justify-center">
                    {status === 'uploading' && <Upload className="w-5 h-5 text-[#C084FC]" />}
                    {status === 'classifying' && <FileText className="w-5 h-5 text-[#C084FC]" />}
                    {status === 'saving' && <CheckCircle className="w-5 h-5 text-[#C084FC]" />}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white text-sm font-medium">
                    {status === 'uploading' && `Uploading to ${activeBusiness?.name}…`}
                    {status === 'classifying' && 'AI is reading your document…'}
                    {status === 'saving' && 'Saving to the right place…'}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    {status === 'classifying' && 'Detecting type · Extracting data'}
                  </p>
                </div>
              </div>
            )}

            {status === 'done' && result && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold">
                    {result.docType === 'income_report' ? 'Snapshot saved!' : 'Saved successfully!'}
                  </p>
                  <p className="text-slate-400 text-xs mt-1 max-w-[260px]">
                    {getSavedDescription()}
                  </p>
                  {result.docType === 'income_report' && result.classification?.monthly_revenue > 0 && (
                    <p className="text-slate-500 text-xs mt-0.5">
                      Revenue: <span className="text-emerald-400 font-semibold">€{result.classification.monthly_revenue.toLocaleString()}</span>
                    </p>
                  )}
                  {(result.docType === 'invoice' || result.docType === 'receipt') && result.classification?.invoice_total > 0 && (
                    <p className="text-slate-500 text-xs mt-0.5">
                      Amount: <span className="text-white">€{result.classification.invoice_total.toFixed(2)}</span>
                    </p>
                  )}
                </div>
                <button
                  onClick={goToResult}
                  className="mt-1 px-5 py-2 rounded-xl bg-[#7B3BFF] hover:bg-[#6d2ff7] text-white text-sm font-medium transition-colors"
                >
                  {getCtaLabel()}
                </button>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-red-400" />
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold">Upload failed</p>
                  <p className="text-slate-400 text-xs mt-1 max-w-[260px]">{error}</p>
                </div>
                <button onClick={reset} className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm transition-colors">
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}