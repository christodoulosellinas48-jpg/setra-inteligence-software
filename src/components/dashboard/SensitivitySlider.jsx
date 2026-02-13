import React from 'react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export default function SensitivitySlider({ label, value, onChange, min = -50, max = 50 }) {
  const isPositive = value > 0;
  const isNegative = value < 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-400">{label}</span>
        <span className={cn(
          "text-sm font-bold px-2 py-0.5 rounded",
          isPositive && "text-emerald-400 bg-emerald-500/10",
          isNegative && "text-rose-400 bg-rose-500/10",
          !isPositive && !isNegative && "text-slate-400 bg-slate-700/50"
        )}>
          {isPositive && '+'}{value}%
        </span>
      </div>
      
      <div className="relative">
        <Slider
          value={[value]}
          onValueChange={(vals) => onChange(vals[0])}
          min={min}
          max={max}
          step={1}
          className="w-full"
        />
        <div className="absolute top-1/2 left-1/2 w-0.5 h-3 bg-slate-600 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full" />
      </div>
      
      <div className="flex justify-between text-xs text-slate-600">
        <span>{min}%</span>
        <span>0%</span>
        <span>+{max}%</span>
      </div>
    </div>
  );
}