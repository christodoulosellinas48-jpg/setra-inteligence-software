import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBusiness } from '@/components/business/BusinessContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  UtensilsCrossed, ShoppingCart, Store, Trash2, Users, ArrowRight,
  ChefHat, Package, TrendingUp, Percent, BarChart2, Brain,
  Receipt, BookOpen, DollarSign, FileText, Activity, Zap,
  AlertTriangle, Target, CheckCircle2, Clock, Layers, PieChart,
  Search, X, Copy, LayoutDashboard, Lightbulb, CalendarRange,
  ShoppingBag, Boxes, LineChart, ClipboardCheck
} from 'lucide-react';

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
        id: 'money', label: 'Money', icon: DollarSign, path: '/Money',
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
        id: 'vat', label: 'VAT & Bookkeeping', icon: Receipt, path: '/VATAndBookkeeping',
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
        id: 'dishes', label: 'Dishes', icon: UtensilsCrossed, path: '/Dishes',
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
        id: 'stock', label: 'Stock', icon: Package, path: '/Stock',
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
        id: 'suppliers', label: 'Suppliers', icon: Store, path: '/Suppliers',
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
        id: 'plan', label: 'Plan', icon: Target, path: '/Plan',
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
        id: 'insights', label: 'Insights', icon: Lightbulb, path: '/Insights',
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
        id: 'payroll', label: 'Payroll', icon: Users, path: '/Payroll',
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

function ModuleCard({ mod, stat }) {
  const navigate = useNavigate();
  const Icon = mod.icon;

  return (
    <motion.div variants={itemVariants} whileHover={{ y: -2, transition: { duration: 0.15 } }}>
      <Card
        className="group relative bg-[#0F0F1E]/80 border-white/[0.06] hover:border-[#7B3BFF]/40 transition-all duration-200 cursor-pointer overflow-hidden h-full"
        onClick={() => navigate(mod.path)}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#7B3BFF]/0 to-[#7B3BFF]/0 group-hover:from-[#7B3BFF]/5 group-hover:to-[#A855F7]/3 transition-all duration-300 pointer-events-none" />
        <div className="p-5 flex flex-col h-full">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#151528] border border-white/[0.06] flex items-center justify-center group-hover:border-[#7B3BFF]/30 transition-colors">
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

function SectionBlock({ section, index, stats }) {
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
          <ModuleCard key={mod.id} mod={mod} stat={stats[mod.id]} />
        ))}
      </motion.div>
    </motion.section>
  );
}

function SearchModal({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const allModules = SECTIONS.flatMap(s => s.modules);
  const filtered = query.trim()
    ? allModules.filter(m =>
        m.label.toLowerCase().includes(query.toLowerCase()) ||
        m.description.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSelect = (mod) => {
    navigate(mod.path);
    onClose();
  };

  return open ? (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-md mx-4"
      >
        <Card className="bg-[#151528] border-white/10 overflow-hidden">
          <div className="p-3 border-b border-white/5 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-500" />
            <Input
              autoFocus
              placeholder="Search modules, reports, dishes…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="bg-transparent border-0 text-white placeholder-slate-500 text-sm"
              onKeyDown={e => { if (e.key === 'Escape') onClose(); }}
            />
            <button onClick={onClose} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          {query.trim() && (
            <div className="max-h-64 overflow-y-auto">
              {filtered.length > 0 ? (
                <div className="py-2">
                  {filtered.map(mod => (
                    <button
                      key={mod.id}
                      onClick={() => handleSelect(mod)}
                      className="w-full px-4 py-2.5 text-left hover:bg-white/5 transition-colors border-b border-white/[0.02] last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <mod.icon className="w-4 h-4 text-slate-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{mod.label}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{mod.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-slate-500 text-sm">No modules found</p>
                </div>
              )}
            </div>
          )}
          {!query.trim() && (
            <div className="p-3 text-xs text-slate-500">
              Type to search modules and features…
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  ) : null;
}

export default function OperationsHub() {
  const navigate = useNavigate();
  const { currentBusiness } = useBusiness();
  const [showSearch, setShowSearch] = useState(false);
  const [stats, setStats] = useState({});

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape' && showSearch) setShowSearch(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

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
    <div className="min-h-screen bg-[#0B0B12]">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
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

          {/* Hero banner */}
          <div className="relative overflow-hidden rounded-2xl border border-[#7B3BFF]/20 bg-gradient-to-br from-[#0F0B1E] via-[#10102A] to-[#0B0B12] p-6">
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#7B3BFF]/8 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-20 w-48 h-48 bg-[#A855F7]/5 rounded-full blur-2xl pointer-events-none" />
            <div className="relative flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-[#C084FC]" />
                  <span className="text-xs font-semibold text-[#C084FC] uppercase tracking-widest">Command Centre</span>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Everything you need to run a profitable operation
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                  From ingredient costs to VAT compliance, menu engineering to supplier spend — Setra connects every part of your business into one intelligent operating system.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" onClick={() => navigate('/Dashboard')} className="text-sm">
                  <Activity className="w-4 h-4 mr-2" /> View Dashboard
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate('/Insights')} className="text-sm">
                  <BarChart2 className="w-4 h-4 mr-2" /> Open Insights
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowSearch(true)} className="text-slate-400 gap-1.5">
                  <Search className="w-4 h-4" />
                  <kbd className="hidden sm:inline text-xs bg-white/10 px-1.5 py-0.5 rounded">⌘K</kbd>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* 5 Sections */}
        <div className="space-y-8">
          {SECTIONS.map((section, index) => (
            <SectionBlock key={section.id} section={section} index={index} stats={stats} />
          ))}
        </div>

      </div>

      <SearchModal open={showSearch} onClose={() => setShowSearch(false)} />
    </div>
  );
}