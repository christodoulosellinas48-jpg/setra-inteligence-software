import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBusiness } from '@/components/business/BusinessContext';
import { useCommandPalette } from '@/lib/CommandPaletteContext';
import { getRecentPages, pushRecentPage } from '@/lib/recentPages';
import {
  Search, LayoutDashboard, DollarSign, Receipt, Settings, Plug,
  UtensilsCrossed, Package, Store, Target, Lightbulb, Users,
  Zap, FileText, ArrowRight, Clock, Bookmark, ChefHat, BarChart2,
  X
} from 'lucide-react';

// ─── Static index ──────────────────────────────────────────────────────────

const ICON_MAP = {
  LayoutDashboard, DollarSign, Receipt, Settings, Plug,
  UtensilsCrossed, Package, Store, Target, Lightbulb, Users,
  Zap, FileText, ArrowRight, Clock, Bookmark, ChefHat, BarChart2,
};

const PAGES = [
  { id: 'dashboard',     label: 'Dashboard',          path: '/Dashboard',         icon: LayoutDashboard, category: 'Page' },
  { id: 'money',         label: 'Money',               path: '/Money',             icon: DollarSign,      category: 'Page' },
  { id: 'vat',           label: 'VAT & Bookkeeping',   path: '/VATAndBookkeeping', icon: Receipt,         category: 'Page' },
  { id: 'ops',           label: 'Operations Hub',      path: '/OperationsHub',     icon: Zap,             category: 'Page' },
  { id: 'dishes',        label: 'Dishes',              path: '/Dishes',            icon: UtensilsCrossed, category: 'Page' },
  { id: 'suppliers',     label: 'Suppliers',           path: '/Suppliers',         icon: Store,           category: 'Page' },
  { id: 'stock',         label: 'Stock',               path: '/Stock',             icon: Package,         category: 'Page' },
  { id: 'plan',          label: 'Plan',                path: '/Plan',              icon: Target,          category: 'Page' },
  { id: 'insights',      label: 'Insights',            path: '/Insights',          icon: Lightbulb,       category: 'Page' },
  { id: 'payroll',       label: 'Payroll',             path: '/Payroll',           icon: Users,           category: 'Page' },
  { id: 'integrations',  label: 'Integrations',        path: '/Integrations',      icon: Plug,            category: 'Page' },
  { id: 'settings',      label: 'Settings',            path: '/Settings',          icon: Settings,        category: 'Page' },
  { id: 'settings-vat',  label: 'VAT Number',          path: '/Settings?tab=vat',  icon: Receipt,         category: 'Settings' },
  { id: 'settings-team', label: 'Team Members',        path: '/Settings?tab=team', icon: Users,           category: 'Settings' },
];

const ACTIONS = [
  { id: 'action-upload',    label: 'Upload invoice',     path: '/Money',             icon: FileText,     category: 'Action', secondary: 'Open Money → upload' },
  { id: 'action-snapshot',  label: 'Save snapshot',      path: '/Dashboard',         icon: Bookmark,     category: 'Action', secondary: 'Open Dashboard → save snapshot' },
  { id: 'action-audit',     label: 'Run audit',          path: '/Insights?tab=audit',icon: BarChart2,    category: 'Action', secondary: 'Open Insights → Audit tab' },
  { id: 'action-employee',  label: 'Add employee',       path: '/Payroll',           icon: Users,        category: 'Action', secondary: 'Open Payroll' },
  { id: 'action-vatpack',   label: 'Generate VAT pack',  path: '/VATAndBookkeeping', icon: Receipt,      category: 'Action', secondary: 'Open VAT & Bookkeeping' },
];

const SUGGESTED = [
  { id: 'sug-dashboard', label: 'Dashboard',         path: '/Dashboard',         icon: LayoutDashboard, category: 'Suggested' },
  { id: 'sug-ops',       label: 'Operations Hub',    path: '/OperationsHub',     icon: Zap,             category: 'Suggested' },
  { id: 'sug-vat',       label: 'VAT & Bookkeeping', path: '/VATAndBookkeeping', icon: Receipt,         category: 'Suggested' },
  { id: 'sug-money',     label: 'Money',             path: '/Money',             icon: DollarSign,      category: 'Suggested' },
];

// ─── Fuzzy match helper ────────────────────────────────────────────────────

function fuzzyScore(text, query) {
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (t === q) return 3;
  if (t.startsWith(q)) return 2;
  if (t.includes(q)) return 1;
  // character-by-character fuzzy
  let ti = 0, qi = 0;
  while (ti < t.length && qi < q.length) {
    if (t[ti] === q[qi]) qi++;
    ti++;
  }
  return qi === q.length ? 0.5 : 0;
}

function searchItems(items, query, textFn) {
  if (!query) return [];
  return items
    .map(item => ({ item, score: fuzzyScore(textFn(item), query) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.item);
}

// ─── Result row ────────────────────────────────────────────────────────────

function ResultRow({ result, isHighlighted, onClick }) {
  const Icon = result.icon || FileText;
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors duration-100 ${
        isHighlighted ? 'bg-[#7B3BFF]/20' : 'hover:bg-white/[0.04]'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isHighlighted ? 'bg-[#7B3BFF]/30' : 'bg-[#1A1A2E]'
      }`}>
        <Icon className={`w-4 h-4 ${isHighlighted ? 'text-[#C084FC]' : 'text-slate-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isHighlighted ? 'text-white' : 'text-slate-200'}`}>
          {result.label}
        </p>
        {result.secondary && (
          <p className="text-xs text-slate-500 truncate">{result.secondary}</p>
        )}
      </div>
      <span className={`text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 ${
        isHighlighted
          ? 'bg-[#7B3BFF]/20 text-[#C084FC] border-[#7B3BFF]/30'
          : 'bg-white/[0.04] text-slate-500 border-white/[0.06]'
      }`}>
        {result.category}
      </span>
    </button>
  );
}

function GroupLabel({ label }) {
  return (
    <div className="px-4 py-2 flex items-center gap-2">
      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-white/[0.04]" />
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="py-2 space-y-1 px-2">
      {[1,2,3].map(i => (
        <div key={i} className="h-12 rounded-lg bg-white/[0.03] animate-pulse" />
      ))}
    </div>
  );
}

// ─── Main palette ──────────────────────────────────────────────────────────

export default function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentBusiness, businesses, setCurrentBusiness } = useBusiness();
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setHighlighted(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // ── Dynamic data ──
  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: ['cmd-suppliers', currentBusiness?.id],
    queryFn: () => base44.entities.Supplier.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness && open,
    staleTime: 5 * 60 * 1000,
  });

  const { data: expenses = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ['cmd-expenses', currentBusiness?.id],
    queryFn: () => base44.entities.ExpenseDocument.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness && open,
    staleTime: 5 * 60 * 1000,
  });

  const { data: dishes = [], isLoading: loadingDishes } = useQuery({
    queryKey: ['cmd-dishes', currentBusiness?.id],
    queryFn: () => base44.entities.Item.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness && open,
    staleTime: 5 * 60 * 1000,
  });

  const { data: snapshots = [], isLoading: loadingSnapshots } = useQuery({
    queryKey: ['cmd-snapshots', currentBusiness?.id],
    queryFn: () => base44.entities.FinancialSnapshot.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness && open,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = loadingSuppliers || loadingExpenses || loadingDishes || loadingSnapshots;

  // ── Build results ──
  const results = useMemo(() => {
    if (!query.trim()) return [];

    const q = query.trim();
    const groups = [];

    // Pages
    const pageMatches = searchItems(PAGES, q, p => `${p.label} ${p.category}`);
    if (pageMatches.length) groups.push({ label: 'Pages & Settings', items: pageMatches.slice(0, 5) });

    // Actions
    const actionMatches = searchItems(ACTIONS, q, a => `${a.label} ${a.secondary || ''}`);
    if (actionMatches.length) groups.push({ label: 'Actions', items: actionMatches.slice(0, 3) });

    // Businesses / Venues
    if (businesses?.length > 0) {
      const bizMatches = searchItems(
        businesses.map(b => ({ id: `biz-${b.id}`, label: b.name, path: null, bizId: b.id, icon: Zap, category: 'Venue', secondary: 'Switch venue' })),
        q, b => b.label
      );
      if (bizMatches.length) groups.push({ label: 'Venues', items: bizMatches.slice(0, 4) });
    }

    // Suppliers
    if (suppliers.length) {
      const supMatches = searchItems(
        suppliers.map(s => ({
          id: `sup-${s.id}`, label: s.name, path: '/Suppliers',
          icon: Store, category: 'Supplier',
          secondary: s.category || 'Supplier',
        })),
        q, s => s.label
      );
      if (supMatches.length) groups.push({ label: 'Suppliers', items: supMatches.slice(0, 5) });
    }

    // Expenses / Invoices
    if (expenses.length) {
      const expMatches = searchItems(
        expenses.map(e => ({
          id: `exp-${e.id}`, label: e.supplier_name || 'Invoice',
          path: '/VATAndBookkeeping',
          icon: FileText, category: 'Invoice',
          secondary: [e.invoice_number, e.invoice_total ? `€${e.invoice_total}` : null].filter(Boolean).join(' · '),
        })),
        q, e => `${e.label} ${e.secondary || ''}`
      );
      if (expMatches.length) groups.push({ label: 'Invoices', items: expMatches.slice(0, 5) });
    }

    // Dishes
    if (dishes.length) {
      const dishMatches = searchItems(
        dishes.map(d => ({
          id: `dish-${d.id}`, label: d.name, path: '/Dishes',
          icon: UtensilsCrossed, category: 'Dish',
          secondary: d.category || '',
        })),
        q, d => d.label
      );
      if (dishMatches.length) groups.push({ label: 'Dishes', items: dishMatches.slice(0, 5) });
    }

    // Snapshots
    if (snapshots.length) {
      const snapMatches = searchItems(
        snapshots.map(s => ({
          id: `snap-${s.id}`, label: `Snapshot ${s.period_start ? s.period_start.slice(0, 7) : ''}`,
          path: '/Dashboard',
          icon: Bookmark, category: 'Snapshot',
          secondary: s.period_type || '',
        })),
        q, s => s.label
      );
      if (snapMatches.length) groups.push({ label: 'Snapshots', items: snapMatches.slice(0, 3) });
    }

    return groups;
  }, [query, suppliers, expenses, dishes, snapshots, businesses]);

  // Flatten for keyboard nav
  const flatResults = useMemo(() => results.flatMap(g => g.items), [results]);

  // Clamp highlight
  useEffect(() => {
    setHighlighted(0);
  }, [query]);

  // Recent pages (no query)
  const recentPages = useMemo(() => getRecentPages(), [open]);

  // ── Keyboard nav ──
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (flatResults[highlighted]) handleSelect(flatResults[highlighted]);
    }
  };

  const handleSelect = (item) => {
    if (item.bizId) {
      // Switch venue
      const biz = businesses.find(b => b.id === item.bizId);
      if (biz) setCurrentBusiness(biz);
      setOpen(false);
      navigate('/Dashboard');
      return;
    }
    if (item.path) {
      pushRecentPage({ path: item.path, label: item.label, category: item.category });
      navigate(item.path);
    }
    setOpen(false);
  };

  if (!open) return null;

  // Flat index for highlighted tracking across groups
  let globalIdx = 0;

  return ReactDOM.createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 px-4"
        style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.6)' }}
        onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: -12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -12 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="w-full max-w-[600px] rounded-2xl border border-white/10 bg-[#111120] shadow-[0_0_80px_rgba(123,59,255,0.3)] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
            <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, suppliers, dishes, invoices…"
              className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            <div className="flex items-center gap-2 flex-shrink-0">
              <kbd className="text-[10px] bg-white/[0.06] text-slate-400 px-2 py-1 rounded border border-white/[0.08] font-mono">⌘K</kbd>
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div ref={listRef} className="max-h-[420px] overflow-y-auto">
            {!query.trim() ? (
              /* Empty state: Recent + Suggested */
              <div className="py-2">
                {recentPages.length > 0 && (
                  <>
                    <GroupLabel label="Recent" />
                    {recentPages.map((r, i) => {
                      const Icon = ICON_MAP[r.icon] || Clock;
                      return (
                        <ResultRow
                          key={r.path + i}
                          result={{ ...r, icon: Clock }}
                          isHighlighted={false}
                          onClick={() => handleSelect(r)}
                        />
                      );
                    })}
                  </>
                )}
                <GroupLabel label="Suggested" />
                {SUGGESTED.map(s => (
                  <ResultRow
                    key={s.id}
                    result={s}
                    isHighlighted={false}
                    onClick={() => handleSelect(s)}
                  />
                ))}
                <div className="px-4 py-3 border-t border-white/[0.04] mt-1">
                  <p className="text-[11px] text-slate-600">Type to search across pages, suppliers, dishes, invoices…</p>
                </div>
              </div>
            ) : isLoading ? (
              <SkeletonRows />
            ) : results.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="text-slate-500 text-sm">No matches for "<span className="text-slate-300">{query}</span>"</p>
                <p className="text-slate-600 text-xs mt-1">Press Esc to close</p>
              </div>
            ) : (
              <div className="py-2">
                {results.map(group => (
                  <div key={group.label}>
                    <GroupLabel label={group.label} />
                    {group.items.map(item => {
                      const idx = globalIdx++;
                      return (
                        <ResultRow
                          key={item.id}
                          result={item}
                          isHighlighted={highlighted === idx}
                          onClick={() => handleSelect(item)}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-white/[0.04] flex items-center gap-4 text-[10px] text-slate-600">
            <span><kbd className="font-mono">↑↓</kbd> navigate</span>
            <span><kbd className="font-mono">↵</kbd> select</span>
            <span><kbd className="font-mono">Esc</kbd> close</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}