import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';

const ACCOUNTING_OPTIONS = [
  { key: 'xero', label: 'Xero', logo: '🔷' },
  { key: 'quickbooks', label: 'QuickBooks', logo: '🟢' },
  { key: 'sage', label: 'Sage', logo: '🟣' },
  { key: 'setra', label: "Use Setra's bookkeeping", logo: '✦', highlight: true },
];

export default function StepConnectAccounting({ onNext, onSkip }) {
  const [selected, setSelected] = useState(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-lg mx-auto w-full"
    >
      <div className="text-center mb-8">
        <div className="w-12 h-12 mx-auto mb-4 bg-[#7B3BFF]/20 rounded-2xl flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-[#A855F7]" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Connect your accounting</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Auto-sync invoices, bills, and bank transactions. Or use Setra's built-in bookkeeping and keep everything in one place.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {ACCOUNTING_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setSelected(opt.key)}
            className={`relative p-4 rounded-xl border text-left transition-all duration-150 ${
              selected === opt.key
                ? 'bg-[#7B3BFF]/20 border-[#7B3BFF] shadow-lg shadow-[#7B3BFF]/10'
                : opt.highlight
                  ? 'bg-[#7B3BFF]/5 border-[#7B3BFF]/30 hover:border-[#7B3BFF]/50'
                  : 'bg-[#151528] border-[#2A2A3A] hover:border-[#7B3BFF]/40'
            }`}
          >
            <div className="text-2xl mb-1">{opt.logo}</div>
            <div className="text-sm font-medium text-white leading-tight">{opt.label}</div>
            {opt.highlight && (
              <div className="text-xs text-[#A855F7] mt-0.5">Recommended</div>
            )}
            {selected === opt.key && (
              <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-[#7B3BFF]" />
            )}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => onNext({ accounting: selected })}
          disabled={!selected}
          className="flex-1 py-5"
        >
          {selected ? 'Continue' : 'Select an option above'}
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
        <Button variant="ghost" onClick={onSkip} className="text-slate-500 hover:text-slate-300">
          Skip for now
        </Button>
      </div>
    </motion.div>
  );
}