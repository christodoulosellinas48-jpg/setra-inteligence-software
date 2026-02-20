import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, CheckCircle2, Circle } from 'lucide-react';

export default function ActionPlan({ businessId }) {
  const queryClient = useQueryClient();
  
  const { data: findings } = useQuery({
    queryKey: ['allFindings', businessId],
    queryFn: async () => {
      const runs = await base44.entities.AuditRun.filter({ business_id: businessId }, '-created_date', 1);
      if (runs.length === 0) return [];
      return base44.entities.AuditFinding.filter({ audit_run_id: runs[0].id });
    }
  });

  const updateFindingMutation = useMutation({
    mutationFn: ({ id, status }) => 
      base44.entities.AuditFinding.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['allFindings', businessId]);
    }
  });

  const exportPDF = () => {
    // Simple CSV export
    const csv = [
      ['Priority', 'Category', 'Issue', 'Impact', 'Recommendation', 'Status'].join(','),
      ...(findings || []).map(f => [
        f.severity,
        f.type,
        f.title,
        `€${f.estimated_monthly_impact_eur?.toFixed(0) || 0}`,
        f.recommendation,
        f.status || 'pending'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-action-plan-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const highPriority = findings?.filter(f => f.severity === 'high') || [];
  const mediumPriority = findings?.filter(f => f.severity === 'medium') || [];
  const lowPriority = findings?.filter(f => f.severity === 'low') || [];

  const renderFindingsList = (findingsList, title) => (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {findingsList.map((finding) => (
            <div
              key={finding.id}
              className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700"
            >
              <Checkbox
                checked={finding.status === 'fixed'}
                onCheckedChange={(checked) =>
                  updateFindingMutation.mutate({
                    id: finding.id,
                    status: checked ? 'fixed' : 'pending'
                  })
                }
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-slate-400 text-xs uppercase">{finding.type}</span>
                  <span className="text-emerald-400 text-sm font-semibold">
                    €{finding.estimated_monthly_impact_eur?.toFixed(0) || 0}
                  </span>
                </div>
                <h4 className="text-white font-medium mb-1">{finding.title}</h4>
                <p className="text-slate-400 text-sm mb-2">{finding.description}</p>
                <div className="bg-blue-500/10 border-l-2 border-blue-500 pl-3 py-2">
                  <p className="text-blue-400 text-xs font-medium mb-1">Action</p>
                  <p className="text-slate-300 text-sm">{finding.recommendation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const totalImpact = findings?.reduce((sum, f) => sum + (f.estimated_monthly_impact_eur || 0), 0) || 0;
  const completedCount = findings?.filter(f => f.status === 'fixed').length || 0;
  const totalCount = findings?.length || 0;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-emerald-900/20 to-blue-900/20 border-emerald-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white text-2xl font-bold mb-2">Action Plan Summary</h3>
              <p className="text-slate-300 mb-4">
                {completedCount} of {totalCount} actions completed
              </p>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Total Opportunity</p>
                  <p className="text-emerald-400 text-3xl font-bold">€{totalImpact.toLocaleString()}</p>
                </div>
                <div className="h-12 w-px bg-slate-700" />
                <div>
                  <p className="text-slate-400 text-sm">High Priority Items</p>
                  <p className="text-red-400 text-3xl font-bold">{highPriority.length}</p>
                </div>
              </div>
            </div>
            <Button onClick={exportPDF} className="bg-emerald-600 hover:bg-emerald-700">
              <Download className="w-4 h-4 mr-2" />
              Export Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {highPriority.length > 0 && renderFindingsList(highPriority, '🔴 High Priority (Action Required)')}
      {mediumPriority.length > 0 && renderFindingsList(mediumPriority, '🟡 Medium Priority (Important)')}
      {lowPriority.length > 0 && renderFindingsList(lowPriority, '🔵 Low Priority (Optimize)')}

      {(!findings || findings.length === 0) && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No action items yet. Run an audit to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}