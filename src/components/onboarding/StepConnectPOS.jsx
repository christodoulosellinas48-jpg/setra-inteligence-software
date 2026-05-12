import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Zap } from 'lucide-react';

const POS_OPTIONS = [
  { key: 'square', label: 'Square', logo: '⬛', status: 'available' },
  { key: 'toast', label: 'Toast', logo: '🍞', status: 'available' },
  { key: 'lightspeed', label: 'Lightspeed', logo: '⚡', status: 'available' },
  { key: 'epos_now', label: 'Epos Now', logo: '🔵', status: 'available' },
  { key: 'clover', label: 'Clover', logo: '🍀', status: 'coming_soon' },
  { key: 'revel', label: 'Revel', logo: '🔶', status: 'coming_soon' },
];

export default function StepConnectPOS({ onNext, onSkip }) {
  const [selected, setSelected] = useState(null);
  const [requestSent, setRequestSent] = useState(false);
  const [customPOS, setCustomPOS] = useState('');

  const handleConnect = () => {
    // In real implementation this would trigger OAuth / integration setup
    onNext({ pos: selected });
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
          <Zap className="w-6 h-6 text-[#A855F7]" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Connect your sales data</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Your POS connection is where the magic starts. Setra pulls sales automatically so you don't have to type a thing.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {POS_OPTIONS.map(pos => (
          <button
            key={pos.key}
            onClick={() => pos.status === 'available' && setSelected(pos.key)}
            disabled={pos.status === 'coming_soon'}
            className={`relative p-4 rounded-xl border text-left transition-all duration-150 ${
              pos.status === 'coming_soon'
                ? 'opacity-40 cursor-not-allowed border-[#2A2A3A] bg-[#151528]'
                : selected === pos.key
                  ? 'bg-[#7B3BFF]/20 border-[#7B3BFF] shadow-lg shadow-[#7B3BFF]/10'
                  : 'bg-[#151528] border-[#2A2A3A] hover:border-[#7B3BFF]/40'
            }`}
          >
            <div className="text-2xl mb-1">{pos.logo}</div>
            <div className="text-sm font-medium text-white">{pos.label}</div>
            {pos.status === 'coming_soon' && (
              <div className="text-xs text-slate-600 mt-0.5">Coming soon</div>
            )}
            {selected === pos.key && (
              <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-[#7B3BFF]" />
            )}
          </button>
        ))}
      </div>

      {/* Not listed */}
      {!requestSent ? (
        <div className="bg-[#151528] border border-[#2A2A3A] rounded-xl p-4 mb-6">
          <p className="text-slate-400 text-sm mb-2">My POS isn't here</p>
          <div className="flex gap-2">
            <input
              value={customPOS}
              onChange={e => setCustomPOS(e.target.value)}
              placeholder="Which POS do you use?"
              className="flex-1 bg-[#0B0B12] border border-[#2A2A3A] rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#7B3BFF]"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => customPOS.trim() && setRequestSent(true)}
              disabled={!customPOS.trim()}
            >
              Request
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-[#7B3BFF]/10 border border-[#7B3BFF]/30 rounded-xl p-4 mb-6 text-center">
          <CheckCircle2 className="w-5 h-5 text-[#7B3BFF] mx-auto mb-1" />
          <p className="text-sm text-slate-300">Got it — we'll add <strong className="text-white">{customPOS}</strong> integration shortly and notify you.</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleConnect}
          disabled={!selected}
          className="flex-1 py-5"
        >
          {selected ? `Connect ${POS_OPTIONS.find(p => p.key === selected)?.label}` : 'Select a POS above'}
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
        <Button variant="ghost" onClick={onSkip} className="text-slate-500 hover:text-slate-300">
          Skip for now
        </Button>
      </div>
      <p className="text-xs text-slate-600 text-center mt-3">You can always connect your POS later from the Integrations page.</p>
    </motion.div>
  );
}