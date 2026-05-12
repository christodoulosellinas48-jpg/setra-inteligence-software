import React, { useState, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wallet, RefreshCw } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';

import BudgetForm from '@/components/budget/BudgetForm';
import { BENCHMARKS } from '@/components/dashboard/financialCalculations';
import { useBusiness } from '@/components/business/BusinessContext';

// Lazy load chart components
const BudgetVsActualChart = lazy(() => import('@/components/budget/BudgetVsActualChart'));
const BudgetInsights = lazy(() => import('@/components/budget/BudgetInsights'));

function BudgetingContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  
  const [budgetForm, setBudgetForm] = useState({
    period_type: 'monthly',
    period_start: format(startOfMonth(addMonths(new Date(), 1)), 'yyyy-MM-dd'),
    period_end: format(endOfMonth(addMonths(new Date(), 1)), 'yyyy-MM-dd'),
    food_beverage_budget: 0,
    staff_costs_budget: 0,
    fixed_costs_budget: 0,
    utilities_budget: 0,
    operating_expenses_budget: 0,
    revenue_target: 0
  });

  const { currentBusiness, user, loading: businessLoading, canEdit } = useBusiness();

  const { data: budgets = [], refetch: refetchBudgets } = useQuery({
    queryKey: ['budgets', currentBusiness?.id],
    queryFn: () => base44.entities.Budget.filter({ business_id: currentBusiness.id }, '-created_date', 20),
    enabled: !!currentBusiness,
    staleTime: 3 * 60 * 1000 // 3 minutes
  });

  const { data: snapshots = [] } = useQuery({
    queryKey: ['financialSnapshots', currentBusiness?.id],
    queryFn: () => base44.entities.FinancialSnapshot.filter({ business_id: currentBusiness.id }, '-period_start', 20),
    enabled: !!currentBusiness,
    staleTime: 3 * 60 * 1000 // 3 minutes
  });

  const currentBudget = budgets[0];

  const handleAutoFill = () => {
    if (!currentBusiness) return;
    setAutoFilling(true);
    
    setTimeout(() => {
      setBudgetForm(prev => ({
        ...prev,
        food_beverage_budget: currentBusiness.purchases_food_bev || 0,
        staff_costs_budget: currentBusiness.staff_costs || 0,
        fixed_costs_budget: currentBusiness.rent_fixed_costs || 0,
        utilities_budget: currentBusiness.utilities || 0,
        operating_expenses_budget: currentBusiness.other_operating || 0,
        revenue_target: currentBusiness.monthly_revenue || 0
      }));
      setAutoFilling(false);
    }, 500);
  };

  const handleSaveBudget = async () => {
    if (!canEdit()) return;
    setSaving(true);
    await base44.entities.Budget.create({
      ...budgetForm,
      business_id: currentBusiness.id,
      created_by_email: user?.email,
      last_edited_by: user?.email,
      last_edited_at: new Date().toISOString()
    });
    await refetchBudgets();
    setSaving(false);
  };

  if (businessLoading || !currentBusiness) {
    return (
      <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#7B3BFF] animate-spin" />
      </div>
    );
  }

  const businessDisplayName = BENCHMARKS[currentBusiness.industry_group]?.displayName || 'Business';

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Wallet className="w-6 h-6 text-[#C084FC]" />
            Budget
          </h1>
          <p className="text-slate-500 text-sm mt-1">Plan your spending and track actuals · {currentBusiness.name} · {businessDisplayName}</p>
        </div>
        {canEdit() && (
          <BudgetForm
            budget={budgetForm}
            onChange={setBudgetForm}
            onSave={handleSaveBudget}
            onAutoFill={handleAutoFill}
            historicalData={currentBusiness}
            saving={saving}
            autoFilling={autoFilling}
            industryGroup={currentBusiness.industry_group}
          />
        )}

        <Suspense fallback={
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[#151528]/80 border-white/5 p-6 rounded-2xl h-80 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-[#7B3BFF] animate-spin" />
            </Card>
            <Card className="bg-[#151528]/80 border-white/5 p-6 rounded-2xl h-80 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-[#7B3BFF] animate-spin" />
            </Card>
          </div>
        }>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BudgetVsActualChart budget={currentBudget} actual={currentBusiness} />
            <BudgetInsights budget={currentBudget} actual={currentBusiness} historicalSnapshots={snapshots} />
          </div>
        </Suspense>

        {budgets.length > 0 && (
          <Card className="bg-[#151528]/80 border-white/5 p-6 rounded-2xl">
            <h3 className="text-base font-semibold text-white mb-4">Past Budgets</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0B0B12]/40">
                    {['Period', 'Type', 'Revenue Target', 'Actual Revenue', 'Variance', 'Status'].map(h => (
                      <th key={h} className={`py-3 px-4 text-xs text-slate-500 font-medium ${h === 'Period' || h === 'Type' ? 'text-left' : 'text-right'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {budgets.slice(0, 8).map((b, idx) => {
                    const isCurrent = idx === 0;
                    const actual = currentBusiness.monthly_revenue || 0;
                    const target = b.revenue_target || 0;
                    const variance = target > 0 && actual > 0 ? ((actual - target) / target) * 100 : null;
                    return (
                      <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="py-3 px-4 text-slate-300 text-xs">
                          {new Date(b.period_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 text-slate-500 capitalize text-xs">{b.period_type}</td>
                        <td className="py-3 px-4 text-right text-slate-300 font-mono text-xs">€{target.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-slate-400 font-mono text-xs">
                          {isCurrent && actual > 0 ? `€${actual.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs">
                          {isCurrent && variance !== null ? (
                            <span className={variance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              {variance >= 0 ? '+' : ''}{variance.toFixed(1)}%
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isCurrent ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[#7B3BFF]/20 text-[#C084FC]">Current</span>
                          ) : (
                            <span className="text-xs text-slate-600">Closed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

export default function Budgeting() {
  return <BudgetingContent />;
}