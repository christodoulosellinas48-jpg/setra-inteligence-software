import React, { useState } from 'react';
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
  CheckCircle2, Clock, AlertCircle, Loader2, XCircle, Sparkles
} from 'lucide-react';
import ExpenseUploadModal from '@/components/dashboard/ExpenseUploadModal';

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    color: 'bg-slate-500/15 text-slate-400 border-slate-500/30',   icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',       icon: Loader2 },
  posted:     { label: 'Posted',     color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
  failed:     { label: 'Failed',     color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',       icon: XCircle },
  needs_review: { label: 'Review',  color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',    icon: AlertCircle },
};

const CATEGORY_LABELS = {
  food_beverage: 'Food & Beverage',
  staff_costs: 'Staff Costs',
  fixed_costs: 'Fixed Costs',
  utilities: 'Utilities',
  operating_expenses: 'Operating',
  one_off_expenses: 'One-Off',
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

export default function Expenses() {
  const { currentBusiness, user, canEdit } = useBusiness();
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses-full', currentBusiness?.id],
    queryFn: () => base44.entities.ExpenseDocument.filter(
      { business_id: currentBusiness.id },
      '-created_date',
      200
    ),
    enabled: !!currentBusiness,
  });

  const deleteExpense = useMutation({
    mutationFn: (id) => base44.entities.ExpenseDocument.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['expenses-full', currentBusiness?.id]),
  });

  const currencySymbol = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr', AUD: '$', CAD: '$' }[currentBusiness?.currency] || '€';

  const filtered = expenses.filter(e => {
    const matchSearch = !search || e.supplier_name?.toLowerCase().includes(search.toLowerCase()) || e.invoice_number?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'all' || e.expense_category === filterCategory;
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const totalGross = filtered.reduce((s, e) => s + (e.invoice_total || 0), 0);
  const totalVAT = filtered.reduce((s, e) => s + (e.vat_amount || 0), 0);

  if (!currentBusiness) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">No business selected.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Expenses</h1>
          <p className="text-slate-500 text-sm mt-0.5">All uploaded invoices & receipts</p>
        </div>
        {canEdit() && (
          <Button onClick={() => setShowUpload(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Invoice
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Documents', value: filtered.length, suffix: '' },
          { label: 'Gross Total', value: `${currencySymbol}${totalGross.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, suffix: '' },
          { label: 'Total VAT (Input)', value: `${currencySymbol}${totalVAT.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, suffix: '' },
          { label: 'Posted', value: expenses.filter(e => e.status === 'posted').length, suffix: `/ ${expenses.length}` },
        ].map((s, i) => (
          <Card key={i} className="p-4">
            <p className="text-slate-500 text-xs mb-1">{s.label}</p>
            <p className="text-white font-bold text-xl">{s.value}<span className="text-slate-500 text-sm ml-1">{s.suffix}</span></p>
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
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-44 bg-[#151528] border-white/10 text-white">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-[#151528] border-white/10">
            <SelectItem value="all" className="text-white">All Categories</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v} className="text-white">{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 bg-[#151528] border-white/10 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#151528] border-white/10">
            <SelectItem value="all" className="text-white">All Status</SelectItem>
            {Object.keys(STATUS_CONFIG).map(s => (
              <SelectItem key={s} value={s} className="text-white">{STATUS_CONFIG[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[#C084FC] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500">No expenses found.</p>
            {canEdit() && (
              <Button variant="outline" onClick={() => setShowUpload(true)} className="mt-4">
                <Upload className="w-4 h-4 mr-2" /> Upload First Invoice
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-[#0B0B12]/40">
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Supplier</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Category</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">Net</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">VAT</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">Gross</th>
                  <th className="text-center px-4 py-3 text-slate-500 font-medium">Status</th>
                  <th className="text-center px-4 py-3 text-slate-500 font-medium">AI</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((exp, i) => (
                    <motion.tr
                      key={exp.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-white/5 hover:bg-white/[0.02] group transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-white font-medium">{exp.supplier_name}</p>
                        {exp.invoice_number && <p className="text-slate-500 text-xs">{exp.invoice_number}</p>}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">{exp.invoice_date || '—'}</td>
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
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {canEdit() && (
        <ExpenseUploadModal
          open={showUpload}
          onOpenChange={setShowUpload}
          onSave={() => queryClient.invalidateQueries(['expenses-full', currentBusiness?.id])}
          businessId={currentBusiness?.id}
          userEmail={user?.email}
        />
      )}
    </div>
  );
}