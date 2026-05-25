import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Settings, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getGreetingEmoji() {
  const h = new Date().getHours();
  if (h < 12) return '☀️';
  if (h < 17) return '🌤️';
  return '🌙';
}

function getVatCountdown(business) {
  if (!business?.vat_registered || !business?.vat_quarter_group) return null;
  const now = new Date();
  const year = now.getFullYear();
  const groupOffsets = { A: 0, B: 1, C: 2 };
  const offset = groupOffsets[business.vat_quarter_group] ?? 0;
  const deadlineMonths = [2, 5, 8, 11].map(m => (m + offset) % 12);
  const nextDeadline = deadlineMonths
    .map(m => {
      const d = new Date(year, m, 10);
      if (d <= now) d.setFullYear(year + 1);
      return d;
    })
    .sort((a, b) => a - b)[0];
  const days = Math.ceil((nextDeadline - now) / (1000 * 60 * 60 * 24));
  return { days, date: nextDeadline };
}

function getAIBriefing(alerts, business) {
  if (!alerts || alerts.length === 0) {
    return "Everything looks good today. No critical items need your attention right now.";
  }
  const high = alerts.filter(a => a.severity === 'high');
  const med = alerts.filter(a => a.severity === 'medium');
  if (high.length > 0) {
    return `You have ${high.length} urgent item${high.length > 1 ? 's' : ''} requiring immediate attention${med.length > 0 ? `, and ${med.length} other${med.length > 1 ? 's' : ''} to review` : ''}. Focus on these before anything else today.`;
  }
  if (med.length > 0) {
    return `${med.length} item${med.length > 1 ? 's' : ''} need${med.length === 1 ? 's' : ''} your attention today. No critical blockers — you're in good shape.`;
  }
  return "Only low-priority items today. Good time to focus on growth and planning.";
}

export default function BriefingCore({ user, business, setupProgress, alerts = [] }) {
  const navigate = useNavigate();
  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const vat = getVatCountdown(business);
  const setupComplete = setupProgress >= 5;
  const briefing = getAIBriefing(alerts, business);
  const highAlerts = alerts.filter(a => a.severity === 'high').length;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
      {/* Main greeting area */}
      <div className="p-5 pb-4">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-xl leading-none mt-1">{getGreetingEmoji()}</span>
          <div>
            <h2 className="text-xl font-bold text-white leading-tight">
              {getGreeting()}, {firstName}
            </h2>
            {business && (
              <p className="text-sm text-slate-400 mt-0.5">{business.name}</p>
            )}
          </div>
        </div>

        {/* AI Briefing block */}
        <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-[#7B3BFF]/10 border border-[#7B3BFF]/20">
          <Sparkles className="w-3.5 h-3.5 text-[#C084FC] mt-0.5 flex-shrink-0" />
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-[#C084FC] font-semibold">Setra: </span>
            {briefing}
          </p>
        </div>
      </div>

      {/* Action chips row */}
      <div className="px-5 pb-5 flex flex-wrap gap-2">
        {/* VAT deadline chip */}
        {vat && (
          <button
            onClick={() => navigate('/VATAndBookkeeping')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              vat.days <= 7
                ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25'
                : vat.days <= 14
                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                : 'bg-white/[0.05] border border-white/10 text-slate-300 hover:bg-white/[0.08]'
            }`}
          >
            <Clock className="w-3 h-3" />
            VAT due in {vat.days}d
          </button>
        )}

        {/* High alerts chip */}
        {highAlerts > 0 && (
          <button
            onClick={() => document.querySelector('[data-tour="checklist"]')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 transition-all"
          >
            <AlertTriangle className="w-3 h-3" />
            {highAlerts} urgent alert{highAlerts > 1 ? 's' : ''}
          </button>
        )}

        {/* Setup progress chip */}
        {!setupComplete && (
          <button
            onClick={() => navigate('/Settings')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#7B3BFF]/15 border border-[#7B3BFF]/30 text-[#C084FC] hover:bg-[#7B3BFF]/25 transition-all"
          >
            <Settings className="w-3 h-3" />
            Setup {setupProgress}/5
          </button>
        )}

        {setupComplete && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle className="w-3 h-3" />
            Setup complete
          </span>
        )}

        {/* Financial data chip */}
        <button
          onClick={() => navigate('/FinancialData')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.05] border border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all"
        >
          <TrendingUp className="w-3 h-3" />
          View financials
        </button>
      </div>
    </div>
  );
}