import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Card } from '@/components/ui/card';

const CATEGORIES = [
  { key: 'food_beverage', budgetKey: 'food_beverage_budget', actualKey: 'purchases_food_bev', label: 'Food & Bev' },
  { key: 'staff', budgetKey: 'staff_costs_budget', actualKey: 'staff_costs', label: 'Staff' },
  { key: 'fixed', budgetKey: 'fixed_costs_budget', actualKey: 'rent_fixed_costs', label: 'Fixed' },
  { key: 'utilities', budgetKey: 'utilities_budget', actualKey: 'utilities', label: 'Utilities' },
  { key: 'operating', budgetKey: 'operating_expenses_budget', actualKey: 'other_operating', label: 'Operating' }
];

export default function BudgetVsActualChart({ budget, actual }) {
  const chartData = CATEGORIES.map(cat => {
    const budgetVal = budget?.[cat.budgetKey] || 0;
    const actualVal = actual?.[cat.actualKey] || 0;
    const variance = budgetVal > 0 ? ((actualVal - budgetVal) / budgetVal) * 100 : 0;
    
    return {
      name: cat.label,
      budget: budgetVal,
      actual: actualVal,
      variance,
      status: actualVal > budgetVal ? 'over' : actualVal < budgetVal * 0.9 ? 'under' : 'on-track'
    };
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <p className="text-white font-medium mb-2">{data.name}</p>
          <p className="text-slate-400">Budget: <span className="text-white">€{data.budget.toLocaleString()}</span></p>
          <p className="text-slate-400">Actual: <span className={data.status === 'over' ? 'text-rose-400' : 'text-emerald-400'}>€{data.actual.toLocaleString()}</span></p>
          <p className={`text-sm mt-1 ${data.variance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {data.variance > 0 ? '+' : ''}{data.variance.toFixed(1)}% variance
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl">
      <h3 className="text-lg font-semibold text-white mb-4">Budget vs Actual Spending</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis stroke="#64748b" tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`} tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="budget" name="Budget" fill="#475569" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" name="Actual" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.status === 'over' ? '#f43f5e' : entry.status === 'under' ? '#10b981' : '#3b82f6'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-slate-600" />
          <span className="text-sm text-slate-400">Budget</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span className="text-sm text-slate-400">Under Budget</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-sm text-slate-400">On Track</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-rose-500" />
          <span className="text-sm text-slate-400">Over Budget</span>
        </div>
      </div>
    </Card>
  );
}