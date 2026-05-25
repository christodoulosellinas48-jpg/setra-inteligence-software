import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, MessageSquare, LayoutDashboard, X, FileText, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useBusiness } from '@/components/business/BusinessContext';

export default function ShortcutRow() {
  const navigate = useNavigate();
  const { currentBusiness } = useBusiness();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [queue, setQueue] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const fileRef = useRef(null);

  const reset = () => { setQueue([]); setProcessing(false); setAllDone(false); };

  const handleFiles = async (files) => {
    if (!files?.length || !currentBusiness) return;
    const arr = Array.from(files);
    const initial = arr.map(f => ({ file: f, status: 'pending', result: null }));
    setQueue(initial);
    setProcessing(true);
    const updated = [...initial];
    for (let i = 0; i < arr.length; i++) {
      updated[i] = { ...updated[i], status: 'processing' };
      setQueue([...updated]);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: arr[i] });
        await base44.entities.ExpenseDocument.create({
          business_id: currentBusiness.id,
          supplier_name: arr[i].name.replace(/\.[^.]+$/, ''),
          invoice_date: new Date().toISOString().split('T')[0],
          invoice_total: 0,
          expense_category: 'operating_expenses',
          document_url: file_url,
          status: 'pending',
          notes: 'Smart upload from Today shortcut',
        });
        updated[i] = { ...updated[i], status: 'done' };
      } catch (e) {
        updated[i] = { ...updated[i], status: 'error' };
      }
      setQueue([...updated]);
    }
    setProcessing(false);
    setAllDone(true);
  };

  const shortcuts = [
    {
      icon: Upload,
      label: 'Smart Upload',
      description: 'Upload invoices, delivery notes, or documents. Setra handles the rest.',
      onClick: () => { reset(); setUploadOpen(true); },
      accentClass: 'border-[#7B3BFF]/40 bg-[#7B3BFF]/10 hover:bg-[#7B3BFF]/20 hover:border-[#7B3BFF]/60 text-[#C084FC] hover:shadow-[0_0_24px_rgba(123,59,255,0.2)]',
      iconClass: 'text-[#C084FC]',
    },
    {
      icon: MessageSquare,
      label: 'Ask Setra',
      description: 'Ask anything about your business. Get instant answers.',
      onClick: () => navigate('/Dashboard'),
      accentClass: 'border-white/10 bg-white/[0.04] hover:bg-white/[0.07] text-white',
      iconClass: 'text-[#C084FC]',
    },
    {
      icon: LayoutDashboard,
      label: 'Open Dashboard',
      description: 'Dive into your full overview and detailed analytics.',
      onClick: () => navigate('/Dashboard'),
      accentClass: 'border-white/10 bg-white/[0.04] hover:bg-white/[0.07] text-white',
      iconClass: 'text-slate-400',
    },
  ];

  return (
    <>
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white">Quick actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {shortcuts.map(({ icon: Icon, label, description, onClick, accentClass, iconClass }) => (
            <button
              key={label}
              onClick={onClick}
              className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all duration-200 group ${accentClass}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                <Icon className={`w-5 h-5 ${iconClass}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-sm font-semibold">{label}</p>
                  <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
                <p className="text-xs mt-0.5 text-slate-500 leading-snug">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Upload modal */}
      {uploadOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget && !processing) { setUploadOpen(false); reset(); } }}
        >
          <div className="bg-[#151528] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
            {!processing && (
              <button onClick={() => { setUploadOpen(false); reset(); }} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
            <h3 className="text-white font-semibold text-base mb-1">Smart Upload</h3>
            <p className="text-slate-400 text-xs mb-4">Upload invoices, receipts, or documents.</p>

            {queue.length === 0 && (
              <div
                className="border-2 border-dashed border-white/10 hover:border-[#7B3BFF]/50 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all hover:bg-[#7B3BFF]/5"
                onClick={() => fileRef.current?.click()}
                onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files); }}
                onDragOver={(e) => e.preventDefault()}
              >
                <Upload className="w-8 h-8 text-[#C084FC]" />
                <p className="text-white text-sm font-medium text-center">Click or drag & drop</p>
                <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.xlsx,.csv" multiple onChange={(e) => handleFiles(e.target.files)} />
              </div>
            )}

            {queue.length > 0 && (
              <div className="space-y-2">
                {queue.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/5">
                    <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                      {item.status === 'processing' && <Loader2 className="w-4 h-4 text-[#C084FC] animate-spin" />}
                      {item.status === 'done' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                      {item.status === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
                      {item.status === 'pending' && <FileText className="w-4 h-4 text-slate-500" />}
                    </div>
                    <p className="text-white text-xs truncate flex-1">{item.file.name}</p>
                  </div>
                ))}
                {allDone && (
                  <div className="pt-2 flex gap-2">
                    <button onClick={() => { navigate('/FinancialData'); setUploadOpen(false); reset(); }} className="flex-1 px-4 py-2 rounded-xl bg-[#7B3BFF] hover:bg-[#6d2ff7] text-white text-sm font-medium transition-colors">
                      View in Financial Data →
                    </button>
                    <button onClick={reset} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm transition-colors">
                      More
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