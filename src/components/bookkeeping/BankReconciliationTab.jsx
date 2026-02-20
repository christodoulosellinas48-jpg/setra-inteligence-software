import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Upload } from 'lucide-react';

export default function BankReconciliationTab({ businessId }) {
  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-800 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Bank Reconciliation</h2>
        <p className="text-slate-400 mb-6">
          Import bank statements (CSV) and match transactions with invoices.
        </p>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Upload className="w-4 h-4 mr-2" />
          Import Bank CSV
        </Button>
      </Card>
    </div>
  );
}