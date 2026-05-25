import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Info, X, ChevronRight, Bell } from 'lucide-react';

const severityConfig = {
  high: { icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
  medium: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  info: { icon: Info, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
};

export default function AlertsPanel({ alerts, totalCount, onDismiss, loading }) {
  const navigate = useNavigate();
  const preview = alerts.slice(0, 3);

  if (loading) return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-white/10 rounded w-1/3" />
        <div className="h-10 bg-white/5 rounded" />
      </div>
    </div>
  );

  if (!totalCount) return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 flex items-center gap-3">
      <Bell className="w-5 h-5 text-slate-500" />
      <p className="text-slate-400 text-sm">No active alerts — you're all clear.</p>
    </div>
  );

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Alerts</h3>
        {totalCount > 3 && (
          <button
            onClick={() => navigate('/Today/alerts')}
            className="text-xs text-[#C084FC] hover:text-white transition-colors flex items-center gap-1"
          >
            View all {totalCount} <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {preview.map(alert => {
          const cfg = severityConfig[alert.severity] || severityConfig.info;
          const Icon = cfg.icon;
          return (
            <div
              key={alert.id}
              className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.bg}`}
            >
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium leading-snug">{alert.headline}</p>
                {alert.context && (
                  <p className="text-xs text-slate-400 mt-0.5">{alert.context}</p>
                )}
              </div>
              <button
                onClick={() => onDismiss(alert.id)}
                className="text-slate-500 hover:text-white transition-colors flex-shrink-0 mt-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {totalCount > 3 && (
        <button
          onClick={() => navigate('/Today/alerts')}
          className="w-full py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-slate-400 text-xs transition-colors"
        >
          +{totalCount - 3} more alerts
        </button>
      )}
    </div>
  );
}