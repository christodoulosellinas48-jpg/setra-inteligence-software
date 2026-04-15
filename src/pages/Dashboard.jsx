import React, { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { debounce } from 'lodash';
import { 
  Upload, TrendingUp, DollarSign, Percent, 
  Target, Calculator, Sliders, FileText,
  ChevronRight, RefreshCw, Mail, Building2, Trash2, Sparkles
} from 'lucide-react';
import AICounselorChat from '@/components/AICounselorChat';
import IconContainer from '@/components/ui/IconContainer';
import ThemedSpinner from '@/components/ui/ThemedSpinner';
import EmptyState from '@/components/ui/EmptyState';

import MetricCard from '@/components/dashboard/MetricCard';
import HealthIndicator from '@/components/dashboard/HealthIndicator';
import InsightCard from '@/components/dashboard/InsightCard';
import FinancialInputs from '@/components/dashboard/FinancialInputs';
import { useBusiness } from '@/components/business/BusinessContext';
import BusinessSwitcher from '@/components/business/BusinessSwitcher';

// Lazy load heavy components
const SensitivitySlider = lazy(() => import('@/components/dashboard/SensitivitySlider'));
const ExpenseUploadModal = lazy(() => import('@/components/dashboard/ExpenseUploadModal'));
const BudgetVsActualMini = lazy(() => import('@/components/dashboard/BudgetVsActualMini'));
const CashFlowMiniChart = lazy(() => import('@/components/dashboard/CashFlowMiniChart'));

import { 
  calculateFinancials, 
  generateInsights, 
  simulateChanges,
  BENCHMARKS 
} from '@/components/dashboard/financialCalculations';

function DashboardContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentBusiness, user, loading: businessLoading, canEdit, userRole } = useBusiness();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCounselorChat, setShowCounselorChat] = useState(false);
  const [simulationValues, setSimulationValues] = useState({
    revenue: 0,
    foodCost: 0,
    staffCost: 0
  });

  // Fetch pending invitations count - defer to avoid blocking render
  const { data: pendingInvitations = [] } = useQuery({
    queryKey: ['pendingInvitations', user?.email],
    queryFn: () => base44.entities.BusinessMember.filter({ 
      user_email: user?.email, 
      invitation_status: 'pending' 
    }),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: []
  });

  // Defer expenses query - only load when scrolled into view
  const [shouldLoadExpenses, setShouldLoadExpenses] = useState(false);
  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', currentBusiness?.id],
    queryFn: () => base44.entities.ExpenseDocument.filter({ business_id: currentBusiness.id }, '-created_date', 5),
    enabled: !!currentBusiness && shouldLoadExpenses,
    staleTime: 2 * 60 * 1000 // 2 minutes
  });

  // Fetch budget and snapshots for charts
  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', currentBusiness?.id],
    queryFn: () => base44.entities.Budget.filter({ business_id: currentBusiness.id }, '-created_date', 1),
    enabled: !!currentBusiness,
    staleTime: 5 * 60 * 1000
  });

  const { data: snapshots = [] } = useQuery({
    queryKey: ['financialSnapshots', currentBusiness?.id],
    queryFn: () => base44.entities.FinancialSnapshot.filter({ business_id: currentBusiness.id }, '-period_start', 10),
    enabled: !!currentBusiness,
    staleTime: 5 * 60 * 1000
  });

  // Load expenses after a short delay or when user scrolls
  React.useEffect(() => {
    if (currentBusiness) {
      const timer = setTimeout(() => setShouldLoadExpenses(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [currentBusiness]);

  // Local state for immediate UI updates
  const [localBusinessData, setLocalBusinessData] = useState(currentBusiness || {});

  // Update local data when currentBusiness changes
  React.useEffect(() => {
    if (currentBusiness) {
      setLocalBusinessData(currentBusiness);
    }
  }, [currentBusiness]);

  // Update business mutation
  const updateBusiness = useMutation({
    mutationFn: (data) => base44.entities.Business.update(currentBusiness.id, {
      ...data,
      last_edited_by: user?.email,
      last_edited_at: new Date().toISOString()
    }),
    onSuccess: () => queryClient.invalidateQueries(['businesses'])
  });

  // Delete expense mutation
  const deleteExpense = useMutation({
    mutationFn: (expenseId) => base44.entities.ExpenseDocument.delete(expenseId),
    onSuccess: () => queryClient.invalidateQueries(['expenses', currentBusiness?.id])
  });

  // Debounced save function
  const debouncedSave = useRef(
    debounce((data) => {
      updateBusiness.mutate(data);
    }, 500)
  ).current;

  // Calculate financials using local data for immediate updates
  const financials = useMemo(() => {
    if (!localBusinessData) return null;
    return calculateFinancials(localBusinessData, localBusinessData.business_type);
  }, [localBusinessData]);

  // Calculate simulated financials only if user changed values
  const hasSimulationChanges = simulationValues.revenue !== 0 || simulationValues.foodCost !== 0 || simulationValues.staffCost !== 0;
  const simulatedFinancials = useMemo(() => {
    if (!localBusinessData || !hasSimulationChanges) return null;
    return simulateChanges(
      localBusinessData,
      localBusinessData.business_type,
      simulationValues.revenue,
      simulationValues.foodCost,
      simulationValues.staffCost
    );
  }, [localBusinessData, simulationValues, hasSimulationChanges]);

  // Generate insights
  const insights = useMemo(() => {
    if (!financials || !localBusinessData) return [];
    return generateInsights(financials, localBusinessData.business_type);
  }, [financials, localBusinessData]);

  const handleInputChange = (key, value) => {
    if (!canEdit()) return;
    // Update local state immediately for responsive UI
    setLocalBusinessData(prev => ({ ...prev, [key]: value }));
    // Debounce the actual save to database
    debouncedSave({ [key]: value });
  };

  if (businessLoading) {
    return (
      <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center">
        <ThemedSpinner size="lg" />
      </div>
    );
  }

  // No business - show welcome screen
  if (!currentBusiness) {
    return (
      <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md w-full"
        >
          <div className="mb-8">
            <img
              src="https://media.base44.com/images/public/698f4ecdefcf4d820e54e33f/50df0face_EEEE413D-A65A-4B84-A6CE-9F681EADF652.png"
              alt="SETRA"
              className="h-14 mx-auto"
              style={{ filter: 'drop-shadow(0 0 20px rgba(123,59,255,0.6))' }}
            />
          </div>
          <EmptyState
            icon={Building2}
            title="Welcome to SETRA"
            description="Create your first business to start tracking finances, managing budgets, and gaining insights."
            action={
              <div className="flex flex-col items-center gap-3">
                <Button
                  onClick={() => navigate(createPageUrl('CreateBusiness'))}
                  className="px-8 py-6 text-lg w-full"
                >
                  Create Your First Business
                </Button>
                {pendingInvitations.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => navigate(createPageUrl('Invitations'))}
                    className="w-full border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {pendingInvitations.length} Pending Invitation{pendingInvitations.length > 1 ? 's' : ''}
                  </Button>
                )}
              </div>
            }
          />
        </motion.div>
      </div>
    );
  }

  const businessDisplayName = BENCHMARKS[currentBusiness.business_type]?.displayName || 'Business';
  const currencySymbol = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr', AUD: '$', CAD: '$' }[currentBusiness.currency] || '€';

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      {/* Header */}
      <header className="border-b border-white/5 backdrop-blur-2xl sticky top-0 z-40 bg-[#0B0B12]/95 shadow-[0_4px_30px_rgba(123,59,255,0.1)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BusinessSwitcher />
              <div>
                <p className="text-slate-500 text-sm">{businessDisplayName} • {userRole}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {pendingInvitations.length > 0 && (
                <Button 
                  variant="outline"
                  onClick={() => navigate(createPageUrl('Invitations'))}
                  variant="outline"
                  className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {pendingInvitations.length}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate('/ConsolidatedView')}
              >
                <Building2 className="w-4 h-4 mr-2" />
                Consolidated View
              </Button>
              <Button 
                onClick={() => setShowCounselorChat(true)}
                variant="outline"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Open AI Counselor Chat
              </Button>
              {canEdit() && (
                <Button 
                  onClick={() => setShowUploadModal(true)}

                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Expense
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Health Indicator */}
        {financials && <HealthIndicator status={financials.overallStatus} score={financials.healthScore} />}

        {/* Financial Inputs Section */}
        <Card className="bg-[#151528]/80 border-white/5 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <IconContainer icon={Calculator} />
              <div>
                <h2 className="text-lg font-semibold text-white">Financial Inputs</h2>
                <p className="text-sm text-slate-500">
                  {canEdit() ? 'Enter your monthly figures' : 'View-only mode'}
                </p>
              </div>
            </div>
          </div>
          <FinancialInputs 
            values={localBusinessData} 
            onChange={handleInputChange} 
            disabled={!canEdit()}
            currencySymbol={currencySymbol}
          />
        </Card>

        {/* Key Metrics Grid */}
        {financials && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              title="Net Profit (After Tax)"
              value={financials.netProfit}
              prefix={currencySymbol}
              status={financials.netProfit >= 0 ? 'healthy' : 'risk'}
              icon={DollarSign}
              delay={0}
            />
            <MetricCard
              title="Tax Amount"
              value={financials.taxAmount}
              prefix={currencySymbol}
              status="neutral"
              benchmark={`Rate: ${financials.taxRate}%`}
              icon={DollarSign}
              delay={0.1}
            />
            <MetricCard
              title="Profit Margin"
              value={financials.profitMargin}
              suffix="%"
              status={financials.profitMarginStatus}
              benchmark={`Target: ${financials.benchmarks.profitMargin.healthy}%+`}
              icon={Percent}
              delay={0.2}
            />
            <MetricCard
              title="Break-even Revenue"
              value={financials.breakEvenRevenue}
              prefix={currencySymbol}
              status="neutral"
              icon={Target}
              delay={0.3}
            />
            <MetricCard
              title="Food Cost Ratio"
              value={financials.foodCostRatio}
              suffix="%"
              status={financials.foodCostStatus}
              benchmark={`Healthy: <${financials.benchmarks.foodCostRatio.healthy}%`}
              icon={TrendingUp}
              delay={0.4}
            />
            <MetricCard
              title="Staff Cost Ratio"
              value={financials.staffCostRatio}
              suffix="%"
              status={financials.staffCostStatus}
              benchmark={`Healthy: <${financials.benchmarks.staffCostRatio.healthy}%`}
              icon={TrendingUp}
              delay={0.5}
            />
            <MetricCard
              title="Fixed Cost Load"
              value={financials.fixedCostRatio}
              suffix="%"
              status={financials.fixedCostStatus}
              benchmark={`Healthy: <${financials.benchmarks.fixedCostRatio.healthy}%`}
              icon={TrendingUp}
              delay={0.6}
            />
          </div>
        )}

        {/* Budget & Cash Flow Charts */}
        <Suspense fallback={
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[#151528]/80 border-white/5 p-6 rounded-2xl h-80 flex items-center justify-center">
              <ThemedSpinner />
            </Card>
            <Card className="bg-[#151528]/80 border-white/5 p-6 rounded-2xl h-80 flex items-center justify-center">
              <ThemedSpinner />
            </Card>
          </div>
        }>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BudgetVsActualMini budget={budgets[0]} actual={currentBusiness} />
            <CashFlowMiniChart currentBusiness={currentBusiness} snapshots={snapshots} />
          </div>
        </Suspense>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Insights */}
          <Card className="bg-[#151528]/80 border-white/5 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <IconContainer icon={FileText} />
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
          <Card className="bg-[#151528]/80 border-white/5 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <IconContainer icon={Sliders} />
              <div>
                <h2 className="text-lg font-semibold text-white">Profit Simulator</h2>
                <p className="text-sm text-slate-500">Test scenario impacts</p>
              </div>
            </div>

            <Suspense fallback={<div className="h-48 flex items-center justify-center"><ThemedSpinner /></div>}>
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
            </Suspense>

            {/* Simulated Results */}
            {hasSimulationChanges && simulatedFinancials && (
              <div className="bg-[#0B0B12]/60 border border-white/5 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">Projected Impact</h3>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Net Profit</span>
                  <span className={`font-bold ${simulatedFinancials.netProfit >= financials.netProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {currencySymbol}{simulatedFinancials.netProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
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
                
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-slate-400">Health Status</span>
                  <span className={`font-bold capitalize ${
                    simulatedFinancials.overallStatus === 'healthy' ? 'text-emerald-400' :
                    simulatedFinancials.overallStatus === 'warning' ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {simulatedFinancials.overallStatus}
                  </span>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Recent Expenses */}
        <Card className="bg-[#151528]/80 border-white/5 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <IconContainer icon={FileText} />
              <div>
                <h2 className="text-lg font-semibold text-white">Recent Expenses</h2>
                <p className="text-sm text-slate-500">{expenses.length} documents uploaded</p>
              </div>
            </div>
          </div>
          
          {expenses.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-slate-500 text-sm">No expenses uploaded yet.</p>
              {canEdit() && (
                <Button variant="outline" onClick={() => setShowUploadModal(true)} className="mt-4">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload First Expense
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.slice(0, 5).map((expense, idx) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between p-4 bg-[#0B0B12]/60 border border-white/5 rounded-xl hover:border-[#7B3BFF]/20 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B3BFF]/10 to-[#A855F7]/10 border border-[#7B3BFF]/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-[#C084FC]" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{expense.supplier_name}</p>
                      <p className="text-sm text-slate-500 capitalize">
                        {expense.expense_category?.replace(/_/g, ' ')}
                        {expense.uploaded_by && <span className="ml-2">• by {expense.uploaded_by}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-white">{currencySymbol}{expense.invoice_total?.toLocaleString()}</p>
                      {expense.vat_included && (
                        <p className="text-xs text-slate-500">VAT incl.</p>
                      )}
                    </div>
                    {canEdit() && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteExpense.mutate(expense.id)}
                        disabled={deleteExpense.isPending}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </main>

      {canEdit() && (
        <Suspense fallback={null}>
          <ExpenseUploadModal 
            open={showUploadModal} 
            onOpenChange={setShowUploadModal}
            onSave={() => queryClient.invalidateQueries(['expenses', currentBusiness?.id])}
            businessId={currentBusiness?.id}
            userEmail={user?.email}
          />
        </Suspense>
      )}

      <Sheet open={showCounselorChat} onOpenChange={setShowCounselorChat}>
        <SheetContent side="right" className="w-full sm:w-[500px] p-0 bg-[#0B0B12] border-[#7B3BFF]/20">
          <AICounselorChat 
            onClose={() => setShowCounselorChat(false)}
            businessId={currentBusiness?.id}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}