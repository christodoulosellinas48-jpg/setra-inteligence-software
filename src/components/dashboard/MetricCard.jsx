import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function MetricCard({ 
  title, 
  value, 
  suffix = '', 
  prefix = '',
  status = 'neutral', 
  benchmark,
  icon: Icon,
  delay = 0 
}) {
  const statusColors = {
    healthy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    risk: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    neutral: 'text-slate-300 bg-slate-700/30 border-slate-600/30'
  };

  const statusIndicators = {
    healthy: { icon: TrendingUp, label: 'Healthy' },
    warning: { icon: Minus, label: 'Warning' },
    risk: { icon: TrendingDown, label: 'At Risk' },
    neutral: { icon: Minus, label: '' }
  };

  const StatusIcon = statusIndicators[status].icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={cn(
        "relative p-6 rounded-2xl border backdrop-blur-sm",
        statusColors[status]
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wide">{title}</span>
        </div>
        {status !== 'neutral' && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            status === 'healthy' && "bg-emerald-500/20 text-emerald-400",
            status === 'warning' && "bg-amber-500/20 text-amber-400",
            status === 'risk' && "bg-rose-500/20 text-rose-400"
          )}>
            <StatusIcon className="w-3 h-3" />
            {statusIndicators[status].label}
          </div>
        )}
      </div>
      
      <div className="text-3xl font-bold text-white mb-2">
        {prefix}{typeof value === 'number' ? value.toLocaleString('en-US', { maximumFractionDigits: 1 }) : value}{suffix}
      </div>
      
      {benchmark && (
        <div className="text-xs text-slate-500">
          Industry benchmark: {benchmark}
        </div>
      )}
    </motion.div>
  );
}