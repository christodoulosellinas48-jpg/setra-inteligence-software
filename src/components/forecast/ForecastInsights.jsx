import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Target, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ForecastInsights({ projections, currentFinancials, historicalSnapshots }) {
  const generateInsights = () => {
    const insights = [];
    
    if (!projections || projections.length === 0 || !currentFinancials) {
      insights.push({
        type: 'info',
        icon: Lightbulb,
        title: 'Build Your Forecast',
        message: 'Save financial snapshots over time to generate accurate trend-based projections.'
      });
      return insights;
    }

    const lastProjection = projections[projections.length - 1];
    const firstProjection = projections[0];
    
    // Revenue trend
    if (lastProjection && firstProjection) {
      const revenueGrowth = ((lastProjection.revenue - firstProjection.revenue) / firstProjection.revenue) * 100;
      
      if (revenueGrowth > 10) {
        insights.push({
          type: 'success',
          icon: TrendingUp,
          title: 'Positive Revenue Outlook',
          message: `Projections show ${revenueGrowth.toFixed(0)}% revenue growth over 6 months. Consider capacity planning and inventory adjustments.`
        });
      } else if (revenueGrowth < -10) {
        insights.push({
          type: 'warning',
          icon: TrendingDown,
          title: 'Revenue Decline Projected',
          message: `Trend suggests ${Math.abs(revenueGrowth).toFixed(0)}% revenue decline. Focus on customer retention and marketing initiatives.`
        });
      }
    }

    // Profit margin analysis
    if (lastProjection) {
      const projectedMargin = lastProjection.revenue > 0 
        ? (lastProjection.profit / lastProjection.revenue) * 100 
        : 0;
      
      if (projectedMargin < 5) {
        insights.push({
          type: 'warning',
          icon: AlertTriangle,
          title: 'Margin Pressure Ahead',
          message: `Projected profit margin of ${projectedMargin.toFixed(1)}% is tight. Review pricing strategy and cost structure.`
        });
      } else if (projectedMargin > 15) {
        insights.push({
          type: 'success',
          icon: DollarSign,
          title: 'Strong Profitability Outlook',
          message: `Projected ${projectedMargin.toFixed(1)}% profit margin indicates healthy business fundamentals.`
        });
      }
    }

    // Expense trend
    if (lastProjection && firstProjection) {
      const expenseGrowth = ((lastProjection.expenses - firstProjection.expenses) / firstProjection.expenses) * 100;
      const revenueGrowth = ((lastProjection.revenue - firstProjection.revenue) / firstProjection.revenue) * 100;
      
      if (expenseGrowth > revenueGrowth + 5) {
        insights.push({
          type: 'caution',
          icon: AlertTriangle,
          title: 'Cost Growth Outpacing Revenue',
          message: `Expenses growing ${(expenseGrowth - revenueGrowth).toFixed(0)}% faster than revenue. Implement cost controls to protect margins.`
        });
      }
    }

    // Break-even analysis
    const monthsToBreakeven = projections.findIndex(p => p.profit > 0);
    if (currentFinancials.netProfit < 0 && monthsToBreakeven > 0) {
      insights.push({
        type: 'info',
        icon: Target,
        title: 'Path to Profitability',
        message: `Based on current trends, break-even projected in ${monthsToBreakeven} month${monthsToBreakeven > 1 ? 's' : ''}. Focus on revenue growth and cost optimization.`
      });
    }

    // Historical volatility check
    if (historicalSnapshots && historicalSnapshots.length >= 3) {
      const profits = historicalSnapshots.map(s => s.net_profit || 0);
      const avgProfit = profits.reduce((a, b) => a + b, 0) / profits.length;
      const variance = profits.reduce((sum, p) => sum + Math.pow(p - avgProfit, 2), 0) / profits.length;
      const stdDev = Math.sqrt(variance);
      const cv = avgProfit !== 0 ? (stdDev / Math.abs(avgProfit)) * 100 : 0;
      
      if (cv > 50) {
        insights.push({
          type: 'caution',
          icon: AlertTriangle,
          title: 'High Earnings Volatility',
          message: 'Profit fluctuates significantly. Build cash reserves and consider stabilizing revenue streams.'
        });
      }
    }

    // Seasonal considerations
    const currentMonth = new Date().getMonth();
    if ([10, 11, 0].includes(currentMonth)) {
      insights.push({
        type: 'info',
        icon: Lightbulb,
        title: 'Seasonal Considerations',
        message: 'Holiday season may impact spending patterns. Factor in seasonal demand when planning inventory and staffing.'
      });
    }

    if (insights.length === 0) {
      insights.push({
        type: 'success',
        icon: TrendingUp,
        title: 'Stable Outlook',
        message: 'Projections indicate steady business performance. Continue monitoring key metrics.'
      });
    }

    return insights;
  };

  const insights = generateInsights();

  const typeStyles = {
    warning: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    caution: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400'
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl">
      <h3 className="text-lg font-semibold text-white mb-4">Forecast Insights & Guidance</h3>
      <div className="space-y-3">
        {insights.map((insight, idx) => {
          const Icon = insight.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "p-4 rounded-xl border",
                typeStyles[insight.type]
              )}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">{insight.title}</p>
                  <p className="text-sm opacity-80 mt-1">{insight.message}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}