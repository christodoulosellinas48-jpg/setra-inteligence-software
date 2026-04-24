import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, Legend
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

// ── Config ────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'purchases_food_bev',  label: 'Food & Bev',   budgetKey: 'food_beverage_budget',  color: '#10b981' },
  { key: 'staff_costs',         label: 'Staff',         budgetKey: 'staff_costs_budget',    color: '#8b5cf6' },
  { key: 'rent_fixed_costs',    label: 'Fixed Costs',   budgetKey: 'fixed_costs_budget',    color: '#3b82f6' },
  { key: 'utilities',           label: 'Utilities',     budgetKey: 'utilities_budget',      color: '#06b6d4' },
  { key: 'other_operating',     label: 'Other',         budgetKey: 'other_budget',          color: '#f59e0b' },
];

const TOTAL_EXPENSE_KEYS = CATEGORIES.map(c => c.key);

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtEur = (v) => `€${(v || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
const fmtK   = (v) => v >= 1000 ? `€${(v / 1000).toFixed(1)}k` : `€${Math.round(v)}`;

function pctChange(curr, prev) {
  if (!prev) return null;
  return ((curr - prev) / prev) * 100;
}

function TrendBadge({ pct, inverse = false }) {
  if (pct === null) return <span className="text-xs text-slate-500">—</span>;
  const isGood = inverse ? pct <= 0 : pct >= 0;
  const Icon = pct > 0 ? TrendingUp : pct < 0 ? TrendingDown : Minus;
  const color = isGood ? 'text-emerald-400' : 'text-rose-400';
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold ${color}`}>
      <Icon className="w-3 h-3" />
      {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
    </span>
  );
}

// ── Custom Tooltips ───────────────────────────────────────────────────────────
function MoMTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-3 text-xs shadow-xl min-w-[160px]">
      <p className="text-slate-300 font-semibold mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5" style={{ color: p.color }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="text-white font-medium">{fmtEur(p.value)}</span>
        </div>
      ))}
      <div className="border-t border-white/10 mt-2 pt-2 flex justify-between">
        <span className="text-slate-400">Total</span>
        <span className="text-white font-bold">{fmtEur(total)}</span>
      </div>
    </div>
  );
}

function DeviationTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-3 text-xs shadow-xl min-w-[180px]">
      <p className="text-slate-300 font-semibold mb-2">{label}</p>
      <div className="flex justify-between gap-4 py-0.5">
        <span className="text-slate-400">Actual</span>
        <span className="text-white">{fmtEur(d?.actual)}</span>
      </div>
      <div className="flex justify-between gap-4 py-0.5">
        <span className="text-slate-400">Budget</span>
        <span className="text-white">{fmtEur(d?.budget)}</span>
      </div>
      <div className="flex justify-between gap-4 pt-2 border-t border-white/10 mt-1">
        <span className="text-slate-400">Deviation</span>
        <span className={d?.deviation >= 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
          {d?.deviation >= 0 ? '+' : ''}{(d?.deviation || 0).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SpendingAnalyticsDashboard({ snapshots = [], budget = null, business }) {
  const currency = business?.currency || 'EUR';
  const sym = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr', AUD: '$', CAD: '$' }[currency] || '€';

  // 1. Month-over-month spending by category (from snapshots, most recent 12)
  const momData = useMemo(() => {
    const sorted = [...snapshots]
      .sort((a, b) => new Date(a.period_start) - new Date(b.period_start))
      .slice(-12);

    return sorted.map(s => {
      const entry = { period: format(parseISO(s.period_start), 'MMM yy') };
      CATEGORIES.forEach(c => { entry[c.key] = s[c.key] || 0; });
      entry.total = TOTAL_EXPENSE_KEYS.reduce((sum, k) => sum + (s[k] || 0), 0);
      return entry;
    });
  }, [snapshots]);

  // 2. Budget deviation per category (current business vs budget)
  const deviationData = useMemo(() => {
    return CATEGORIES.map(cat => {
      const actual = business?.[cat.key] || 0;
      const bgt    = budget?.[cat.budgetKey] || 0;
      const deviation = bgt > 0 ? ((actual - bgt) / bgt) * 100 : 0;
      return { name: cat.label, actual, budget: bgt, deviation, color: cat.color };
    }).filter(d => d.actual > 0 || d.budget > 0);
  }, [business, budget]);

  // 3. Category MoM change cards (last 2 snapshots)
  const categoryChanges = useMemo(() => {
    if (momData.length < 2) return [];
    const curr = momData[momData.length - 1];
    const prev = momData[momData.length - 2];
    return CATEGORIES.map(cat => ({
      ...cat,
      current: curr?.[cat.key] || 0,
      previous: prev?.[cat.key] || 0,
      pct: pctChange(curr?.[cat.key] || 0, prev?.[cat.key] || 0)
    })).filter(c => c.current > 0 || c.previous > 0);
  }, [momData]);

  // 4. Total spend MoM
  const totalMoM = useMemo(() => {
    if (momData.length < 2) return null;
    return pctChange(momData[momData.length - 1]?.total, momData[momData.length - 2]?.total);
  }, [momData]);

  // Alerts: categories > 10% over budget
  const alerts = deviationData.filter(d => d.deviation > 10);

  const hasMoMData  = momData.length >= 2;
  const hasDevData  = deviationData.some(d => d.budget > 0);

  return (
    <div className="space-y-6">

      {/* ── Alert bar ────────────────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/25 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-rose-300 text-sm font-semibold">Budget deviation detected</p>
            <p className="text-rose-400/80 text-xs mt-0.5">
              {alerts.map(a => `${a.name} (+${a.deviation.toFixed(1)}%)`).join(' · ')} over budget this month.
            </p>
          </div>
        </div>
      )}

      {/* ── Summary stat row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {categoryChanges.slice(0, 4).map(cat => (
          <Card key={cat.key} className="bg-[#0F0F1E]/80 border-white/[0.06] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-medium">{cat.label}</span>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
            </div>
            <p className="text-lg font-bold text-white">{sym}{(cat.current / 1000).toFixed(1)}k</p>
            <TrendBadge pct={cat.pct} inverse={true} />
          </Card>
        ))}
      </div>

      {/* ── Chart 1: MoM Stacked Spending Trend ──────────────────────────────── */}
      <Card className="bg-[#0F0F1E]/80 border-white/[0.06] p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-white">Month-over-Month Spending</h3>
            <p className="text-xs text-slate-500 mt-0.5">Stacked by expense category · last 12 months</p>
          </div>
          {hasMoMData && totalMoM !== null && (
            <div className="text-right">
              <TrendBadge pct={totalMoM} inverse={true} />
              <p className="text-[10px] text-slate-600 mt-0.5">vs prev month</p>
            </div>
          )}
        </div>

        {!hasMoMData ? (
          <div className="h-64 flex items-center justify-center text-slate-500 text-sm border border-dashed border-white/[0.06] rounded-xl">
            Save 2+ financial snapshots to see trends over time.
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={momData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                <defs>
                  {CATEGORIES.map(c => (
                    <linearGradient key={c.key} id={`grad_${c.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={c.color} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={c.color} stopOpacity={0.03} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="period" stroke="#334155" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis stroke="#334155" tickFormatter={fmtK} tick={{ fill: '#64748b', fontSize: 11 }} width={52} />
                <Tooltip content={<MoMTooltip />} />
                {CATEGORIES.map(c => (
                  <Area
                    key={c.key}
                    type="monotone"
                    dataKey={c.key}
                    name={c.label}
                    stroke={c.color}
                    strokeWidth={1.5}
                    fill={`url(#grad_${c.key})`}
                    stackId="1"
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4">
          {CATEGORIES.map(c => (
            <div key={c.key} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: c.color }} />
              <span className="text-xs text-slate-400">{c.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Chart 2: Budget Deviation ─────────────────────────────────────────── */}
      <Card className="bg-[#0F0F1E]/80 border-white/[0.06] p-6 rounded-2xl">
        <div className="mb-5">
          <h3 className="text-base font-semibold text-white">Budget Deviation by Category</h3>
          <p className="text-xs text-slate-500 mt-0.5">Current month actuals vs. set budget · positive = over budget</p>
        </div>

        {!hasDevData ? (
          <div className="h-52 flex items-center justify-center text-slate-500 text-sm border border-dashed border-white/[0.06] rounded-xl">
            Set a budget in the Budgeting section to see deviations.
          </div>
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviationData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="name" stroke="#334155" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis
                  stroke="#334155"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={v => `${v > 0 ? '+' : ''}${v.toFixed(0)}%`}
                  width={44}
                />
                <Tooltip content={<DeviationTooltip />} />
                <ReferenceLine y={0} stroke="#ffffff20" strokeWidth={1} />
                <Bar dataKey="deviation" radius={[4, 4, 4, 4]} maxBarSize={48}>
                  {deviationData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.deviation > 10 ? '#f43f5e'
                          : entry.deviation > 0  ? '#fb923c'
                          : '#10b981'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Deviation summary pills */}
        {hasDevData && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
            {deviationData.map(d => (
              <div key={d.name} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-slate-500 mb-1">{d.name}</p>
                <p className={`text-sm font-bold ${d.deviation > 10 ? 'text-rose-400' : d.deviation > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {d.deviation > 0 ? '+' : ''}{d.deviation.toFixed(1)}%
                </p>
                {d.deviation > 10 && (
                  <Badge className="text-[9px] mt-1 bg-rose-500/10 text-rose-400 border-rose-500/20 px-1 py-0">over</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Chart 3: Category-Specific MoM Line Chart ────────────────────────── */}
      <Card className="bg-[#0F0F1E]/80 border-white/[0.06] p-6 rounded-2xl">
        <div className="mb-5">
          <h3 className="text-base font-semibold text-white">Category Spend Over Time</h3>
          <p className="text-xs text-slate-500 mt-0.5">Individual category trends · identifies persistent increases</p>
        </div>

        {!hasMoMData ? (
          <div className="h-64 flex items-center justify-center text-slate-500 text-sm border border-dashed border-white/[0.06] rounded-xl">
            Save 2+ financial snapshots to see category trends.
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={momData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="period" stroke="#334155" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis stroke="#334155" tickFormatter={fmtK} tick={{ fill: '#64748b', fontSize: 11 }} width={52} />
                <Tooltip content={<MoMTooltip />} />
                {CATEGORIES.map(c => (
                  <Line
                    key={c.key}
                    type="monotone"
                    dataKey={c.key}
                    name={c.label}
                    stroke={c.color}
                    strokeWidth={2}
                    dot={{ r: 3, fill: c.color, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

    </div>
  );
}