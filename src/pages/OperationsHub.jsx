import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UtensilsCrossed, ShoppingCart, Store, Trash2, Users, ArrowRight, ChefHat } from 'lucide-react';

const MODULES = [
  {
    id: 'menu',
    label: 'Menu Engineering',
    icon: UtensilsCrossed,
    path: '/MenuEngineering',
    description: 'Analyse menu item profitability and popularity. Identify stars, plowhorses, puzzles, and dogs.',
    color: 'from-violet-500/20 to-purple-500/10',
    iconColor: 'text-violet-400',
    iconBg: 'bg-violet-500/15',
    badge: 'Analytics'
  },
  {
    id: 'po',
    label: 'Purchase Orders',
    icon: ShoppingCart,
    path: '/PurchaseOrders',
    description: 'Create, send, and track purchase orders to suppliers. Manage delivery expectations and costs.',
    color: 'from-blue-500/20 to-cyan-500/10',
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/15',
    badge: 'Procurement'
  },
  {
    id: 'vendors',
    label: 'Vendors & Suppliers',
    icon: Store,
    path: '/Vendors',
    description: 'Manage supplier relationships, view invoice history, and track total spending per vendor.',
    color: 'from-emerald-500/20 to-teal-500/10',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15',
    badge: 'Suppliers'
  },
  {
    id: 'waste',
    label: 'Waste Management',
    icon: Trash2,
    path: '/WasteManagement',
    description: 'Log and track food waste, identify high-waste items, and reduce operational losses.',
    color: 'from-orange-500/20 to-amber-500/10',
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-500/15',
    badge: 'Sustainability'
  },
  {
    id: 'payroll',
    label: 'Payroll & Staff',
    icon: Users,
    path: '/Payroll',
    description: 'Manage shifts, track labour costs, and maintain employee contract records.',
    color: 'from-pink-500/20 to-rose-500/10',
    iconColor: 'text-pink-400',
    iconBg: 'bg-pink-500/15',
    badge: 'HR & Labour'
  },
  {
    id: 'recipes',
    label: 'Recipe Manager',
    icon: ChefHat,
    path: '/RecipeManager',
    description: 'Link inventory ingredients to menu items and track real-time food cost percentages per dish.',
    color: 'from-yellow-500/20 to-orange-500/10',
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-500/15',
    badge: 'Food Cost'
  }
];

export default function OperationsHub() {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Operations Hub</h1>
        <p className="text-slate-400 text-sm mt-1">All your operational tools in one place</p>
      </div>

      {/* Hero Banner */}
      <Card className="bg-gradient-to-r from-[#7B3BFF]/10 to-[#A855F7]/5 border-[#7B3BFF]/20 p-8">
        <div className="max-w-2xl">
          <h2 className="text-xl font-bold text-white mb-2">Operational Excellence, Unified</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            From menu profitability to vendor management, waste tracking to payroll — 
            everything you need to run a lean, profitable hospitality operation.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {MODULES.map(m => (
              <span key={m.id} className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400">
                {m.label}
              </span>
            ))}
          </div>
        </div>
      </Card>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map((mod, idx) => {
          const Icon = mod.icon;
          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.07 }}
            >
              <Card
                className={`bg-gradient-to-br ${mod.color} border-white/5 hover:border-[#7B3BFF]/40 transition-all duration-200 cursor-pointer group p-6 h-full flex flex-col`}
                onClick={() => navigate(mod.path)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl ${mod.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${mod.iconColor}`} />
                  </div>
                  <Badge className="bg-white/5 border-white/10 text-slate-400 text-xs">
                    {mod.badge}
                  </Badge>
                </div>

                <h3 className="text-white font-semibold text-base mb-2 group-hover:text-[#C084FC] transition-colors">
                  {mod.label}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed flex-1">
                  {mod.description}
                </p>

                <div className="flex items-center gap-1 mt-4 text-[#A855F7] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Open <ArrowRight className="w-4 h-4" />
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}