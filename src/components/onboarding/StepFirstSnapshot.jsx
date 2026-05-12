import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, ShoppingBag, BarChart3, Percent } from 'lucide-react';

const SAMPLE_METRICS = [
  { icon: TrendingUp, label: 'Revenue this week', value: '€4,820', sub: 'Sample data', color: 'text-green-400' },
  { icon: ShoppingBag, label: 'Top seller', value: 'Flat White', sub: '38 sold', color: 'text-[#A855F7]' },
  { icon: BarChart3, label: 'Avg ticket size', value: '€12.40', sub: 'Sample data', color: 'text-blue-400' },
  { icon: Percent, label: 'Est. food cost', value: '28%', sub: '↓ 2% vs target', color: 'text-emerald-400' },
];

export default function StepFirstSnapshot({ posConnected, onNext }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-lg mx-auto w-full"
    >
      <div className="text-center mb-6">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Here's your first snapshot</h2>
        <p className="text-slate-400 text-sm">
          {posConnected
            ? 'Your POS is connected — real numbers are already flowing in.'
            : 'This is what you\'ll see once your data flows in. Connect your POS to see real numbers.'}
        </p>
      </div>

      {/* Mini dashboard */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {SAMPLE_METRICS.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="relative bg-[#151528] border border-[#2A2A3A] rounded-xl p-4 overflow-hidden">
              {!posConnected && (
                <div className="absolute inset-0 backdrop-blur-[2px] bg-[#0B0B12]/30 flex items-center justify-center rounded-xl z-10">
                  <span className="text-xs text-slate-500 bg-[#0B0B12]/80 px-2 py-1 rounded-lg">Sample</span>
                </div>
              )}
              <Icon className={`w-4 h-4 mb-2 ${m.color}`} />
              <div className="text-xl font-bold text-white">{m.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{m.label}</div>
              <div className="text-xs text-slate-600 mt-0.5">{m.sub}</div>
            </div>
          );
        })}
      </div>

      {!posConnected && (
        <div className="bg-[#7B3BFF]/8 border border-[#7B3BFF]/20 rounded-xl p-3 text-center mb-5">
          <p className="text-xs text-slate-400">Connect your POS from <span className="text-[#A855F7]">Integrations</span> to replace sample data with your real numbers.</p>
        </div>
      )}

      <Button onClick={onNext} className="w-full py-5 text-base">
        Take me to my Dashboard
        <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
    </motion.div>
  );
}