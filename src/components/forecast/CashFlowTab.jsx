import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { addMonths, format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

const TOOLTIP_STYLE = { backgroundColor: '#151528', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff' };

export default function CashFlowTab({ business, snapshots, vatPeriods, scenario }) {
  const cashFlowData = useMemo(() => {
    if (!business) return [];

    const scenarioMultipliers = {
      optimistic: { revenue: 1.08, expense: 0.97 },
      baseline:   { revenue: 1.0,  expense: 1.0  },
      conservative: { revenue: 0.92, expense: 1.04 },
    };
    const mult = scenarioMultipliers[scenario] || scenarioMultipliers.baseline;

    // Estimate growth from snapshots
    let revGrowth = 0;
    if (snapshots.length >= 2) {
      const sorted = [...snapshots].sort((a, b) => new Date(a.period_start) - new Date(b.period_start));
      const last = sorted.slice(-3);
      const first = last[0]?.monthly_revenue || business.monthly_revenue || 0;
      const lastR = last[last.length - 1]?.monthly_revenue || business.monthly_revenue || 0;
      revGrowth = first > 0 ? (lastR - first) / first / last.length : 0;
    }

    const baseRev = business.monthly_revenue || 0;
    const baseExp = (business.purchases_food_bev || 0) + (business.staff_costs || 0) +
      (business.rent_fixed_costs || 0) + (business.utilities || 0) + (business.other_operating || 0);
    const vatRate = (business.vat_rate || 19) / 100;

    // Compute quarterly VAT cash outflows from open periods
    const vatByMonth = {};
    vatPeriods.forEach(p => {
      if (p.net_vat_payable > 0 && p.filing_deadline) {
        const m = format(new Date(p.filing_deadline), 'MMM yyyy');
        vatByMonth[m] = (vatByMonth[m] || 0) + p.net_vat_payable;
      }
    });

    let runningCash = baseRev * 2; // assume 2-months cash reserve as opening
    const now = new Date();
    const months = [];

    for (let i = 0; i <= 11; i++) {
      const date = addMonths(now, i);
      const label = format(date, 'MMM yyyy');
      const gf = 1 + revGrowth * i;

      const revenue = Math.round(baseRev * gf * mult.revenue);
      const expenses = Math.round(baseExp * gf * mult.expense);
      const vatOutflow = vatByMonth[label] || 0;
      const netCashflow = revenue - expenses - vatOutflow;
      runningCash += netCashflow;

      months.push({
        period: label,
        revenue,
        expenses,
        vatOutflow,
        netCashflow,
        runningCash: Math.round(runningCash),
        isProjection: i > 0,
      });
    }

    return months;
  }, [business, snapshots, vatPeriods, scenario]);

  const minCash = Math.min(...cashFlowData.map(d => d.runningCash));
  const cashAtRisk = minCash < 0;
  const lowestMonth = cashFlowData.find(d => d.runningCash === minCash);

  const fmt = (v) => `€${Math.abs(v).toLocaleString()}${v < 0 ? ' (deficit)' : ''}`;

  return (
    <div className="space-y-6">
      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Opening Cash (Est.)', value: cashFlowData[0]?.runningCash, icon: Wallet, color: 'text-white' },
          { label: 'Projected 6-Month Cash', value: cashFlowData[5]?.runningCash, icon: TrendingUp, color: (cashFlowData[5]?.runningCash ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400' },
          { label: 'Projected 12-Month Cash', value: cashFlowData[11]?.runningCash, icon: TrendingDown, color: (cashFlowData[11]?.runningCash ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-[#151528]/80 border-white/5 p-5">
            <div className="flex items-center gap-2 text-slate-500 mb-2 text-sm"><Icon className="w-4 h-4" />{label}</div>
            <p className={`text-2xl font-bold ${color}`}>{value != null ? fmt(value) : '—'}</p>
          </Card>
        ))}
      </div>

      {cashAtRisk && lowestMonth && (
        <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl">
          <TrendingDown className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <p className="text-rose-300 text-sm">
            <strong>Cash deficit risk:</strong> Projected running cash turns negative in {lowestMonth.period} (€{Math.abs(lowestMonth.runningCash).toLocaleString()} deficit). Consider a credit facility or cutting non-essential costs.
          </p>
        </div>
      )}

      {/* Running Cash Chart */}
      <Card className="bg-[#151528]/80 border-white/5 p-6 rounded-2xl">
        <h3 className="text-base font-semibold text-white mb-5">12-Month Running Cash Position</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={cashFlowData}>
            <defs>
              <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7B3BFF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7B3BFF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={TOOLTIP_STYLE}
              formatter={(v) => [`€${v.toLocaleString()}`, 'Running Cash']} />
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" opacity={0.5} />
            <Area type="monotone" dataKey="runningCash" stroke="#7B3BFF" strokeWidth={2}
              fill="url(#cashGrad)" dot={false} activeDot={{ r: 4, fill: '#C084FC' }} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Monthly Cashflow Table */}
      <Card className="bg-[#151528]/80 border-white/5 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="text-base font-semibold text-white">Monthly Cash Flow Detail</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-[#0B0B12]/40">
                {['Period', 'Revenue', 'Expenses', 'VAT Outflow', 'Net Cash', 'Running Balance'].map(h => (
                  <th key={h} className={`py-3 px-4 text-xs text-slate-500 font-medium ${h === 'Period' ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cashFlowData.map((row, i) => (
                <tr key={i} className={`border-b border-white/5 ${row.isProjection ? 'opacity-80' : 'bg-[#7B3BFF]/5'}`}>
                  <td className="py-3 px-4 text-white font-medium">
                    {row.period}{!row.isProjection && <span className="ml-2 text-xs text-[#C084FC]">(now)</span>}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-mono">€{row.revenue.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-rose-400 font-mono">€{row.expenses.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-amber-400 font-mono">
                    {row.vatOutflow > 0 ? `€${row.vatOutflow.toLocaleString()}` : '—'}
                  </td>
                  <td className={`py-3 px-4 text-right font-mono font-semibold ${row.netCashflow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {row.netCashflow >= 0 ? '+' : ''}€{row.netCashflow.toLocaleString()}
                  </td>
                  <td className={`py-3 px-4 text-right font-mono font-bold ${row.runningCash >= 0 ? 'text-white' : 'text-rose-400'}`}>
                    €{row.runningCash.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}