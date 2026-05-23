import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { debounce } from 'lodash';
import { 
  Upload, TrendingUp, DollarSign, Percent, 
  Target, Calculator, Sliders, FileText,
  ChevronRight, Mail, Building2, Trash2, Sparkles, Save, CheckCircle2, RefreshCw
} from 'lucide-react';
import { startOfMonth, endOfMonth } from 'date-fns';
import AICounselorChat from '@/components/AICounselorChat';
import usePullToRefresh from '@/hooks/usePullToRefresh';
import PullToRefreshIndicator from '@/components/ui/PullToRefreshIndicator';
import IconContainer from '@/components/ui/IconContainer';
import ThemedSpinner from '@/components/ui/ThemedSpinner';
import EmptyState from '@/components/ui/EmptyState';

import MetricCard from '@/components/dashboard/MetricCard';
import HealthIndicator from '@/components/dashboard/HealthIndicator';
import InsightCard from '@/components/dashboard/InsightCard';
import FinancialInputs from '@/components/dashboard/FinancialInputs';
import { useBusiness } from '@/components/business/BusinessContext';

import SensitivitySlider from '@/components/dashboard/SensitivitySlider';
import ExpenseUploadModal from '@/components/dashboard/ExpenseUploadModal';
import AddFromSystemButton from '@/components/dashboard/AddFromSystemButton';
import AutofillControls from '@/components/dashboard/AutofillControls';
import BudgetVsActualMini from '@/components/dashboard/BudgetVsActualMini';
import CashFlowMiniChart from '@/components/dashboard/CashFlowMiniChart';
import SetupChecklist from '@/components/onboarding/SetupChecklist';

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
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [snapshotSaved, setSnapshotSaved] = useState(false);

  const saveSnapshot = async () => {
    if (!currentBusiness || !financials) return;
    setSavingSnapshot(true);
    const now = new Date();
    await base44.entities.FinancialSnapshot.create({
      business_id: currentBusiness.id,
      period_start: startOfMonth(now).toISOString().split('T')[0],
      period_end: endOfMonth(now).toISOString().split('T')[0],
      period_type: 'monthly',
      monthly_revenue: currentBusiness.monthly_revenue || 0,
      rent_fixed_costs: currentBusiness.rent_fixed_costs || 0,
      staff_costs: currentBusiness.staff_costs || 0,
      purchases_food_bev: currentBusiness.purchases_food_bev || 0,
      utilities: currentBusiness.utilities || 0,
      other_operating: currentBusiness.other_operating || 0,
      net_profit: financials.netProfit,
      profit_margin: financials.profitMargin,
      created_by_email: user?.email,
    });
    queryClient.invalidateQueries(['financialSnapshots', currentBusiness?.id]);
    setSavingSnapshot(false);
    setSnapshotSaved(true);
    setTimeout(() => setSnapshotSaved(false), 3000);
  };
  const [simulationValues, setSimulationValues] = useState({
    revenue: 0,
    foodCost: 0,
    staffCost: 0
  });

  const { isRefreshing, pullDistance, containerRef } = usePullToRefresh(async () => {
    await Promise.all([
      queryClient.invalidateQueries(['expenses', currentBusiness?.id]),
      queryClient.invalidateQueries(['budgets', currentBusiness?.id]),
      queryClient.invalidateQueries(['financialSnapshots', currentBusiness?.id]),
      queryClient.invalidateQueries(['businesses']),
    ]);
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
    return calculateFinancials(localBusinessData, localBusinessData.industry_group || localBusinessData.business_type);
  }, [localBusinessData]);

  // Calculate simulated financials only if user changed values
  const hasSimulationChanges = simulationValues.revenue !== 0 || simulationValues.foodCost !== 0 || simulationValues.staffCost !== 0;
  const simulatedFinancials = useMemo(() => {
    if (!localBusinessData || !hasSimulationChanges) return null;
    return simulateChanges(
      localBusinessData,
      localBusinessData.industry_group || localBusinessData.business_type,
      simulationValues.revenue,
      simulationValues.foodCost,
      simulationValues.staffCost
    );
  }, [localBusinessData, simulationValues, hasSimulationChanges]);

  // Generate insights
  const insights = useMemo(() => {
    return generateInsights(financials, localBusinessData?.industry_group || localBusinessData?.business_type);
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
                  onClick={() => navigate('/CreateBusiness')}
                  className="px-8 py-6 text-lg w-full"
                >
                  Create Your First Business
                </Button>
                {pendingInvitations.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => navigate('/Invitations')}
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

  const businessDisplayName = BENCHMARKS[currentBusiness.industry_group || currentBusiness.business_type]?.displayName || 'Business';
  const currencySymbol = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr', AUD: '$', CAD: '$' }[currentBusiness.currency] || '€';

  const healthStatusColor = financials?.overallStatus === 'healthy' ? 'text-emerald-400'
    : financials?.overallStatus === 'warning' ? 'text-amber-400' : 'text-rose-400';

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0B0B12]">
      <PullToRefreshIndicator isRefreshing={isRefreshing} pullDistance={pullDistance} />
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* Setup checklist — shown to owner until complete */}
        {userRole === 'owner' && (
          <SetupChecklist
            completed={{
              business: !!currentBusiness,
              pos: false,
              accounting: false,
              invoice: expenses.length > 0,
              team: false,
            }}
          />
        )}

        {/* Health + Key Profit metrics at the top — always shown, empty state when no data */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <HealthIndicator
              status={financials?.overallStatus}
              score={financials?.healthScore}
              noData={!financials || (currentBusiness?.monthly_revenue || 0) === 0}
            />
          </div>
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <MetricCard
              title="Net Profit"
              value={financials?.netProfit ?? 0}
              prefix={currencySymbol}
              status={financials ? (financials.netProfit >= 0 ? 'healthy' : 'risk') : 'neutral'}
              icon={DollarSign}
              delay={0}
              noData={!financials}
            />
            <MetricCard
              title="Profit Margin"
              value={financials?.profitMargin ?? 0}
              suffix="%"
              status={financials?.profitMarginStatus ?? 'neutral'}
              benchmark={financials ? `Target: ${financials.benchmarks.profitMargin.healthy}%+` : undefined}
              icon={Percent}
              delay={0.1}
              noData={!financials}
            />
          </div>
        </div>

        {/* Section Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.05]" />
          <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-2">Financial Inputs</span>
          <div className="h-px flex-1 bg-white/[0.05]" />
        </div>

        {/* Financial Inputs Section */}
        <Card className="bg-[#0F0F1E]/80 border-white/[0.06] p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <IconContainer icon={Calculator} />
              <div>
                <h2 className="text-base font-semibold text-white">Monthly Figures</h2>
                <p className="text-xs text-slate-500">
                  {canEdit() ? 'Auto-fill from historical data, payroll & invoices' : 'View-only mode'}
                </p>
              </div>
            </div>
            {canEdit() && (
              <AutofillControls
                businessId={currentBusiness?.id}
                disabled={!currentBusiness}
                onApplyData={(data) => {
                  // Apply all values at once to avoid stale closure overwrites
                  setLocalBusinessData(prev => ({ ...prev, ...data }));
                  // Save each field to the DB
                  Object.entries(data).forEach(([key, value]) => {
                    debouncedSave({ [key]: value });
                  });
                }}
              />
            )}
          </div>
          <FinancialInputs
            values={localBusinessData}
            onChange={handleInputChange}
            disabled={!canEdit()}
            currencySymbol={currencySymbol}
          />
        </Card>

        {/* Section Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.05]" />
          <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-2">Performance Metrics</span>
          <div className="h-px flex-1 bg-white/[0.05]" />
        </div>

        {/* Full Metrics Grid — always rendered, empty state when no data */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricCard
            title="Tax Amount"
            value={financials?.taxAmount ?? 0}
            prefix={currencySymbol}
            status="neutral"
            benchmark={financials ? `Rate: ${financials.taxRate}%` : undefined}
            icon={DollarSign}
            delay={0}
            noData={!financials}
          />
          <MetricCard
            title="Break-even"
            value={financials?.breakEvenRevenue ?? 0}
            prefix={currencySymbol}
            status="neutral"
            icon={Target}
            delay={0.05}
            noData={!financials}
          />
          <MetricCard
            title="Food Cost"
            value={financials?.foodCostRatio ?? 0}
            suffix="%"
            status={financials?.foodCostStatus ?? 'neutral'}
            benchmark={financials ? `<${financials.benchmarks.foodCostRatio.healthy}%` : undefined}
            icon={TrendingUp}
            delay={0.1}
            noData={!financials}
          />
          <MetricCard
            title="Staff Cost"
            value={financials?.staffCostRatio ?? 0}
            suffix="%"
            status={financials?.staffCostStatus ?? 'neutral'}
            benchmark={financials ? `<${financials.benchmarks.staffCostRatio.healthy}%` : undefined}
            icon={TrendingUp}
            delay={0.15}
            noData={!financials}
          />
          <MetricCard
            title="Fixed Cost"
            value={financials?.fixedCostRatio ?? 0}
            suffix="%"
            status={financials?.fixedCostStatus ?? 'neutral'}
            benchmark={financials ? `<${financials.benchmarks.fixedCostRatio.healthy}%` : undefined}
            icon={TrendingUp}
            delay={0.2}
            noData={!financials}
          />
        </div>

        {/* Budget & Cash Flow Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <BudgetVsActualMini budget={budgets[0]} actual={currentBusiness} />
          <CashFlowMiniChart currentBusiness={currentBusiness} snapshots={snapshots} />
        </div>

        {/* Section Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.05]" />
          <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-2">Intelligence</span>
          <div className="h-px flex-1 bg-white/[0.05]" />
        </div>

        {/* Insights + Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Insights */}
          <Card className="bg-[#0F0F1E]/80 border-white/[0.06] p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/10 border border-[#7B3BFF]/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#C084FC]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">AI Insights</h2>
                <p className="text-xs text-slate-500">Recommendations based on your numbers</p>
              </div>
            </div>
            <div className="space-y-3">
              {insights.map((insight, idx) => (
                <InsightCard key={idx} {...insight} delay={idx * 0.1} />
              ))}
            </div>
          </Card>

          {/* Profit Simulator */}
          <Card className="bg-[#0F0F1E]/80 border-white/[0.06] p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-5">
              <IconContainer icon={Sliders} />
              <div>
                <h2 className="text-base font-semibold text-white">Profit Simulator</h2>
                <p className="text-xs text-slate-500">Model scenario impact before making decisions</p>
              </div>
            </div>

            <div className="space-y-5 mb-6">
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

            {!financials && (
              <div className="bg-[#0B0B12]/40 border border-dashed border-white/[0.06] rounded-xl p-5 text-center">
                <p className="text-xs text-slate-600">Enter your monthly figures above to unlock the simulator</p>
              </div>
            )}
            {financials && hasSimulationChanges && simulatedFinancials ? (
              <div className="bg-[#0B0B12]/60 border border-white/[0.06] rounded-xl p-4 space-y-3">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Projected Impact</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Net Profit</span>
                  <span className={`text-sm font-bold ${simulatedFinancials.netProfit >= financials.netProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {currencySymbol}{simulatedFinancials.netProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    <span className="text-xs ml-1.5 opacity-70">
                      ({simulatedFinancials.netProfit >= financials.netProfit ? '+' : ''}{(simulatedFinancials.netProfit - financials.netProfit).toLocaleString('en-US', { maximumFractionDigits: 0 })})
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Profit Margin</span>
                  <span className={`text-sm font-bold ${simulatedFinancials.profitMargin >= financials.profitMargin ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {simulatedFinancials.profitMargin.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <span className="text-sm text-slate-400">Health Status</span>
                  <span className={`text-sm font-bold capitalize ${
                    simulatedFinancials.overallStatus === 'healthy' ? 'text-emerald-400' :
                    simulatedFinancials.overallStatus === 'warning' ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {simulatedFinancials.overallStatus}
                  </span>
                </div>
              </div>
            ) : financials ? (
              <div className="bg-[#0B0B12]/40 border border-dashed border-white/[0.06] rounded-xl p-5 text-center">
                <p className="text-xs text-slate-600">Adjust the sliders above to model different scenarios</p>
              </div>
            ) : null}
          </Card>
        </div>

        {/* Section Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.05]" />
          <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-2">Recent Activity</span>
          <div className="h-px flex-1 bg-white/[0.05]" />
        </div>

        {/* Recent Expenses */}
        <Card className="bg-[#0F0F1E]/80 border-white/[0.06] p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <IconContainer icon={FileText} />
              <div>
                <h2 className="text-base font-semibold text-white">Recent Invoices</h2>
                <p className="text-xs text-slate-500">{expenses.length} document{expenses.length !== 1 ? 's' : ''} uploaded</p>
              </div>
            </div>
            {expenses.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/Expenses')}
                className="text-xs text-slate-400 hover:text-white h-8"
              >
                View all <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}
          </div>

          {expenses.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-white/[0.06] rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-[#151528] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
                <FileText className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-sm text-slate-500 mb-4">No invoices uploaded yet</p>
              {canEdit() && (
                <Button size="sm" variant="outline" onClick={() => setShowUploadModal(true)} className="text-xs h-8">
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Upload First Invoice
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.slice(0, 5).map((expense, idx) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex items-center justify-between px-4 py-3 bg-[#0B0B12]/60 border border-white/[0.05] rounded-xl hover:border-[#7B3BFF]/20 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#7B3BFF]/10 to-[#A855F7]/10 border border-[#7B3BFF]/10 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-[#C084FC]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white leading-tight">{expense.supplier_name}</p>
                      <p className="text-xs text-slate-500 capitalize mt-0.5">
                        {expense.expense_category?.replace(/_/g, ' ')}
                        {expense.invoice_date && <span className="ml-2 text-slate-600">· {expense.invoice_date}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{currencySymbol}{expense.invoice_total?.toLocaleString()}</p>
                      {expense.vat_included && <p className="text-[10px] text-slate-600">VAT incl.</p>}
                    </div>
                    {canEdit() && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteExpense.mutate(expense.id)}
                        disabled={deleteExpense.isPending}
                        className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
        <ExpenseUploadModal 
          open={showUploadModal} 
          onOpenChange={setShowUploadModal}
          onSave={() => queryClient.invalidateQueries(['expenses', currentBusiness?.id])}
          businessId={currentBusiness?.id}
          userEmail={user?.email}
        />
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