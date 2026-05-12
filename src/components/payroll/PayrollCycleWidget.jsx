import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, CheckCircle2, Clock, Play, AlertCircle } from 'lucide-react';
import { format, addMonths, endOfMonth, differenceInDays } from 'date-fns';

function getNextPayrollDate() {
  const now = new Date();
  // Last day of current month
  const eom = endOfMonth(now);
  if (now.getDate() >= 25) {
    // Past the 25th — next is end of next month
    return endOfMonth(addMonths(now, 1));
  }
  return eom;
}

export default function PayrollCycleWidget({ contracts, onRunPayroll }) {
  const activeContracts = contracts.filter(c => c.status === 'active');
  const monthlySalaries = activeContracts
    .filter(c => c.contract_type === 'monthly')
    .reduce((s, c) => s + (c.monthly_salary || 0), 0);

  const nextRun = getNextPayrollDate();
  const daysUntil = differenceInDays(nextRun, new Date());
  const isUrgent = daysUntil <= 7;

  if (activeContracts.length === 0) {
    return (
      <Card className="bg-[#151528]/80 border-white/5 p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#7B3BFF]/15 flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-5 h-5 text-[#C084FC]" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">No payroll cycle yet</p>
            <p className="text-slate-500 text-xs">Add employees to activate the monthly payroll cycle.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`border p-5 ${isUrgent ? 'bg-amber-500/8 border-amber-500/30' : 'bg-[#151528]/80 border-white/5'}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isUrgent ? 'bg-amber-500/15' : 'bg-[#7B3BFF]/15'}`}>
            {isUrgent
              ? <AlertCircle className="w-5 h-5 text-amber-400" />
              : <CalendarDays className="w-5 h-5 text-[#C084FC]" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`font-semibold text-sm ${isUrgent ? 'text-amber-300' : 'text-white'}`}>
                Next payroll run: {format(nextRun, 'dd MMM yyyy')}
              </p>
              <Badge className={isUrgent
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs'
                : 'bg-[#7B3BFF]/20 text-[#C084FC] border-[#7B3BFF]/30 text-xs'}>
                {daysUntil === 0 ? 'Today' : `${daysUntil} days away`}
              </Badge>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              {activeContracts.length} active employee{activeContracts.length !== 1 ? 's' : ''} · Cycle: Monthly
              {monthlySalaries > 0 && ` · Estimated: €${monthlySalaries.toLocaleString()} (salaried)`}
            </p>
            {activeContracts.filter(c => c.contract_type !== 'monthly').length > 0 && (
              <p className="text-amber-400/70 text-xs mt-0.5">
                + {activeContracts.filter(c => c.contract_type !== 'monthly').length} hourly — hours needed to calculate total
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" className="text-xs gap-1.5">
            Adjust hours
          </Button>
          <Button size="sm" onClick={onRunPayroll} className="text-xs gap-1.5 bg-gradient-to-r from-[#7B3BFF] to-[#A855F7]">
            <Play className="w-3.5 h-3.5" /> Review & approve
          </Button>
        </div>
      </div>
    </Card>
  );
}