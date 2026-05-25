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
      description: 'Upload invoices, delivery notes, or documents.',
      onClick: () => { reset(); setUploadOpen(true); },
      accent: 'violet',
    },
    {
      icon: MessageSquare,
      label: 'Ask Setra',
      description: 'Ask anything about your business. Get instant answers.',
      onClick: () => navigate('/Dashboard'),
      accent: 'emerald',
    },
    {
      icon: LayoutDashboard,
      label: 'Open Dashboard',
      description: 'Dive into your full overview and detailed analytics.',
      onClick: () => navigate('/Dashboard'),
      accent: 'blue',
    },
  ];

  const accentMap = {
    violet: 'bg-violet-50 border-violet-200 hover:bg-violet-100 hover:border-violet-300 text-violet-700',
    emerald: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 text-emerald-700',
    blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300 text-blue-700',
  };
  const iconAccentMap = {
    violet: 'bg-violet-100 text-violet-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
  };

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-800">Quick actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {shortcuts.map(({ icon: Icon, label, description, onClick, accent }) => (
            <button
              key={label}
              onClick={onClick}
              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all group ${accentMap[accent]}`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconAccentMap[accent]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{label}</p>
                  <ArrowRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
                <p className="text-xs mt-0.5 opacity-70 leading-snug">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Upload modal */}
      {uploadOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget && !processing) { setUploadOpen(false); reset(); } }}
        >
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
            {!processing && (
              <button
                onClick={() => { setUploadOpen(false); reset(); }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <h3 className="text-slate-800 font-bold text-base mb-1">Smart Upload</h3>
            <p className="text-slate-500 text-xs mb-4">Upload invoices, receipts, or documents.</p>

            {queue.length === 0 && (
              <div
                className="border-2 border-dashed border-slate-200 hover:border-violet-400 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all bg-slate-50 hover:bg-violet-50"
                onClick={() => fileRef.current?.click()}
                onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files); }}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-violet-600" />
                </div>
                <p className="text-slate-700 text-sm font-medium text-center">Click or drag & drop</p>
                <p className="text-slate-400 text-xs text-center">PDF, image, or spreadsheet</p>
                <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.xlsx,.csv" multiple onChange={(e) => handleFiles(e.target.files)} />
              </div>
            )}

            {queue.length > 0 && (
              <div className="space-y-2">
                {queue.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                      {item.status === 'processing' && <Loader2 className="w-4 h-4 text-violet-600 animate-spin" />}
                      {item.status === 'done' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                      {item.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                      {item.status === 'pending' && <FileText className="w-4 h-4 text-slate-400" />}
                    </div>
                    <p className="text-slate-700 text-xs truncate flex-1">{item.file.name}</p>
                  </div>
                ))}
                {allDone && (
                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => { navigate('/FinancialData'); setUploadOpen(false); reset(); }}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
                    >
                      View in Financial Data →
                    </button>
                    <button
                      onClick={reset}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm transition-colors"
                    >
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