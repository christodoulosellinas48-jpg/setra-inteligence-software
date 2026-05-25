import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useBusiness } from '@/components/business/BusinessContext';
import ManualExpenseModal from '@/components/expenses/ManualExpenseModal';
import LogWasteModal from '@/components/layout/LogWasteModal';

export default function QuickActionChips() {
  const { currentBusiness, user } = useBusiness();
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [wasteOpen, setWasteOpen] = useState(false);

  if (!currentBusiness) return null;

  return (
    <>
      <button
        onClick={() => setExpenseOpen(true)}
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/8 hover:bg-emerald-500/15 hover:border-emerald-500/50 transition-all duration-200 text-xs font-medium text-emerald-400"
        title="Add expense"
      >
        <Plus className="w-3.5 h-3.5" />
        Add expense
      </button>

      <button
        onClick={() => setWasteOpen(true)}
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/8 hover:bg-amber-500/15 hover:border-amber-500/50 transition-all duration-200 text-xs font-medium text-amber-400"
        title="Log waste"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Log waste
      </button>

      <ManualExpenseModal
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        onSave={() => setExpenseOpen(false)}
        businessId={currentBusiness.id}
        userEmail={user?.email}
      />

      <LogWasteModal
        open={wasteOpen}
        onOpenChange={setWasteOpen}
        businessId={currentBusiness.id}
      />
    </>
  );
}