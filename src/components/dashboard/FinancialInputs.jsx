import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { DollarSign, Home, Users, ShoppingCart, Zap, MoreHorizontal, ChevronUp, ChevronDown } from 'lucide-react';

const inputs = [
  { key: 'monthly_revenue', label: 'Monthly Revenue', icon: DollarSign, color: 'emerald' },
  { key: 'rent_fixed_costs', label: 'Rent / Fixed Costs', icon: Home, color: 'blue' },
  { key: 'staff_costs', label: 'Staff Costs', icon: Users, color: 'purple' },
  { key: 'purchases_food_bev', label: 'Purchases (F&B)', icon: ShoppingCart, color: 'amber' },
  { key: 'utilities', label: 'Utilities', icon: Zap, color: 'cyan' },
  { key: 'other_operating', label: 'Other Operating', icon: MoreHorizontal, color: 'slate' },
  { key: 'corporate_tax_rate', label: 'Corporate Tax Rate (%)', icon: DollarSign, color: 'red', isPercentage: true }
];

const colorClasses = {
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  red: 'bg-red-500/10 text-red-400 border-red-500/20'
};

export default function FinancialInputs({ values, onChange, disabled = false, currencySymbol = '€' }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {inputs.map((input, index) => {
        const Icon = input.icon;
        return (
          <motion.div
            key={input.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative"
          >
            <Label className="text-slate-400 text-sm mb-2 block">{input.label}</Label>
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses[input.color]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <Input
                  type="number"
                  value={values[input.key] || ''}
                  onChange={(e) => onChange(input.key, parseFloat(e.target.value) || 0)}
                  className="pl-14 pr-10 h-12 bg-slate-800/50 border-slate-700 text-white text-lg font-medium focus:border-emerald-500/50 focus:ring-emerald-500/20 disabled:opacity-50"
                  placeholder="0"
                  disabled={disabled}
                  step={input.isPercentage ? "0.1" : "1"}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                  {input.isPercentage ? '%' : currencySymbol}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    const increment = input.isPercentage ? 0.5 : 100;
                    onChange(input.key, (values[input.key] || 0) + increment);
                  }}
                  disabled={disabled}
                  className="h-5 w-8 bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-emerald-500/50"
                >
                  <ChevronUp className="w-3 h-3 text-slate-400" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    const decrement = input.isPercentage ? 0.5 : 100;
                    onChange(input.key, Math.max(0, (values[input.key] || 0) - decrement));
                  }}
                  disabled={disabled}
                  className="h-5 w-8 bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-emerald-500/50"
                >
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </Button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}