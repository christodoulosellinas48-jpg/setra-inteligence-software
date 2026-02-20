import React, { useState, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, LineChart, RefreshCw, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { motion } from 'framer-motion';

import ScenarioSelector from '@/components/forecast/ScenarioSelector';
import { calculateFinancials, BENCHMARKS } from '@/components/dashboard/financialCalculations';
import { BusinessProvider, useBusiness } from '@/components/business/BusinessContext';

// Lazy load chart components
const ProjectionChart = lazy(() => import('@/components/forecast/ProjectionChart'));
const ForecastInsights = lazy(() => import('@/components/forecast/ForecastInsights'));

function ForecastingContent() {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState('baseline');

  const { currentBusiness, loading: businessLoading } = useBusiness();

  const { data: snapshots = [] } = useQuery({
    queryKey: ['financialSnapshots', currentBusiness?.id],
    queryFn: () => base44.entities.FinancialSnapshot.filter({ business_id: currentBusiness.id }, '-period_start', 20),
    enabled: !!currentBusiness,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  const financials = useMemo(() => {
    if (!currentBusiness) return null;
    return calculateFinancials(currentBusiness, currentBusiness.business_type);
  }, [currentBusiness]);

  const projections = useMemo(() => {
    if (!currentBusiness) return [];
    
    // Calculate growth rates from historical data or use defaults
    let revenueGrowthRate = 0;
    let expenseGrowthRate = 0;
    
    if (snapshots.length >= 2) {
      const sorted = [...snapshots].sort((a, b) => new Date(a.period_start) - new Date(b.period_start));
      const recent = sorted.slice(-3);
      
      if (recent.length >= 2) {
        const firstRev = recent[0].monthly_revenue || currentBusiness.monthly_revenue;
        const lastRev = recent[recent.length - 1].monthly_revenue || currentBusiness.monthly_revenue;
        revenueGrowthRate = firstRev > 0 ? (lastRev - firstRev) / firstRev / recent.length : 0;
        
        const firstExp = (recent[0].purchases_food_bev || 0) + (recent[0].staff_costs || 0) + 
                        (recent[0].rent_fixed_costs || 0) + (recent[0].utilities || 0) + (recent[0].other_operating || 0);
        const lastExp = (recent[recent.length - 1].purchases_food_bev || 0) + (recent[recent.length - 1].staff_costs || 0) + 
                       (recent[recent.length - 1].rent_fixed_costs || 0) + (recent[recent.length - 1].utilities || 0) + 
                       (recent[recent.length - 1].other_operating || 0);
        expenseGrowthRate = firstExp > 0 ? (lastExp - firstExp) / firstExp / recent.length : 0;
      }
    }
    
    // Adjust based on scenario
    const scenarioMultipliers = {
      optimistic: { revenue: 1.10, expense: 0.95 },
      baseline: { revenue: 1.0, expense: 1.0 },
      conservative: { revenue: 0.90, expense: 1.05 }
    };
    
    const multiplier = scenarioMultipliers[scenario];
    
    const baseRevenue = currentBusiness.monthly_revenue || 0;
    const baseExpenses = (currentBusiness.purchases_food_bev || 0) + (currentBusiness.staff_costs || 0) + 
                        (currentBusiness.rent_fixed_costs || 0) + (currentBusiness.utilities || 0) + (currentBusiness.other_operating || 0);
    
    const projectionData = [];
    const now = new Date();
    
    for (let i = 0; i <= 6; i++) {
      const monthDate = addMonths(now, i);
      const growthFactor = 1 + (revenueGrowthRate * i);
      const expenseGrowthFactor = 1 + (expenseGrowthRate * i);
      
      const revenue = Math.round(baseRevenue * growthFactor * multiplier.revenue);
      const expenses = Math.round(baseExpenses * expenseGrowthFactor * multiplier.expense);
      const profit = revenue - expenses;
      
      projectionData.push({
        period: format(monthDate, 'MMM yyyy'),
        month: i,
        revenue,
        expenses,
        profit,
        margin: revenue > 0 ? (profit / revenue) * 100 : 0,
        isProjection: i > 0
      });
    }
    
    return projectionData;
  }, [currentBusiness, snapshots, scenario]);

  const summaryMetrics = useMemo(() => {
    if (projections.length < 2) return null;
    
    const current = projections[0];
    const sixMonth = projections[projections.length - 1];
    
    return {
      revenueChange: current.revenue > 0 ? ((sixMonth.revenue - current.revenue) / current.revenue) * 100 : 0,
      profitChange: current.profit !== 0 ? ((sixMonth.profit - current.profit) / Math.abs(current.profit)) * 100 : 0,
      avgMargin: projections.reduce((sum, p) => sum + p.margin, 0) / projections.length,
      projectedRevenue: sixMonth.revenue,
      projectedProfit: sixMonth.profit
    };
  }, [projections]);

  if (businessLoading || !currentBusiness) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const businessDisplayName = BENCHMARKS[currentBusiness.business_type]?.displayName || 'Business';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800/50 backdrop-blur-sm sticky top-0 z-40 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate(createPageUrl('Dashboard'))}
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  <LineChart className="w-6 h-6 text-rose-400" />
                  Financial Forecasting
                </h1>
                <p className="text-slate-500 text-sm">{currentBusiness.name} • {businessDisplayName}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Scenario Selection */}
        <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">Projection Scenario</h3>
          <ScenarioSelector selected={scenario} onChange={setScenario} />
        </Card>

        {/* Summary Metrics */}
        {summaryMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">6-Month Revenue</span>
              </div>
              <p className="text-2xl font-bold text-white">€{summaryMetrics.projectedRevenue.toLocaleString()}</p>
              <p className={`text-sm mt-1 ${summaryMetrics.revenueChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {summaryMetrics.revenueChange >= 0 ? '+' : ''}{summaryMetrics.revenueChange.toFixed(1)}% vs current
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Projected Profit</span>
              </div>
              <p className={`text-2xl font-bold ${summaryMetrics.projectedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                €{summaryMetrics.projectedProfit.toLocaleString()}
              </p>
              <p className={`text-sm mt-1 ${summaryMetrics.profitChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {summaryMetrics.profitChange >= 0 ? '+' : ''}{summaryMetrics.profitChange.toFixed(1)}% change
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Avg Profit Margin</span>
              </div>
              <p className="text-2xl font-bold text-white">{summaryMetrics.avgMargin.toFixed(1)}%</p>
              <p className="text-sm mt-1 text-slate-500">Over projection period</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <LineChart className="w-4 h-4" />
                <span className="text-sm">Data Points</span>
              </div>
              <p className="text-2xl font-bold text-white">{snapshots.length}</p>
              <p className="text-sm mt-1 text-slate-500">Historical snapshots</p>
            </motion.div>
          </div>
        )}

        {/* Charts and Insights */}
        <Suspense fallback={
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl h-96 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
            </Card>
            <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl h-96 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
            </Card>
          </div>
        }>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProjectionChart projections={projections} scenario={scenario} />
            <ForecastInsights 
              projections={projections} 
              currentFinancials={financials} 
              historicalSnapshots={snapshots}
            />
          </div>
        </Suspense>

        {/* Projection Table */}
        <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">Monthly Projection Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Period</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Revenue</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Expenses</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Net Profit</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Margin</th>
                </tr>
              </thead>
              <tbody>
                {projections.map((p, idx) => (
                  <tr key={idx} className={`border-b border-slate-800 ${p.isProjection ? 'opacity-80' : ''}`}>
                    <td className="py-3 px-4 text-white">
                      {p.period}
                      {!p.isProjection && <span className="ml-2 text-xs text-emerald-400">(Current)</span>}
                    </td>
                    <td className="py-3 px-4 text-right text-rose-400">€{p.revenue.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-rose-400">€{p.expenses.toLocaleString()}</td>
                    <td className={`py-3 px-4 text-right ${p.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      €{p.profit.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300">{p.margin.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            * Projections are trend-based estimates and should be used for planning purposes only.
          </p>
        </Card>
      </main>
    </div>
  );
}

export default function Forecasting() {
  return (
    <BusinessProvider>
      <ForecastingContent />
    </BusinessProvider>
  );
}