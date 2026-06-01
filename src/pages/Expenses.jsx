import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useBusiness } from '@/components/business/BusinessContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import {
  Upload, Search, FileText, Trash2, ExternalLink,
  CheckCircle2, Clock, AlertCircle, Loader2, XCircle, Sparkles,
  PlusCircle, Download, Square, CheckSquare, Tag, X
} from 'lucide-react';
import ExpenseUploadModal from '@/components/dashboard/ExpenseUploadModal';
import ManualExpenseModal from '@/components/expenses/ManualExpenseModal';
import BulkUploadModal from '@/components/expenses/BulkUploadModal';
import EmailIngestBanner from '@/components/expenses/EmailIngestBanner';
import DateRangeFilter from '@/components/expenses/DateRangeFilter';
import usePullToRefresh from '@/hooks/usePullToRefresh';
import PullToRefreshIndicator from '@/components/ui/PullToRefreshIndicator';
import SkeletonRows from '@/components/ui/SkeletonRows';
import { isWithinInterval, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const STATUS_CONFIG = {
  pending:      { label: 'Pending',    color: 'bg-slate-500/15 text-slate-400 border-slate-500/30',      icon: Clock },
  processing:   { label: 'Processing', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',          icon: Loader2 },
  posted:       { label: 'Posted',     color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
  failed:       { label: 'Failed',     color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',          icon: XCircle },
  needs_review: { label: 'Needs Review', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',    icon: AlertCircle },
};

const CATEGORY_LABELS = {
  food_beverage:      'Food & Beverage',
  staff_costs:        'Staff Costs',
  fixed_costs:        'Fixed Costs',
  utilities:          'Utilities',
  operating_expenses: 'Operating',
  one_off_expenses:   'One-Off',
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <Badge className={`text-xs gap-1 ${cfg.color}`}>
      <Icon className={`w-3 h-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {cfg.label}
    </Badge>
  );
}

function exportToCSV(expenses, currencySymbol) {
  const headers = ['Supplier', 'Invoice #', 'Date', 'Category', 'Net', 'VAT', 'Gross', 'Status', 'AI Confidence'];
  const rows = expenses.map(e => [
    e.supplier_name,
    e.invoice_number || '',
    e.invoice_date || '',
    CATEGORY_LABELS[e.expense_category] || e.expense_category || '',
    e.net_amount || 0,
    e.vat_amount || 0,
    e.invoice_total || 0,
    e.status || '',
    e.confidence_score ? `${Math.round(e.confidence_score * 100)}%` : '',
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Expenses() {
  const { currentBusiness, user, canEdit } = useBusiness();
  const queryClient = useQueryClient();

  const [showUpload, setShowUpload] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ from: subMonths(new Date(), 12), to: new Date() });
  const [selected, setSelected] = useState(new Set());

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses-full', currentBusiness?.id],
    queryFn: () => base44.entities.ExpenseDocument.filter(
      { business_id: currentBusiness.id },
      '-created_date',
      500
    ),
    enabled: !!currentBusiness,
  });

  const deleteExpense = useMutation({
    mutationFn: (id) => base44.entities.ExpenseDocument.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries(['expenses-full', currentBusiness?.id]);
      const previous = queryClient.getQueryData(['expenses-full', currentBusiness?.id]);
      queryClient.setQueryData(['expenses-full', currentBusiness?.id], (old = []) => old.filter(e => e.id !== id));
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['expenses-full', currentBusiness?.id], ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries(['expenses-full', currentBusiness?.id]),
  });

  const bulkDelete = async () => {
    for (const id of selected) await base44.entities.ExpenseDocument.delete(id);
    setSelected(new Set());
    queryClient.invalidateQueries(['expenses-full', currentBusiness?.id]);
  };

  const bulkMarkPosted = async () => {
    for (const id of selected) await base44.entities.ExpenseDocument.update(id, { status: 'posted' });
    setSelected(new Set());
    queryClient.invalidateQueries(['expenses-full', currentBusiness?.id]);
  };

  const { isRefreshing, pullDistance, containerRef } = usePullToRefresh(async () => {
    await queryClient.invalidateQueries(['expenses-full', currentBusiness?.id]);
  });

  const currencySymbol = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr', AUD: '$', CAD: '$' }[currentBusiness?.currency] || '€';

  const needsReviewCount = useMemo(() =>
    expenses.filter(e => e.status === 'needs_review' || (e.confidence_score > 0 && e.confidence_score < 0.6)).length,
    [expenses]
  );

  const filtered = useMemo(() => expenses.filter(e => {
    const matchSearch = !search || e.supplier_name?.toLowerCase().includes(search.toLowerCase()) || e.invoice_number?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'all' || e.expense_category === filterCategory;
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    const matchDate = (!dateRange.from && !dateRange.to) || (() => {
      if (!e.invoice_date) return true;
      try {
        return isWithinInterval(parseISO(e.invoice_date), { start: dateRange.from, end: dateRange.to });
      } catch { return true; }
    })();
    return matchSearch && matchCat && matchStatus && matchDate;
  }), [expenses, search, filterCategory, filterStatus, dateRange]);

  const totalGross = filtered.reduce((s, e) => s + (e.invoice_total || 0), 0);
  const totalVAT   = filtered.reduce((s, e) => s + (e.vat_amount || 0), 0);
  const postedCount = expenses.filter(e => e.status === 'posted').length;

  const toggleSelect = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handlePageDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer?.files?.[0];
    if (!droppedFile || !canEdit()) return;
    const isValid = droppedFile.type.match(/pdf|image/);
    if (!isValid) return;
    setPendingFile(droppedFile);
    setShowUpload(true);
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(e => e.id)));
    }
  };

  if (!currentBusiness) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">No business selected.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="p-6 max-w-7xl mx-auto space-y-6 relative"
      onDragOver={(e) => { e.preventDefault(); if (canEdit()) setIsDragOver(true); }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false); }}
      onDrop={handlePageDrop}
    >
      {/* Full-page drag overlay */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#7B3BFF]/20 backdrop-blur-sm border-4 border-dashed border-[#7B3BFF]/60 flex flex-col items-center justify-center pointer-events-none"
          >
            <Upload className="w-16 h-16 text-[#C084FC] mb-4" />
            <p className="text-2xl font-bold text-white">Drop invoice to process</p>
            <p className="text-slate-400 mt-1">AI will extract all fields automatically</p>
          </motion.div>
        )}
      </AnimatePresence>

      <PullToRefreshIndicator isRefreshing={isRefreshing} pullDistance={pullDistance} />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Expenses</h1>
            {needsReviewCount > 0 && (
              <button
                onClick={() => setFilterStatus('needs_review')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-medium hover:bg-amber-500/25 transition-colors"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                {needsReviewCount} need{needsReviewCount === 1 ? 's' : ''} review
              </button>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-0.5">All uploaded invoices & receipts</p>
        </div>
        {canEdit() && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={() => exportToCSV(filtered, currencySymbol)} className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => setShowManual(true)} className="gap-2">
              <PlusCircle className="w-4 h-4" />
              Add manually
            </Button>
            <Button variant="outline" onClick={() => setShowBulkUpload(true)} className="gap-2">
              <Upload className="w-4 h-4" />
              Bulk Upload
            </Button>
            <Button onClick={() => setShowUpload(true)} className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Invoice
            </Button>
          </div>
        )}
      </div>

      {/* Inline Drop Zone — visible when no expenses yet, always accepts drops */}
      {canEdit() && expenses.length === 0 && !isLoading && (
        <div
          onClick={() => setShowUpload(true)}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-[#7B3BFF]/30 hover:border-[#7B3BFF]/60 rounded-2xl p-10 text-center cursor-pointer transition-all group bg-[#7B3BFF]/5 hover:bg-[#7B3BFF]/10"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#7B3BFF]/15 border border-[#7B3BFF]/30 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <Upload className="w-6 h-6 text-[#C084FC]" />
          </div>
          <p className="text-white font-semibold text-lg">Drop your first invoice here</p>
          <p className="text-slate-400 text-sm mt-1">or click to browse — AI will extract vendor, amount & date automatically</p>
          <div className="flex items-center justify-center gap-3 mt-4 text-xs text-slate-500">
            <span>PDF</span><span>·</span><span>JPG</span><span>·</span><span>PNG</span>
          </div>
        </div>
      )}

      {/* Email Ingest Banner */}
      <EmailIngestBanner business={currentBusiness} />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Documents', value: filtered.length },
          { label: 'Gross Total', value: `${currencySymbol}${totalGross.toLocaleString('en-US', { maximumFractionDigits: 0 })}` },
          { label: 'Total VAT (Input)', value: `${currencySymbol}${totalVAT.toLocaleString('en-US', { maximumFractionDigits: 0 })}` },
          { label: 'Posted', value: postedCount, suffix: `/ ${expenses.length}`, tooltip: `${postedCount} of ${expenses.length} invoices have been posted to your accounting system` },
        ].map((s, i) => (
          <Card key={i} className="p-4" title={s.tooltip || ''}>
            <p className="text-slate-500 text-xs mb-1">{s.label}</p>
            <p className="text-white font-bold text-xl">{s.value}<span className="text-slate-500 text-sm ml-1">{s.suffix || ''}</span></p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search supplier or invoice #..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-[#151528] border-white/10 text-white pl-9"
          />
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-44 bg-[#151528] border-white/10 text-white">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="bg-[#151528] border-white/10">
            <SelectItem value="all" className="text-white">All Categories</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v} className="text-white">{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-[#151528] border-white/10 text-white">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#151528] border-white/10">
            <SelectItem value="all" className="text-white">All Status</SelectItem>
            {Object.keys(STATUS_CONFIG).map(s => (
              <SelectItem key={s} value={s} className="text-white">{STATUS_CONFIG[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(filterStatus !== 'all' || filterCategory !== 'all') && (
          <button
            onClick={() => { setFilterStatus('all'); setFilterCategory('all'); }}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-white px-2 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}
      </div>

      {/* Batch Action Bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 px-4 py-3 bg-[#7B3BFF]/15 border border-[#7B3BFF]/30 rounded-xl text-sm"
          >
            <span className="text-[#C084FC] font-medium">{selected.size} selected</span>
            <div className="flex items-center gap-2 ml-2">
              <Button size="sm" variant="outline" onClick={bulkMarkPosted} className="h-8 gap-1.5 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Mark posted
              </Button>
              <Button size="sm" variant="outline" onClick={() => exportToCSV(filtered.filter(e => selected.has(e.id)), currencySymbol)} className="h-8 gap-1.5 text-xs">
                <Download className="w-3.5 h-3.5" /> Export
              </Button>
              <Button size="sm" variant="outline" onClick={bulkDelete} className="h-8 gap-1.5 text-xs text-rose-400 hover:text-rose-300 border-rose-500/30 hover:border-rose-500/50">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </div>
            <button onClick={() => setSelected(new Set())} className="ml-auto text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <SkeletonRows count={5} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500">No expenses found.</p>
            {canEdit() && expenses.length === 0 && (
              <Button variant="outline" onClick={() => setShowUpload(true)} className="mt-4">
                <Upload className="w-4 h-4 mr-2" /> Upload First Invoice
              </Button>
            )}
            {expenses.length > 0 && (
              <button onClick={() => { setFilterStatus('all'); setFilterCategory('all'); setDateRange({ from: null, to: null }); setSearch(''); }}
                className="mt-3 text-sm text-[#C084FC] hover:text-white transition-colors">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-[#0B0B12]/40">
                  <th className="px-4 py-3">
                    <button onClick={toggleSelectAll} className="text-slate-500 hover:text-white transition-colors">
                      {selected.size === filtered.length && filtered.length > 0
                        ? <CheckSquare className="w-4 h-4 text-[#C084FC]" />
                        : <Square className="w-4 h-4" />
                      }
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Supplier</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Category</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">Net</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">VAT</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">Gross</th>
                  <th className="text-center px-4 py-3 text-slate-500 font-medium">Status</th>
                  <th className="text-center px-4 py-3 text-slate-500 font-medium">AI</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((exp, i) => {
                    const isSelected = selected.has(exp.id);
                    return (
                      <motion.tr
                        key={exp.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: Math.min(i * 0.03, 0.3) }}
                        className={`border-b border-white/5 group transition-colors ${isSelected ? 'bg-[#7B3BFF]/8' : 'hover:bg-white/[0.02]'}`}
                      >
                        <td className="px-4 py-3.5">
                          <button onClick={() => toggleSelect(exp.id)} className="text-slate-500 hover:text-white transition-colors">
                            {isSelected
                              ? <CheckSquare className="w-4 h-4 text-[#C084FC]" />
                              : <Square className="w-4 h-4" />
                            }
                          </button>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-white font-medium">{exp.supplier_name}</p>
                          {exp.invoice_number && <p className="text-slate-500 text-xs">{exp.invoice_number}</p>}
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">{exp.invoice_date || '—'}</td>
                        <td className="px-4 py-3.5">
                          <span className="text-slate-300 text-xs">{CATEGORY_LABELS[exp.expense_category] || exp.expense_category || '—'}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right text-slate-300">
                          {exp.net_amount ? `${currencySymbol}${exp.net_amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-right text-slate-400 text-xs">
                          {exp.vat_amount ? `${currencySymbol}${exp.vat_amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-right text-white font-semibold">
                          {exp.invoice_total ? `${currencySymbol}${exp.invoice_total.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <StatusBadge status={exp.status} />
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {exp.confidence_score > 0 && (
                            <span className={`text-xs flex items-center justify-center gap-1 ${exp.confidence_score >= 0.85 ? 'text-emerald-400' : exp.confidence_score >= 0.6 ? 'text-amber-400' : 'text-rose-400'}`}>
                              <Sparkles className="w-3 h-3" />
                              {Math.round(exp.confidence_score * 100)}%
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {exp.document_url && (
                              <Button variant="ghost" size="icon" asChild className="h-7 w-7 text-slate-400 hover:text-white">
                                <a href={exp.document_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </Button>
                            )}
                            {canEdit() && (
                              <Button
                                variant="ghost" size="icon"
                                className="h-7 w-7 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                                onClick={() => deleteExpense.mutate(exp.id)}
                                disabled={deleteExpense.isPending}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modals */}
      {canEdit() && (
        <>
          <ExpenseUploadModal
            open={showUpload}
            onOpenChange={(v) => { setShowUpload(v); if (!v) setPendingFile(null); }}
            onSave={() => queryClient.invalidateQueries(['expenses-full', currentBusiness?.id])}
            businessId={currentBusiness?.id}
            userEmail={user?.email}
            pendingFile={pendingFile}
          />
          <BulkUploadModal
            open={showBulkUpload}
            onOpenChange={setShowBulkUpload}
            onSave={() => queryClient.invalidateQueries(['expenses-full', currentBusiness?.id])}
            businessId={currentBusiness?.id}
            userEmail={user?.email}
          />
          <ManualExpenseModal
            open={showManual}
            onOpenChange={setShowManual}
            onSave={() => queryClient.invalidateQueries(['expenses-full', currentBusiness?.id])}
            businessId={currentBusiness?.id}
            userEmail={user?.email}
          />
        </>
      )}
    </div>
  );
}