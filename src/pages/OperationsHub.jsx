import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useBusiness } from '@/components/business/BusinessContext';

import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  UtensilsCrossed, Store, Users, ArrowRight,
  Package, BarChart2,
  Receipt, DollarSign,
  AlertTriangle, Target, Layers,
  LayoutDashboard, Lightbulb,
  Boxes, LineChart, ClipboardCheck, Pin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PinButton from '@/components/sidebar/PinButton';
import SidebarFullModal from '@/components/sidebar/SidebarFullModal';
import { useSidebarLayout } from '@/lib/SidebarLayoutContext';
import { toast } from 'sonner';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
};

// ─── Section definitions (5 outcome-named sections) ───────────────────────

const SECTIONS = [
  {
    id: 'today',
    label: "Today's Numbers",
    subtitle: 'Your venue, right now',
    icon: LayoutDashboard,
    color: 'text-violet-400',
    borderColor: 'border-violet-500/20',
    modules: [
      {
        id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/Dashboard',
        description: 'Live P&L health score, KPIs, and the daily snapshot of your business.',
        badge: 'Daily', badgeColor: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
        fetchStat: async () => null,
      },
      {
        id: 'money', label: 'Financial Data', icon: DollarSign, path: '/FinancialData',
        description: 'All money in (revenue) and money out (expenses) in one view.',
        badge: 'Cash Flow', badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
        fetchStat: async (biz) => {
          try {
            const expenses = await base44.entities.ExpenseDocument.filter({ business_id: biz.id });
            return expenses.length > 0 ? `${expenses.length} invoices` : null;
          } catch { return null; }
        }
      },
      {
        id: 'vat', sidebarId: 'vat', label: 'VAT & Bookkeeping', icon: Receipt, path: '/VATAndBookkeeping',
        description: 'Inbox, bank reconciliation, VAT periods, P&L, payroll, and exports.',
        badge: 'Compliance', badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
        fetchStat: async () => null,
      },
    ]
  },
  {
    id: 'dishes',
    label: 'Dishes & Menu',
    subtitle: 'What you sell, what it costs you',
    icon: UtensilsCrossed,
    color: 'text-purple-400',
    borderColor: 'border-purple-500/20',
    modules: [
      {
        id: 'dishes', sidebarId: 'dishes', label: 'Dishes', icon: UtensilsCrossed, path: '/Dishes',
        description: 'Menu items, recipes, food cost per plate, and the engineering matrix — all in one place.',
        badge: 'Menu', badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/20',
        fetchStat: async (biz) => {
          try {
            const items = await base44.entities.Item.filter({ business_id: biz.id });
            return items.length > 0 ? `${items.length} dishes` : null;
          } catch { return null; }
        }
      },
    ]
  },
  {
    id: 'stock',
    label: 'Stock & Suppliers',
    subtitle: 'What you have, who you buy from',
    icon: Boxes,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/20',
    modules: [
      {
        id: 'stock', sidebarId: 'stock', label: 'Stock', icon: Package, path: '/Stock',
        description: 'Inventory levels, reorder alerts, and waste log — the full stock picture.',
        badge: 'Inventory', badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20',
        fetchStat: async (biz) => {
          try {
            const items = await base44.entities.InventoryItem.filter({ business_id: biz.id });
            return items.length > 0 ? `${items.length} items` : null;
          } catch { return null; }
        }
      },
      {
        id: 'suppliers', sidebarId: 'suppliers', label: 'Suppliers', icon: Store, path: '/Suppliers',
        description: 'Supplier directory, purchase orders, and spend analysis — past and future orders.',
        badge: 'Procurement', badgeColor: 'bg-teal-500/15 text-teal-300 border-teal-500/20',
        fetchStat: async (biz) => {
          try {
            const suppliers = await base44.entities.Supplier.filter({ business_id: biz.id });
            return suppliers.length > 0 ? `${suppliers.length} suppliers` : null;
          } catch { return null; }
        }
      },
    ]
  },
  {
    id: 'plan',
    label: 'Plan & Analyse',
    subtitle: 'Look ahead, look back',
    icon: LineChart,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/20',
    modules: [
      {
        id: 'plan', sidebarId: 'plan', label: 'Plan', icon: Target, path: '/Plan',
        description: 'Set monthly budgets and run 6-month forecasts with optimistic/conservative scenarios.',
        badge: 'Forward', badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
        fetchStat: async (biz) => {
          try {
            const budgets = await base44.entities.Budget.filter({ business_id: biz.id });
            return budgets.length > 0 ? `${budgets.length} budgets` : null;
          } catch { return null; }
        }
      },
      {
        id: 'insights', sidebarId: 'insights', label: 'Insights', icon: Lightbulb, path: '/Insights',
        description: 'Performance reports, deep-dive audit findings, and an action plan to act on them.',
        badge: 'Analysis', badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/20',
        fetchStat: async (biz) => {
          try {
            const audits = await base44.entities.AuditRun.filter({ business_id: biz.id });
            return audits.length > 0 ? `${audits.length} audits` : null;
          } catch { return null; }
        }
      },
    ]
  },
  {
    id: 'compliance',
    label: 'Compliance & People',
    subtitle: 'Filings, staff, money owed',
    icon: ClipboardCheck,
    color: 'text-blue-400',
    borderColor: 'border-blue-500/20',
    modules: [
      {
        id: 'vat2', label: 'VAT & Bookkeeping', icon: Receipt, path: '/VATAndBookkeeping',
        description: 'Cyprus VAT periods, filings, bank reconciliation, and accountant exports.',
        badge: 'VAT', badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
        fetchStat: async () => null,
      },
      {
        id: 'payroll', sidebarId: 'payroll', label: 'Payroll', icon: Users, path: '/Payroll',
        description: 'Employee contracts, shifts, labour costs, and Cyprus payroll tax breakdown.',
        badge: 'HR', badgeColor: 'bg-pink-500/15 text-pink-300 border-pink-500/20',
        fetchStat: async (biz) => {
          try {
            const contracts = await base44.entities.EmployeeContract.filter({ business_id: biz.id, status: 'active' });
            return contracts.length > 0 ? `${contracts.length} employees` : null;
          } catch { return null; }
        }
      },
    ]
  },
];

function ModuleCard({ mod, stat, onPinFull }) {
  const navigate = useNavigate();
  const Icon = mod.icon;
  const { isPinned, canEdit, canPinMore, pin, unpin, vatLocked, contextGroupName } = useSidebarLayout();

  const pinned = isPinned(mod.sidebarId || mod.id);
  const SACRED = ['dashboard', 'ops_hub', 'settings'];
  const isSacred = SACRED.includes(mod.sidebarId || mod.id);

  const handlePinClick = (e) => {
    e.stopPropagation();
    const sid = mod.sidebarId || mod.id;
    if (pinned) {
      if (sid === 'vat' && vatLocked) return;
      unpin(sid);
      toast.success(`Unpinned from ${contextGroupName}`, { duration: 2000 });
    } else {
      if (!canPinMore) { onPinFull(); return; }
      pin(sid);
      toast.success(`Pinned to sidebar for ${contextGroupName}`, { duration: 2000 });
    }
  };

  return (
    <motion.div variants={itemVariants} whileHover={{ y: -2, transition: { duration: 0.15 } }}>
      <Card
        className="group relative bg-[#0D0D1A]/90 border-[#7B3BFF]/10 hover:border-[#7B3BFF]/45 hover:shadow-[0_0_24px_rgba(123,59,255,0.18)] transition-all duration-200 cursor-pointer overflow-hidden h-full"
        onClick={() => navigate(mod.path)}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#7B3BFF]/0 to-[#7B3BFF]/0 group-hover:from-[#7B3BFF]/7 group-hover:to-[#A855F7]/4 transition-all duration-300 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7B3BFF]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Pin button top-right */}
        {!isSacred && canEdit && (
          <button
            onClick={handlePinClick}
            title={pinned ? `Unpin from sidebar` : `Pin to sidebar (${contextGroupName})`}
            className={cn(
              'absolute top-2.5 right-2.5 z-10 flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-150',
              'opacity-0 group-hover:opacity-100',
              pinned
                ? 'bg-[#7B3BFF]/20 border border-[#7B3BFF]/50 text-[#A855F7]'
                : 'bg-[#151528] border border-white/[0.06] text-slate-500 hover:bg-[#7B3BFF]/15 hover:border-[#7B3BFF]/40 hover:text-[#A855F7]'
            )}
          >
            <Pin className={cn('w-3.5 h-3.5', pinned && 'fill-[#A855F7]')} />
          </button>
        )}

        <div className="p-5 flex flex-col h-full">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F0F20] border border-[#7B3BFF]/15 flex items-center justify-center group-hover:border-[#7B3BFF]/40 group-hover:shadow-[0_0_12px_rgba(123,59,255,0.2)] transition-all duration-200">
              <Icon className="w-4.5 h-4.5 text-[#C084FC]" style={{ width: '1.1rem', height: '1.1rem' }} />
            </div>
            <Badge className={`text-[10px] px-2 py-0.5 border ${mod.badgeColor}`}>
              {mod.badge}
            </Badge>
          </div>
          <h3 className="text-sm font-semibold text-white mb-1.5 group-hover:text-[#C084FC] transition-colors leading-snug">
            {mod.label}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed flex-1 mb-3">
            {mod.description}
          </p>
          {stat && (
            <p className="text-xs text-slate-400 font-medium mb-2">✓ {stat}</p>
          )}
          <div className="flex items-center gap-1 text-[#7B3BFF] text-xs font-medium opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-[-4px] group-hover:translate-x-0">
            Open <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function SectionBlock({ section, index, stats, onPinFull }) {
  const Icon = section.icon;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg bg-[#151528] border ${section.borderColor} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${section.color}`} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">{section.label}</h2>
          <p className="text-xs text-slate-500">{section.subtitle}</p>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
      >
        {section.modules.map((mod) => (
          <ModuleCard key={mod.id} mod={mod} stat={stats[mod.id]} onPinFull={onPinFull} />
        ))}
      </motion.div>
    </motion.section>
  );
}


export default function OperationsHub() {
  const navigate = useNavigate();
  const { currentBusiness } = useBusiness();
  const [stats, setStats] = useState({});
  const [showFullModal, setShowFullModal] = useState(false);


  useEffect(() => {
    if (!currentBusiness) return;
    const fetchAllStats = async () => {
      const newStats = {};
      for (const section of SECTIONS) {
        for (const mod of section.modules) {
          try {
            const stat = await mod.fetchStat(currentBusiness);
            if (stat) newStats[mod.id] = stat;
          } catch {}
        }
      }
      setStats(newStats);
    };
    fetchAllStats();
  }, [currentBusiness]);

  const { data: pendingExpenses = [] } = useQuery({
    queryKey: ['pendingExpenses', currentBusiness?.id],
    queryFn: () => base44.entities.ExpenseDocument.filter({ business_id: currentBusiness.id, status: 'pending' }),
    enabled: !!currentBusiness,
    staleTime: 2 * 60 * 1000
  });

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory', currentBusiness?.id],
    queryFn: () => base44.entities.InventoryItem.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness,
    staleTime: 5 * 60 * 1000
  });

  const lowStockCount = inventoryItems.filter(i => i.current_stock <= i.reorder_threshold).length;

  return (
    <div className="min-h-screen bg-[#07070F]">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className=""
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7B3BFF]/25 to-[#A855F7]/15 border border-[#7B3BFF]/30 flex items-center justify-center">
                  <Layers className="w-4.5 h-4.5 text-[#C084FC]" style={{ width: '1.1rem', height: '1.1rem' }} />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Operations Hub</h1>
              </div>
              <p className="text-slate-400 text-sm">
                11 modules across 5 areas, organised the way your day flows.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {pendingExpenses.length > 0 && (
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 border text-xs gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {pendingExpenses.length} pending
                </Badge>
              )}
              {lowStockCount > 0 && (
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 border text-xs gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {lowStockCount} low stock
                </Badge>
              )}
            </div>
          </div>

        </motion.div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* 5 Sections */}
        <div className="space-y-8">
          {SECTIONS.map((section, index) => (
            <SectionBlock key={section.id} section={section} index={index} stats={stats} onPinFull={() => setShowFullModal(true)} />
          ))}
        </div>

      </div>

      {showFullModal && (
        <SidebarFullModal open={showFullModal} onClose={() => setShowFullModal(false)} />
      )}
    </div>
  );
}