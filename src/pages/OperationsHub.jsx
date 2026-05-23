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
  Search, X
} from 'lucide-react';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
};

const CATEGORIES = [
  {
    id: 'profit',
    label: 'Profit Drivers',
    subtitle: 'Maximise margin from every menu item and sale',
    icon: TrendingUp,
    color: 'text-violet-400',
    borderColor: 'border-violet-500/20',
    modules: [
      {
        id: 'menu', label: 'Menu Engineering', icon: UtensilsCrossed, path: '/MenuEngineering',
        description: 'Stars, plowhorses, puzzles & dogs. Identify your top-margin items.',
        badge: 'Profitability', badgeColor: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
        fetchStat: async (biz) => {
          try {
            const items = await base44.entities.Item.filter({ business_id: biz.id });
            return items.length > 0 ? `${items.length} dishes` : null;
          } catch { return null; }
        }
      },
      {
        id: 'recipes', label: 'Recipe Manager', icon: ChefHat, path: '/RecipeManager',
        description: 'Link ingredients to dishes and track real-time food cost per plate.',
        badge: 'Food Cost', badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/20',
        fetchStat: async (biz) => {
          try {
            const recipes = await base44.entities.Recipe.filter({ business_id: biz.id });
            return recipes.length > 0 ? `${recipes.length} recipes` : null;
          } catch { return null; }
        }
      },
    ]
  },
  {
    id: 'cost',
    label: 'Budget',
    subtitle: 'Track every euro leaving the business',
    icon: DollarSign,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
    modules: [
      {
        id: 'vendors', label: 'Vendors & Suppliers', icon: Store, path: '/Vendors',
        description: 'Supplier relationships, invoice history, and total spend per vendor.',
        badge: 'Suppliers', badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
        fetchStat: async (biz) => {
          try {
            const suppliers = await base44.entities.Supplier.filter({ business_id: biz.id });
            return suppliers.length > 0 ? `${suppliers.length} suppliers` : null;
          } catch { return null; }
        }
      },
      {
        id: 'waste', label: 'Waste Management', icon: Trash2, path: '/WasteManagement',
        description: 'Log food waste, identify high-waste items, and reduce operational loss.',
        badge: 'Waste', badgeColor: 'bg-orange-500/15 text-orange-300 border-orange-500/20',
        fetchStat: async (biz) => null // Placeholder
      },
      {
        id: 'expenses', label: 'Expenses', icon: Receipt, path: '/Expenses',
        description: 'Upload invoices and receipts. AI extracts and categorises automatically.',
        badge: 'Invoices', badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
        fetchStat: async (biz) => {
          try {
            const expenses = await base44.entities.ExpenseDocument.filter({ business_id: biz.id });
            return expenses.length > 0 ? `${expenses.length} invoices` : null;
          } catch { return null; }
        }
      },
    ]
  },
  {
    id: 'supply',
    label: 'Inventory & Supply',
    subtitle: 'Know what you have and what you need',
    icon: Package,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/20',
    modules: [
      {
        id: 'inventory', label: 'Inventory', icon: Package, path: '/Inventory',
        description: 'Track stock levels, reorder thresholds, and ingredient unit costs.',
        badge: 'Stock', badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20',
        fetchStat: async (biz) => {
          try {
            const items = await base44.entities.InventoryItem.filter({ business_id: biz.id });
            return items.length > 0 ? `${items.length} items` : null;
          } catch { return null; }
        }
      },
      {
        id: 'po', label: 'Purchase Orders', icon: ShoppingCart, path: '/PurchaseOrders',
        description: 'Create and send POs to suppliers. Track delivery and cost expectations.',
        badge: 'Procurement', badgeColor: 'bg-teal-500/15 text-teal-300 border-teal-500/20',
        fetchStat: async (biz) => {
          try {
            const pos = await base44.entities.PurchaseOrder.filter({ business_id: biz.id });
            const sent = pos.filter(p => p.status === 'sent').length;
            const received = pos.filter(p => p.status === 'received').length;
            return pos.length > 0 ? `${sent} sent, ${received} received` : null;
          } catch { return null; }
        }
      },
    ]
  },
  {
    id: 'finance',
    label: 'Financial Operations',
    subtitle: 'Compliance, bookkeeping, and financial records',
    icon: BookOpen,
    color: 'text-blue-400',
    borderColor: 'border-blue-500/20',
    modules: [
      {
        id: 'vat', label: 'VAT & Bookkeeping', icon: Percent, path: '/VATAndBookkeeping',
        description: 'Manage VAT periods, input/output VAT, P&L, payroll, and exports.',
        badge: 'Compliance', badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
        fetchStat: async (biz) => null // Would need VAT period calculation
      },
      {
        id: 'payroll', label: 'Payroll', icon: Users, path: '/Payroll',
        description: 'Manage shifts, log labour costs, and maintain employee contracts.',
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
  {
    id: 'intelligence',
    label: 'Intelligence & Reporting',
    subtitle: 'Data that drives better decisions',
    icon: Brain,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/20',
    modules: [
      {
        id: 'reports', label: 'Reports', icon: BarChart2, path: '/Reports',
        description: 'Revenue trends, expense breakdowns, and financial summary reports.',
        badge: 'Analytics', badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
        fetchStat: async (biz) => null
      },
      {
        id: 'forecast', label: 'Forecasting', icon: Activity, path: '/Forecasting',
        description: 'Project revenue and costs with optimistic, baseline, and conservative scenarios.',
        badge: 'Forecast', badgeColor: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/20',
        fetchStat: async (biz) => null
      },
      {
        id: 'budget', label: 'Budget', icon: Target, path: '/Budgeting',
        description: 'Set monthly budgets and compare against actual financial performance.',
        badge: 'Budget', badgeColor: 'bg-lime-500/15 text-lime-300 border-lime-500/20',
        fetchStat: async (biz) => {
          try {
            const budgets = await base44.entities.Budget.filter({ business_id: biz.id });
            return budgets.length > 0 ? `${budgets.length} budgets` : null;
          } catch { return null; }
        }
      },
      {
        id: 'audit', label: 'Audit', icon: PieChart, path: '/Audit',
        description: 'Deep-dive audit findings: pricing, food cost, labour, waste, and menu.',
        badge: 'Audit', badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/20',
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
    id: 'setup',
    label: 'Setup & Integrations',
    subtitle: 'Connect your tools and configure your workspace',
    icon: Zap,
    color: 'text-indigo-400',
    borderColor: 'border-indigo-500/20',
    modules: [
      {
        id: 'integrations', label: 'Integrations', icon: Zap, path: '/Integrations',
        description: 'Connect your POS, accounting, banking, and delivery platforms.',
        badge: 'Integrations', badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20',
        fetchStat: async (biz) => null
      },
      {
        id: 'settings', label: 'Settings', icon: FileText, path: '/Settings',
        description: 'Manage your business details, VAT, subscription, and team access.',
        badge: 'Config', badgeColor: 'bg-slate-500/15 text-slate-300 border-slate-500/20',
        fetchStat: async (biz) => null
      },
    ]
  },
];

function ModuleCard({ mod, stat, delay = 0 }) {
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

function CategorySection({ category, index, stats }) {
  const Icon = category.icon;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg bg-[#151528] border ${category.borderColor} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${category.color}`} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">{category.label}</h2>
          <p className="text-xs text-slate-500">{category.subtitle}</p>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
      >
        {category.modules.map((mod) => (
          <ModuleCard key={mod.id} mod={mod} stat={stats[mod.id]} />
        ))}
      </motion.div>
    </motion.section>
  );
}

function SearchModal({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const allModules = CATEGORIES.flatMap(c => c.modules);
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
              placeholder="Search modules, reports, recipes…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="bg-transparent border-0 text-white placeholder-slate-500 text-sm"
              onKeyDown={e => {
                if (e.key === 'Escape') onClose();
              }}
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
              Type to search modules, reports, and features…
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

  // Register ⌘K global search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

  // Fetch stats for all modules
  useEffect(() => {
    if (!currentBusiness) return;
    const fetchAllStats = async () => {
      const newStats = {};
      for (const category of CATEGORIES) {
        for (const mod of category.modules) {
          try {
            const stat = await mod.fetchStat(currentBusiness);
            if (stat) newStats[mod.id] = stat;
          } catch (e) {
            // Silent fail for stats
          }
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
  const totalModules = CATEGORIES.reduce((sum, c) => sum + c.modules.length, 0);

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
          {/* Title row */}
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7B3BFF]/25 to-[#A855F7]/15 border border-[#7B3BFF]/30 flex items-center justify-center">
                  <Layers className="w-4.5 h-4.5 text-[#C084FC]" style={{ width: '1.1rem', height: '1.1rem' }} />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Operations Hub</h1>
              </div>
              <p className="text-slate-400 text-sm">
                Your operational control centre — {totalModules} modules across {CATEGORIES.length} business areas.
              </p>
            </div>

            {/* Quick status indicators */}
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
              {/* Removed always-on "All systems operational" badge — no real integration data to back it */}
            </div>
          </div>

          {/* Hero command banner */}
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
                <Button size="sm" variant="outline" onClick={() => navigate('/Reports')} className="text-sm">
                  <BarChart2 className="w-4 h-4 mr-2" /> Open Reports
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowSearch(true)} className="text-slate-400 gap-1.5">
                  <Search className="w-4 h-4" />
                  <kbd className="hidden sm:inline text-xs bg-white/10 px-1.5 py-0.5 rounded">⌘K</kbd>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* Category Sections */}
        <div className="space-y-8">
          {CATEGORIES.map((category, index) => (
            <CategorySection key={category.id} category={category} index={index} stats={stats} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="rounded-2xl border border-white/[0.06] bg-[#0F0F1E]/60 p-6 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/10 border border-[#7B3BFF]/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-[#C084FC]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Need strategic guidance?</p>
              <p className="text-xs text-slate-500">Ask Setra analyses your business and suggests where to act next.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/Dashboard')}>
            <Zap className="w-4 h-4 mr-2 text-[#C084FC]" />
            Ask Setra
          </Button>
        </motion.div>

      </div>

      <SearchModal open={showSearch} onClose={() => setShowSearch(false)} />
    </div>
  );
}