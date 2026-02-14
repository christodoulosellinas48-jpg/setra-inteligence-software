import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Wallet, RefreshCw } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';

import BudgetForm from '@/components/budget/BudgetForm';
import BudgetVsActualChart from '@/components/budget/BudgetVsActualChart';
import BudgetInsights from '@/components/budget/BudgetInsights';
import { BENCHMARKS } from '@/components/dashboard/financialCalculations';

export default function Budgeting() {
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

  const { data: profiles, isLoading: profileLoading } = useQuery({
    queryKey: ['businessProfile'],
    queryFn: () => base44.entities.BusinessProfile.list('-created_date', 1)
  });

  const { data: budgets = [], refetch: refetchBudgets } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list('-created_date')
  });

  const { data: snapshots = [] } = useQuery({
    queryKey: ['financialSnapshots'],
    queryFn: () => base44.entities.FinancialSnapshot.list('-period_start')
  });

  const profile = profiles?.[0];
  const currentBudget = budgets[0];

  const handleAutoFill = () => {
    if (!profile) return;
    setAutoFilling(true);
    
    // Use current profile data as baseline
    setTimeout(() => {
      setBudgetForm(prev => ({
        ...prev,
        food_beverage_budget: profile.purchases_food_bev || 0,
        staff_costs_budget: profile.staff_costs || 0,
        fixed_costs_budget: profile.rent_fixed_costs || 0,
        utilities_budget: profile.utilities || 0,
        operating_expenses_budget: profile.other_operating || 0,
        revenue_target: profile.monthly_revenue || 0
      }));
      setAutoFilling(false);
    }, 500);
  };

  const handleSaveBudget = async () => {
    setSaving(true);
    await base44.entities.Budget.create(budgetForm);
    await refetchBudgets();
    setSaving(false);
  };

  if (profileLoading || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const businessDisplayName = BENCHMARKS[profile.business_type]?.displayName || 'Business';

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
                  <Wallet className="w-6 h-6 text-emerald-500" />
                  Budget Management
                </h1>
                <p className="text-slate-500 text-sm">{profile.business_name} • {businessDisplayName}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <BudgetForm
          budget={budgetForm}
          onChange={setBudgetForm}
          onSave={handleSaveBudget}
          onAutoFill={handleAutoFill}
          historicalData={profile}
          saving={saving}
          autoFilling={autoFilling}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BudgetVsActualChart budget={currentBudget} actual={profile} />
          <BudgetInsights budget={currentBudget} actual={profile} historicalSnapshots={snapshots} />
        </div>

        {budgets.length > 0 && (
          <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Budget History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Period</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Type</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Revenue Target</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Total Budget</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.slice(0, 5).map((b) => {
                    const total = (b.food_beverage_budget || 0) + (b.staff_costs_budget || 0) + 
                                  (b.fixed_costs_budget || 0) + (b.utilities_budget || 0) + 
                                  (b.operating_expenses_budget || 0);
                    return (
                      <tr key={b.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                        <td className="py-3 px-4 text-white">
                          {new Date(b.period_start).toLocaleDateString()} - {new Date(b.period_end).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-slate-400 capitalize">{b.period_type}</td>
                        <td className="py-3 px-4 text-right text-emerald-400">€{(b.revenue_target || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-slate-300">€{total.toLocaleString()}</td>
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