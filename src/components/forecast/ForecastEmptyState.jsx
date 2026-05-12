import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Database, ArrowRight, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ForecastEmptyState({ snapshotCount }) {
  const needed = 3;
  const remaining = Math.max(0, needed - snapshotCount);

  return (
    <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center p-6">
      <Card className="bg-[#151528]/80 border-white/5 rounded-2xl p-8 max-w-lg w-full">
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-[#7B3BFF]/10 border border-[#7B3BFF]/20 flex items-center justify-center mb-6">
          <BarChart3 className="w-7 h-7 text-[#C084FC]" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">Not enough data for a forecast yet</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          Setra needs at least <strong className="text-white">3 months</strong> of historical data to give you a meaningful projection.
          {snapshotCount > 0
            ? ` You have ${snapshotCount} snapshot${snapshotCount !== 1 ? 's' : ''} so far — ${remaining} more to go.`
            : ' You have no snapshots yet.'}
        </p>

        {/* Progress dots */}
        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: needed }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-all ${
                i < snapshotCount ? 'bg-[#7B3BFF]' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Action checklist */}
        <div className="space-y-3 mb-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">To unlock forecasting:</p>
          {[
            { text: 'Connect your POS to backfill prior months', path: '/Integrations', done: false },
            { text: `Save ${remaining} more financial snapshot${remaining !== 1 ? 's' : ''} (one per month)`, path: '/Reports', done: remaining === 0 },
            { text: 'Or import 3 months of P&Ls from the Reports page', path: '/Reports', done: false },
          ].map((item, i) => (
            <Link key={i} to={item.path} className="flex items-center gap-3 group p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
              <div className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center ${
                item.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 group-hover:border-[#7B3BFF]'
              }`}>
                {item.done && <span className="text-white text-xs">✓</span>}
              </div>
              <span className={`text-sm flex-1 ${item.done ? 'text-emerald-400 line-through opacity-60' : 'text-slate-300 group-hover:text-white'}`}>
                {item.text}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-[#C084FC] opacity-0 group-hover:opacity-100 transition-all" />
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="p-4 bg-[#7B3BFF]/5 border border-[#7B3BFF]/15 rounded-xl flex items-center gap-3">
          <Calendar className="w-5 h-5 text-[#C084FC] flex-shrink-0" />
          <p className="text-sm text-slate-400 flex-1">
            In the meantime, set a budget so we can track variance from day one.
          </p>
          <Link to="/Budgeting">
            <Button size="sm" variant="outline" className="whitespace-nowrap text-[#C084FC] border-[#7B3BFF]/40 hover:bg-[#7B3BFF]/10">
              Set budget →
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}