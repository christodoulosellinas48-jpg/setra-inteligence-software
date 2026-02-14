import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, addMonths, format } from 'date-fns';

const CATEGORIES = [
  { key: 'food_beverage_budget', label: 'Food & Beverage', color: 'emerald' },
  { key: 'staff_costs_budget', label: 'Staff Costs', color: 'purple' },
  { key: 'fixed_costs_budget', label: 'Rent / Fixed Costs', color: 'blue' },
  { key: 'utilities_budget', label: 'Utilities', color: 'cyan' },
  { key: 'operating_expenses_budget', label: 'Operating Expenses', color: 'slate' }
];

export default function BudgetForm({ budget, onChange, onSave, onAutoFill, historicalData, saving, autoFilling }) {
  const handlePeriodChange = (periodType) => {
    const now = new Date();
    let start, end;
    
    if (periodType === 'monthly') {
      start = startOfMonth(addMonths(now, 1));
      end = endOfMonth(addMonths(now, 1));
    } else {
      start = startOfQuarter(addMonths(now, 3));
      end = endOfQuarter(addMonths(now, 3));
    }
    
    onChange({
      ...budget,
      period_type: periodType,
      period_start: format(start, 'yyyy-MM-dd'),
      period_end: format(end, 'yyyy-MM-dd')
    });
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Set Budget</h3>
        {historicalData && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAutoFill}
            disabled={autoFilling}
            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
          >
            {autoFilling ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Auto-fill from History
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Label className="text-slate-400 mb-2 block">Budget Period</Label>
          <Select value={budget.period_type || 'monthly'} onValueChange={handlePeriodChange}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="monthly" className="text-white hover:bg-slate-700">Monthly</SelectItem>
              <SelectItem value="quarterly" className="text-white hover:bg-slate-700">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-slate-400 mb-2 block">Revenue Target</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
            <Input
              type="number"
              value={budget.revenue_target || ''}
              onChange={(e) => onChange({ ...budget, revenue_target: parseFloat(e.target.value) || 0 })}
              className="bg-slate-800 border-slate-700 text-white pl-8"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {CATEGORIES.map((cat) => (
          <div key={cat.key}>
            <Label className="text-slate-400 mb-2 block text-sm">{cat.label}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
              <Input
                type="number"
                value={budget[cat.key] || ''}
                onChange={(e) => onChange({ ...budget, [cat.key]: parseFloat(e.target.value) || 0 })}
                className="bg-slate-800 border-slate-700 text-white pl-8"
                placeholder="0"
              />
            </div>
          </div>
        ))}
      </div>

      <Button 
        onClick={onSave} 
        disabled={saving}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Save Budget
      </Button>
    </Card>
  );
}