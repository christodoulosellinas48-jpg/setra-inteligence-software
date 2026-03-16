import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { format, addMonths } from 'date-fns';

export default function CashFlowMiniChart({ currentBusiness, snapshots }) {
  const projectionData = useMemo(() => {
    if (!currentBusiness) return [];

    // Calculate trend from historical data
    let growthRate = 0;
    if (snapshots && snapshots.length >= 2) {
      const sorted = [...snapshots].sort((a, b) => new Date(a.period_start) - new Date(b.period_start));
      const recent = sorted.slice(-3);
      
      if (recent.length >= 2) {
        const first = recent[0].net_profit || 0;
        const last = recent[recent.length - 1].net_profit || 0;
        growthRate = first !== 0 ? (last - first) / Math.abs(first) / recent.length : 0;
      }
    }

    const baseProfit = (currentBusiness.monthly_revenue || 0) - 
                       (currentBusiness.purchases_food_bev || 0) -
                       (currentBusiness.staff_costs || 0) -
                       (currentBusiness.rent_fixed_costs || 0) -
                       (currentBusiness.utilities || 0) -
                       (currentBusiness.other_operating || 0);

    const data = [];
    const now = new Date();
    
    for (let i = 0; i <= 3; i++) {
      const monthDate = addMonths(now, i);
      const projectedProfit = baseProfit * (1 + (growthRate * i));
      
      data.push({
        month: format(monthDate, 'MMM'),
        profit: Math.round(projectedProfit),
        isCurrent: i === 0
      });
    }
    
    return data;
  }, [currentBusiness, snapshots]);

  const trend = projectionData.length > 1 ? 
    projectionData[projectionData.length - 1].profit - projectionData[0].profit : 0;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs">
          <p className="text-white font-medium">{data.month}</p>
          <p className="text-slate-400">Projected: €{data.profit.toLocaleString()}</p>
          {data.isCurrent && <p className="text-emerald-400 text-[10px]">Current</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Cash Flow Projection</h3>
          <p className="text-sm text-slate-500">Next 3 months trend</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend >= 0 ? '+' : ''}€{Math.abs(trend).toLocaleString()}
          </p>
          <div className="flex items-center gap-1 text-sm justify-end">
            {trend >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            )}
            <span className={trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {trend >= 0 ? 'Growing' : 'Declining'}
            </span>
          </div>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={projectionData}>
            <defs>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis stroke="#64748b" tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`} tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="profit" 
              stroke="#10b981" 
              strokeWidth={2}
              fill="url(#colorProfit)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        {projectionData.slice(1).map((item, idx) => (
          <div key={idx} className="bg-slate-800/30 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">{item.month}</p>
            <p className={`text-sm font-semibold ${item.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              €{(item.profit/1000).toFixed(1)}k
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}