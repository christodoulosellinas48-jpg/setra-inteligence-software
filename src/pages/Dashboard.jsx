import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Upload, TrendingUp, DollarSign, Percent, 
  Target, Calculator, Sliders, FileText,
  ChevronRight, RefreshCw
} from 'lucide-react';

import MetricCard from '@/components/dashboard/MetricCard';
import HealthIndicator from '@/components/dashboard/HealthIndicator';
import InsightCard from '@/components/dashboard/InsightCard';
import SensitivitySlider from '@/components/dashboard/SensitivitySlider';
import FinancialInputs from '@/components/dashboard/FinancialInputs';
import ExpenseUploadModal from '@/components/dashboard/ExpenseUploadModal';

import { 
  calculateFinancials, 
  generateInsights, 
  simulateChanges,
  BENCHMARKS 
} from '@/components/utils/financialCalculations.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [simulationValues, setSimulationValues] = useState({
    revenue: 0,
    foodCost: 0,
    staffCost: 0
  });

  // Fetch business profile
  const { data: profiles, isLoading: profileLoading } = useQuery({
    queryKey: ['businessProfile'],
    queryFn: () => base44.entities.BusinessProfile.list('-created_date', 1)
  });

  const profile = profiles?.[0];

  // Fetch expenses
  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.ExpenseDocument.list('-created_date')
  });

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: (data) => base44.entities.BusinessProfile.update(profile.id, data),
    onSuccess: () => queryClient.invalidateQueries(['businessProfile'])
  });

  // Redirect if no profile
  useEffect(() => {
    if (!profileLoading && !profile) {
      navigate(createPageUrl('Onboarding'));
    }
  }, [profile, profileLoading, navigate]);

  // Calculate financials
  const financials = useMemo(() => {
    if (!profile) return null;
    return calculateFinancials(profile, profile.business_type);
  }, [profile]);

  // Calculate simulated financials
  const simulatedFinancials = useMemo(() => {
    if (!profile) return null;
    return simulateChanges(
      profile,
      profile.business_type,
      simulationValues.revenue,
      simulationValues.foodCost,
      simulationValues.staffCost
    );
  }, [profile, simulationValues]);

  // Generate insights
  const insights = useMemo(() => {
    if (!financials || !profile) return [];
    return generateInsights(financials, profile.business_type);
  }, [financials, profile]);

  const handleInputChange = (key, value) => {
    updateProfile.mutate({ [key]: value });
  };

  if (profileLoading || !profile || !financials) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const businessDisplayName = BENCHMARKS[profile.business_type]?.displayName || 'Business';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/50 backdrop-blur-sm sticky top-0 z-40 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{profile.business_name || 'Margin Control'}</h1>
              <p className="text-slate-500 text-sm">{businessDisplayName} • Financial Intelligence</p>
            </div>
            <Button 
              onClick={() => setShowUploadModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Expense
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Health Indicator */}
        <HealthIndicator status={financials.overallStatus} score={financials.healthScore} />

        {/* Financial Inputs Section */}
        <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Financial Inputs</h2>
                <p className="text-sm text-slate-500">Enter your monthly figures</p>
              </div>
            </div>
          </div>
          <FinancialInputs values={profile} onChange={handleInputChange} />
        </Card>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            title="Net Profit"
            value={financials.netProfit}
            prefix="€"
            status={financials.netProfit >= 0 ? 'healthy' : 'risk'}
            icon={DollarSign}
            delay={0}
          />
          <MetricCard
            title="Profit Margin"
            value={financials.profitMargin}
            suffix="%"
            status={financials.profitMarginStatus}
            benchmark={`Target: ${financials.benchmarks.profitMargin.healthy}%+`}
            icon={Percent}
            delay={0.1}
          />
          <MetricCard
            title="Break-even Revenue"
            value={financials.breakEvenRevenue}
            prefix="€"
            status="neutral"
            icon={Target}
            delay={0.2}
          />
          <MetricCard
            title="Food Cost Ratio"
            value={financials.foodCostRatio}
            suffix="%"
            status={financials.foodCostStatus}
            benchmark={`Healthy: <${financials.benchmarks.foodCostRatio.healthy}%`}
            icon={TrendingUp}
            delay={0.3}
          />
          <MetricCard
            title="Staff Cost Ratio"
            value={financials.staffCostRatio}
            suffix="%"
            status={financials.staffCostStatus}
            benchmark={`Healthy: <${financials.benchmarks.staffCostRatio.healthy}%`}
            icon={TrendingUp}
            delay={0.4}
          />
          <MetricCard
            title="Fixed Cost Load"
            value={financials.fixedCostRatio}
            suffix="%"
            status={financials.fixedCostStatus}
            benchmark={`Healthy: <${financials.benchmarks.fixedCostRatio.healthy}%`}
            icon={TrendingUp}
            delay={0.5}
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Insights */}
          <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Business Insights</h2>
                <p className="text-sm text-slate-500">AI-powered recommendations</p>
              </div>
            </div>
            <div className="space-y-3">
              {insights.map((insight, idx) => (
                <InsightCard key={idx} {...insight} delay={idx * 0.1} />
              ))}
            </div>
          </Card>

          {/* Sensitivity Simulator */}
          <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Sliders className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Profit Simulator</h2>
                <p className="text-sm text-slate-500">Test scenario impacts</p>
              </div>
            </div>
            
            <div className="space-y-6 mb-8">
              <SensitivitySlider
                label="Revenue Change"
                value={simulationValues.revenue}
                onChange={(v) => setSimulationValues({ ...simulationValues, revenue: v })}
              />
              <SensitivitySlider
                label="Food Cost Change"
                value={simulationValues.foodCost}
                onChange={(v) => setSimulationValues({ ...simulationValues, foodCost: v })}
              />
              <SensitivitySlider
                label="Staff Cost Change"
                value={simulationValues.staffCost}
                onChange={(v) => setSimulationValues({ ...simulationValues, staffCost: v })}
              />
            </div>

            {/* Simulated Results */}
            <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">Projected Impact</h3>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Net Profit</span>
                <span className={`font-bold ${simulatedFinancials.netProfit >= financials.netProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                  €{simulatedFinancials.netProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  <span className="text-xs ml-1 opacity-70">
                    ({simulatedFinancials.netProfit >= financials.netProfit ? '+' : ''}
                    {(simulatedFinancials.netProfit - financials.netProfit).toLocaleString('en-US', { maximumFractionDigits: 0 })})
                  </span>
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Profit Margin</span>
                <span className={`font-bold ${simulatedFinancials.profitMargin >= financials.profitMargin ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {simulatedFinancials.profitMargin.toFixed(1)}%
                </span>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                <span className="text-slate-400">Health Status</span>
                <span className={`font-bold capitalize ${
                  simulatedFinancials.overallStatus === 'healthy' ? 'text-emerald-400' :
                  simulatedFinancials.overallStatus === 'warning' ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {simulatedFinancials.overallStatus}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Expenses */}
        {expenses.length > 0 && (
          <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Recent Expenses</h2>
                  <p className="text-sm text-slate-500">{expenses.length} documents uploaded</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              {expenses.slice(0, 5).map((expense, idx) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{expense.supplier_name}</p>
                      <p className="text-sm text-slate-500 capitalize">
                        {expense.expense_category?.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">€{expense.invoice_total?.toLocaleString()}</p>
                    {expense.vat_included && (
                      <p className="text-xs text-slate-500">VAT incl.</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        )}
      </main>

      <ExpenseUploadModal 
        open={showUploadModal} 
        onOpenChange={setShowUploadModal}
        onSave={() => queryClient.invalidateQueries(['expenses'])}
      />
    </div>
  );
}