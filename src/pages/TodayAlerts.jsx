import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBusiness } from '@/components/business/BusinessContext';
import { Bell, AlertTriangle, Info, ArrowRight, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import usePageTitle from '@/lib/usePageTitle';

const SEVERITY_OPTS = ['all', 'high', 'medium', 'info'];
const TYPE_OPTS = [
  { value: 'all', label: 'All types' },
  { value: 'vat_deadline', label: 'VAT deadline' },
  { value: 'payroll_deadline', label: 'Payroll deadline' },
  { value: 'price_spike', label: 'Price spike' },
  { value: 'low_stock', label: 'Low stock' },
  { value: 'missing_recipe', label: 'Missing recipe' },
  { value: 'margin_alert', label: 'Margin alert' },
  { value: 'setup_gap', label: 'Setup gap' },
];

function SeverityIcon({ severity }) {
  if (severity === 'high') return <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />;
  if (severity === 'medium') return <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />;
  return <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />;
}

export default function TodayAlerts() {
  usePageTitle();
  const { currentBusiness } = useBusiness();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const bizId = currentBusiness?.id;

  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showDismissed, setShowDismissed] = useState(false);

  const { data: allAlerts = [], isLoading } = useQuery({
    queryKey: ['alerts-feed', bizId],
    queryFn: () => base44.entities.Alert.filter({ business_id: bizId }),
    enabled: !!bizId,
  });

  const handleDismiss = async (alertId) => {
    await base44.entities.Alert.update(alertId, { dismissed_at: new Date().toISOString() });
    queryClient.invalidateQueries({ queryKey: ['alerts-feed', bizId] });
  };

  const filtered = allAlerts
    .filter(a => showDismissed ? !!a.dismissed_at : !a.dismissed_at)
    .filter(a => severityFilter === 'all' || a.severity === severityFilter)
    .filter(a => typeFilter === 'all' || a.type === typeFilter)
    .sort((a, b) => {
      const sev = { high: 0, medium: 1, info: 2 };
      if (sev[a.severity] !== sev[b.severity]) return sev[a.severity] - sev[b.severity];
      return new Date(b.created_date) - new Date(a.created_date);
    });

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#0B0B12]/95 backdrop-blur-xl sticky top-16 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/15 border border-[#7B3BFF]/25 flex items-center justify-center">
              <Bell className="w-4 h-4 text-[#C084FC]" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">All Alerts</h1>
              <button onClick={() => navigate('/Today')} className="text-xs text-[#A855F7] hover:text-[#C084FC] transition-colors">
                ← Back to Today
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <Filter className="w-3.5 h-3.5 text-slate-500" />

          {/* Severity pills */}
          {SEVERITY_OPTS.map(s => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize',
                severityFilter === s
                  ? 'bg-[#7B3BFF]/20 border-[#7B3BFF]/40 text-[#C084FC]'
                  : 'border-white/10 text-slate-500 hover:text-white hover:border-white/20'
              )}
            >
              {s === 'all' ? 'All severity' : s}
            </button>
          ))}

          <div className="h-4 w-px bg-white/10" />

          {/* Type select */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-1 rounded-full text-xs font-medium border border-white/10 bg-[#0B0B12] text-slate-400 hover:border-white/20 transition-colors"
          >
            {TYPE_OPTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          <button
            onClick={() => setShowDismissed(d => !d)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
              showDismissed
                ? 'bg-slate-700/40 border-slate-500/40 text-slate-300'
                : 'border-white/10 text-slate-500 hover:text-white hover:border-white/20'
            )}
          >
            {showDismissed ? 'Active' : 'Show dismissed'}
          </button>
        </div>

        {/* Alert list */}
        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3,4].map(i => <div key={i} className="h-16 bg-white/[0.03] rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Bell className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No alerts match your filters.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(alert => (
              <div
                key={alert.id}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer group',
                  alert.dismissed_at
                    ? 'bg-white/[0.01] border-white/[0.04] opacity-50'
                    : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'
                )}
                onClick={() => navigate(alert.deeplink_url || '/Today')}
              >
                <SeverityIcon severity={alert.severity} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{alert.headline}</p>
                  {alert.context && <p className="text-slate-500 text-xs mt-0.5">{alert.context}</p>}
                  <p className="text-slate-600 text-[10px] mt-1">
                    {new Date(alert.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {alert.dismissed_at && ' · Dismissed'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!alert.dismissed_at && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDismiss(alert.id); }}
                      className="text-slate-600 hover:text-slate-400 text-[10px] font-medium transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Dismiss
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(alert.deeplink_url || '/Today'); }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#7B3BFF]/20 border border-[#7B3BFF]/30 text-[#C084FC] text-xs font-medium hover:bg-[#7B3BFF]/30 transition-colors"
                  >
                    Act <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}