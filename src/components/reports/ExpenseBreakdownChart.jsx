import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '@/components/ui/card';

const COLORS = {
  'Food & Beverage': '#10b981',
  'Staff Costs': '#8b5cf6',
  'Fixed Costs': '#3b82f6',
  'Utilities': '#06b6d4',
  'Other Operating': '#64748b'
};

export default function ExpenseBreakdownChart({ data }) {
  const chartData = [
    { name: 'Food & Beverage', value: data.purchases_food_bev || 0 },
    { name: 'Staff Costs', value: data.staff_costs || 0 },
    { name: 'Fixed Costs', value: data.rent_fixed_costs || 0 },
    { name: 'Utilities', value: data.utilities || 0 },
    { name: 'Other Operating', value: data.other_operating || 0 }
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <p className="text-white font-medium">{payload[0].payload.name}</p>
          <p className="text-emerald-400">€{payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl">
      <h3 className="text-lg font-semibold text-white mb-4">Expenses by Category</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis type="number" stroke="#64748b" tickFormatter={(v) => `€${v.toLocaleString()}`} />
            <YAxis type="category" dataKey="name" stroke="#64748b" width={120} tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#64748b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}