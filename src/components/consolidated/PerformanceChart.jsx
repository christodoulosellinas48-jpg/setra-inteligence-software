import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const METRIC_OPTIONS = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'profit', label: 'Net Profit (€)' },
  { value: 'margin', label: 'Margin (%)' },
  { value: 'foodCostRatio', label: 'Food Cost %' },
  { value: 'staffCostRatio', label: 'Staff Cost %' },
];

function formatYAxis(metric, v) {
  if (metric === 'margin' || metric === 'foodCostRatio' || metric === 'staffCostRatio') return `${v.toFixed(0)}%`;
  return `€${(v / 1000).toFixed(0)}k`;
}

function formatTooltipValue(metric, v) {
  if (v === null || v === undefined) return '—';
  if (metric === 'margin' || metric === 'foodCostRatio' || metric === 'staffCostRatio') return `${v.toFixed(1)}%`;
  return '€' + Math.round(v).toLocaleString('en-EU');
}

const CustomTooltip = ({ active, payload, metric }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
      <p className="text-white font-medium mb-1">{d.name}</p>
      <p className="text-slate-400 text-xs mb-2">{d.type}</p>
      <p className="text-cyan-400 text-sm">
        {METRIC_OPTIONS.find(o => o.value === metric)?.label}: {formatTooltipValue(metric, d[metric])}
      </p>
    </div>
  );
};

export default function PerformanceChart({ data }) {
  const [metric, setMetric] = useState('revenue');

  const chartData = data.map(b => ({
    ...b,
    [metric]: b[metric] ?? 0,
  }));

  const getBarColor = (entry) => {
    if (metric === 'margin' || metric === 'profit') {
      return (entry[metric] ?? 0) >= 0 ? '#10b981' : '#f43f5e';
    }
    if (metric === 'foodCostRatio' || metric === 'staffCostRatio') return '#f59e0b';
    return '#7B3BFF';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="text-lg font-semibold text-white">Business Performance Comparison</h3>
        <div className="flex flex-wrap gap-2">
          {METRIC_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => setMetric(o.value)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                metric === o.value
                  ? 'bg-[#7B3BFF]/20 border-[#7B3BFF]/50 text-[#C084FC]'
                  : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ left: 10, right: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              angle={-35}
              textAnchor="end"
              height={70}
            />
            <YAxis
              stroke="#64748b"
              tickFormatter={(v) => formatYAxis(metric, v)}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip metric={metric} />} />
            <Bar dataKey={metric} radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={getBarColor(entry)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}