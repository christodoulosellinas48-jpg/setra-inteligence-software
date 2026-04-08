import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
      <p className="text-white font-medium mb-1">{data.name}</p>
      <p className="text-slate-400 text-sm">{data.type}</p>
      <p className="text-cyan-400 mt-2">Revenue: €{data.revenue.toLocaleString()}</p>
      <p className={data.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
        Profit: €{data.profit.toLocaleString()}
      </p>
      <p className="text-slate-300">Margin: {data.margin.toFixed(1)}%</p>
    </div>
  );
};

export default function PerformanceChart({ data }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Business Performance Comparison</h3>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 20, right: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke="#64748b"
              tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="profit" name="Net Profit" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#f43f5e'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}