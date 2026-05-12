import React from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, AlertOctagon, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HealthIndicator({ status, score, noData = false }) {
  if (noData) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-2xl border border-white/[0.06] p-8 bg-[#0F0F1E]/60"
      >
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 rounded-2xl bg-[#2A2A3A]/50 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-8 h-8 text-slate-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-400 mb-2">No data yet</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Setra will score your financial health once you've entered your monthly figures or connected a data source.
            </p>
            <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full w-0 rounded-full bg-slate-700" />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const configs = {
    healthy: {
      icon: Shield,
      title: 'Healthy Position',
      description: 'Your business shows strong financial health with balanced cost structures.',
      gradient: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
      border: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
      barColor: 'bg-emerald-500',
      glow: 'shadow-emerald-500/20'
    },
    warning: {
      icon: AlertTriangle,
      title: 'Margin Pressure',
      description: 'Some cost ratios are approaching threshold levels. Review recommended actions.',
      gradient: 'from-amber-500/20 via-amber-500/10 to-transparent',
      border: 'border-amber-500/30',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-400',
      barColor: 'bg-amber-500',
      glow: 'shadow-amber-500/20'
    },
    risk: {
      icon: AlertOctagon,
      title: 'Profitability Risk',
      description: 'Critical cost structure issues detected. Immediate attention required.',
      gradient: 'from-rose-500/20 via-rose-500/10 to-transparent',
      border: 'border-rose-500/30',
      iconBg: 'bg-rose-500/20',
      iconColor: 'text-rose-400',
      barColor: 'bg-rose-500',
      glow: 'shadow-rose-500/20'
    }
  };

  const config = configs[status] || configs.healthy;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-8",
        config.border,
        `shadow-lg ${config.glow}`
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br", config.gradient)} />
      <div className="relative flex items-start gap-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className={cn("w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0", config.iconBg)}
        >
          <Icon className={cn("w-8 h-8", config.iconColor)} />
        </motion.div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-white mb-2">{config.title}</h3>
          <p className="text-slate-400 leading-relaxed">{config.description}</p>
          {score !== undefined && (
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className={cn("h-full rounded-full", config.barColor)}
                />
              </div>
              <span className="text-sm font-semibold text-slate-300">{score}%</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}