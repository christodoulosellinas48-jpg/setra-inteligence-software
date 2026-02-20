import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BookOpen, Star, TrendingDown, HelpCircle } from 'lucide-react';

export default function MenuEngineeringAudit({ businessId }) {
  const { data: findings } = useQuery({
    queryKey: ['menuFindings', businessId],
    queryFn: async () => {
      const runs = await base44.entities.AuditRun.filter({ business_id: businessId }, '-created_date', 1);
      if (runs.length === 0) return [];
      return base44.entities.AuditFinding.filter({ audit_run_id: runs[0].id, type: 'menu' });
    }
  });

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'plowhorse': return { icon: TrendingDown, color: 'text-yellow-400' };
      case 'dog': return { icon: TrendingDown, color: 'text-red-400' };
      case 'puzzle': return { icon: HelpCircle, color: 'text-blue-400' };
      default: return { icon: Star, color: 'text-emerald-400' };
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <BookOpen className="w-12 h-12 text-blue-400" />
            <div>
              <h3 className="text-white text-xl font-semibold">Menu Matrix Analysis</h3>
              <p className="text-slate-400 text-sm mt-1">
                Optimize your menu based on sales volume and profit margins
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {findings?.map((finding, idx) => {
          const metrics = finding.metric_snapshot_json ? JSON.parse(finding.metric_snapshot_json) : {};
          const { icon: Icon, color } = getCategoryIcon(metrics.category);
          
          return (
            <Card key={idx} className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-5 h-5 ${color}`} />
                      <span className="text-slate-400 text-sm uppercase tracking-wide">
                        {metrics.category}
                      </span>
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
                    </div>
                    <CardTitle className="text-white text-xl">{finding.title}</CardTitle>
                  </div>
                  {finding.estimated_monthly_impact_eur > 0 && (
                    <div className="text-right">
                      <p className="text-emerald-400 text-2xl font-bold">
                        €{finding.estimated_monthly_impact_eur?.toFixed(0)}
                      </p>
                      <p className="text-slate-500 text-xs">opportunity</p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-300 mb-3">{finding.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Units Sold</p>
                      <p className="text-white font-medium">{metrics.units_sold}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Contribution Margin</p>
                      <p className="text-white font-medium">€{metrics.contrib_margin?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <p className="text-purple-400 font-medium mb-2">📊 Strategy</p>
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
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No menu optimization opportunities found yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}