import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Info, X, ChevronRight, Bell, DollarSign, Activity } from 'lucide-react';

const severityConfig = {
  high: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-700',
    label: 'Urgent',
  },
  medium: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    label: 'Attention',
  },
  info: {
    icon: Info,
    color: 'text-blue-500',
    bg: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    label: 'Info',
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

// Confidence dots: filled vs empty based on level
function ConfidenceDots({ level }) {
  const levels = { high: 3, medium: 2, low: 1 };
  const filled = levels[level] ?? 2;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i <= filled ? 'bg-slate-500' : 'bg-slate-200'}`}
        />
      ))}
    </div>
  );
}

// Tooltip wrapper
function Tooltip({ content, children }) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && content && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-lg pointer-events-none">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </div>
      )}
    </div>
  );
}

function AlertRow({ alert, onDismiss }) {
  const cfg = severityConfig[alert.severity] || severityConfig.info;
  const Icon = cfg.icon;
  const typeLabel = typeLabels[alert.type] || alert.type;

  // Derive a mock confidence from severity for display purposes
  const confidence = alert.severity === 'high' ? 'high' : alert.severity === 'medium' ? 'medium' : 'low';

  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${cfg.bg} group`}>
      <div className={`mt-0.5 flex-shrink-0 ${cfg.color}`}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        {/* Type label + headline */}
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${cfg.badge}`}>
            {typeLabel}
          </span>
          <p className="text-sm text-slate-800 font-semibold leading-snug">{alert.headline}</p>
        </div>

        {alert.context && (
          <p className="text-xs text-slate-500 leading-snug mt-0.5">{alert.context}</p>
        )}

        {/* Impact + Confidence as subtle icon tooltips */}
        <div className="flex items-center gap-3 mt-2">
          <Tooltip content="Estimated financial impact">
            <div className="flex items-center gap-1 text-xs text-slate-500 cursor-default">
              <DollarSign className="w-3 h-3 text-slate-400" />
              <span>Impact</span>
            </div>
          </Tooltip>

          <Tooltip content={`Confidence: ${confidence}`}>
            <div className="flex items-center gap-1 cursor-default">
              <Activity className="w-3 h-3 text-slate-400" />
              <ConfidenceDots level={confidence} />
            </div>
          </Tooltip>

          {alert.deeplink_url && (
            <a
              href={alert.deeplink_url}
              className="ml-auto text-xs font-medium text-violet-600 hover:text-violet-800 flex items-center gap-0.5 transition-colors"
            >
              Act <ChevronRight className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      <button
        onClick={() => onDismiss(alert.id)}
        className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100"
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
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-slate-100 rounded w-1/4" />
        <div className="h-14 bg-slate-50 rounded-xl border border-slate-100" />
        <div className="h-14 bg-slate-50 rounded-xl border border-slate-100" />
      </div>
    </div>
  );

  if (!totalCount) return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
        <Bell className="w-4 h-4 text-emerald-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">All clear</p>
        <p className="text-xs text-slate-400">No active alerts — you're on top of everything.</p>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-800">Top priorities</h3>
          {totalCount > 0 && (
            <span className="text-xs font-semibold bg-slate-800 text-white px-1.5 py-0.5 rounded-full">
              {totalCount}
            </span>
          )}
        </div>
        {totalCount > 3 && (
          <button
            onClick={() => navigate('/Today/alerts')}
            className="text-xs text-violet-600 hover:text-violet-800 transition-colors flex items-center gap-0.5 font-medium"
          >
            View all <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      <p className="text-xs text-slate-400 -mt-1">Action these now to stay in control.</p>

      <div className="space-y-2">
        {preview.map(alert => (
          <AlertRow key={alert.id} alert={alert} onDismiss={onDismiss} />
        ))}
      </div>

      {totalCount > 3 && (
        <button
          onClick={() => navigate('/Today/alerts')}
          className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium transition-colors"
        >
          +{totalCount - 3} more alerts →
        </button>
      )}
    </div>
  );
}