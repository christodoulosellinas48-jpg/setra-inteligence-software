import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

export default function PLTab({ businessId }) {
  return (
    <Card className="bg-slate-900/50 border-slate-800 p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
        <TrendingUp className="w-8 h-8 text-emerald-400" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">Profit & Loss</h2>
      <p className="text-slate-400">
        Invoice-based P&L view showing revenue, COGS, and expenses.
      </p>
    </Card>
  );
}