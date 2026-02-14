import React, { useState, useMemo, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, BarChart3, RefreshCw, Save, Loader2 } from 'lucide-react';
import { startOfMonth, endOfMonth } from 'date-fns';

import ReportDatePicker from '@/components/reports/ReportDatePicker';
import HealthIndicator from '@/components/dashboard/HealthIndicator';

// Lazy load charts and heavy components
const ExpenseBreakdownChart = lazy(() => import('@/components/reports/ExpenseBreakdownChart'));
const RevenueTrendChart = lazy(() => import('@/components/reports/RevenueTrendChart'));
const FinancialSummaryTable = lazy(() => import('@/components/reports/FinancialSummaryTable'));
const ExportButtons = lazy(() => import('@/components/reports/ExportButtons'));

import { calculateFinancials, BENCHMARKS } from '@/components/dashboard/financialCalculations';
import { BusinessProvider, useBusiness } from '@/components/business/BusinessContext';

function ReportsContent() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [periodType, setPeriodType] = useState('monthly');
  const [saving, setSaving] = useState(false);

  const { currentBusiness, user, loading: businessLoading } = useBusiness();

  const { data: snapshots = [], refetch: refetchSnapshots } = useQuery({
    queryKey: ['financialSnapshots', currentBusiness?.id],
    queryFn: () => base44.entities.FinancialSnapshot.filter({ business_id: currentBusiness.id }, '-period_start', 50),
    enabled: !!currentBusiness,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const financials = useMemo(() => {
    if (!currentBusiness) return null;
    return calculateFinancials(currentBusiness, currentBusiness.business_type);
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
      created_by_email: user?.email
    });
    
    await refetchSnapshots();
    setSaving(false);
  };

  if (businessLoading || !currentBusiness || !financials) {
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
                  <BarChart3 className="w-6 h-6 text-emerald-500" />
                  Financial Reports
                </h1>
                <p className="text-slate-500 text-sm">{currentBusiness.name} • {businessDisplayName}</p>
              </div>
            </div>
            <Suspense fallback={<Button disabled className="bg-slate-800">Export</Button>}>
              <ExportButtons 
                data={currentBusiness}
                calculations={financials}
                dateRange={dateRange}
                businessName={currentBusiness.name}
                businessType={businessDisplayName}
              />
            </Suspense>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Date Range Selection */}
        <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <ReportDatePicker 
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              periodType={periodType}
              onPeriodTypeChange={setPeriodType}
            />
            <Button 
              onClick={saveSnapshot}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Snapshot
            </Button>
          </div>
        </Card>

        {/* Health Overview */}
        <HealthIndicator status={financials.overallStatus} score={financials.healthScore} />

        {/* Charts Grid */}
        <Suspense fallback={
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl h-80 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
            </Card>
            <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl h-80 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
            </Card>
          </div>
        }>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpenseBreakdownChart data={currentBusiness} />
            <RevenueTrendChart snapshots={snapshots} />
          </div>
        </Suspense>

        {/* Financial Summary */}
        <Suspense fallback={
          <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl h-64 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          </Card>
        }>
          <FinancialSummaryTable data={currentBusiness} calculations={financials} />
        </Suspense>

        {/* Saved Snapshots */}
        {snapshots.length > 0 && (
          <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Saved Financial Snapshots</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Period</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Type</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Revenue</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Net Profit</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.slice(0, 10).map((snapshot, idx) => (
                    <motion.tr 
                      key={snapshot.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-slate-800 hover:bg-slate-800/30"
                    >
                      <td className="py-3 px-4 text-white">
                        {new Date(snapshot.period_start).toLocaleDateString()} - {new Date(snapshot.period_end).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-400 capitalize">{snapshot.period_type}</td>
                      <td className="py-3 px-4 text-right text-emerald-400">€{(snapshot.monthly_revenue || 0).toLocaleString()}</td>
                      <td className={`py-3 px-4 text-right ${(snapshot.net_profit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
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
      </main>
    </div>
  );
}

export default function Reports() {
  return (
    <BusinessProvider>
      <ReportsContent />
    </BusinessProvider>
  );
}