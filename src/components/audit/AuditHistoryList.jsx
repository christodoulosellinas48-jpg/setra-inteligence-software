import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function AuditHistoryList({ auditRuns, onViewAudit }) {
  const [expanded, setExpanded] = useState(false);

  if (!auditRuns || auditRuns.length < 2) return null;

  const displayed = expanded ? auditRuns : auditRuns.slice(0, 3);

  return (
    <Card className="bg-[#151528]/80 border-white/5 rounded-2xl overflow-hidden mb-6">
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-300">Recent Audits</span>
          <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{auditRuns.length}</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </div>

      {expanded && (
        <div className="border-t border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0B0B12]/40">
                {['Date', 'Period', 'Findings', 'Opportunity', ''].map(h => (
                  <th key={h} className={`px-4 py-2.5 text-xs text-slate-500 font-medium ${h === '' || h === 'Opportunity' || h === 'Findings' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((run, idx) => (
                <tr key={run.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-slate-300 text-xs">
                    {format(new Date(run.created_date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {format(new Date(run.period_start), 'MMM d')} – {format(new Date(run.period_end), 'MMM d')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs font-semibold ${(run.high_findings || 0) > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                      {run.total_findings || 0}
                    </span>
                    {(run.high_findings || 0) > 0 && (
                      <span className="text-xs text-rose-500 ml-1">({run.high_findings} high)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-400 text-xs font-semibold font-mono">
                    €{(run.total_impact_eur || 0).toLocaleString()}/mo
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => onViewAudit(run)} className="text-[#A855F7] hover:text-white text-xs h-7 px-3">
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {auditRuns.length > 3 && (
            <div className="px-4 pb-3 text-center">
              <Button variant="ghost" size="sm" onClick={() => setExpanded(true)} className="text-slate-500 text-xs">
                Show all {auditRuns.length} audits
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}