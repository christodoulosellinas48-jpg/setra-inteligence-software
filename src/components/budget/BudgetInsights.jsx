import React from 'react';
import { Card } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { key: 'food_beverage', budgetKey: 'food_beverage_budget', actualKey: 'purchases_food_bev', label: 'Food & Beverage' },
  { key: 'staff', budgetKey: 'staff_costs_budget', actualKey: 'staff_costs', label: 'Staff Costs' },
  { key: 'fixed', budgetKey: 'fixed_costs_budget', actualKey: 'rent_fixed_costs', label: 'Fixed Costs' },
  { key: 'utilities', budgetKey: 'utilities_budget', actualKey: 'utilities', label: 'Utilities' },
  { key: 'operating', budgetKey: 'operating_expenses_budget', actualKey: 'other_operating', label: 'Operating Expenses' }
];

export default function BudgetInsights({ budget, actual, historicalSnapshots }) {
  const generateInsights = () => {
    const insights = [];
    
    if (!budget) {
      insights.push({
        type: 'info',
        icon: AlertCircle,
        title: 'No Budget Set',
        message: 'Create a budget to start tracking your spending against targets.'
      });
      return insights;
    }

    // Analyze each category
    CATEGORIES.forEach(cat => {
      const budgetVal = budget[cat.budgetKey] || 0;
      const actualVal = actual?.[cat.actualKey] || 0;
      
      if (budgetVal > 0) {
        const variance = ((actualVal - budgetVal) / budgetVal) * 100;
        
        if (variance > 15) {
          insights.push({
            type: 'warning',
            icon: AlertTriangle,
            title: `${cat.label} Overspending`,
            message: `You're ${variance.toFixed(0)}% over budget (€${(actualVal - budgetVal).toLocaleString()} excess). Review recent expenses to identify cost drivers.`
          });
        } else if (variance > 5) {
          insights.push({
            type: 'caution',
            icon: TrendingUp,
            title: `${cat.label} Cost Drift`,
            message: `Spending is ${variance.toFixed(0)}% above budget. Monitor closely to prevent further drift.`
          });
        } else if (variance < -20 && actualVal > 0) {
          insights.push({
            type: 'success',
            icon: TrendingDown,
            title: `${cat.label} Under Budget`,
            message: `You're ${Math.abs(variance).toFixed(0)}% under budget. Great cost control! Consider reallocating savings.`
          });
        }
      }
    });

    // Revenue target analysis
    if (budget.revenue_target > 0 && actual?.monthly_revenue) {
      const revenueVariance = ((actual.monthly_revenue - budget.revenue_target) / budget.revenue_target) * 100;
      
      if (revenueVariance < -10) {
        insights.push({
          type: 'warning',
          icon: AlertTriangle,
          title: 'Revenue Below Target',
          message: `Revenue is ${Math.abs(revenueVariance).toFixed(0)}% below target. Consider promotional activities or reviewing pricing strategy.`
        });
      } else if (revenueVariance > 10) {
        insights.push({
          type: 'success',
          icon: CheckCircle2,
          title: 'Revenue Exceeding Target',
          message: `Revenue is ${revenueVariance.toFixed(0)}% above target. Excellent performance! Ensure costs scale appropriately.`
        });
      }
    }

    // Total budget analysis
    const totalBudget = CATEGORIES.reduce((sum, cat) => sum + (budget[cat.budgetKey] || 0), 0);
    const totalActual = CATEGORIES.reduce((sum, cat) => sum + (actual?.[cat.actualKey] || 0), 0);
    
    if (totalBudget > 0) {
      const totalVariance = ((totalActual - totalBudget) / totalBudget) * 100;
      
      if (Math.abs(totalVariance) <= 5) {
        insights.push({
          type: 'success',
          icon: CheckCircle2,
          title: 'Overall Budget On Track',
          message: `Total spending is within 5% of budget. You're managing costs effectively.`
        });
      }
    }

    // Historical trend insights
    if (historicalSnapshots && historicalSnapshots.length >= 3) {
      const recentSnapshots = historicalSnapshots.slice(0, 3);
      const avgProfit = recentSnapshots.reduce((sum, s) => sum + (s.net_profit || 0), 0) / recentSnapshots.length;
      
      if (avgProfit < 0) {
        insights.push({
          type: 'warning',
          icon: AlertTriangle,
          title: 'Consistent Losses Detected',
          message: 'Recent periods show negative profit. Budget adjustments may be needed to return to profitability.'
        });
      }
    }

    if (insights.length === 0) {
      insights.push({
        type: 'info',
        icon: CheckCircle2,
        title: 'Budget Analysis Complete',
        message: 'No significant variances detected. Continue monitoring your spending patterns.'
      });
    }

    return insights;
  };

  const insights = generateInsights();

  const typeStyles = {
    warning: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    caution: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400'
  };

  return (
    <Card className="bg-[#151528]/80 border-white/5 p-6 rounded-2xl">
      <h3 className="text-lg font-semibold text-white mb-4">Budget Insights & Variance Analysis</h3>
      <div className="space-y-3">
        {insights.map((insight, idx) => {
          const Icon = insight.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "p-4 rounded-xl border",
                typeStyles[insight.type]
              )}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">{insight.title}</p>
                  <p className="text-sm opacity-80 mt-1">{insight.message}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}