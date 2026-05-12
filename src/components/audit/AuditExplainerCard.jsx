import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Lightbulb } from 'lucide-react';

const STORAGE_KEY = 'setra_audit_explainer_dismissed';

export default function AuditExplainerCard() {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setDismissed(true);
  };

  return (
    <Card className="bg-[#7B3BFF]/10 border-[#7B3BFF]/30 rounded-2xl overflow-hidden mb-6">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#7B3BFF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lightbulb className="w-5 h-5 text-[#C084FC]" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-2">What does a Setra audit do?</h4>
              <p className="text-slate-400 text-xs leading-relaxed mb-3">
                Setra analyses your last 7, 30, or 90 days of revenue, costs, recipes, payroll, and waste — and surfaces specific things you could change to make more money.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {['A clear cause', 'A recommended action', 'Estimated monthly impact (€)', 'A priority rating'].map(item => (
                  <div key={item} className="bg-[#0B0B12]/40 rounded-lg px-3 py-2 text-xs text-slate-300">· {item}</div>
                ))}
              </div>
              <p className="text-[#C084FC] text-xs font-medium">
                Most operators find 3–8 actionable changes worth €500–€4,000/month after their first audit.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleDismiss} className="text-slate-500 hover:text-white flex-shrink-0 h-7 w-7">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-slate-400 hover:text-white text-xs">
            Got it, hide this
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}