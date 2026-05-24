import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBusiness } from '@/components/business/BusinessContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy, Trash2, CheckCircle2, AlertTriangle, Loader2,
  Receipt, UtensilsCrossed, ChefHat, ChevronDown, ChevronRight, ExternalLink
} from 'lucide-react';

// ---- Duplicate-detection helpers ----

function findDuplicateInvoices(expenses) {
  const groups = {};
  for (const e of expenses) {
    const key = [
      (e.supplier_name || '').toLowerCase().trim(),
      e.invoice_date || '',
      Math.round((e.invoice_total || 0) * 100), // cents to avoid float diff
    ].join('|');
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  }
  return Object.values(groups).filter(g => g.length > 1);
}

function findDuplicateItems(items) {
  const groups = {};
  for (const item of items) {
    const key = (item.name || '').toLowerCase().trim();
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return Object.values(groups).filter(g => g.length > 1);
}

function findDuplicateRecipes(recipes) {
  const groups = {};
  for (const r of recipes) {
    const key = (r.name || '').toLowerCase().trim();
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  }
  return Object.values(groups).filter(g => g.length > 1);
}

// ---- Sub-components ----

function DuplicateGroup({ group, entityName, onDelete, deleting, renderRow, icon: Icon, color }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="rounded-xl border border-amber-500/20 bg-[#151528]/80 overflow-hidden"
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
      >
        <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-white text-sm font-medium">{renderRow.groupLabel(group[0])}</span>
          <span className="ml-2 text-xs text-amber-400">{group.length} duplicates</span>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5 divide-y divide-white/5">
              {group.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3 group">
                  <div className="flex-1 min-w-0">
                    {renderRow.row(item, idx)}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.document_url && (
                      <a href={item.document_url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => onDelete(item.id)}
                      disabled={deleting.has(item.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {deleting.has(item.id)
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Section({ title, icon: Icon, color, groups, entityName, onDelete, deleting, renderRow, emptyText }) {
  if (groups.length === 0) {
    return (
      <Card className="p-5 flex items-center gap-3 bg-[#151528]/60 border-white/5">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <div>
          <p className="text-white text-sm font-medium">{title}</p>
          <p className="text-slate-500 text-xs mt-0.5">{emptyText}</p>
        </div>
      </Card>
    );
  }

  const totalDups = groups.reduce((s, g) => s + g.length - 1, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 ${color}`} />
        <h3 className="text-white font-semibold text-sm">{title}</h3>
        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 border text-xs">
          {totalDups} duplicate{totalDups !== 1 ? 's' : ''} found
        </Badge>
      </div>
      <div className="space-y-2">
        <AnimatePresence>
          {groups.map((g, i) => (
            <DuplicateGroup
              key={i}
              group={g}
              entityName={entityName}
              onDelete={onDelete}
              deleting={deleting}
              renderRow={renderRow}
              icon={Icon}
              color={color}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---- Main page ----

export default function Duplicates() {
  const { currentBusiness, canEdit } = useBusiness();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(new Set());

  const { data: expenses = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ['expenses-full', currentBusiness?.id],
    queryFn: () => base44.entities.ExpenseDocument.filter({ business_id: currentBusiness.id }, '-created_date', 500),
    enabled: !!currentBusiness,
  });

  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ['menu-items', currentBusiness?.id],
    queryFn: () => base44.entities.Item.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness,
  });

  const { data: recipes = [], isLoading: loadingRecipes } = useQuery({
    queryKey: ['recipes', currentBusiness?.id],
    queryFn: () => base44.entities.Recipe.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness,
  });

  const dupInvoices = useMemo(() => findDuplicateInvoices(expenses), [expenses]);
  const dupItems = useMemo(() => findDuplicateItems(items), [items]);
  const dupRecipes = useMemo(() => findDuplicateRecipes(recipes), [recipes]);

  const isLoading = loadingExpenses || loadingItems || loadingRecipes;

  const totalDuplicates =
    dupInvoices.reduce((s, g) => s + g.length - 1, 0) +
    dupItems.reduce((s, g) => s + g.length - 1, 0) +
    dupRecipes.reduce((s, g) => s + g.length - 1, 0);

  const handleDelete = async (entityName, id) => {
    setDeleting(prev => new Set(prev).add(id));
    try {
      await base44.entities[entityName].delete(id);
      queryClient.invalidateQueries([entityName === 'ExpenseDocument' ? 'expenses-full' : entityName === 'Item' ? 'menu-items' : 'recipes', currentBusiness?.id]);
    } finally {
      setDeleting(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const currencySymbol = { EUR: '€', USD: '$', GBP: '£' }[currentBusiness?.currency] || '€';

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
              <Copy className="w-4.5 h-4.5 text-amber-400" style={{ width: '1.1rem', height: '1.1rem' }} />
            </div>
            <h1 className="text-2xl font-bold text-white">Duplicate Detector</h1>
            {totalDuplicates > 0 && (
              <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 border">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {totalDuplicates} found
              </Badge>
            )}
          </div>
          <p className="text-slate-500 text-sm ml-12">
            Scans your invoices, menu items, and recipes for exact or near-exact duplicates.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-[#7B3BFF] animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">

            {/* Invoices */}
            <Section
              title="Invoices & Expenses"
              icon={Receipt}
              color="text-blue-400"
              groups={dupInvoices}
              entityName="ExpenseDocument"
              onDelete={(id) => handleDelete('ExpenseDocument', id)}
              deleting={deleting}
              emptyText="No duplicate invoices found — all clear."
              renderRow={{
                groupLabel: (item) => `${item.supplier_name} · ${item.invoice_date || '—'} · ${currencySymbol}${(item.invoice_total || 0).toFixed(2)}`,
                row: (item, idx) => (
                  <div>
                    <p className="text-white text-sm font-medium">{item.supplier_name}</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {item.invoice_date || '—'} · {currencySymbol}{(item.invoice_total || 0).toFixed(2)}
                      {item.invoice_number ? ` · #${item.invoice_number}` : ''}
                      <span className="ml-2 text-slate-600">
                        Uploaded {item.created_date ? new Date(item.created_date).toLocaleDateString() : '—'}
                      </span>
                    </p>
                  </div>
                ),
              }}
            />

            {/* Menu Items */}
            <Section
              title="Menu Items"
              icon={UtensilsCrossed}
              color="text-violet-400"
              groups={dupItems}
              entityName="Item"
              onDelete={(id) => handleDelete('Item', id)}
              deleting={deleting}
              emptyText="No duplicate menu items found — all clear."
              renderRow={{
                groupLabel: (item) => item.name,
                row: (item, idx) => (
                  <div>
                    <p className="text-white text-sm font-medium">{item.name}</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {item.category} · {currencySymbol}{(item.selling_price || 0).toFixed(2)}
                      {item.active === false ? ' · Inactive' : ''}
                    </p>
                  </div>
                ),
              }}
            />

            {/* Recipes */}
            <Section
              title="Recipes"
              icon={ChefHat}
              color="text-orange-400"
              groups={dupRecipes}
              entityName="Recipe"
              onDelete={(id) => handleDelete('Recipe', id)}
              deleting={deleting}
              emptyText="No duplicate recipes found — all clear."
              renderRow={{
                groupLabel: (r) => r.name,
                row: (r, idx) => (
                  <div>
                    <p className="text-white text-sm font-medium">{r.name}</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Created {r.created_date ? new Date(r.created_date).toLocaleDateString() : '—'}
                    </p>
                  </div>
                ),
              }}
            />

            {totalDuplicates === 0 && (
              <Card className="p-8 text-center bg-[#151528]/60 border-emerald-500/10">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-white font-semibold">No duplicates found</p>
                <p className="text-slate-500 text-sm mt-1">
                  Your invoices, menu items, and recipes all look unique.
                </p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}