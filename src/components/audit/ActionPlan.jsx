import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle2, Loader2, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const SEVERITY_CONFIG = {
  high:   { emoji: '🔴', color: 'text-rose-400',  bg: 'bg-rose-500/10',  border: 'border-rose-500/30',  label: 'HIGH'   },
  medium: { emoji: '🟡', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'MEDIUM' },
  low:    { emoji: '🔵', color: 'text-blue-400',  bg: 'bg-blue-500/10',  border: 'border-blue-500/30',  label: 'LOW'    },
};

function FindingCard({ finding, onStatusChange }) {
  const cfg = SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.low;
  const isFixed = finding.status === 'fixed';
  const isIgnored = finding.status === 'ignored';

  return (
    <div className={`rounded-xl border p-5 transition-all ${isFixed ? 'opacity-60 bg-emerald-500/5 border-emerald-500/20' : isIgnored ? 'opacity-40 bg-white/[0.02] border-white/5' : `bg-[#0B0B12]/40 ${cfg.border}`}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{cfg.emoji}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
          <span className="text-slate-500 text-xs uppercase">{finding.type}</span>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-emerald-400 font-bold font-mono text-base">
            €{(finding.estimated_monthly_impact_eur || 0).toFixed(0)}<span className="text-xs font-normal text-emerald-600">/mo</span>
          </span>
        </div>
      </div>

      <h4 className={`font-semibold mb-1 ${isFixed ? 'line-through text-slate-400' : 'text-white'}`}>{finding.title}</h4>
      <p className="text-slate-400 text-sm mb-3">{finding.description}</p>

      <div className="bg-[#7B3BFF]/5 border-l-2 border-[#7B3BFF]/40 pl-3 py-2 rounded-r mb-4">
        <p className="text-[#A855F7] text-xs font-medium mb-0.5">Recommended Action</p>
        <p className="text-slate-300 text-sm">{finding.recommendation}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {!isFixed && !isIgnored && (
          <Button
            size="sm"
            onClick={() => onStatusChange(finding.id, 'fixed')}
            className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-600/30 h-8 text-xs"
            variant="outline"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            Mark complete
          </Button>
        )}
        {isFixed && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onStatusChange(finding.id, 'pending')}
            className="text-slate-500 hover:text-white h-8 text-xs"
          >
            Undo
          </Button>
        )}
        {!isFixed && !isIgnored && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onStatusChange(finding.id, 'ignored')}
            className="text-slate-600 hover:text-slate-400 h-8 text-xs"
          >
            Dismiss
          </Button>
        )}
        {isIgnored && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onStatusChange(finding.id, 'pending')}
            className="text-slate-500 hover:text-white h-8 text-xs"
          >
            Restore
          </Button>
        )}
      </div>
    </div>
  );
}

export default function ActionPlan({ businessId, onRunNewAudit }) {
  const queryClient = useQueryClient();
  const [showIgnored, setShowIgnored] = useState(false);

  const { data: findings, isLoading } = useQuery({
    queryKey: ['allFindings', businessId],
    queryFn: async () => {
      const runs = await base44.entities.AuditRun.filter({ business_id: businessId }, '-created_date', 1);
      if (runs.length === 0) return [];
      return base44.entities.AuditFinding.filter({ audit_run_id: runs[0].id });
    }
  });

  const updateFindingMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.AuditFinding.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries(['allFindings', businessId])
  });

  const exportCSV = () => {
    const csv = [
      ['Priority', 'Category', 'Issue', 'Impact (€/mo)', 'Recommendation', 'Status'].join(','),
      ...(findings || []).map(f => [
        f.severity, f.type, `"${f.title}"`, (f.estimated_monthly_impact_eur || 0).toFixed(0),
        `"${f.recommendation}"`, f.status || 'pending'
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `setra-audit-action-plan-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[#7B3BFF] animate-spin" /></div>;
  }

  const allFindings = findings || [];
  const activeFindings = allFindings.filter(f => f.status !== 'ignored');
  const ignoredFindings = allFindings.filter(f => f.status === 'ignored');
  const highPriority = activeFindings.filter(f => f.severity === 'high');
  const mediumPriority = activeFindings.filter(f => f.severity === 'medium');
  const lowPriority = activeFindings.filter(f => f.severity === 'low');

  const totalImpact = activeFindings.reduce((sum, f) => sum + (f.estimated_monthly_impact_eur || 0), 0);
  const completedCount = activeFindings.filter(f => f.status === 'fixed').length;
  const totalCount = activeFindings.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (allFindings.length === 0) {
    return (
      <Card className="bg-[#151528]/80 border-white/5 rounded-2xl">
        <CardContent className="p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">No action items yet. Run an audit to get started.</p>
          {onRunNewAudit && (
            <Button onClick={onRunNewAudit} variant="outline" size="sm">
              Go to Audit Setup
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero: Total Opportunity */}
      {totalImpact > 0 && (
        <Card className="bg-gradient-to-br from-[#7B3BFF]/20 to-emerald-900/20 border-emerald-500/20 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">💰</span>
                  <p className="text-slate-400 text-sm">Profit leaks identified</p>
                </div>
                <p className="text-5xl font-black text-emerald-400">€{totalImpact.toLocaleString()}<span className="text-2xl font-semibold text-emerald-600">/mo</span></p>
                <p className="text-slate-400 text-sm mt-2">
                  {totalCount} actions to recover them · <span className="text-rose-400 font-medium">{highPriority.length} high-priority</span>
                </p>
              </div>
              <Button onClick={exportCSV} variant="outline" className="gap-2 flex-shrink-0">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      <Card className="bg-[#151528]/80 border-white/5 rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white font-semibold text-sm">Action Plan Progress</p>
              <p className="text-slate-500 text-xs mt-0.5">{completedCount} of {totalCount} actions completed</p>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#C084FC]" />
              <span className="text-[#C084FC] font-bold text-sm">{Math.round(progressPct)}%</span>
            </div>
          </div>
          <Progress value={progressPct} className="h-2 bg-white/10" />
          {completedCount > 0 && (
            <p className="text-emerald-400 text-xs mt-2">
              ✓ You've closed {completedCount} issue{completedCount > 1 ? 's' : ''} —
              estimated €{activeFindings.filter(f => f.status === 'fixed').reduce((s, f) => s + (f.estimated_monthly_impact_eur || 0), 0).toFixed(0)}/mo recovered
            </p>
          )}
        </CardContent>
      </Card>

      {/* High Priority */}
      {highPriority.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            🔴 High Priority ({highPriority.length})
          </h3>
          <div className="space-y-3">
            {highPriority.map(f => (
              <FindingCard key={f.id} finding={f} onStatusChange={(id, status) => updateFindingMutation.mutate({ id, status })} />
            ))}
          </div>
        </div>
      )}

      {/* Medium Priority */}
      {mediumPriority.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">
            🟡 Medium Priority ({mediumPriority.length})
          </h3>
          <div className="space-y-3">
            {mediumPriority.map(f => (
              <FindingCard key={f.id} finding={f} onStatusChange={(id, status) => updateFindingMutation.mutate({ id, status })} />
            ))}
          </div>
        </div>
      )}

      {/* Low Priority */}
      {lowPriority.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">
            🔵 Low Priority / Optimise ({lowPriority.length})
          </h3>
          <div className="space-y-3">
            {lowPriority.map(f => (
              <FindingCard key={f.id} finding={f} onStatusChange={(id, status) => updateFindingMutation.mutate({ id, status })} />
            ))}
          </div>
        </div>
      )}

      {/* Ignored / Dismissed */}
      {ignoredFindings.length > 0 && (
        <div>
          <button
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
            onClick={() => setShowIgnored(s => !s)}
          >
            {showIgnored ? 'Hide' : 'Show'} {ignoredFindings.length} dismissed item{ignoredFindings.length > 1 ? 's' : ''}
          </button>
          {showIgnored && (
            <div className="space-y-3 mt-3">
              {ignoredFindings.map(f => (
                <FindingCard key={f.id} finding={f} onStatusChange={(id, status) => updateFindingMutation.mutate({ id, status })} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}