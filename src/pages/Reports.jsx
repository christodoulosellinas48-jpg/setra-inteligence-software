import React, { useState, useMemo, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BarChart3, RefreshCw, Save, Loader2, FileText, TrendingUp, Activity } from 'lucide-react';
import { startOfMonth, endOfMonth } from 'date-fns';
import SpendingAnalyticsDashboard from '@/components/reports/SpendingAnalyticsDashboard';

import HealthIndicator from '@/components/dashboard/HealthIndicator';
import ReportBuilder from '@/components/reports/ReportBuilder';
import { calculateFinancials, BENCHMARKS } from '@/components/dashboard/financialCalculations';
import { useBusiness } from '@/components/business/BusinessContext';

const ExpenseBreakdownChart = lazy(() => import('@/components/reports/ExpenseBreakdownChart'));
const RevenueTrendChart = lazy(() => import('@/components/reports/RevenueTrendChart'));
const FinancialSummaryTable = lazy(() => import('@/components/reports/FinancialSummaryTable'));

function ReportsContent() {
  const [periodType, setPeriodType] = useState('monthly');
  const [saving, setSaving] = useState(false);
  const [dateRange] = useState({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });

  const { currentBusiness, user, loading: businessLoading } = useBusiness();

  const { data: snapshots = [], refetch: refetchSnapshots } = useQuery({
    queryKey: ['financialSnapshots', currentBusiness?.id],
    queryFn: () => base44.entities.FinancialSnapshot.filter({ business_id: currentBusiness.id }, '-period_start', 50),
    enabled: !!currentBusiness,
    staleTime: 5 * 60 * 1000,
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', currentBusiness?.id],
    queryFn: () => base44.entities.Budget.filter({ business_id: currentBusiness.id }, '-created_date', 1),
    enabled: !!currentBusiness,
    staleTime: 5 * 60 * 1000,
  });

  const { data: vatPeriods = [] } = useQuery({
    queryKey: ['vatPeriods', currentBusiness?.id],
    queryFn: () => base44.entities.VATPeriod.filter({ business_id: currentBusiness.id }, '-period_start', 20),
    enabled: !!currentBusiness,
    staleTime: 5 * 60 * 1000,
  });

  const financials = useMemo(() => {
    if (!currentBusiness) return null;
    return calculateFinancials(currentBusiness, currentBusiness.industry_group);
  }, [currentBusiness]);

  const saveSnapshot = async () => {
    if (!currentBusiness || !financials) return;
    setSaving(true);
    await base44.entities.FinancialSnapshot.create({
      business_id: currentBusiness.id,
      period_start: dateRange.from.toISOString().split('T')[0],
      period_end: dateRange.to.toISOString().split('T')[0],
      period_type: periodType,
      monthly_revenue: currentBusiness.monthly_revenue,
      rent_fixed_costs: currentBusiness.rent_fixed_costs,
      staff_costs: currentBusiness.staff_costs,
      purchases_food_bev: currentBusiness.purchases_food_bev,
      utilities: currentBusiness.utilities,
      other_operating: currentBusiness.other_operating,
      net_profit: financials.netProfit,
      profit_margin: financials.profitMargin,
      created_by_email: user?.email,
    });
    await refetchSnapshots();
    setSaving(false);
  };

  if (businessLoading || !currentBusiness || !financials) {
    return (
      <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#7B3BFF] animate-spin" />
      </div>
    );
  }

  const businessDisplayName = BENCHMARKS[currentBusiness.industry_group]?.displayName || 'Business';

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Page Title */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-[#C084FC]" />
              Performance Analytics & Reports
            </h1>
            <p className="text-slate-500 text-sm mt-1">{currentBusiness.name} · {businessDisplayName}</p>
          </div>
          <Button onClick={saveSnapshot} disabled={saving} variant="outline">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Snapshot
          </Button>
        </div>

        {/* Health Summary */}
        <HealthIndicator status={financials.overallStatus} score={financials.healthScore} />

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="bg-[#151528]/80 border border-white/5 p-1 rounded-xl mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#7B3BFF]/20 data-[state=active]:text-white rounded-lg">
              <TrendingUp className="w-4 h-4 mr-2" />Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-[#7B3BFF]/20 data-[state=active]:text-white rounded-lg">
              <Activity className="w-4 h-4 mr-2" />Spending Analytics
            </TabsTrigger>
            <TabsTrigger value="custom" className="data-[state=active]:bg-[#7B3BFF]/20 data-[state=active]:text-white rounded-lg">
              <FileText className="w-4 h-4 mr-2" />Custom Reports
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab — existing charts + snapshots */}
          <TabsContent value="overview" className="space-y-8">
            <Suspense fallback={
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[0, 1].map(i => (
                  <Card key={i} className="bg-[#151528]/80 border-white/5 p-6 h-80 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-[#7B3BFF] animate-spin" />
                  </Card>
                ))}
              </div>
            }>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ExpenseBreakdownChart data={currentBusiness} />
                <RevenueTrendChart snapshots={snapshots} />
              </div>
            </Suspense>

            <Suspense fallback={
              <Card className="bg-[#151528]/80 border-white/5 p-6 h-64 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-[#7B3BFF] animate-spin" />
              </Card>
            }>
              <FinancialSummaryTable data={currentBusiness} calculations={financials} />
            </Suspense>

            {/* Saved Snapshots */}
            {snapshots.length > 0 && (
              <Card className="bg-[#151528]/80 border-white/5 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">Saved Financial Snapshots</h3>
                  <span className="text-xs text-slate-500">{snapshots.length} snapshots</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 bg-[#0B0B12]/40">
                        {['Period', 'Type', 'Revenue', 'Net Profit', 'Margin'].map(h => (
                          <th key={h} className={`py-3 px-4 text-xs text-slate-500 font-medium ${h === 'Period' || h === 'Type' ? 'text-left' : 'text-right'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {snapshots.slice(0, 12).map((snapshot, idx) => (
                        <motion.tr key={snapshot.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 px-4 text-slate-300">
                            {new Date(snapshot.period_start).toLocaleDateString()} – {new Date(snapshot.period_end).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-slate-400 capitalize">{snapshot.period_type}</td>
                          <td className="py-3 px-4 text-right text-emerald-400 font-mono">€{(snapshot.monthly_revenue || 0).toLocaleString()}</td>
                          <td className={`py-3 px-4 text-right font-mono ${(snapshot.net_profit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            €{(snapshot.net_profit || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-300">{(snapshot.profit_margin || 0).toFixed(1)}%</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Spending Analytics Tab */}
          <TabsContent value="analytics">
            <SpendingAnalyticsDashboard
              snapshots={snapshots}
              budget={budgets[0] || null}
              business={currentBusiness}
            />
          </TabsContent>

          {/* Custom Reports Tab */}
          <TabsContent value="custom">
            <ReportBuilder
              business={currentBusiness}
              snapshots={snapshots}
              vatPeriods={vatPeriods}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function Reports() {
  return <ReportsContent />;
}