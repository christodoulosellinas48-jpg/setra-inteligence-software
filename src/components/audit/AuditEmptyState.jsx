import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckSquare, Zap } from 'lucide-react';

export default function AuditEmptyState({ business, onRunBasicCheck }) {
  const industryLabel = {
    bar: 'Bars', canteen: 'Canteens', coffee_shop: 'Coffee Shops',
    catering_events: 'Catering', confectionery: 'Confectioneries',
    deli_cava: 'Delis & Cavas', food_to_go: 'Food-to-Go',
    hotels: 'Hotels F&B', restaurant: 'Restaurants'
  }[business?.industry_group] || 'your business type';

  return (
    <Card className="bg-[#151528]/80 border-amber-500/30 rounded-2xl overflow-hidden">
      <CardContent className="p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-xl mb-1">Not enough data to run a full audit</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              An audit analyses your recent revenue, costs, recipes, and labor to surface profit leaks.
              Right now we don't have enough information to do that for <span className="text-white font-medium">{business?.name}</span>.
            </p>
          </div>
        </div>

        <div className="bg-[#0B0B12]/60 rounded-xl p-5 mb-6 border border-white/5">
          <p className="text-sm font-semibold text-slate-300 mb-4">To unlock your first full audit:</p>
          <div className="space-y-3">
            {[
              { text: 'Connect your POS or enter monthly revenue figures in Settings', done: (business?.monthly_revenue || 0) > 0 },
              { text: 'Upload at least 2 weeks of supplier invoices via Expenses', done: false },
              { text: 'Add at least one recipe in Recipe Manager (for menu engineering checks)', done: false },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${item.done ? 'bg-emerald-500/20 border border-emerald-500/50' : 'border border-slate-600'}`}>
                  {item.done && <CheckSquare className="w-3 h-3 text-emerald-400" />}
                </div>
                <span className={`text-sm ${item.done ? 'text-slate-400 line-through' : 'text-slate-300'}`}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={onRunBasicCheck} variant="outline" size="sm" className="gap-2">
            <Zap className="w-4 h-4 text-[#C084FC]" />
            Run basic check (tax rate &amp; pricing assumptions)
          </Button>
          <p className="text-slate-500 text-xs">
            Audit is tuned for <span className="text-slate-400">{industryLabel}</span> — we look for the issues that matter most in your category.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}