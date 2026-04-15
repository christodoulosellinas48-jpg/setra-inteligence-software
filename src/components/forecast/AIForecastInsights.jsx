import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, DollarSign, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

const ICON_MAP = { success: TrendingUp, warning: AlertTriangle, caution: TrendingDown, info: Lightbulb, profit: DollarSign };
const STYLE_MAP = {
  success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  warning: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
  caution: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  info:    'bg-blue-500/10 border-blue-500/30 text-blue-400',
  profit:  'bg-[#7B3BFF]/10 border-[#7B3BFF]/30 text-[#C084FC]',
};

export default function AIForecastInsights({ business, snapshots, vatPeriods, projections, scenario }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generateAIInsights = async () => {
    setLoading(true);
    try {
      // Build rich context from all data sources
      const revenueHistory = snapshots.slice(0, 12).map(s => ({
        period: s.period_start,
        revenue: s.monthly_revenue || 0,
        profit: s.net_profit || 0,
        margin: s.profit_margin || 0,
        foodCost: s.purchases_food_bev || 0,
        staffCost: s.staff_costs || 0,
      }));

      const vatContext = vatPeriods.slice(0, 4).map(p => ({
        period: `${p.period_start} to ${p.period_end}`,
        outputVat: p.output_vat || 0,
        inputVat: p.input_vat || 0,
        netPayable: p.net_vat_payable || 0,
        status: p.status,
      }));

      const projectionSummary = projections.map(p => ({
        month: p.period,
        revenue: p.revenue,
        expenses: p.expenses,
        profit: p.profit,
        margin: parseFloat(p.margin.toFixed(1)),
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        model: 'claude_sonnet_4_6',
        prompt: `You are an expert CFO advisor for hospitality businesses. Analyze this financial data for "${business.name}" (${business.industry_group}) and generate 5-6 specific, actionable insights.

CURRENT FINANCIALS:
- Monthly Revenue: €${business.monthly_revenue || 0}
- Food & Beverage Costs: €${business.purchases_food_bev || 0}
- Staff Costs: €${business.staff_costs || 0}
- Fixed Costs: €${business.rent_fixed_costs || 0}
- Utilities: €${business.utilities || 0}
- Other Operating: €${business.other_operating || 0}
- VAT Rate: ${business.vat_rate || 19}%
- Currency: ${business.currency || 'EUR'}

HISTORICAL SNAPSHOTS (most recent first):
${JSON.stringify(revenueHistory, null, 2)}

VAT PERIODS:
${JSON.stringify(vatContext, null, 2)}

${scenario.toUpperCase()} SCENARIO PROJECTIONS (next 6 months):
${JSON.stringify(projectionSummary, null, 2)}

Generate exactly 6 insights. Each must be:
1. Specific to THIS business's data (use actual numbers)
2. Actionable — what should they DO
3. Prioritized by financial impact

Types to use: "success" (positive trend), "warning" (urgent risk), "caution" (watch closely), "info" (opportunity), "profit" (profit-improvement action).

Return JSON only.`,
        response_json_schema: {
          type: 'object',
          properties: {
            insights: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  title: { type: 'string' },
                  message: { type: 'string' },
                  impact: { type: 'string', description: 'Estimated monthly financial impact e.g. "+€500/month"' },
                }
              }
            },
            summary: { type: 'string', description: 'One-sentence executive summary' },
            risk_level: { type: 'string', description: 'overall: low / medium / high' }
          }
        }
      });

      setInsights(result);
      setGenerated(true);
    } catch (err) {
      console.error('AI insights error', err);
    }
    setLoading(false);
  };

  const riskColor = { low: 'text-emerald-400', medium: 'text-amber-400', high: 'text-rose-400' };

  return (
    <Card className="bg-[#151528]/80 border-white/5 p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C084FC]" />
            AI Financial Intelligence
          </h3>
          <p className="text-slate-500 text-sm mt-0.5">Powered by deep analysis of your historical data, VAT periods & projections</p>
        </div>
        <Button onClick={generateAIInsights} disabled={loading} size="sm" variant={generated ? 'outline' : 'default'}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : generated ? <RefreshCw className="w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          {loading ? 'Analysing...' : generated ? 'Refresh' : 'Generate AI Insights'}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center py-10 gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-[#7B3BFF]/20 border-t-[#7B3BFF] animate-spin" />
              <Sparkles className="w-5 h-5 text-[#C084FC] absolute inset-0 m-auto animate-pulse" />
            </div>
            <p className="text-slate-400 text-sm">Analysing revenue trends, VAT data, cost structures...</p>
          </motion.div>
        )}

        {!loading && !generated && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center py-8 gap-2 text-center">
            <Sparkles className="w-10 h-10 text-slate-600 mb-1" />
            <p className="text-slate-400 text-sm">Click "Generate AI Insights" to get a deep analysis of your business performance, risks, and opportunities based on all your financial data.</p>
            {snapshots.length === 0 && (
              <p className="text-amber-400 text-xs mt-2">⚠ Save financial snapshots in Reports for richer historical analysis</p>
            )}
          </motion.div>
        )}

        {!loading && generated && insights && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Executive Summary */}
            {insights.summary && (
              <div className="p-4 bg-[#7B3BFF]/10 border border-[#7B3BFF]/20 rounded-xl">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-slate-300 text-sm flex-1">{insights.summary}</p>
                  {insights.risk_level && (
                    <span className={`text-xs font-semibold uppercase tracking-wide ${riskColor[insights.risk_level] || 'text-slate-400'}`}>
                      {insights.risk_level} risk
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Individual Insights */}
            <div className="space-y-2.5">
              {(insights.insights || []).map((insight, idx) => {
                const Icon = ICON_MAP[insight.type] || Lightbulb;
                const style = STYLE_MAP[insight.type] || STYLE_MAP.info;
                return (
                  <motion.div key={idx} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.07 }}
                    className={`p-4 rounded-xl border ${style}`}>
                    <div className="flex items-start gap-3">
                      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="font-medium text-sm">{insight.title}</p>
                          {insight.impact && (
                            <span className="text-xs opacity-75 font-mono whitespace-nowrap">{insight.impact}</span>
                          )}
                        </div>
                        <p className="text-sm opacity-80 mt-1 leading-relaxed">{insight.message}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <p className="text-xs text-slate-600 text-center">AI insights are based on {snapshots.length} historical snapshots · {vatPeriods.length} VAT periods · {scenario} scenario</p>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}