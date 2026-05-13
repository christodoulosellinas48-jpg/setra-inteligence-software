import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function BudgetVsActualMini({ budget, actual }) {
  const categories = [
    { key: 'food', budgetKey: 'food_beverage_budget', actualKey: 'purchases_food_bev', label: 'Food' },
    { key: 'staff', budgetKey: 'staff_costs_budget', actualKey: 'staff_costs', label: 'Staff' },
    { key: 'fixed', budgetKey: 'fixed_costs_budget', actualKey: 'rent_fixed_costs', label: 'Fixed' }
  ];

  const chartData = categories.map(cat => {
    const budgetVal = budget?.[cat.budgetKey] || 0;
    const actualVal = actual?.[cat.actualKey] || 0;
    const variance = budgetVal > 0 ? ((actualVal - budgetVal) / budgetVal) * 100 : 0;
    
    return {
      name: cat.label,
      value: actualVal,
      budget: budgetVal,
      variance,
      status: actualVal > budgetVal ? 'over' : 'under'
    };
  });

  const totalBudget = chartData.reduce((sum, d) => sum + d.budget, 0);
  const totalActual = chartData.reduce((sum, d) => sum + d.value, 0);
  const overallVariance = totalBudget > 0 ? ((totalActual - totalBudget) / totalBudget) * 100 : 0;
  const noBudget = !budget || totalBudget === 0;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs">
          <p className="text-white font-medium">{data.name}</p>
          <p className="text-slate-400">Budget: €{data.budget.toLocaleString()}</p>
          <p className="text-slate-400">Actual: €{data.value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  if (noBudget) {
    return (
      <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center min-h-[280px] text-center">
        <TrendingDown className="w-10 h-10 text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-white mb-1">Budget Performance</h3>
        <p className="text-sm text-slate-500 mb-4 max-w-xs">No budget set — create a budget to track performance against targets</p>
        <a href="/Budgeting" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#7B3BFF]/20 border border-[#7B3BFF]/30 text-[#C084FC] text-xs font-medium rounded-lg hover:bg-[#7B3BFF]/30 transition-colors">
          Set a budget →
        </a>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Budget Performance</h3>
          <p className="text-sm text-slate-500">Current month vs budget</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">
            {overallVariance > 0 ? '+' : ''}{overallVariance.toFixed(1)}%
          </p>
          <div className="flex items-center gap-1 text-sm">
            {overallVariance > 0 ? (
              <TrendingUp className="w-4 h-4 text-rose-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-emerald-400" />
            )}
            <span className={overallVariance > 0 ? 'text-rose-400' : 'text-emerald-400'}>
              {overallVariance > 0 ? 'Over' : 'Under'} budget
            </span>
          </div>
        </div>
      </div>

      <div className="h-48 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis stroke="#64748b" tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`} tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.status === 'over' ? '#f43f5e' : '#10b981'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {chartData.map(item => (
          <div key={item.name} className="bg-slate-800/30 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">{item.name}</p>
            <p className={`text-sm font-semibold ${item.status === 'over' ? 'text-rose-400' : 'text-emerald-400'}`}>
              {item.variance > 0 ? '+' : ''}{item.variance.toFixed(0)}%
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}