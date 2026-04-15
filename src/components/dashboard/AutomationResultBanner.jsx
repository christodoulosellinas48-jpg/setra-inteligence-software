import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Building2, BookOpen, Receipt, Package, ShoppingCart, BarChart2 } from 'lucide-react';

export default function AutomationResultBanner({ result }) {
  if (!result) return null;

  const items = [
    result.supplier && { icon: Building2, label: `Supplier ${result.supplier}`, color: 'text-blue-400' },
    result.ledger === 'created' && { icon: BookOpen, label: 'Ledger entry posted', color: 'text-purple-400' },
    result.vat_updated && { icon: Receipt, label: 'VAT period updated', color: 'text-amber-400' },
    result.inventory_updated > 0 && { icon: Package, label: `${result.inventory_updated} inventory item${result.inventory_updated > 1 ? 's' : ''} updated`, color: 'text-cyan-400' },
    result.inventory_created > 0 && { icon: Package, label: `${result.inventory_created} new inventory item${result.inventory_created > 1 ? 's' : ''} created`, color: 'text-cyan-400' },
    result.purchases > 0 && { icon: ShoppingCart, label: `${result.purchases} purchase record${result.purchases > 1 ? 's' : ''} logged`, color: 'text-emerald-400' },
    result.snapshot && { icon: BarChart2, label: 'Reporting updated', color: 'text-rose-400' },
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
    >
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <p className="text-emerald-400 font-medium text-sm">Invoice processed — system updated automatically</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-1.5">
              <Icon className={`w-3.5 h-3.5 ${item.color}`} />
              <span className="text-slate-300 text-xs">{item.label}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}