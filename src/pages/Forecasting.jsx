import React, { useState, useMemo, lazy, Suspense } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RefreshCw, LineChart, TrendingUp, DollarSign, BarChart3, Wallet, Sparkles } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { motion } from 'framer-motion';

import ScenarioSelector from '@/components/forecast/ScenarioSelector';
import AIForecastInsights from '@/components/forecast/AIForecastInsights';
import CashFlowTab from '@/components/forecast/CashFlowTab';
import { calculateFinancials, BENCHMARKS } from '@/components/dashboard/financialCalculations';
import { useBusiness } from '@/components/business/BusinessContext';

const ProjectionChart = lazy(() => import('@/components/forecast/ProjectionChart'));

function ForecastingContent() {
  const [scenario, setScenario] = useState('baseline');
  const { currentBusiness, loading: businessLoading } = useBusiness();

  const { data: snapshots = [] } = useQuery({
    queryKey: ['financialSnapshots', currentBusiness?.id],
    queryFn: () => base44.entities.FinancialSnapshot.filter({ business_id: currentBusiness.id }, '-period_start', 24),
    enabled: !!currentBusiness,
    staleTime: 5 * 60 * 1000,
  });

  const { data: vatPeriods = [] } = useQuery({
    queryKey: ['vatPeriods', currentBusiness?.id],
    queryFn: () => base44.entities.VATPeriod.filter({ business_id: currentBusiness.id }, '-period_start', 8),
    enabled: !!currentBusiness,
    staleTime: 5 * 60 * 1000,
  });

  const financials = useMemo(() => {
    if (!currentBusiness) return null;
    return calculateFinancials(currentBusiness, currentBusiness.industry_group);
  }, [currentBusiness]);

  const projections = useMemo(() => {
    if (!currentBusiness) return [];

    let revenueGrowthRate = 0;
    let expenseGrowthRate = 0;

    if (snapshots.length >= 2) {
      const sorted = [...snapshots].sort((a, b) => new Date(a.period_start) - new Date(b.period_start));
      const recent = sorted.slice(-6);
      if (recent.length >= 2) {
        const firstRev = recent[0].monthly_revenue || currentBusiness.monthly_revenue;
        const lastRev = recent[recent.length - 1].monthly_revenue || currentBusiness.monthly_revenue;
        revenueGrowthRate = firstRev > 0 ? (lastRev - firstRev) / firstRev / recent.length : 0;
        const toExp = s => (s.purchases_food_bev || 0) + (s.staff_costs || 0) + (s.rent_fixed_costs || 0) + (s.utilities || 0) + (s.other_operating || 0);
        const firstExp = toExp(recent[0]);
        const lastExp = toExp(recent[recent.length - 1]);
        expenseGrowthRate = firstExp > 0 ? (lastExp - firstExp) / firstExp / recent.length : 0;
      }
    }

    const scenarioMultipliers = {
      optimistic:   { revenue: 1.10, expense: 0.95 },
      baseline:     { revenue: 1.0,  expense: 1.0  },
      conservative: { revenue: 0.90, expense: 1.05 },
    };
    const multiplier = scenarioMultipliers[scenario];

    const baseRevenue = currentBusiness.monthly_revenue || 0;
    const baseExpenses = (currentBusiness.purchases_food_bev || 0) + (currentBusiness.staff_costs || 0) +
      (currentBusiness.rent_fixed_costs || 0) + (currentBusiness.utilities || 0) + (currentBusiness.other_operating || 0);

    return Array.from({ length: 7 }, (_, i) => {
      const revenue = Math.round(baseRevenue * (1 + revenueGrowthRate * i) * multiplier.revenue);
      const expenses = Math.round(baseExpenses * (1 + expenseGrowthRate * i) * multiplier.expense);
      const profit = revenue - expenses;
      return {
        period: format(addMonths(new Date(), i), 'MMM yyyy'),
        month: i,
        revenue, expenses, profit,
        margin: revenue > 0 ? (profit / revenue) * 100 : 0,
        isProjection: i > 0,
      };
    });
  }, [currentBusiness, snapshots, scenario]);

  const summaryMetrics = useMemo(() => {
    if (projections.length < 2) return null;
    const current = projections[0];
    const sixMonth = projections[projections.length - 1];
    return {
      revenueChange: current.revenue > 0 ? ((sixMonth.revenue - current.revenue) / current.revenue) * 100 : 0,
      profitChange:  current.profit !== 0 ? ((sixMonth.profit - current.profit) / Math.abs(current.profit)) * 100 : 0,
      avgMargin:     projections.reduce((s, p) => s + p.margin, 0) / projections.length,
      projectedRevenue: sixMonth.revenue,
      projectedProfit:  sixMonth.profit,
    };
  }, [projections]);

  if (businessLoading || !currentBusiness) {
    return (
      <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#7B3BFF] animate-spin" />
      </div>
    );
  }

  const businessDisplayName = BENCHMARKS[currentBusiness.industry_group]?.displayName || 'Business';
  const currency = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr', AUD: '$', CAD: '$' }[currentBusiness.currency] || '€';

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <LineChart className="w-6 h-6 text-[#C084FC]" />
            Financial Intelligence
          </h1>
          <p className="text-slate-500 text-sm mt-1">{currentBusiness.name} · {businessDisplayName} · {snapshots.length} historical snapshots</p>
        </div>

        {/* Scenario Selector */}
        <Card className="bg-[#151528]/80 border-white/5 p-6 rounded-2xl">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Projection Scenario</h3>
          <ScenarioSelector selected={scenario} onChange={setScenario} />
        </Card>

        {/* Summary KPIs */}
        {summaryMetrics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: '6-Month Revenue', value: `${currency}${summaryMetrics.projectedRevenue.toLocaleString()}`, change: summaryMetrics.revenueChange, icon: TrendingUp },
              { label: 'Projected Profit', value: `${currency}${summaryMetrics.projectedProfit.toLocaleString()}`, change: summaryMetrics.profitChange, icon: DollarSign, colored: true, val: summaryMetrics.projectedProfit },
              { label: 'Avg Profit Margin', value: `${summaryMetrics.avgMargin.toFixed(1)}%`, icon: BarChart3 },
              { label: 'Historical Data', value: `${snapshots.length} snapshots`, sub: `+ ${vatPeriods.length} VAT periods`, icon: Wallet },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="bg-[#151528]/80 border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center gap-2 text-slate-500 mb-2 text-sm"><Icon className="w-4 h-4" />{kpi.label}</div>
                  <p className={`text-2xl font-bold ${kpi.colored ? (kpi.val >= 0 ? 'text-emerald-400' : 'text-rose-400') : 'text-white'}`}>{kpi.value}</p>
                  {kpi.change != null && (
                    <p className={`text-sm mt-1 ${kpi.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {kpi.change >= 0 ? '+' : ''}{kpi.change.toFixed(1)}% vs current
                    </p>
                  )}
                  {kpi.sub && <p className="text-sm mt-1 text-slate-500">{kpi.sub}</p>}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="projections">
          <TabsList className="bg-[#151528]/80 border border-white/5 p-1 rounded-xl mb-6">
            <TabsTrigger value="projections" className="data-[state=active]:bg-[#7B3BFF]/20 data-[state=active]:text-white rounded-lg">
              <TrendingUp className="w-4 h-4 mr-2" />Revenue Forecast
            </TabsTrigger>
            <TabsTrigger value="cashflow" className="data-[state=active]:bg-[#7B3BFF]/20 data-[state=active]:text-white rounded-lg">
              <Wallet className="w-4 h-4 mr-2" />Cash Flow
            </TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:bg-[#7B3BFF]/20 data-[state=active]:text-white rounded-lg">
              <Sparkles className="w-4 h-4 mr-2" />AI Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projections" className="space-y-6">
            <Suspense fallback={<Card className="bg-[#151528]/80 border-white/5 p-6 h-96 flex items-center justify-center"><RefreshCw className="w-8 h-8 text-[#7B3BFF] animate-spin" /></Card>}>
              <ProjectionChart projections={projections} scenario={scenario} />
            </Suspense>

            {/* Projection Table */}
            <Card className="bg-[#151528]/80 border-white/5 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-white/5">
                <h3 className="text-base font-semibold text-white">Monthly Projection Breakdown</h3>
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
                      <tr key={idx} className={`border-b border-white/5 ${!p.isProjection ? 'bg-[#7B3BFF]/5' : ''}`}>
                        <td className="py-3 px-4 text-white font-medium">
                          {p.period}{!p.isProjection && <span className="ml-2 text-xs text-[#C084FC]">(current)</span>}
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-400 font-mono">{currency}{p.revenue.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-rose-400 font-mono">{currency}{p.expenses.toLocaleString()}</td>
                        <td className={`py-3 px-4 text-right font-mono font-semibold ${p.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{currency}{p.profit.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-slate-300">{p.margin.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-600 px-5 py-3 border-t border-white/5">
                Projections are trend-based estimates using {snapshots.length > 0 ? `${snapshots.length} historical data points` : 'current business figures'}. For planning purposes only.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="cashflow">
            <CashFlowTab business={currentBusiness} snapshots={snapshots} vatPeriods={vatPeriods} scenario={scenario} />
          </TabsContent>

          <TabsContent value="ai">
            <AIForecastInsights
              business={currentBusiness}
              snapshots={snapshots}
              vatPeriods={vatPeriods}
              projections={projections}
              scenario={scenario}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function Forecasting() {
  return <ForecastingContent />;
}