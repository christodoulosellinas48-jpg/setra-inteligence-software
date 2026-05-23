import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import usePullToRefresh from '@/hooks/usePullToRefresh';
import PullToRefreshIndicator from '@/components/ui/PullToRefreshIndicator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusiness, BusinessProvider } from '@/components/business/BusinessContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Building2, TrendingUp, FileText, Calendar, Mail, Phone,
  Plus, X, ChevronRight, ArrowLeft, Clock, AlertCircle,
  MapPin, CreditCard, Tag, StickyNote, User
} from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORY_OPTIONS = [
  { value: 'food_beverage', label: 'Food & Beverage' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'fixed_costs', label: 'Fixed Costs' },
  { value: 'staff_costs', label: 'Staff & Services' },
  { value: 'operating_expenses', label: 'Operating Expenses' },
  { value: 'other', label: 'Other' },
];

const CATEGORY_COLORS = {
  food_beverage: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  utilities: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  fixed_costs: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  staff_costs: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  operating_expenses: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  other: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const STATUS_STYLES = {
  new: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  parsed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  needs_review: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  posted: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const EMPTY_FORM = {
  name: '', category: 'food_beverage', contact_name: '', contact_email: '',
  phone: '', address: '', notes: '',
};

function AddVendorModal({ open, onClose, businessId, onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Supplier.create({ ...data, business_id: businessId }),
    onSuccess: () => {
      qc.invalidateQueries(['suppliers', businessId]);
      onSuccess?.();
      onClose();
      setForm(EMPTY_FORM);
    },
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#151528] border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#A855F7]" /> Add Vendor
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div>
            <Label className="text-slate-400 text-xs mb-1.5 block">Supplier Name *</Label>
            <Input value={form.name} onChange={e => set('name', e.target.value)}
              className="bg-[#0B0B12] border-white/10 text-white" placeholder="e.g. Limnos Wines" />
          </div>

          <div>
            <Label className="text-slate-400 text-xs mb-1.5 block">Category</Label>
            <Select value={form.category} onValueChange={v => set('category', v)}>
              <SelectTrigger className="bg-[#0B0B12] border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#151528] border-white/10">
                {CATEGORY_OPTIONS.map(c => (
                  <SelectItem key={c.value} value={c.value} className="text-white">{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-400 text-xs mb-1.5 block flex items-center gap-1"><User className="w-3 h-3" /> Contact Person</Label>
              <Input value={form.contact_name} onChange={e => set('contact_name', e.target.value)}
                className="bg-[#0B0B12] border-white/10 text-white" placeholder="Maria" />
            </div>
            <div>
              <Label className="text-slate-400 text-xs mb-1.5 block flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</Label>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)}
                className="bg-[#0B0B12] border-white/10 text-white" placeholder="+357..." />
            </div>
          </div>

          <div>
            <Label className="text-slate-400 text-xs mb-1.5 block flex items-center gap-1"><Mail className="w-3 h-3" /> Email</Label>
            <Input value={form.contact_email} onChange={e => set('contact_email', e.target.value)}
              className="bg-[#0B0B12] border-white/10 text-white" placeholder="supplier@example.com" />
          </div>

          <div>
            <Label className="text-slate-400 text-xs mb-1.5 block flex items-center gap-1"><MapPin className="w-3 h-3" /> Address</Label>
            <Input value={form.address} onChange={e => set('address', e.target.value)}
              className="bg-[#0B0B12] border-white/10 text-white" placeholder="Street, City, Country" />
          </div>

          <div>
            <Label className="text-slate-400 text-xs mb-1.5 block flex items-center gap-1"><StickyNote className="w-3 h-3" /> Notes</Label>
            <Input value={form.notes} onChange={e => set('notes', e.target.value)}
              className="bg-[#0B0B12] border-white/10 text-white" placeholder="Payment terms, special notes..." />
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.name.trim() || createMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending ? 'Saving…' : 'Add Vendor'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function VendorProfile({ supplier, documents, expenses, currencySymbol, onBack }) {
  const [tab, setTab] = useState('invoices');

  const supplierDocs = useMemo(() =>
    documents.filter(d => d.supplier_name?.toLowerCase().trim() === supplier.name?.toLowerCase().trim()),
    [documents, supplier]);

  const supplierExpenses = useMemo(() =>
    expenses.filter(e => e.supplier_name?.toLowerCase().trim() === supplier.name?.toLowerCase().trim()),
    [expenses, supplier]);

  const allInvoices = useMemo(() => {
    const fromDocs = supplierDocs.map(d => ({
      id: d.id, invoice_number: d.invoice_number || '—',
      invoice_date: d.invoice_date || '—', due_date: d.due_date,
      gross_total: d.gross_total, net_total: d.net_total,
      vat_total: d.vat_total, status: d.status, source: 'document',
    }));
    const fromExp = supplierExpenses
      .filter(e => !supplierDocs.find(d => d.invoice_number === e.invoice_number))
      .map(e => ({
        id: e.id, invoice_number: e.invoice_number || '—',
        invoice_date: e.invoice_date || '—', due_date: null,
        gross_total: e.invoice_total, net_total: null,
        vat_total: null, status: 'posted', source: 'expense',
      }));
    return [...fromDocs, ...fromExp].sort((a, b) => b.invoice_date > a.invoice_date ? 1 : -1);
  }, [supplierDocs, supplierExpenses]);

  const totalSpend = allInvoices.reduce((s, i) => s + (i.gross_total || 0), 0);

  // Outstanding payables — docs with status not 'posted'
  const outstanding = allInvoices.filter(i => i.status !== 'posted' && i.status !== 'approved');

  // Price history per line — from document lines (approximate from totals)
  const priceHistory = useMemo(() => {
    const byMonth = {};
    allInvoices.forEach(inv => {
      if (!inv.invoice_date || inv.invoice_date === '—') return;
      const month = inv.invoice_date.slice(0, 7);
      byMonth[month] = (byMonth[month] || 0) + (inv.gross_total || 0);
    });
    return Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0])).map(([month, total]) => ({ month, total }));
  }, [allInvoices]);

  const TABS = [
    { id: 'invoices', label: 'Invoices', count: allInvoices.length },
    { id: 'spend', label: 'Spend History', count: priceHistory.length },
    { id: 'details', label: 'Details' },
  ];

  return (
    <div className="space-y-5">
      {/* Back button + header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-1.5 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> All Vendors
        </button>
      </div>

      {/* Supplier Hero */}
      <div className="bg-[#151528]/80 border border-white/5 rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#7B3BFF]/15 border border-[#7B3BFF]/20 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-[#A855F7]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{supplier.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge className={`text-xs border ${CATEGORY_COLORS[supplier.category] || CATEGORY_COLORS.other}`}>
                  {CATEGORY_OPTIONS.find(c => c.value === supplier.category)?.label || supplier.category}
                </Badge>
                {supplier.last_order_date && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Last order: {supplier.last_order_date}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="text-center px-4 py-2 bg-white/5 rounded-xl">
              <p className="text-xs text-slate-500">Total Spend</p>
              <p className="text-lg font-bold text-white">{currencySymbol}{totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="text-center px-4 py-2 bg-white/5 rounded-xl">
              <p className="text-xs text-slate-500">Invoices</p>
              <p className="text-lg font-bold text-white">{allInvoices.length}</p>
            </div>
          </div>
        </div>

        {/* Contact info */}
        {(supplier.contact_name || supplier.contact_email || supplier.phone || supplier.address) && (
          <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-4">
            {supplier.contact_name && (
              <span className="text-xs text-slate-400 flex items-center gap-1.5"><User className="w-3 h-3 text-slate-500" />{supplier.contact_name}</span>
            )}
            {supplier.contact_email && (
              <a href={`mailto:${supplier.contact_email}`} className="text-xs text-slate-400 hover:text-[#C084FC] flex items-center gap-1.5 transition-colors">
                <Mail className="w-3 h-3 text-slate-500" />{supplier.contact_email}
              </a>
            )}
            {supplier.phone && (
              <span className="text-xs text-slate-400 flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-500" />{supplier.phone}</span>
            )}
            {supplier.address && (
              <span className="text-xs text-slate-400 flex items-center gap-1.5"><MapPin className="w-3 h-3 text-slate-500" />{supplier.address}</span>
            )}
          </div>
        )}
        {supplier.notes && (
          <div className="mt-3 px-3 py-2 bg-white/[0.03] rounded-lg">
            <p className="text-xs text-slate-400">{supplier.notes}</p>
          </div>
        )}
      </div>

      {/* Outstanding payables alert */}
      {outstanding.length > 0 && (
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <p className="text-amber-300 text-sm font-medium">{outstanding.length} invoice{outstanding.length > 1 ? 's' : ''} pending review</p>
          </div>
          <div className="space-y-1">
            {outstanding.slice(0, 3).map(inv => (
              <div key={inv.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{inv.invoice_number} · {inv.invoice_date}</span>
                <span className="text-amber-400 font-medium">{currencySymbol}{(inv.gross_total || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/5">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-1.5 ${
              tab === t.id ? 'border-[#7B3BFF] text-[#C084FC]' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-[#7B3BFF]/20 text-[#C084FC]' : 'bg-white/5 text-slate-500'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'invoices' && (
        <div className="space-y-2">
          {allInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No invoices found for this supplier.</p>
              <p className="text-slate-600 text-xs mt-1">Upload invoices in Expenses to populate this view.</p>
            </div>
          ) : allInvoices.map(inv => (
            <div key={inv.id} className="bg-white/5 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-white font-medium text-sm">{inv.invoice_number}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {inv.invoice_date}</span>
                    {inv.due_date && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due: {inv.due_date}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white font-bold text-sm">{currencySymbol}{(inv.gross_total || 0).toFixed(2)}</p>
                  {inv.net_total != null && (
                    <p className="text-slate-500 text-xs">Net: {currencySymbol}{inv.net_total.toFixed(2)}</p>
                  )}
                </div>
              </div>
              {inv.status && (
                <div className="mt-2">
                  <Badge className={`text-xs border ${STATUS_STYLES[inv.status] || STATUS_STYLES.new} capitalize`}>
                    {inv.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'spend' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Monthly spend from invoices — tracks price trends over time.</p>
          {priceHistory.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No spend history yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(() => {
                const maxTotal = Math.max(...priceHistory.map(p => p.total));
                return priceHistory.map((p, idx) => {
                  const pct = maxTotal > 0 ? (p.total / maxTotal) * 100 : 0;
                  const prev = priceHistory[idx - 1];
                  const change = prev ? ((p.total - prev.total) / prev.total) * 100 : null;
                  return (
                    <div key={p.month} className="bg-white/5 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-xs font-mono">{p.month}</span>
                        <div className="flex items-center gap-2">
                          {change !== null && (
                            <span className={`text-[10px] font-medium ${change > 5 ? 'text-rose-400' : change < -5 ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {change > 0 ? '+' : ''}{change.toFixed(1)}%
                            </span>
                          )}
                          <span className="text-white text-sm font-bold">{currencySymbol}{p.total.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-[#7B3BFF] to-[#A855F7] transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      )}

      {tab === 'details' && (
        <div className="space-y-3">
          {[
            { icon: Tag, label: 'Category', value: CATEGORY_OPTIONS.find(c => c.value === supplier.category)?.label || supplier.category },
            { icon: User, label: 'Contact', value: supplier.contact_name || '—' },
            { icon: Mail, label: 'Email', value: supplier.contact_email || '—' },
            { icon: Phone, label: 'Phone', value: supplier.phone || '—' },
            { icon: MapPin, label: 'Address', value: supplier.address || '—' },
            { icon: StickyNote, label: 'Notes', value: supplier.notes || '—' },
            { icon: Calendar, label: 'Last Order', value: supplier.last_order_date || '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 bg-white/[0.03] rounded-xl p-3">
              <Icon className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-sm text-white mt-0.5 break-words">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VendorsContent() {
  const { currentBusiness } = useBusiness();
  const qc = useQueryClient();
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const currencySymbol = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr', AUD: '$', CAD: '$' }[currentBusiness?.currency] || '€';

  const { isRefreshing, pullDistance, containerRef } = usePullToRefresh(async () => {
    await Promise.all([
      qc.invalidateQueries(['suppliers', currentBusiness?.id]),
      qc.invalidateQueries(['allExpenses', currentBusiness?.id]),
      qc.invalidateQueries(['documents', currentBusiness?.id]),
    ]);
  });

  const { data: supplierRecords = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: ['suppliers', currentBusiness?.id],
    queryFn: () => base44.entities.Supplier.filter({ business_id: currentBusiness.id }, '-total_spend'),
    enabled: !!currentBusiness,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['allExpenses', currentBusiness?.id],
    queryFn: () => base44.entities.ExpenseDocument.filter({ business_id: currentBusiness.id }, '-invoice_date', 500),
    enabled: !!currentBusiness,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', currentBusiness?.id],
    queryFn: () => base44.entities.Document.filter({ business_id: currentBusiness.id }, '-invoice_date', 200),
    enabled: !!currentBusiness,
  });

  // Build a virtual supplier list from ExpenseDocuments so vendors always appear
  // even if the Supplier FK was never set during invoice upload.
  const suppliers = useMemo(() => {
    if (expenses.length === 0 && supplierRecords.length === 0) return [];

    // Group expenses by supplier name
    const expenseMap = {};
    expenses.forEach(e => {
      const name = (e.supplier_name || '').trim();
      if (!name) return;
      if (!expenseMap[name]) {
        expenseMap[name] = { name, total_spend: 0, invoice_count: 0, last_order_date: null, category: e.expense_category || 'other', invoices: [] };
      }
      expenseMap[name].total_spend += (e.invoice_total || 0);
      expenseMap[name].invoice_count += 1;
      if (e.invoice_date && (!expenseMap[name].last_order_date || e.invoice_date > expenseMap[name].last_order_date)) {
        expenseMap[name].last_order_date = e.invoice_date;
      }
      expenseMap[name].invoices.push(e);
    });

    // Merge with actual Supplier records (they may have contact details)
    const merged = { ...expenseMap };
    supplierRecords.forEach(s => {
      const name = (s.name || '').trim();
      if (merged[name]) {
        // Enrich with contact details from the Supplier record
        merged[name] = { ...merged[name], ...s, name, total_spend: merged[name].total_spend, invoice_count: merged[name].invoice_count, last_order_date: merged[name].last_order_date };
      } else {
        merged[name] = { ...s, name, invoices: [] };
      }
    });

    return Object.values(merged).sort((a, b) => (b.total_spend || 0) - (a.total_spend || 0));
  }, [expenses, supplierRecords]);

  const totalSpend = useMemo(() => expenses.reduce((s, e) => s + (e.invoice_total || 0), 0), [expenses]);
  const topCategory = useMemo(() => {
    const catMap = {};
    suppliers.forEach(s => { catMap[s.category] = (catMap[s.category] || 0) + (s.total_spend || 0); });
    const top = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    return CATEGORY_OPTIONS.find(c => c.value === top)?.label || top?.replace(/_/g, ' ') || '';
  }, [suppliers]);

  // loading state is only true when no data yet (both suppliers & expenses pending)
  const isLoading = loadingSuppliers;

  if (!currentBusiness) return (
    <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-400 mb-4">No business selected.</p>
        <Button onClick={() => window.location.href = '/CreateBusiness'}>Create a Business</Button>
      </div>
    </div>
  );

  // Show vendor profile detail view
  if (selectedSupplier) {
    return (
      <div ref={containerRef} className="p-6">
        <PullToRefreshIndicator isRefreshing={isRefreshing} pullDistance={pullDistance} />
        <VendorProfile
          supplier={selectedSupplier}
          documents={documents}
          expenses={expenses}
          currencySymbol={currencySymbol}
          onBack={() => setSelectedSupplier(null)}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="p-6 space-y-6">
      <PullToRefreshIndicator isRefreshing={isRefreshing} pullDistance={pullDistance} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Vendors & Suppliers</h1>
          <p className="text-slate-400 text-sm mt-1">Track supplier relationships and spending</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Vendor
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#151528]/80 border-white/5 p-4">
          <p className="text-slate-400 text-sm">Total Suppliers</p>
          <p className="text-3xl font-bold text-white mt-1">{suppliers.length}</p>
        </Card>
        <Card className="bg-[#151528]/80 border-white/5 p-4">
          <p className="text-slate-400 text-sm">Total Spend</p>
          <p className="text-3xl font-bold text-white mt-1">{currencySymbol}{totalSpend.toLocaleString()}</p>
          <p className="text-xs text-slate-600 mt-1">All-time, from supplier records</p>
        </Card>
        <Card className="bg-[#151528]/80 border-white/5 p-4">
          <p className="text-slate-400 text-sm">Top Category</p>
          <p className="text-xl font-bold text-white mt-1 capitalize">
            {topCategory || <span className="text-slate-500">—</span>}
          </p>
        </Card>
      </div>

      {/* Supplier List */}
      {isLoading ? (
        <div className="text-center text-slate-400 py-12">Loading suppliers...</div>
      ) : suppliers.length === 0 ? (
        <Card className="bg-[#151528]/80 border-white/5 p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg font-medium">No suppliers yet</p>
          <p className="text-slate-500 text-sm mt-2">
            Upload invoices to automatically populate your supplier directory, or{' '}
            <button
              onClick={() => setShowAddModal(true)}
              className="text-[#A855F7] hover:text-[#C084FC] underline underline-offset-2 transition-colors"
            >
              add a vendor manually
            </button>
            .
          </p>
          <Button onClick={() => setShowAddModal(true)} variant="outline" className="mt-5">
            <Plus className="w-4 h-4 mr-2" /> Add Vendor Manually
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((supplier, idx) => (
            <motion.div
              key={supplier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card
                className="bg-[#151528]/80 border-white/5 hover:border-[#7B3BFF]/30 transition-all duration-200 h-full cursor-pointer group"
                onClick={() => setSelectedSupplier(supplier)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#7B3BFF]/15 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-[#A855F7]" />
                      </div>
                      <CardTitle className="text-white text-base leading-tight">{supplier.name}</CardTitle>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-[#A855F7] transition-colors flex-shrink-0 mt-0.5" />
                  </div>
                  <Badge className={`text-xs border w-fit ${CATEGORY_COLORS[supplier.category] || CATEGORY_COLORS.other}`}>
                    {CATEGORY_OPTIONS.find(c => c.value === supplier.category)?.label || supplier.category?.replace(/_/g, ' ')}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-slate-500 text-xs flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Total Spend</p>
                      <p className="text-white font-bold mt-0.5">{currencySymbol}{(supplier.total_spend || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-slate-500 text-xs flex items-center gap-1"><FileText className="w-3 h-3" /> Invoices</p>
                      <p className="text-white font-bold mt-0.5">{supplier.invoice_count || 0}</p>
                    </div>
                  </div>
                  {supplier.last_order_date && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" /> Last order: {supplier.last_order_date}
                    </div>
                  )}
                  {supplier.contact_email && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
                      <Mail className="w-3 h-3 flex-shrink-0" /> {supplier.contact_email}
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Phone className="w-3 h-3 flex-shrink-0" /> {supplier.phone}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <AddVendorModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        businessId={currentBusiness.id}
      />
    </div>
  );
}

export default function Vendors() {
  return <BusinessProvider><VendorsContent /></BusinessProvider>;
}