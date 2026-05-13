import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Loader2, Calendar, Users, TrendingUp, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

export default function AutofillControls({ businessId, onApplyData, disabled = false }) {
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('current');
  const [showOptions, setShowOptions] = useState(false);
  const [feedback, setFeedback] = useState('');

  const months = [
    { value: 'current', label: 'Current Month' },
    { value: '1', label: '1 Month Ago' },
    { value: '2', label: '2 Months Ago' },
    { value: '3', label: '3 Months Ago' },
    { value: '6', label: '6 Months Ago' },
    { value: 'all', label: 'All Time' },
  ];

  const handleAutoFill = async () => {
    if (!businessId) return;
    setLoading(true);
    setFeedback('');

    try {
      const isAllTime = selectedMonth === 'all';
      const monthsBack = selectedMonth === 'current' ? 0 : parseInt(selectedMonth);
      const targetDate = monthsBack === 0 ? new Date() : subMonths(new Date(), monthsBack);
      const periodStart = isAllTime ? null : startOfMonth(targetDate);
      const periodEnd = isAllTime ? null : endOfMonth(targetDate);

      const data = {};

      // 1. Fetch from FinancialSnapshot if available (only for specific month, not all time)
      if (!isAllTime) {
        const snapshots = await base44.entities.FinancialSnapshot.filter(
          { business_id: businessId },
          '-period_start',
          10
        );
        const relevantSnapshot = snapshots.find(s => {
          const snapshotDate = new Date(s.period_start);
          return snapshotDate >= periodStart && snapshotDate <= periodEnd;
        });
        if (relevantSnapshot) {
          if (relevantSnapshot.monthly_revenue) data.monthly_revenue = relevantSnapshot.monthly_revenue;
          if (relevantSnapshot.rent_fixed_costs) data.rent_fixed_costs = relevantSnapshot.rent_fixed_costs;
          if (relevantSnapshot.purchases_food_bev) data.purchases_food_bev = relevantSnapshot.purchases_food_bev;
          if (relevantSnapshot.utilities) data.utilities = relevantSnapshot.utilities;
          if (relevantSnapshot.other_operating) data.other_operating = relevantSnapshot.other_operating;
        }
      }

      // 2. Auto-fetch staff costs from LaborShift (fetch all for business, filter client-side)
      const allShifts = await base44.entities.LaborShift.filter({ business_id: businessId }, '-date', 2000);
      console.log('LaborShift results:', allShifts.length, allShifts.slice(0, 3));
      const relevantShifts = isAllTime ? allShifts : allShifts.filter(s => {
        if (!s.date) return false;
        const d = new Date(s.date);
        return d >= periodStart && d <= periodEnd;
      });
      if (relevantShifts.length > 0) {
        const totalStaffCosts = relevantShifts.reduce((sum, shift) => sum + (shift.total_cost || 0), 0);
        data.staff_costs = totalStaffCosts;
      } else {
        // Fallback: use active EmployeeContracts monthly salaries
        const contracts = await base44.entities.EmployeeContract.filter({ business_id: businessId, status: 'active' });
        console.log('EmployeeContract fallback:', contracts.length, contracts.slice(0, 3));
        if (contracts.length > 0) {
          const totalFromContracts = contracts.reduce((sum, c) => {
            if (c.contract_type === 'monthly') return sum + (c.monthly_salary || 0);
            if (c.contract_type === 'hourly' || c.contract_type === 'part_time') {
              // Estimate: hourly rate * 160 hours/month
              return sum + ((c.hourly_rate || 0) * 160);
            }
            return sum;
          }, 0);
          if (totalFromContracts > 0) data.staff_costs = totalFromContracts;
        }
      }

      // 3. Aggregate Expense Documents for food costs & utilities
      const expenses = await base44.entities.ExpenseDocument.filter(
        { business_id: businessId },
        '-invoice_date',
        2000
      );

      const periodExpenses = isAllTime ? expenses : expenses.filter(e => {
        if (!e.invoice_date) return false;
        const expDate = new Date(e.invoice_date);
        return expDate >= periodStart && expDate <= periodEnd;
      });

      const foodBevTotal = periodExpenses
        .filter(e => e.expense_category === 'food_beverage')
        .reduce((sum, e) => sum + (e.invoice_total || 0), 0);

      const utilitiesTotal = periodExpenses
        .filter(e => e.expense_category === 'utilities')
        .reduce((sum, e) => sum + (e.invoice_total || 0), 0);

      const otherTotal = periodExpenses
        .filter(e => ['operating_expenses', 'one_off_expenses'].includes(e.expense_category))
        .reduce((sum, e) => sum + (e.invoice_total || 0), 0);

      if (foodBevTotal > 0) data.purchases_food_bev = foodBevTotal;
      if (utilitiesTotal > 0) data.utilities = utilitiesTotal;
      if (otherTotal > 0) data.other_operating = otherTotal;

      console.log('Autofill final data:', data);
      if (Object.keys(data).length === 0) {
        setFeedback('No data found for this period');
      } else {
        onApplyData(data);
        setFeedback(`✓ Auto-filled: ${Object.keys(data).join(', ')}`);
        setShowOptions(false);
      }
    } catch (error) {
      setFeedback(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowOptions(!showOptions)}
        disabled={disabled || loading}
        className="h-8 gap-2 text-xs"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
        Auto-fill
      </Button>

      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            className="absolute top-full right-0 mt-2 w-72 z-50"
          >
            <Card className="bg-[#0F0F1E] border-white/[0.06] p-4 shadow-lg">
              <p className="text-xs font-semibold text-slate-400 mb-3">Select month to pull data from:</p>

              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full bg-[#151528] border-white/10 text-white text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[#151528] border-white/10">
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value} className="text-white text-sm">
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-2 mb-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Revenue from snapshots</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-purple-500" />
                  <span>Staff costs from payroll</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                  <span>Food/utilities from invoices</span>
                </div>
              </div>

              <Button
                onClick={handleAutoFill}
                disabled={loading || disabled}
                className="w-full h-9 text-sm gap-2"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {loading ? 'Fetching data...' : 'Apply Data'}
              </Button>

              {feedback && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-xs mt-3 p-2 rounded-lg text-center ${
                    feedback.startsWith('✓')
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-rose-500/10 text-rose-400'
                  }`}
                >
                  {feedback}
                </motion.p>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}