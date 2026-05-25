import React, { useState, useEffect, useRef } from 'react';
import { Bell, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

export default function AlertsBell({ businessId, userId }) {
  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!businessId || !userId) return;
    base44.entities.Alert.filter({ business_id: businessId })
      .then(all => setAlerts(all.filter(a => !a.dismissed_at && a.user_id === userId)))
      .catch(() => {});
  }, [businessId, userId]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = alerts.length;
  const recent5 = alerts.slice(0, 5);

  const handleDismiss = async (alertId) => {
    await base44.entities.Alert.update(alertId, { dismissed_at: new Date().toISOString() });
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
        title="Alerts"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold leading-none border border-[#07070F]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#151528] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <span className="text-white font-semibold text-sm">Alerts</span>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {recent5.length === 0 ? (
            <div className="px-4 py-6 text-center text-slate-500 text-xs">All clear — no active alerts.</div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {recent5.map(alert => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors cursor-pointer group"
                  onClick={() => { navigate(alert.deeplink_url || '/Today'); setOpen(false); }}
                >
                  <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
                    alert.severity === 'high' ? 'bg-rose-400' :
                    alert.severity === 'medium' ? 'bg-amber-400' : 'bg-blue-400'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium leading-snug">{alert.headline}</p>
                    {alert.context && <p className="text-slate-500 text-[10px] mt-0.5 truncate">{alert.context}</p>}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDismiss(alert.id); }}
                    className="text-slate-600 hover:text-slate-400 text-[10px] opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="px-4 py-3 border-t border-white/[0.06]">
            <button
              onClick={() => { navigate('/Today/alerts'); setOpen(false); }}
              className="flex items-center gap-1 text-[#A855F7] hover:text-[#C084FC] text-xs font-medium transition-colors"
            >
              View all alerts <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}