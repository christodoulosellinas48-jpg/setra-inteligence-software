import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarRange, ChevronDown } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, subMonths, subQuarters, format } from 'date-fns';

const PRESETS = [
  { label: 'This month', fn: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: 'Last month', fn: () => { const d = subMonths(new Date(), 1); return { from: startOfMonth(d), to: endOfMonth(d) }; } },
  { label: 'This quarter', fn: () => ({ from: startOfQuarter(new Date()), to: endOfQuarter(new Date()) }) },
  { label: 'Last quarter', fn: () => { const d = subQuarters(new Date(), 1); return { from: startOfQuarter(d), to: endOfQuarter(d) }; } },
  { label: 'Year to date', fn: () => ({ from: startOfYear(new Date()), to: new Date() }) },
  { label: 'All time', fn: () => ({ from: null, to: null }) },
];

export default function DateRangeFilter({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const label = !value.from && !value.to ? 'All time'
    : value.from && value.to ? `${format(value.from, 'dd MMM')} – ${format(value.to, 'dd MMM yy')}`
    : 'Custom';

  const applyPreset = (preset) => {
    onChange(preset.fn());
    setOpen(false);
  };

  const applyCustom = () => {
    if (customFrom && customTo) {
      onChange({ from: new Date(customFrom), to: new Date(customTo) });
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 h-11 bg-[#151528] border border-white/10 rounded-xl text-sm text-white hover:border-white/20 transition-colors"
      >
        <CalendarRange className="w-4 h-4 text-slate-400" />
        <span className="text-slate-300">{label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 top-12 left-0 bg-[#151528] border border-white/10 rounded-xl shadow-2xl w-64 p-2">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                {p.label}
              </button>
            ))}
            <div className="border-t border-white/5 mt-2 pt-2 px-1 space-y-2">
              <p className="text-xs text-slate-500 px-2">Custom range</p>
              <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className="bg-[#0B0B12] border-white/10 text-white text-xs h-8" />
              <Input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                className="bg-[#0B0B12] border-white/10 text-white text-xs h-8" />
              <Button size="sm" className="w-full h-8 text-xs" onClick={applyCustom} disabled={!customFrom || !customTo}>
                Apply
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}