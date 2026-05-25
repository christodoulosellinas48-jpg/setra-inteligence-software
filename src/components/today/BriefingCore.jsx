import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Settings, Clock } from 'lucide-react';

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

export default function BriefingCore({ user, business, setupProgress }) {
  const navigate = useNavigate();
  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const vat = getVatCountdown(business);
  const setupComplete = setupProgress >= 5;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
      {/* Greeting */}
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl leading-none mt-0.5">{getGreetingEmoji()}</span>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {getGreeting()}, {firstName}
          </h2>
          {business && (
            <p className="text-sm text-slate-500 mt-0.5">
              Here's what needs your attention today — <span className="font-medium text-slate-700">{business.name}</span>
            </p>
          )}
        </div>
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-2">
        {vat && (
          <button
            onClick={() => navigate('/VATAndBookkeeping')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              vat.days <= 7
                ? 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'
                : vat.days <= 14
                ? 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100'
                : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3 h-3" />
            VAT due in {vat.days}d
          </button>
        )}

        {!setupComplete && (
          <button
            onClick={() => navigate('/Settings')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-100 transition-all"
          >
            <Settings className="w-3 h-3" />
            Complete setup — {setupProgress}/5
          </button>
        )}

        {setupComplete && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-700">
            <CheckCircle className="w-3 h-3" />
            Setup complete
          </span>
        )}
      </div>
    </div>
  );
}