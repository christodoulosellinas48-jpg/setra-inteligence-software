import React from 'react';
import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function PayrollTab({ businessId }) {
  return (
    <Card className="bg-slate-900/50 border-slate-800 p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
        <Users className="w-8 h-8 text-purple-400" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">Payroll</h2>
      <p className="text-slate-400">
        Optional payroll management module (coming soon).
      </p>
    </Card>
  );
}