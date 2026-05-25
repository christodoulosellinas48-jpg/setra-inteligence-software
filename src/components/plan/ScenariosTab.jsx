import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBusiness } from '@/components/business/BusinessContext';
import { Card } from '@/components/ui/card';
import ScenarioDrivers, { DEFAULT_DRIVERS, applyDriversToProjection } from '@/components/forecast/ScenarioDrivers';
import { RefreshCw, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { motion } from 'framer-motion';

const HORIZON = 6;

export default function ScenariosTab() {
  const { currentBusiness, loading: businessLoading } = useBusiness();
  const [scenario, setScenario] = useState('baseline');
  const [drivers, setDrivers] = useState(DEFAULT_DRIVERS);

  const { data: snapshots = [] } = useQuery({
    queryKey: ['financialSnapshots', currentBusiness?.id],
    queryFn: () => base44.entities.FinancialSnapshot.filter({ business_id: currentBusiness.id }, '-period_start', 24),
    enabled: !!currentBusiness,
    staleTime: 5 * 60 * 1000,
  });

  const currency = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr', AUD: '$', CAD: '$' }[currentBusiness?.currency] || '€';

  const projections = useMemo(() => {
    if (!currentBusiness) return [];

    const baseRevenue  = currentBusiness.monthly_revenue || 0;
    const foodCost     = currentBusiness.purchases_food_bev || 0;
    const staffCost    = currentBusiness.staff_costs || 0;
    const rentCost     = currentBusiness.rent_fixed_costs || 0;
    const baseExpenses = foodCost + staffCost + rentCost + (currentBusiness.utilities || 0) + (currentBusiness.other_operating || 0);

    const { revMultiplier, expMultiplier } = applyDriversToProjection({
      baseRevenue, baseExpenses, foodCost, staffCost, rentCost, drivers, scenarioKey: scenario,
    });

    return Array.from({ length: HORIZON + 1 }, (_, i) => {
      const revenue  = Math.round(baseRevenue * revMultiplier * (1 + i * 0.005));
      const expenses = Math.round(baseExpenses * expMultiplier);
      const profit   = revenue - expenses;
      return {
        period: format(addMonths(new Date(), i), 'MMM yyyy'),
        month: i,
        revenue, expenses, profit,
        margin: revenue > 0 ? (profit / revenue) * 100 : 0,
        isProjection: i > 0,
      };
    });
  }, [currentBusiness, scenario, drivers]);

  const summary = useMemo(() => {
    if (projections.length < 2) return null;
    const cur  = projections[0];
    const last = projections[projections.length - 1];
    return {
      revenueChange:    cur.revenue > 0 ? ((last.revenue - cur.revenue) / cur.revenue) * 100 : null,
      profitChange:     cur.profit !== 0 ? ((last.profit - cur.profit) / Math.abs(cur.profit)) * 100 : null,
      avgMargin:        projections.reduce((s, p) => s + p.margin, 0) / projections.length,
      projectedRevenue: last.revenue,
      projectedProfit:  last.profit,
    };
  }, [projections]);

  if (businessLoading || !currentBusiness) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#7B3BFF] animate-spin" />
      </div>
    );
  }

  const kpis = summary ? [
    { label: `${HORIZON}-Month Revenue`, value: `${currency}${summary.projectedRevenue.toLocaleString()}`, change: summary.revenueChange, icon: TrendingUp },
    { label: 'Projected Profit', value: `${currency}${summary.projectedProfit.toLocaleString()}`, change: summary.profitChange, icon: DollarSign, colored: true, val: summary.projectedProfit },
    { label: 'Avg Profit Margin', value: `${summary.avgMargin.toFixed(1)}%`, icon: BarChart3 },
  ] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white">Scenarios</h2>
        <p className="text-slate-500 text-sm mt-1">
          Adjust drivers below to model best-case, worst-case, and custom scenarios against your current baseline.
        </p>
      </div>

      {/* Scenario Drivers */}
      <ScenarioDrivers
        scenario={scenario}
        setScenario={setScenario}
        drivers={drivers}
        setDrivers={setDrivers}
      />

      {/* KPI Summary */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-[#151528]/80 border border-white/5 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-slate-500 mb-2 text-sm">
                  <Icon className="w-4 h-4" />{kpi.label}
                </div>
                <p className={`text-2xl font-bold ${kpi.colored ? (kpi.val >= 0 ? 'text-emerald-400' : 'text-rose-400') : 'text-white'}`}>
                  {kpi.value}
                </p>
                {kpi.change != null && (
                  <p className={`text-sm mt-1 ${kpi.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {kpi.change >= 0 ? '+' : ''}{kpi.change.toFixed(1)}% vs current
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Scenario Projection Table */}
      <Card className="bg-[#151528]/80 border-white/5 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="text-base font-semibold text-white">Scenario Projection Breakdown</h3>
          <p className="text-xs text-slate-500 mt-1">Based on your current business data and selected scenario drivers</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-[#0B0B12]/40">
                {['Period', 'Revenue', 'Expenses', 'Net Profit', 'Margin'].map(h => (
                  <th key={h} className={`py-3 px-4 text-xs text-slate-500 font-medium ${h === 'Period' ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projections.map((p, idx) => (
                <tr key={idx} className={`border-b border-white/5 ${!p.isProjection ? 'bg-[#7B3BFF]/5' : 'hover:bg-white/[0.02]'}`}>
                  <td className="py-3 px-4 text-white font-medium">
                    {p.period}{!p.isProjection && <span className="ml-2 text-xs text-[#C084FC]">(current)</span>}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-mono">{currency}{p.revenue.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-rose-400 font-mono">{currency}{p.expenses.toLocaleString()}</td>
                  <td className={`py-3 px-4 text-right font-mono font-semibold ${p.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {currency}{p.profit.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300">{p.margin.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-600 px-5 py-3 border-t border-white/5">
          Scenario projections are illustrative estimates. Adjust the drivers above to model different outcomes.
        </p>
      </Card>
    </div>
  );
}