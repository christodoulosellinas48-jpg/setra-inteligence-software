import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Sparkles, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, addMonths, format } from 'date-fns';
import { BENCHMARKS } from '@/components/dashboard/financialCalculations';

// Industry benchmarks for coaching (as % of revenue)
const INDUSTRY_BENCHMARKS = {
  bar:              { food: [20, 30], staff: [25, 35], fixed: [8, 15], utilities: [3, 6], operating: [5, 10] },
  canteen:          { food: [30, 38], staff: [25, 35], fixed: [5, 10], utilities: [3, 7], operating: [5, 10] },
  coffee_shop:      { food: [22, 28], staff: [25, 30], fixed: [8, 12], utilities: [3, 6], operating: [5, 10] },
  catering_events:  { food: [28, 38], staff: [30, 40], fixed: [3, 8],  utilities: [2, 5], operating: [5, 10] },
  confectionery:    { food: [25, 35], staff: [20, 28], fixed: [8, 15], utilities: [3, 6], operating: [5, 10] },
  deli_cava:        { food: [28, 38], staff: [20, 28], fixed: [8, 14], utilities: [3, 6], operating: [5, 10] },
  food_to_go:       { food: [25, 35], staff: [22, 30], fixed: [6, 12], utilities: [3, 6], operating: [5, 10] },
  hotels:           { food: [25, 35], staff: [30, 40], fixed: [10, 20], utilities: [4, 8], operating: [5, 12] },
  restaurant:       { food: [28, 35], staff: [25, 32], fixed: [8, 14], utilities: [3, 6], operating: [5, 10] },
};

const CATEGORIES = [
  { key: 'food_beverage_budget',      label: 'Food & Beverage',    benchmarkKey: 'food' },
  { key: 'staff_costs_budget',        label: 'Staff Costs',        benchmarkKey: 'staff' },
  { key: 'fixed_costs_budget',        label: 'Rent / Fixed Costs', benchmarkKey: 'fixed' },
  { key: 'utilities_budget',          label: 'Utilities',          benchmarkKey: 'utilities' },
  { key: 'operating_expenses_budget', label: 'Operating Expenses', benchmarkKey: 'operating' },
];

function BenchmarkCoach({ value, revenueTarget, benchmarkRange, label, industryName }) {
  if (!revenueTarget || revenueTarget <= 0 || !value || value <= 0 || !benchmarkRange) return null;
  const pct = (value / revenueTarget) * 100;
  const [low, high] = benchmarkRange;

  if (pct < low - 2) return (
    <p className="text-xs text-blue-400 mt-1.5 flex items-center gap-1">
      <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
      {pct.toFixed(1)}% of revenue — below typical range ({low}–{high}%) for {industryName}. May be fine, or check if underfunded.
    </p>
  );
  if (pct <= high + 2) return (
    <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1">
      <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
      {pct.toFixed(1)}% of revenue — within healthy range for {industryName} ({low}–{high}%).
    </p>
  );
  return (
    <p className="text-xs text-amber-400 mt-1.5 flex items-center gap-1">
      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
      {pct.toFixed(1)}% — above typical for {industryName} ({low}–{high}%). May signal waste, over-staffing, or pricing issues.
    </p>
  );
}

function BudgetHealthSummary({ budget, industryGroup }) {
  const bm = INDUSTRY_BENCHMARKS[industryGroup];
  const industryName = BENCHMARKS[industryGroup]?.displayName || 'your business type';
  if (!bm || !budget.revenue_target || budget.revenue_target <= 0) return null;

  const rev = budget.revenue_target;
  const checks = CATEGORIES.map(cat => {
    const val = budget[cat.key] || 0;
    if (!val) return null;
    const range = bm[cat.benchmarkKey];
    if (!range) return null;
    const pct = (val / rev) * 100;
    const [low, high] = range;
    const status = pct < low - 2 ? 'low' : pct <= high + 2 ? 'ok' : 'high';
    return { label: cat.label.split(' ')[0], pct, status };
  }).filter(Boolean);

  const totalCosts = CATEGORIES.reduce((s, c) => s + (budget[c.key] || 0), 0);
  const netMarginPct = rev > 0 ? ((rev - totalCosts) / rev) * 100 : null;
  const hasWarnings = checks.some(c => c.status === 'high');

  return (
    <div className={`rounded-xl border px-4 py-3 mb-5 ${hasWarnings ? 'bg-amber-500/5 border-amber-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="font-semibold text-slate-300 mr-1">Budget health check</span>
        {checks.map(c => (
          <span key={c.label} className={`flex items-center gap-0.5 ${c.status === 'ok' ? 'text-emerald-400' : c.status === 'high' ? 'text-amber-400' : 'text-blue-400'}`}>
            {c.status === 'ok' ? '✓' : '⚠'} {c.label} {c.pct.toFixed(0)}%{c.status === 'high' ? ' (high)' : c.status === 'low' ? ' (low)' : ''}
            <span className="text-slate-600 mx-1">·</span>
          </span>
        ))}
        {netMarginPct !== null && (
          <span className={`font-medium ${netMarginPct >= 7 ? 'text-emerald-400' : netMarginPct >= 3 ? 'text-amber-400' : 'text-rose-400'}`}>
            Net margin: {netMarginPct.toFixed(1)}% {netMarginPct < 7 ? '(target: 7%+)' : '✓'}
          </span>
        )}
      </div>
    </div>
  );
}

export default function BudgetForm({ budget, onChange, onSave, onAutoFill, historicalData, saving, autoFilling, industryGroup }) {
  const industryName = BENCHMARKS[industryGroup]?.displayName || 'your business type';
  const bm = INDUSTRY_BENCHMARKS[industryGroup];

  const handlePeriodChange = (periodType) => {
    const now = new Date();
    let start, end;
    if (periodType === 'monthly') {
      start = startOfMonth(addMonths(now, 1));
      end = endOfMonth(addMonths(now, 1));
    } else {
      start = startOfQuarter(addMonths(now, 3));
      end = endOfQuarter(addMonths(now, 3));
    }
    onChange({ ...budget, period_type: periodType, period_start: format(start, 'yyyy-MM-dd'), period_end: format(end, 'yyyy-MM-dd') });
  };

  const handleBuildFromForecast = () => {
    if (!historicalData) return;
    // Use current business figures with industry-benchmark cost allocation
    const rev = historicalData.monthly_revenue || 0;
    if (!rev || !bm) {
      onAutoFill();
      return;
    }
    const suggested = {
      revenue_target: Math.round(rev * 1.05), // 5% growth target
      food_beverage_budget: Math.round(rev * ((bm.food[0] + bm.food[1]) / 2) / 100),
      staff_costs_budget: Math.round(rev * ((bm.staff[0] + bm.staff[1]) / 2) / 100),
      fixed_costs_budget: historicalData.rent_fixed_costs || Math.round(rev * ((bm.fixed[0] + bm.fixed[1]) / 2) / 100),
      utilities_budget: historicalData.utilities || Math.round(rev * ((bm.utilities[0] + bm.utilities[1]) / 2) / 100),
      operating_expenses_budget: Math.round(rev * ((bm.operating[0] + bm.operating[1]) / 2) / 100),
    };
    onChange({ ...budget, ...suggested });
  };

  return (
    <Card className="bg-[#151528]/80 border-white/5 p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h3 className="text-base font-semibold text-white">Set Budget</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {historicalData && bm && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBuildFromForecast}
              className="border-[#7B3BFF]/40 text-[#C084FC] hover:bg-[#7B3BFF]/10 gap-1.5 text-xs"
              title={`Build from your current figures (€${(historicalData.monthly_revenue||0).toLocaleString()}/mo) and ${industryName} benchmarks`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Build from Forecast
            </Button>
          )}
          {historicalData && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAutoFill}
              disabled={autoFilling}
              className="border-white/10 text-slate-400 hover:text-white gap-1.5 text-xs"
              title="Copy your current monthly figures as-is"
            >
              {autoFilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
              Auto-fill from History
            </Button>
          )}
        </div>
      </div>

      <BudgetHealthSummary budget={budget} industryGroup={industryGroup} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div>
          <Label className="text-slate-400 mb-2 block text-xs uppercase tracking-wider">Budget Period</Label>
          <Select value={budget.period_type || 'monthly'} onValueChange={handlePeriodChange}>
            <SelectTrigger className="bg-[#0B0B12]/60 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-slate-400 mb-2 block text-xs uppercase tracking-wider">Revenue Target</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">€</span>
            <Input
              type="number"
              value={budget.revenue_target || ''}
              onChange={(e) => onChange({ ...budget, revenue_target: parseFloat(e.target.value) || 0 })}
              className="bg-[#0B0B12]/60 border-white/10 text-white pl-8"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {CATEGORIES.map((cat) => {
          const val = budget[cat.key] || 0;
          const rev = budget.revenue_target || 0;
          const range = bm?.[cat.benchmarkKey];
          const pct = rev > 0 && val > 0 ? (val / rev) * 100 : null;
          const isHigh = pct && range && pct > range[1] + 2;
          return (
            <div key={cat.key}>
              <Label className="text-slate-400 mb-2 block text-xs">{cat.label}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">€</span>
                <Input
                  type="number"
                  value={val || ''}
                  onChange={(e) => onChange({ ...budget, [cat.key]: parseFloat(e.target.value) || 0 })}
                  className={`bg-[#0B0B12]/60 border-white/10 text-white pl-8 ${isHigh ? 'border-amber-500/40' : ''}`}
                  placeholder="0"
                />
              </div>
              {rev > 0 && bm && (
                <BenchmarkCoach
                  value={val}
                  revenueTarget={rev}
                  benchmarkRange={range}
                  label={cat.label}
                  industryName={industryName}
                />
              )}
            </div>
          );
        })}
      </div>

      <Button
        onClick={onSave}
        disabled={saving}
        className="w-full"
      >
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Save Budget
      </Button>
    </Card>
  );
}