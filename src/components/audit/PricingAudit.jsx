import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, AlertTriangle } from 'lucide-react';

export default function PricingAudit({ businessId }) {
  const { data: findings } = useQuery({
    queryKey: ['pricingFindings', businessId],
    queryFn: async () => {
      const runs = await base44.entities.AuditRun.filter({ business_id: businessId }, '-created_date', 1);
      if (runs.length === 0) return [];
      return base44.entities.AuditFinding.filter({ audit_run_id: runs[0].id, type: 'pricing' });
    }
  });

  const totalImpact = findings?.reduce((sum, f) => sum + (f.estimated_monthly_impact_eur || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Pricing Opportunities</p>
              <p className="text-4xl font-bold text-white mt-2">€{totalImpact.toLocaleString()}/mo</p>
              <p className="text-slate-400 text-sm mt-1">Potential monthly revenue increase</p>
            </div>
            <TrendingUp className="w-16 h-16 text-purple-400" />
          </div>
        </CardContent>
      </Card>

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
                      <AlertTriangle className="w-4 h-4 text-slate-400" />
                    </div>
                    <CardTitle className="text-white text-xl">{finding.title}</CardTitle>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 text-2xl font-bold">
                      €{finding.estimated_monthly_impact_eur?.toFixed(0) || 0}
                    </p>
                    <p className="text-slate-500 text-xs">monthly impact</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-300 mb-3">{finding.description}</p>
                  {metrics.current_price && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Current Price</p>
                        <p className="text-white font-medium">€{metrics.current_price?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Ideal Price</p>
                        <p className="text-emerald-400 font-medium">€{metrics.ideal_price?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Portion Cost</p>
                        <p className="text-white font-medium">€{metrics.portion_cost?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Units Sold</p>
                        <p className="text-white font-medium">{metrics.units_sold}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-blue-400 font-medium mb-2">💡 Recommendation</p>
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
            <p className="text-slate-400">No pricing issues found. Run an audit to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}