import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, AlertCircle, TrendingUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InsightCard({ type, message, delay = 0 }) {
  const configs = {
    warning: {
      icon: AlertCircle,
      bg: 'bg-amber-500/5',
      border: 'border-amber-500/20',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-400'
    },
    success: {
      icon: TrendingUp,
      bg: 'bg-emerald-500/5',
      border: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400'
    },
    tip: {
      icon: Lightbulb,
      bg: 'bg-blue-500/5',
      border: 'border-blue-500/20',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400'
    },
    info: {
      icon: Info,
      bg: 'bg-slate-500/5',
      border: 'border-slate-500/20',
      iconBg: 'bg-slate-500/10',
      iconColor: 'text-slate-400'
    }
  };

  const config = configs[type] || configs.info;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl border",
        config.bg,
        config.border
      )}
    >
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", config.iconBg)}>
        <Icon className={cn("w-5 h-5", config.iconColor)} />
      </div>
      <p className="text-sm text-slate-300 leading-relaxed pt-2">{message}</p>
    </motion.div>
  );
}