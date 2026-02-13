import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function FinancialSummaryTable({ data, calculations }) {
  const rows = [
    { label: 'Monthly Revenue', value: data.monthly_revenue, type: 'revenue' },
    { label: 'Food & Beverage Purchases', value: data.purchases_food_bev, type: 'expense' },
    { label: 'Staff Costs', value: data.staff_costs, type: 'expense' },
    { label: 'Rent / Fixed Costs', value: data.rent_fixed_costs, type: 'expense' },
    { label: 'Utilities', value: data.utilities, type: 'expense' },
    { label: 'Other Operating Expenses', value: data.other_operating, type: 'expense' },
    { label: 'Total Expenses', value: (data.purchases_food_bev || 0) + (data.staff_costs || 0) + (data.rent_fixed_costs || 0) + (data.utilities || 0) + (data.other_operating || 0), type: 'subtotal' },
    { label: 'Net Profit', value: calculations.netProfit, type: 'profit' }
  ];

  const ratios = [
    { label: 'Profit Margin', value: calculations.profitMargin, suffix: '%', status: calculations.profitMarginStatus },
    { label: 'Food Cost Ratio', value: calculations.foodCostRatio, suffix: '%', status: calculations.foodCostStatus },
    { label: 'Staff Cost Ratio', value: calculations.staffCostRatio, suffix: '%', status: calculations.staffCostStatus },
    { label: 'Fixed Cost Load', value: calculations.fixedCostRatio, suffix: '%', status: calculations.fixedCostStatus },
    { label: 'Break-even Revenue', value: calculations.breakEvenRevenue, prefix: '€' }
  ];

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl">
      <h3 className="text-lg font-semibold text-white mb-4">Financial Summary</h3>
      
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">Income & Expenses</h4>
          <div className="space-y-2">
            {rows.map((row, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "flex items-center justify-between py-2 px-3 rounded-lg",
                  row.type === 'subtotal' && "bg-slate-800/50 border-t border-slate-700 mt-2",
                  row.type === 'profit' && "bg-emerald-500/10 border border-emerald-500/20"
                )}
              >
                <span className={cn(
                  "text-sm",
                  row.type === 'profit' ? "text-emerald-400 font-semibold" : "text-slate-300"
                )}>
                  {row.label}
                </span>
                <span className={cn(
                  "font-medium",
                  row.type === 'revenue' && "text-emerald-400",
                  row.type === 'expense' && "text-slate-300",
                  row.type === 'subtotal' && "text-rose-400",
                  row.type === 'profit' && (row.value >= 0 ? "text-emerald-400" : "text-rose-400")
                )}>
                  €{(row.value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">Key Ratios</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {ratios.map((ratio, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 px-3 bg-slate-800/30 rounded-lg">
                <span className="text-sm text-slate-300">{ratio.label}</span>
                <span className={cn(
                  "font-medium",
                  ratio.status === 'healthy' && "text-emerald-400",
                  ratio.status === 'warning' && "text-amber-400",
                  ratio.status === 'risk' && "text-rose-400",
                  !ratio.status && "text-slate-300"
                )}>
                  {ratio.prefix}{(ratio.value || 0).toLocaleString('en-US', { maximumFractionDigits: 1 })}{ratio.suffix}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}