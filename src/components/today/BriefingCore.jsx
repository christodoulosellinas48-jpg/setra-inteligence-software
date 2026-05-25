import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Settings } from 'lucide-react';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getVatCountdown(business) {
  if (!business?.vat_registered || !business?.vat_quarter_group) return null;
  const now = new Date();
  const month = now.getMonth(); // 0-based
  const year = now.getFullYear();
  // VAT deadlines: 10th of the 2nd month after each quarter end
  // Group A: Jan/Apr/Jul/Oct quarters → deadlines: Mar 10, Jun 10, Sep 10, Dec 10
  // Group B: Feb/May/Aug/Nov quarters → deadlines: Apr 10, Jul 10, Oct 10, Jan 10
  // Group C: Mar/Jun/Sep/Dec quarters → deadlines: May 10, Aug 10, Nov 10, Feb 10
  const groupOffsets = { A: 0, B: 1, C: 2 };
  const offset = groupOffsets[business.vat_quarter_group] ?? 0;
  // Deadline months (0-based): 2,5,8,11 + offset
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
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 space-y-3">
      {/* Greeting */}
      <div>
        <h2 className="text-xl font-bold text-white">
          {getGreeting()}, {firstName}
        </h2>
        {business && (
          <p className="text-sm text-slate-400 mt-0.5">{business.name}</p>
        )}
      </div>

      {/* Chips row */}
      <div className="flex flex-wrap gap-2">
        {/* VAT deadline chip */}
        {vat && (
          <button
            onClick={() => navigate('/VATAndBookkeeping')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              vat.days <= 7
                ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25'
                : vat.days <= 14
                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                : 'bg-white/[0.05] border border-white/10 text-slate-300 hover:bg-white/[0.08]'
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            VAT due in {vat.days}d
          </button>
        )}

        {/* Setup progress chip */}
        {!setupComplete && (
          <button
            onClick={() => navigate('/Settings')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#7B3BFF]/15 border border-[#7B3BFF]/30 text-[#C084FC] hover:bg-[#7B3BFF]/25 transition-colors"
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
      </div>
    </div>
  );
}