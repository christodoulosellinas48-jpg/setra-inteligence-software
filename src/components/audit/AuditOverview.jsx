import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, subDays, subMonths } from 'date-fns';
import { Calendar as CalendarIcon, Play, AlertCircle, TrendingUp, DollarSign, Loader2 } from 'lucide-react';
import { runFullAudit } from './auditCalculations';
import { motion } from 'framer-motion';

export default function AuditOverview({ businessId }) {
  const queryClient = useQueryClient();
  const [periodStart, setPeriodStart] = useState(subMonths(new Date(), 1));
  const [periodEnd, setPeriodEnd] = useState(new Date());
  const [auditConfig, setAuditConfig] = useState({
    pricing: true,
    foodcost: true,
    menu: true,
    labor: true,
    waste: true
  });

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

  const runAuditMutation = useMutation({
    mutationFn: async () => {
      // Fetch all data
      const [items, recipes, sales, purchases, inventoryAdj, laborShifts] = await Promise.all([
        base44.entities.Item.filter({ business_id: businessId }),
        base44.entities.Recipe.filter({ business_id: businessId }),
        base44.entities.Sale.filter({
          business_id: businessId,
          date: { $gte: format(periodStart, 'yyyy-MM-dd'), $lte: format(periodEnd, 'yyyy-MM-dd') }
        }),
        base44.entities.Purchase.filter({
          business_id: businessId,
          date: { $gte: format(periodStart, 'yyyy-MM-dd'), $lte: format(periodEnd, 'yyyy-MM-dd') }
        }),
        base44.entities.InventoryAdjustment.filter({
          business_id: businessId,
          date: { $gte: format(periodStart, 'yyyy-MM-dd'), $lte: format(periodEnd, 'yyyy-MM-dd') }
        }),
        base44.entities.LaborShift.filter({
          business_id: businessId,
          date: { $gte: format(periodStart, 'yyyy-MM-dd'), $lte: format(periodEnd, 'yyyy-MM-dd') }
        })
      ]);

      // Run audit calculations
      const findings = runFullAudit({
        business,
        items,
        recipes,
        sales,
        purchases,
        inventoryAdjustments: inventoryAdj,
        laborShifts
      });

      // Create audit run
      const auditRun = await base44.entities.AuditRun.create({
        business_id: businessId,
        period_start: format(periodStart, 'yyyy-MM-dd'),
        period_end: format(periodEnd, 'yyyy-MM-dd'),
        status: 'draft'
      });

      // Save findings
      await Promise.all(
        findings.map(finding =>
          base44.entities.AuditFinding.create({
            audit_run_id: auditRun.id,
            ...finding
          })
        )
      );

      return auditRun;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['latestAudit', businessId]);
    }
  });

  const setQuickPeriod = (period) => {
    const end = new Date();
    let start;
    if (period === 'week') start = subDays(end, 7);
    else if (period === 'month') start = subMonths(end, 1);
    else if (period === 'quarter') start = subMonths(end, 3);
    setPeriodStart(start);
    setPeriodEnd(end);
  };

  const totalImpact = latestAudit?.findings?.reduce(
    (sum, f) => sum + (f.estimated_monthly_impact_eur || 0), 0
  ) || 0;

  const highSeverityCount = latestAudit?.findings?.filter(f => f.severity === 'high').length || 0;
  const mediumSeverityCount = latestAudit?.findings?.filter(f => f.severity === 'medium').length || 0;

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Audit Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-slate-400 mb-3 block">Audit Period</Label>
            <div className="flex flex-wrap gap-3 mb-4">
              <Button variant="outline" onClick={() => setQuickPeriod('week')} className="text-slate-300">
                Last 7 Days
              </Button>
              <Button variant="outline" onClick={() => setQuickPeriod('month')} className="text-slate-300">
                Last 30 Days
              </Button>
              <Button variant="outline" onClick={() => setQuickPeriod('quarter')} className="text-slate-300">
                Last Quarter
              </Button>
            </div>
            <div className="flex gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-slate-300">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {format(periodStart, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <Calendar mode="single" selected={periodStart} onSelect={setPeriodStart} />
                </PopoverContent>
              </Popover>
              <span className="text-slate-500 self-center">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-slate-300">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {format(periodEnd, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <Calendar mode="single" selected={periodEnd} onSelect={setPeriodEnd} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button
            onClick={() => runAuditMutation.mutate()}
            disabled={runAuditMutation.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {runAuditMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Audit...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run New Audit
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {latestAudit && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Total Impact</p>
                      <p className="text-3xl font-bold text-white mt-1">
                        €{totalImpact.toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="w-10 h-10 text-emerald-400" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">High Priority</p>
                      <p className="text-3xl font-bold text-white mt-1">{highSeverityCount}</p>
                    </div>
                    <AlertCircle className="w-10 h-10 text-red-400" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Medium Priority</p>
                      <p className="text-3xl font-bold text-white mt-1">{mediumSeverityCount}</p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Recent Findings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {latestAudit.findings?.slice(0, 5).map((finding, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            finding.severity === 'high'
                              ? 'bg-red-500/10 text-red-400'
                              : finding.severity === 'medium'
                              ? 'bg-yellow-500/10 text-yellow-400'
                              : 'bg-blue-500/10 text-blue-400'
                          }`}
                        >
                          {finding.severity.toUpperCase()}
                        </span>
                        <span className="text-slate-400 text-xs">{finding.type}</span>
                      </div>
                      <span className="text-emerald-400 font-semibold">
                        €{finding.estimated_monthly_impact_eur?.toFixed(0) || 0}
                      </span>
                    </div>
                    <h4 className="text-white font-medium mb-1">{finding.title}</h4>
                    <p className="text-slate-400 text-sm mb-2">{finding.description}</p>
                    <p className="text-slate-500 text-xs italic">{finding.recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}