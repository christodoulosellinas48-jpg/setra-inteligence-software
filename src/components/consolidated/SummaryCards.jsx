import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, BarChart3, Building2 } from 'lucide-react';

export default function SummaryCards({ metrics }) {
  const cards = [
    {
      icon: DollarSign,
      label: 'Total Monthly Revenue',
      value: `€${metrics.totalRevenue.toLocaleString()}`,
      sub: 'Across all entities',
      valueClass: 'text-white'
    },
    {
      icon: TrendingUp,
      label: 'Combined Net Profit',
      value: `€${metrics.totalProfit.toLocaleString()}`,
      sub: `${metrics.avgMargin.toFixed(1)}% avg margin`,
      valueClass: metrics.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
    },
    {
      icon: BarChart3,
      label: 'Portfolio Health Score',
      value: metrics.avgHealthScore.toFixed(0),
      sub: 'Average across businesses',
      valueClass: 'text-white'
    },
    {
      icon: Building2,
      label: 'Active Businesses',
      value: metrics.businessCount,
      sub: 'In your portfolio',
      valueClass: 'text-white'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ icon: Icon, label, value, sub, valueClass }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-[#151528]/80 border border-white/5 rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Icon className="w-4 h-4" />
            <span className="text-sm">{label}</span>
          </div>
          <p className={`text-3xl font-bold ${valueClass}`}>{value}</p>
          <p className="text-sm text-slate-500 mt-1">{sub}</p>
        </motion.div>
      ))}
    </div>
  );
}