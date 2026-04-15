import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

// Maps expense_category to the financial input key
const CATEGORY_TO_FIELD = {
  food_beverage: 'purchases_food_bev',
  staff_costs: 'staff_costs',
  fixed_costs: 'rent_fixed_costs',
  utilities: 'utilities',
  operating_expenses: 'other_operating',
  one_off_expenses: 'other_operating',
};

export default function AddFromSystemButton({ businessId, onApply, disabled }) {
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

      // Fetch all expenses for this business this month
      const expenses = await base44.entities.ExpenseDocument.filter({ business_id: businessId });

      // Filter to current month
      const thisMonthExpenses = expenses.filter(e => {
        if (!e.invoice_date) return false;
        return e.invoice_date >= monthStart && e.invoice_date <= monthEnd;
      });

      // Sum by category
      const totals = {};
      for (const expense of thisMonthExpenses) {
        const field = CATEGORY_TO_FIELD[expense.expense_category];
        if (!field) continue;
        totals[field] = (totals[field] || 0) + (expense.invoice_total || 0);
      }

      if (Object.keys(totals).length === 0) {
        alert('No invoices found for this month to import.');
        return;
      }

      onApply(totals);
      setApplied(true);
      setTimeout(() => setApplied(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={disabled || loading}
      className="border-[#7B3BFF]/40 text-[#C084FC] hover:bg-[#7B3BFF]/10 hover:border-[#7B3BFF]/60 gap-2"
    >
      {loading ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : applied ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      ) : (
        <Sparkles className="w-4 h-4" />
      )}
      {applied ? 'Applied!' : loading ? 'Loading...' : 'Auto-fill from Invoices'}
    </Button>
  );
}