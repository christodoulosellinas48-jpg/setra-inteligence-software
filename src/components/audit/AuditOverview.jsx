import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, subDays, subMonths } from 'date-fns';
import { Calendar as CalendarIcon, Play, AlertCircle, TrendingUp, DollarSign, Loader2 } from 'lucide-react';
import { runFullAudit } from './auditCalculations';
import { motion } from 'framer-motion';
import AuditEmptyState from './AuditEmptyState';
import AuditExplainerCard from './AuditExplainerCard';
import AuditHistoryList from './AuditHistoryList';

export default function AuditOverview({ businessId, onAuditComplete, onViewHistoricalAudit }) {
  const queryClient = useQueryClient();
  const [periodStart, setPeriodStart] = useState(subMonths(new Date(), 1));
  const [periodEnd, setPeriodEnd] = useState(new Date());
  const [quickPeriod, setQuickPeriod] = useState('month');

  const { data: business } = useQuery({
    queryKey: ['business', businessId],
    queryFn: () => base44.entities.Business.filter({ id: businessId }).then(r => r[0])
  });

  const { data: latestAudit, isLoading: loadingAudit } = useQuery({
    queryKey: ['latestAudit', businessId],
    queryFn: async () => {
      const runs = await base44.entities.AuditRun.filter({ business_id: businessId }, '-created_date', 1);
      if (runs.length === 0) return null;
      const findings = await base44.entities.AuditFinding.filter({ audit_run_id: runs[0].id });
      return { ...runs[0], findings };
    }
  });

  const { data: allAuditRuns } = useQuery({
    queryKey: ['allAuditRuns', businessId],
    queryFn: () => base44.entities.AuditRun.filter({ business_id: businessId }, '-created_date', 20)
  });

  const runAuditMutation = useMutation({
    mutationFn: async ({ basicOnly } = {}) => {
      const [items, recipes, sales, purchases, inventoryAdj, laborShifts] = await Promise.all([
        base44.entities.Item.filter({ business_id: businessId }),
        base44.entities.Recipe.filter({ business_id: businessId }),
        base44.entities.Sale.filter({ business_id: businessId, date: { $gte: format(periodStart, 'yyyy-MM-dd'), $lte: format(periodEnd, 'yyyy-MM-dd') } }),
        base44.entities.Purchase.filter({ business_id: businessId, date: { $gte: format(periodStart, 'yyyy-MM-dd'), $lte: format(periodEnd, 'yyyy-MM-dd') } }),
        base44.entities.InventoryAdjustment.filter({ business_id: businessId, date: { $gte: format(periodStart, 'yyyy-MM-dd'), $lte: format(periodEnd, 'yyyy-MM-dd') } }),
        base44.entities.LaborShift.filter({ business_id: businessId, date: { $gte: format(periodStart, 'yyyy-MM-dd'), $lte: format(periodEnd, 'yyyy-MM-dd') } })
      ]);

      const findings = runFullAudit({ business, items, recipes, sales, purchases, inventoryAdjustments: inventoryAdj, laborShifts });

      const totalImpact = findings.reduce((s, f) => s + (f.estimated_monthly_impact_eur || 0), 0);
      const highCount = findings.filter(f => f.severity === 'high').length;

      const auditRun = await base44.entities.AuditRun.create({
        business_id: businessId,
        period_start: format(periodStart, 'yyyy-MM-dd'),
        period_end: format(periodEnd, 'yyyy-MM-dd'),
        status: 'draft',
        total_findings: findings.length,
        high_findings: highCount,
        total_impact_eur: totalImpact
      });

      await Promise.all(findings.map(finding =>
        base44.entities.AuditFinding.create({ audit_run_id: auditRun.id, ...finding })
      ));

      return { auditRun, findings };
    },
    onSuccess: ({ findings }) => {
      queryClient.invalidateQueries(['latestAudit', businessId]);
      queryClient.invalidateQueries(['allAuditRuns', businessId]);
      queryClient.invalidateQueries(['allFindings', businessId]);
      if (onAuditComplete) onAuditComplete(findings);
    }
  });

  const setQuickPeriodFn = (period) => {
    setQuickPeriod(period);
    const end = new Date();
    let start;
    if (period === 'week') start = subDays(end, 7);
    else if (period === 'month') start = subMonths(end, 1);
    else if (period === 'quarter') start = subMonths(end, 3);
    setPeriodStart(start);
    setPeriodEnd(end);
  };

  const hasEnoughData = business && (
    (business.monthly_revenue || 0) > 0 ||
    business.purchases_food_bev > 0
  );

  const totalImpact = latestAudit?.findings?.reduce((sum, f) => sum + (f.estimated_monthly_impact_eur || 0), 0) || 0;
  const highSeverityCount = latestAudit?.findings?.filter(f => f.severity === 'high').length || 0;
  const mediumSeverityCount = latestAudit?.findings?.filter(f => f.severity === 'medium').length || 0;

  const recentFindings = latestAudit?.findings || [];

  return (
    <div className="space-y-6">
      <AuditExplainerCard />

      <AuditHistoryList auditRuns={allAuditRuns || []} onViewAudit={onViewHistoricalAudit} />

      {/* Setup Card */}
      <Card className="bg-[#151528]/80 border-white/5 rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base">Audit Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label className="text-slate-400 mb-3 block text-xs uppercase tracking-wider">Audit Period</Label>
            <div className="flex flex-wrap gap-2 mb-4">
              {[{ key: 'week', label: 'Last 7 Days' }, { key: 'month', label: 'Last 30 Days' }, { key: 'quarter', label: 'Last Quarter' }].map(p => (
                <Button
                  key={p.key}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickPeriodFn(p.key)}
                  className={quickPeriod === p.key ? 'border-[#7B3BFF]/60 bg-[#7B3BFF]/10 text-[#C084FC]' : 'text-slate-300'}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="text-slate-300">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {format(periodStart, 'PP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent><Calendar mode="single" selected={periodStart} onSelect={d => { setPeriodStart(d); setQuickPeriod(null); }} /></PopoverContent>
              </Popover>
              <span className="text-slate-500 self-center text-sm">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="text-slate-300">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {format(periodEnd, 'PP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent><Calendar mode="single" selected={periodEnd} onSelect={d => { setPeriodEnd(d); setQuickPeriod(null); }} /></PopoverContent>
              </Popover>
            </div>
          </div>

          <Button
            onClick={() => runAuditMutation.mutate()}
            disabled={runAuditMutation.isPending}
            className="w-full"
          >
            {runAuditMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Running Audit...</>
            ) : (
              <><Play className="w-4 h-4 mr-2" />Run New Audit</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Empty state after audit on no data */}
      {runAuditMutation.isSuccess && !hasEnoughData && (
        <AuditEmptyState
          business={business}
          onRunBasicCheck={() => runAuditMutation.mutate({ basicOnly: true })}
        />
      )}

      {!hasEnoughData && !latestAudit && !runAuditMutation.isSuccess && (
        <AuditEmptyState
          business={business}
          onRunBasicCheck={() => runAuditMutation.mutate({ basicOnly: true })}
        />
      )}

      {/* Results */}
      {latestAudit && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Opportunity', value: `€${totalImpact.toLocaleString()}/mo`, icon: DollarSign, color: 'text-emerald-400' },
              { label: 'High Priority', value: highSeverityCount, icon: AlertCircle, color: 'text-rose-400', delay: 0.1 },
              { label: 'Medium Priority', value: mediumSeverityCount, icon: TrendingUp, color: 'text-amber-400', delay: 0.2 },
            ].map((card, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: card.delay || 0 }}>
                <Card className="bg-[#151528]/80 border-white/5">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-xs">{card.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                      </div>
                      <card.icon className={`w-9 h-9 ${card.color} opacity-60`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Recent Findings */}
          <Card className="bg-[#151528]/80 border-white/5 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">Recent Findings</CardTitle>
            </CardHeader>
            <CardContent>
              {recentFindings.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-slate-500 text-sm">No findings yet. Run an audit on this period to surface profit leaks.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentFindings.slice(0, 5).map((finding, idx) => (
                    <div key={idx} className="p-4 bg-[#0B0B12]/40 rounded-xl border border-white/5">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            finding.severity === 'high' ? 'bg-rose-500/10 text-rose-400' :
                            finding.severity === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-blue-500/10 text-blue-400'
                          }`}>{finding.severity?.toUpperCase()}</span>
                          <span className="text-slate-500 text-xs">{finding.type}</span>
                        </div>
                        <span className="text-emerald-400 font-semibold text-sm font-mono">
                          €{(finding.estimated_monthly_impact_eur || 0).toFixed(0)}/mo
                        </span>
                      </div>
                      <h4 className="text-white font-medium text-sm mb-1">{finding.title}</h4>
                      <p className="text-slate-400 text-xs mb-2">{finding.description}</p>
                      <p className="text-slate-500 text-xs italic">{finding.recommendation}</p>
                    </div>
                  ))}
                  {recentFindings.length > 5 && (
                    <p className="text-center text-xs text-slate-500 pt-2">
                      +{recentFindings.length - 5} more findings — check the Action Plan tab
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}