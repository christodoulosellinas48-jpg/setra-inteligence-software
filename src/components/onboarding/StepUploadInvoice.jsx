import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Upload, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function StepUploadInvoice({ onNext, onSkip }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const handleFile = async (f) => {
    if (!f) return;
    setFile(f);
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
      setDone(true);
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-lg mx-auto w-full"
    >
      <div className="text-center mb-8">
        <div className="w-12 h-12 mx-auto mb-4 bg-[#7B3BFF]/20 rounded-2xl flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-[#A855F7]" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Try AI invoice parsing</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Drop in a supplier invoice (PDF or photo) and watch Setra extract every line in seconds.
        </p>
      </div>

      {/* Drop zone */}
      {!done ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 mb-6 ${
            dragOver
              ? 'border-[#7B3BFF] bg-[#7B3BFF]/10'
              : 'border-[#2A2A3A] hover:border-[#7B3BFF]/50 bg-[#151528]/60'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={e => handleFile(e.target.files[0])}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#7B3BFF] border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Uploading {file?.name}…</p>
            </div>
          ) : file ? (
            <div className="flex flex-col items-center gap-2">
              <FileText className="w-8 h-8 text-[#A855F7]" />
              <p className="text-white text-sm font-medium">{file.name}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Upload className="w-8 h-8 text-slate-600" />
              <p className="text-slate-400 text-sm">Drag a PDF or photo here, or <span className="text-[#A855F7]">click to browse</span></p>
              <p className="text-xs text-slate-600">PDF, JPG, PNG supported</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#7B3BFF]/10 border border-[#7B3BFF]/30 rounded-2xl p-6 text-center mb-6">
          <CheckCircle2 className="w-8 h-8 text-[#7B3BFF] mx-auto mb-2" />
          <p className="text-white font-medium">Invoice uploaded!</p>
          <p className="text-slate-400 text-sm mt-1">Setra will parse and categorise it automatically. You'll see it in Expenses.</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={() => onNext({ invoiceUploaded: done })} className="flex-1 py-5">
          {done ? 'Continue' : 'Skip this step'}
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
        {!done && (
          <Button variant="ghost" onClick={onSkip} className="text-slate-500 hover:text-slate-300">
            Skip for now
          </Button>
        )}
      </div>
    </motion.div>
  );
}