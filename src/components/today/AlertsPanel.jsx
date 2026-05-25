import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Info, X, ChevronRight, Bell, DollarSign, Activity } from 'lucide-react';

const severityConfig = {
  high: {
    icon: AlertTriangle,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
    badge: 'bg-rose-500/20 text-rose-300',
  },
  medium: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    badge: 'bg-amber-500/20 text-amber-300',
  },
  info: {
    icon: Info,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/20',
    badge: 'bg-sky-500/20 text-sky-300',
  },
};

const typeLabels = {
  vat_deadline: 'Compliance',
  payroll_deadline: 'Payroll',
  price_spike: 'Price Spike',
  low_stock: 'Low Stock',
  missing_recipe: 'Recipe',
  margin_alert: 'Margin',
  setup_gap: 'Setup',
};

function ConfidenceDots({ level }) {
  const levels = { high: 3, medium: 2, low: 1 };
  const filled = levels[level] ?? 2;
  const colorMap = { high: 'bg-emerald-400', medium: 'bg-amber-400', low: 'bg-rose-400' };
  const emptyColor = 'bg-white/10';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map(i => (
        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= filled ? colorMap[level] : emptyColor}`} />
      ))}
    </div>
  );
}

function Tooltip({ content, children }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && content && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-900 border border-white/10 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-xl pointer-events-none">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}

function AlertRow({ alert, onDismiss }) {
  const cfg = severityConfig[alert.severity] || severityConfig.info;
  const Icon = cfg.icon;
  const typeLabel = typeLabels[alert.type] || alert.type;
  const confidence = alert.severity === 'high' ? 'high' : alert.severity === 'medium' ? 'medium' : 'low';

  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${cfg.bg} group`}>
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.color}`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${cfg.badge}`}>
            {typeLabel}
          </span>
          <p className="text-sm text-white font-medium leading-snug">{alert.headline}</p>
        </div>

        {alert.context && (
          <p className="text-xs text-slate-400 mt-0.5 leading-snug">{alert.context}</p>
        )}

        {/* Subtle indicators row */}
        <div className="flex items-center gap-3 mt-2">
          <Tooltip content="Estimated financial impact">
            <div className="flex items-center gap-1 text-xs text-slate-500 cursor-default hover:text-slate-300 transition-colors">
              <DollarSign className="w-3 h-3" />
              <span>Impact</span>
            </div>
          </Tooltip>

          <Tooltip content={`Confidence: ${confidence}`}>
            <div className="flex items-center gap-1.5 cursor-default">
              <Activity className="w-3 h-3 text-slate-500" />
              <ConfidenceDots level={confidence} />
            </div>
          </Tooltip>

          {alert.deeplink_url && (
            <a
              href={alert.deeplink_url}
              className="ml-auto text-xs font-semibold text-[#C084FC] hover:text-white flex items-center gap-0.5 transition-colors"
            >
              Act <ChevronRight className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      <button
        onClick={() => onDismiss(alert.id)}
        className="text-slate-600 hover:text-white transition-colors flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function AlertsPanel({ alerts, totalCount, onDismiss, loading }) {
  const navigate = useNavigate();
  const preview = alerts.slice(0, 3);

  if (loading) return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-white/10 rounded w-1/3" />
        <div className="h-14 bg-white/5 rounded-xl" />
        <div className="h-14 bg-white/5 rounded-xl" />
      </div>
    </div>
  );

  if (!totalCount) return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
        <Bell className="w-4 h-4 text-emerald-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">All clear</p>
        <p className="text-xs text-slate-500">No active alerts — you're on top of everything.</p>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Top priorities</h3>
          <span className="text-xs font-bold bg-white/10 text-slate-300 px-1.5 py-0.5 rounded-full">
            {totalCount}
          </span>
        </div>
        {totalCount > 3 && (
          <button
            onClick={() => navigate('/Today/alerts')}
            className="text-xs text-[#C084FC] hover:text-white transition-colors flex items-center gap-0.5 font-medium"
          >
            View all <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      <p className="text-xs text-slate-500 -mt-1">Action these now to stay in control.</p>

      <div className="space-y-2">
        {preview.map(alert => (
          <AlertRow key={alert.id} alert={alert} onDismiss={onDismiss} />
        ))}
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