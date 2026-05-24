import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Calendar, Users, TrendingUp, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AutofillControls({ businessId, onApplyData, disabled = false }) {
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [feedback, setFeedback] = useState('');

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-indexed
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const years = Array.from({ length: 8 }, (_, i) => currentYear - i);

  const handleAutoFill = async () => {
    if (!businessId) return;
    setLoading(true);
    setFeedback('');

    try {
      const targetDate = new Date(selectedYear, selectedMonth, 1);
      const periodStart = startOfMonth(targetDate);
      const periodEnd = endOfMonth(targetDate);

      const data = {};

      // 1. Fetch from FinancialSnapshot — highest priority source
      const snapshots = await base44.entities.FinancialSnapshot.filter(
        { business_id: businessId },
        '-period_start',
        24
      );

      const startStr = periodStart.toISOString().split('T')[0];
      let relevantSnapshot = snapshots.find(s => s.period_start === startStr);
      if (!relevantSnapshot && snapshots.length > 0) relevantSnapshot = snapshots[0];

      if (relevantSnapshot) {
        if (relevantSnapshot.monthly_revenue > 0) data.monthly_revenue = relevantSnapshot.monthly_revenue;
        if (relevantSnapshot.rent_fixed_costs > 0) data.rent_fixed_costs = relevantSnapshot.rent_fixed_costs;
        if (relevantSnapshot.purchases_food_bev > 0) data.purchases_food_bev = relevantSnapshot.purchases_food_bev;
        if (relevantSnapshot.utilities > 0) data.utilities = relevantSnapshot.utilities;
        if (relevantSnapshot.other_operating > 0) data.other_operating = relevantSnapshot.other_operating;
        if (relevantSnapshot.staff_costs > 0) data.staff_costs = relevantSnapshot.staff_costs;
      }

      // 2. Auto-fetch staff costs from LaborShift
      const allShifts = await base44.entities.LaborShift.filter({ business_id: businessId }, '-date', 2000);
      const relevantShifts = allShifts.filter(s => {
        if (!s.date) return false;
        const d = new Date(s.date);
        return d >= periodStart && d <= periodEnd;
      });
      if (relevantShifts.length > 0) {
        data.staff_costs = relevantShifts.reduce((sum, shift) => sum + (shift.total_cost || 0), 0);
      } else {
        const contracts = await base44.entities.EmployeeContract.filter({ business_id: businessId, status: 'active' });
        if (contracts.length > 0) {
          const totalFromContracts = contracts.reduce((sum, c) => {
            if (c.contract_type === 'monthly') return sum + (c.monthly_salary || 0);
            return sum + ((c.hourly_rate || 0) * 160);
          }, 0);
          if (totalFromContracts > 0) data.staff_costs = totalFromContracts;
        }
      }

      // 3. Aggregate Expense Documents
      const expenses = await base44.entities.ExpenseDocument.filter(
        { business_id: businessId },
        '-invoice_date',
        2000
      );

      const periodExpenses = expenses.filter(e => {
        if (!e.invoice_date) return false;
        const expDate = new Date(e.invoice_date);
        return expDate >= periodStart && expDate <= periodEnd;
      });

      const foodBevTotal = periodExpenses.filter(e => e.expense_category === 'food_beverage').reduce((s, e) => s + (e.invoice_total || 0), 0);
      const utilitiesTotal = periodExpenses.filter(e => e.expense_category === 'utilities').reduce((s, e) => s + (e.invoice_total || 0), 0);
      const otherTotal = periodExpenses.filter(e => ['operating_expenses', 'one_off_expenses'].includes(e.expense_category)).reduce((s, e) => s + (e.invoice_total || 0), 0);
      const fixedCostsTotal = periodExpenses.filter(e => e.expense_category === 'fixed_costs').reduce((s, e) => s + (e.invoice_total || 0), 0);
      const staffCostsFromInvoices = periodExpenses.filter(e => e.expense_category === 'staff_costs').reduce((s, e) => s + (e.invoice_total || 0), 0);

      if (foodBevTotal > 0) data.purchases_food_bev = foodBevTotal;
      if (utilitiesTotal > 0) data.utilities = utilitiesTotal;
      if (otherTotal > 0) data.other_operating = otherTotal;
      if (fixedCostsTotal > 0) data.rent_fixed_costs = fixedCostsTotal;
      if (staffCostsFromInvoices > 0 && !data.staff_costs) data.staff_costs = staffCostsFromInvoices;

      if (Object.keys(data).length === 0) {
        setFeedback('No data found for this period. Try a different month or enter manually.');
      } else {
        onApplyData(data);
        const fieldLabels = { monthly_revenue: 'Revenue', purchases_food_bev: 'F&B', staff_costs: 'Staff', rent_fixed_costs: 'Rent', utilities: 'Utilities', other_operating: 'Other' };
        const filled = Object.keys(data).map(k => fieldLabels[k] || k).join(', ');
        setFeedback(`✓ Filled: ${filled}`);
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
            className="absolute top-full right-0 mt-2 w-80 z-50"
          >
            <Card className="bg-[#0F0F1E] border-white/[0.06] p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Select month to pull data from:
                </p>
                <button onClick={() => setShowOptions(false)} className="text-slate-600 hover:text-slate-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Year row */}
              <div className="flex gap-1.5 flex-wrap mb-2">
                {years.map(y => (
                  <button
                    key={y}
                    onClick={() => setSelectedYear(y)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      selectedYear === y
                        ? 'bg-[#7B3BFF] text-white'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>

              {/* Month grid */}
              <div className="grid grid-cols-6 gap-1 mb-4">
                {MONTHS.map((m, i) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(i)}
                    className={`py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                      selectedMonth === i && selectedYear === currentYear ? 'ring-1 ring-[#7B3BFF]/50' : ''
                    } ${
                      selectedMonth === i
                        ? 'bg-[#7B3BFF] text-white'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <p className="text-[10px] text-slate-500 mb-3">
                Selected: {MONTHS[selectedMonth]} {selectedYear}
              </p>

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