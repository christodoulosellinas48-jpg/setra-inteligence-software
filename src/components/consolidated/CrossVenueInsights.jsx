import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, Zap, Info } from 'lucide-react';

function buildInsights(businesses) {
  const withData = businesses.filter(b => b.hasData && b.revenue > 0);
  if (withData.length < 2) return [];

  const insights = [];

  // Best performer by profit
  const best = [...withData].sort((a, b) => (b.profit ?? -Infinity) - (a.profit ?? -Infinity))[0];
  if (best) {
    insights.push({
      type: 'success',
      icon: TrendingUp,
      title: `Best performer: ${best.name}`,
      body: `Leading the portfolio with €${Math.round(best.profit).toLocaleString()} net profit and a ${best.margin.toFixed(1)}% margin.`,
    });
  }

  // Highest food cost vs portfolio avg
  const avgFoodCost = withData.reduce((s, b) => s + (b.foodCostRatio ?? 0), 0) / withData.length;
  const highFoodCost = withData.filter(b => b.foodCostRatio !== null && b.foodCostRatio > avgFoodCost + 5);
  highFoodCost.forEach(b => {
    insights.push({
      type: 'warning',
      icon: AlertTriangle,
      title: `Food cost alert: ${b.name}`,
      body: `Food cost is ${b.foodCostRatio.toFixed(1)}% vs portfolio average of ${avgFoodCost.toFixed(1)}%. Review supplier pricing or portion control.`,
    });
  });

  // Lowest margin venue (excluding €0)
  const lowestMargin = [...withData].sort((a, b) => (a.margin ?? 100) - (b.margin ?? 100))[0];
  if (lowestMargin && lowestMargin.id !== best?.id) {
    insights.push({
      type: 'info',
      icon: Info,
      title: `Margin opportunity: ${lowestMargin.name}`,
      body: `Running at ${lowestMargin.margin.toFixed(1)}% margin — the lowest in the portfolio. A 2% improvement would add ~€${Math.round(lowestMargin.revenue * 0.02).toLocaleString()}/mo.`,
    });
  }

  // Staff cost saving opportunity
  const avgStaffCost = withData.reduce((s, b) => s + (b.staffCostRatio ?? 0), 0) / withData.length;
  const lowestStaffCost = [...withData].sort((a, b) => (a.staffCostRatio ?? 100) - (b.staffCostRatio ?? 100))[0];
  const highestStaffCost = [...withData].sort((a, b) => (b.staffCostRatio ?? 0) - (a.staffCostRatio ?? 0))[0];
  if (lowestStaffCost && highestStaffCost && lowestStaffCost.id !== highestStaffCost.id && highestStaffCost.staffCostRatio - lowestStaffCost.staffCostRatio > 5) {
    const potentialSaving = Math.round(highestStaffCost.revenue * ((highestStaffCost.staffCostRatio - lowestStaffCost.staffCostRatio) / 100));
    insights.push({
      type: 'tip',
      icon: Zap,
      title: `Staffing efficiency gap`,
      body: `${lowestStaffCost.name} runs at ${lowestStaffCost.staffCostRatio.toFixed(1)}% staff cost vs ${highestStaffCost.staffCostRatio.toFixed(1)}% at ${highestStaffCost.name}. Closing this gap could save ~€${potentialSaving.toLocaleString()}/mo.`,
    });
  }

  return insights.slice(0, 4);
}

const STYLES = {
  success: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', icon: 'text-emerald-400', title: 'text-emerald-300' },
  warning: { border: 'border-amber-500/20', bg: 'bg-amber-500/5', icon: 'text-amber-400', title: 'text-amber-300' },
  info:    { border: 'border-cyan-500/20', bg: 'bg-cyan-500/5', icon: 'text-cyan-400', title: 'text-cyan-300' },
  tip:     { border: 'border-[#7B3BFF]/20', bg: 'bg-[#7B3BFF]/5', icon: 'text-[#C084FC]', title: 'text-[#C084FC]' },
};

export default function CrossVenueInsights({ businesses }) {
  const insights = buildInsights(businesses);
  if (insights.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Cross-Venue Insights</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((insight, i) => {
          const s = STYLES[insight.type];
          const Icon = insight.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-xl border ${s.border} ${s.bg} p-4 flex gap-3`}
            >
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${s.icon}`} />
              <div>
                <p className={`text-sm font-semibold ${s.title} mb-0.5`}>{insight.title}</p>
                <p className="text-sm text-slate-400 leading-relaxed">{insight.body}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}