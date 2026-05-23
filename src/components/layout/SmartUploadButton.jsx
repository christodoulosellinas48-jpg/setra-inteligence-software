import React, { useState, useRef } from 'react';
import { useBusiness } from '@/components/business/BusinessContext';
import { base44 } from '@/api/base44Client';
import { Upload, X, CheckCircle, AlertCircle, Loader2, FileText, Receipt, Users, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const DOC_TYPES = {
  invoice: { label: 'Invoice', icon: Receipt, color: 'text-blue-400', route: '/Expenses' },
  payslip: { label: 'Payslip', icon: Users, color: 'text-emerald-400', route: '/Payroll' },
  menu: { label: 'Menu', icon: BookOpen, color: 'text-orange-400', route: '/MenuEngineering' },
  receipt: { label: 'Receipt', icon: Receipt, color: 'text-yellow-400', route: '/Expenses' },
  document: { label: 'Document', icon: FileText, color: 'text-slate-400', route: '/VATAndBookkeeping' },
};

export default function SmartUploadButton() {
  const { currentBusiness } = useBusiness();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | uploading | classifying | saving | done | error
  const [result, setResult] = useState(null); // { type, label, route, fileName }
  const [error, setError] = useState(null);
  const fileRef = useRef(null);
  const navigate = useNavigate();

  const reset = () => {
    setStatus('idle');
    setResult(null);
    setError(null);
  };

  const handleFile = async (file) => {
    if (!file || !currentBusiness) return;
    setOpen(true);
    setStatus('uploading');
    setError(null);
    setResult(null);

    try {
      // 1. Upload file
      setStatus('uploading');
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // 2. Classify with AI
      setStatus('classifying');
      const classification = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a document classifier for a restaurant finance platform. Analyze the document and classify it.

Business: ${currentBusiness.name}
File name: ${file.name}

Classify as ONE of: invoice, payslip, menu, receipt, document

For invoice/receipt: also extract supplier_name, invoice_date (YYYY-MM-DD), invoice_total (number), expense_category (food_beverage|staff_costs|fixed_costs|utilities|operating_expenses|one_off_expenses).
For payslip: extract employee_name, pay_period, net_pay (number).

Respond with JSON only.`,
        file_urls: [file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            doc_type: { type: 'string', enum: ['invoice', 'payslip', 'menu', 'receipt', 'document'] },
            supplier_name: { type: 'string' },
            invoice_date: { type: 'string' },
            invoice_total: { type: 'number' },
            expense_category: { type: 'string' },
            employee_name: { type: 'string' },
            pay_period: { type: 'string' },
            net_pay: { type: 'number' },
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
          business_id: currentBusiness.id,
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
          business_id: currentBusiness.id,
          supplier_name: classification.employee_name || 'Employee',
          invoice_date: new Date().toISOString().split('T')[0],
          invoice_total: classification.net_pay || 0,
          expense_category: 'staff_costs',
          document_url: file_url,
          status: 'pending',
          notes: `Payslip — ${classification.pay_period || ''} — Smart upload`
        });
      } else {
        // Generic document — save to bookkeeping inbox
        await base44.entities.Document.create({
          business_id: currentBusiness.id,
          type: 'invoice',
          supplier_name: classification.supplier_name || file.name.replace(/\.[^.]+$/, ''),
          file_url,
          status: 'new',
          raw_text: classification.notes || ''
        });
      }

      setResult({ ...typeConfig, fileName: file.name, docType, classification });
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
            <p className="text-slate-400 text-xs mb-5">Drop any file — AI will detect what it is and save it automatically.</p>

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
                  <p className="text-slate-500 text-xs mt-1">Invoice · Payslip · Menu · Receipt · Any document</p>
                </div>
                <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.xlsx,.csv" onChange={(e) => handleFile(e.target.files[0])} />
              </div>
            )}

            {(status === 'uploading' || status === 'classifying' || status === 'saving') && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="relative w-14 h-14">
                  <div className="absolute inset-0 rounded-full border-2 border-[#7B3BFF]/20 border-t-[#7B3BFF] animate-spin" />
                  <div className="absolute inset-2 rounded-full bg-[#7B3BFF]/10 flex items-center justify-center">
                    {status === 'uploading' && <Upload className="w-5 h-5 text-[#C084FC]" />}
                    {status === 'classifying' && <FileText className="w-5 h-5 text-[#C084FC]" />}
                    {status === 'saving' && <CheckCircle className="w-5 h-5 text-[#C084FC]" />}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white text-sm font-medium">
                    {status === 'uploading' && 'Uploading file…'}
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
                  <p className="text-white font-semibold">Saved successfully!</p>
                  <p className="text-slate-400 text-xs mt-1 max-w-[240px]">
                    Detected as <span className={cn('font-medium', result.color)}>{result.label}</span>
                    {result.classification?.supplier_name && (
                      <> from <span className="text-white">{result.classification.supplier_name}</span></>
                    )}
                  </p>
                  {result.classification?.invoice_total > 0 && (
                    <p className="text-slate-500 text-xs mt-0.5">
                      Amount: <span className="text-white">€{result.classification.invoice_total.toFixed(2)}</span>
                    </p>
                  )}
                </div>
                <button
                  onClick={goToResult}
                  className="mt-1 px-5 py-2 rounded-xl bg-[#7B3BFF] hover:bg-[#6d2ff7] text-white text-sm font-medium transition-colors"
                >
                  View in {result.label === 'Payslip' ? 'Payroll' : result.label === 'Menu' ? 'Menu Engineering' : 'Expenses'} →
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