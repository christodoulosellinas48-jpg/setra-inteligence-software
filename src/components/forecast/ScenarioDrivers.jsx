import React, { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { TrendingUp, Minus, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// Default drivers shape — used by parent to initialise state
export const DEFAULT_DRIVERS = {
  price_increase: 0,       // % menu price increase 0–15
  seat_capacity: 0,         // % seat/capacity increase 0–50
  supplier_savings: 0,      // % supplier cost reduction 0–15
  staff_adjustment: 0,      // % staff cost change -20 to +20
  rent_change: 0,           // € monthly rent change -2000 to +2000
};

const DRIVERS_CONFIG = [
  {
    key: 'price_increase',
    emoji: '📈',
    label: 'Raise menu prices',
    description: 'Average price increase across the menu',
    unit: '%',
    min: 0, max: 15, step: 0.5,
    affectsRevenue: true,
  },
  {
    key: 'seat_capacity',
    emoji: '🪑',
    label: 'Add seats / capacity',
    description: 'Increase in covers or throughput',
    unit: '%',
    min: 0, max: 50, step: 1,
    affectsRevenue: true,
  },
  {
    key: 'supplier_savings',
    emoji: '💰',
    label: 'Negotiate supplier costs',
    description: 'Reduction in food & beverage spend',
    unit: '%',
    min: 0, max: 15, step: 0.5,
    affectsExpenses: true,
    expenseKey: 'food',
  },
  {
    key: 'staff_adjustment',
    emoji: '🧑‍🍳',
    label: 'Adjust staffing',
    description: 'Change in total staff cost (negative = cut, positive = hire)',
    unit: '%',
    min: -20, max: 20, step: 1,
    affectsExpenses: true,
    expenseKey: 'staff',
  },
  {
    key: 'rent_change',
    emoji: '🏠',
    label: 'Rent change',
    description: 'Monthly rent increase or decrease',
    unit: '€',
    min: -2000, max: 2000, step: 50,
    affectsExpenses: true,
    expenseKey: 'rent',
  },
];

const SCENARIOS = [
  { key: 'optimistic',   label: 'Optimistic',   icon: TrendingUp,   color: 'emerald', description: 'Drivers applied at full impact' },
  { key: 'baseline',     label: 'Baseline',      icon: Minus,        color: 'blue',    description: 'Drivers applied at 50% impact' },
  { key: 'conservative', label: 'Conservative',  icon: TrendingDown, color: 'amber',   description: 'Drivers applied at 25% impact' },
];

function DriverRow({ driver, value, onChange }) {
  const isNegativeGood = driver.key === 'supplier_savings';
  const displayValue = driver.unit === '€'
    ? `${value >= 0 ? '+' : ''}€${value.toLocaleString()}`
    : `${value >= 0 && driver.min < 0 ? '+' : ''}${value}%`;

  const isActive = value !== 0;

  return (
    <div className={cn(
      'p-4 rounded-xl border transition-all',
      isActive ? 'border-[#7B3BFF]/30 bg-[#7B3BFF]/5' : 'border-white/5 bg-[#0B0B12]/30'
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{driver.emoji}</span>
          <div>
            <p className="text-sm font-medium text-white">{driver.label}</p>
            <p className="text-xs text-slate-500">{driver.description}</p>
          </div>
        </div>
        <span className={cn(
          'text-sm font-mono font-semibold tabular-nums',
          !isActive ? 'text-slate-500' :
          isNegativeGood ? 'text-emerald-400' :
          (driver.min < 0 && value < 0) ? 'text-rose-400' : 'text-[#C084FC]'
        )}>
          {displayValue}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={driver.min}
        max={driver.max}
        step={driver.step}
        className="w-full"
      />
      <div className="flex justify-between mt-1">
        <span className="text-xs text-slate-600">
          {driver.unit === '€' ? `€${driver.min.toLocaleString()}` : `${driver.min}%`}
        </span>
        <span className="text-xs text-slate-600">
          {driver.unit === '€' ? `+€${driver.max.toLocaleString()}` : `+${driver.max}%`}
        </span>
      </div>
    </div>
  );
}

export default function ScenarioDrivers({ scenario, setScenario, drivers, setDrivers }) {
  const [expanded, setExpanded] = React.useState(true);

  const activeDriverCount = Object.values(drivers).filter(v => v !== 0).length;

  const updateDriver = (key, value) => {
    setDrivers(prev => ({ ...prev, [key]: value }));
  };

  const resetDrivers = () => setDrivers(DEFAULT_DRIVERS);

  return (
    <div className="space-y-4">
      {/* Scenario picker */}
      <Card className="bg-[#151528]/80 border-white/5 p-5 rounded-2xl">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Scenario</h3>
        <div className="flex gap-3">
          {SCENARIOS.map((s) => {
            const Icon = s.icon;
            const isSelected = scenario === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setScenario(s.key)}
                className={cn(
                  'flex-1 p-3 rounded-xl border transition-all text-left',
                  isSelected ? {
                    optimistic: 'bg-emerald-500/10 border-emerald-500/40',
                    baseline: 'bg-blue-500/10 border-blue-500/40',
                    conservative: 'bg-amber-500/10 border-amber-500/40',
                  }[s.key] : 'bg-[#0B0B12]/40 border-white/5 hover:border-white/10'
                )}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <Icon className={cn('w-4 h-4', {
                    optimistic: 'text-emerald-400',
                    baseline: 'text-blue-400',
                    conservative: 'text-amber-400',
                  }[s.key])} />
                  <span className={cn('font-medium text-sm', isSelected ? 'text-white' : 'text-slate-400')}>
                    {s.label}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{s.description}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Drivers panel */}
      <Card className="bg-[#151528]/80 border-white/5 rounded-2xl overflow-hidden">
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-white">Scenario Drivers</h3>
            {activeDriverCount > 0 && (
              <span className="text-xs bg-[#7B3BFF]/20 text-[#C084FC] px-2 py-0.5 rounded-full">
                {activeDriverCount} active
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {activeDriverCount > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); resetDrivers(); }}
                className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
              >
                Reset
              </button>
            )}
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>
        </button>

        {expanded && (
          <div className="px-5 pb-5 space-y-3">
            <p className="text-xs text-slate-500 -mt-1 mb-4">
              Stack drivers to model your own scenario. The {scenario} scenario applies drivers at {
                { optimistic: '100%', baseline: '50%', conservative: '25%' }[scenario]
              } impact.
            </p>
            {DRIVERS_CONFIG.map(driver => (
              <DriverRow
                key={driver.key}
                driver={driver}
                value={drivers[driver.key]}
                onChange={(v) => updateDriver(driver.key, v)}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// Helper: compute driver multipliers to apply to base financials
export function applyDriversToProjection({ baseRevenue, baseExpenses, foodCost, staffCost, rentCost, drivers, scenarioKey }) {
  const impactFactor = { optimistic: 1.0, baseline: 0.5, conservative: 0.25 }[scenarioKey] ?? 1.0;

  const revMultiplier =
    1
    + (drivers.price_increase / 100 * impactFactor)
    + (drivers.seat_capacity / 100 * impactFactor);

  const foodAdj  = 1 - (drivers.supplier_savings / 100 * impactFactor);
  const staffAdj = 1 + (drivers.staff_adjustment / 100 * impactFactor);
  const rentAdj  = drivers.rent_change * impactFactor; // absolute € change

  const adjustedFood  = (foodCost || 0) * foodAdj;
  const adjustedStaff = (staffCost || 0) * staffAdj;
  const otherExp = baseExpenses - (foodCost || 0) - (staffCost || 0) - (rentCost || 0);
  const adjustedRent  = (rentCost || 0) + rentAdj;

  const adjustedExpenses = adjustedFood + adjustedStaff + otherExp + adjustedRent;

  return {
    revMultiplier,
    expMultiplier: baseExpenses > 0 ? adjustedExpenses / baseExpenses : 1,
  };
}