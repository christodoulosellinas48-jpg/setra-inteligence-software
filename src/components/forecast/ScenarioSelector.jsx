import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, Minus, TrendingDown } from 'lucide-react';

const SCENARIOS = [
  { 
    key: 'optimistic', 
    label: 'Optimistic', 
    description: '+10% revenue growth',
    icon: TrendingUp,
    color: 'emerald'
  },
  { 
    key: 'baseline', 
    label: 'Baseline', 
    description: 'Current trend',
    icon: Minus,
    color: 'blue'
  },
  { 
    key: 'conservative', 
    label: 'Conservative', 
    description: '-10% revenue adjustment',
    icon: TrendingDown,
    color: 'amber'
  }
];

export default function ScenarioSelector({ selected, onChange }) {
  return (
    <div className="flex gap-3">
      {SCENARIOS.map((scenario) => {
        const Icon = scenario.icon;
        const isSelected = selected === scenario.key;
        
        return (
          <button
            key={scenario.key}
            onClick={() => onChange(scenario.key)}
            className={cn(
              "flex-1 p-4 rounded-xl border transition-all",
              isSelected 
                ? `bg-${scenario.color}-500/10 border-${scenario.color}-500/50` 
                : "bg-slate-800/50 border-slate-700 hover:border-slate-600",
              scenario.key === 'optimistic' && isSelected && "bg-emerald-500/10 border-emerald-500/50",
              scenario.key === 'baseline' && isSelected && "bg-blue-500/10 border-blue-500/50",
              scenario.key === 'conservative' && isSelected && "bg-amber-500/10 border-amber-500/50"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className={cn(
                "w-4 h-4",
                scenario.key === 'optimistic' && "text-emerald-400",
                scenario.key === 'baseline' && "text-blue-400",
                scenario.key === 'conservative' && "text-amber-400"
              )} />
              <span className={cn(
                "font-medium",
                isSelected ? "text-white" : "text-slate-300"
              )}>
                {scenario.label}
              </span>
            </div>
            <p className="text-xs text-slate-500">{scenario.description}</p>
          </button>
        );
      })}
    </div>
  );
}