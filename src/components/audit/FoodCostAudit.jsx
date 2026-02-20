import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UtensilsCrossed } from 'lucide-react';

export default function FoodCostAudit({ businessId }) {
  const { data: findings } = useQuery({
    queryKey: ['foodcostFindings', businessId],
    queryFn: async () => {
      const runs = await base44.entities.AuditRun.filter({ business_id: businessId }, '-created_date', 1);
      if (runs.length === 0) return [];
      return base44.entities.AuditFinding.filter({ 
        audit_run_id: runs[0].id, 
        type: { $in: ['foodcost', 'waste'] } 
      });
    }
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {findings?.map((finding, idx) => {
          const metrics = finding.metric_snapshot_json ? JSON.parse(finding.metric_snapshot_json) : {};
          return (
            <Card key={idx} className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
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
                      <span className="text-slate-500 text-xs">{finding.type}</span>
                    </div>
                    <CardTitle className="text-white text-xl">{finding.title}</CardTitle>
                  </div>
                  <div className="text-right">
                    <p className="text-red-400 text-2xl font-bold">
                      €{finding.estimated_monthly_impact_eur?.toFixed(0) || 0}
                    </p>
                    <p className="text-slate-500 text-xs">monthly leak</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-300 mb-3">{finding.description}</p>
                  {metrics.current_food_cost_pct && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Current Food Cost %</p>
                        <p className="text-red-400 font-medium">{metrics.current_food_cost_pct?.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Target Food Cost %</p>
                        <p className="text-emerald-400 font-medium">{metrics.target_food_cost_pct?.toFixed(1)}%</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                  <p className="text-orange-400 font-medium mb-2">🎯 Action Required</p>
                  <p className="text-slate-300 text-sm">{finding.recommendation}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(!findings || findings.length === 0) && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-12 text-center">
            <UtensilsCrossed className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No food cost issues detected. Run an audit to analyze your data.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}