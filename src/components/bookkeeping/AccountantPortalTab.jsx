import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  UserCircle, Building2, AlertCircle, CheckCircle2, Clock,
  RefreshCw, Search, ChevronRight, Sparkles, Users,
  CalendarDays, FileText, BarChart3, ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useBusiness } from '@/components/business/BusinessContext';
import { formatDistanceToNow, addDays, format } from 'date-fns';

function ClientStatusBadge({ status }) {
  if (status === 'clean') return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs">Clean</Badge>;
  if (status === 'needs_review') return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-xs"><AlertCircle className="w-3 h-3 mr-1" />Needs review</Badge>;
  if (status === 'pending_vat') return <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-xs"><Clock className="w-3 h-3 mr-1" />Pending VAT</Badge>;
  return <Badge className="bg-slate-500/15 text-slate-400 border-slate-500/30 text-xs">Unknown</Badge>;
}

function deriveClientStatus(business, expenses) {
  const needsReview = expenses.filter(e => e.status === 'needs_review' || (e.confidence_score > 0 && e.confidence_score < 0.6));
  if (needsReview.length > 0) return { status: 'needs_review', count: needsReview.length };
  if (business.vat_registered) return { status: 'pending_vat', count: 0 };
  return { status: 'clean', count: 0 };
}

// Simulate VAT due date from business settings
function getVatDueDate(business) {
  const now = new Date();
  // Next quarter end + 40 days (approx Cyprus VAT deadline: 10th of 2nd month)
  const month = now.getMonth();
  const quarterEnd = new Date(now.getFullYear(), Math.ceil((month + 1) / 3) * 3, 0);
  return addDays(quarterEnd, 40);
}

function ClientRow({ business, expenses, isSelected, onSelect, onSwitchTo }) {
  const { status, count } = deriveClientStatus(business, expenses);
  const vatDue = business.vat_registered ? getVatDueDate(business) : null;
  const daysUntilVat = vatDue ? Math.round((vatDue - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const vatUrgent = daysUntilVat != null && daysUntilVat <= 14;

  return (
    <tr className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors group ${isSelected ? 'bg-[#7B3BFF]/8' : ''}`}>
      <td className="px-4 py-3.5">
        <input type="checkbox" checked={isSelected} onChange={onSelect}
          className="w-4 h-4 accent-[#7B3BFF] rounded cursor-pointer" />
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#7B3BFF]/20 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-[#C084FC]" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">{business.name}</p>
            <p className="text-slate-500 text-xs capitalize">{(business.industry_group || '').replace(/_/g, ' ')}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 text-slate-400 text-sm">
        {business.updated_date
          ? formatDistanceToNow(new Date(business.updated_date), { addSuffix: true })
          : '—'}
      </td>
      <td className="px-4 py-3.5">
        {business.vat_registered && vatDue ? (
          <span className={`text-sm font-medium ${vatUrgent ? 'text-amber-400' : 'text-slate-300'}`}>
            {format(vatDue, 'dd MMM yyyy')}
            {vatUrgent && <span className="ml-1.5 text-xs text-amber-400">⚠ {daysUntilVat}d</span>}
          </span>
        ) : (
          <span className="text-slate-600 text-sm">Not VAT registered</span>
        )}
      </td>
      <td className="px-4 py-3.5">
        <ClientStatusBadge status={status} />
        {count > 0 && <span className="ml-1.5 text-xs text-amber-400">{count} item{count > 1 ? 's' : ''}</span>}
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="outline" onClick={onSwitchTo}
            className="h-7 text-xs gap-1 text-[#C084FC] border-[#7B3BFF]/30 hover:border-[#7B3BFF]/60">
            Switch <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default function AccountantPortalTab() {
  const { user, switchBusiness } = useBusiness();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());

  // Load all businesses this user owns or is a member of
  const { data: ownedBusinesses = [], isLoading: loadingOwned } = useQuery({
    queryKey: ['accountant-owned-businesses', user?.email],
    queryFn: () => base44.entities.Business.filter({ owner_email: user.email }),
    enabled: !!user,
  });

  const { data: memberRecords = [], isLoading: loadingMember } = useQuery({
    queryKey: ['accountant-member-records', user?.email],
    queryFn: () => base44.entities.BusinessMember.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const memberBusinessIds = memberRecords.map(m => m.business_id);

  const { data: memberBusinesses = [] } = useQuery({
    queryKey: ['accountant-member-businesses', memberBusinessIds.join(',')],
    queryFn: async () => {
      if (!memberBusinessIds.length) return [];
      const all = await base44.entities.Business.list();
      return all.filter(b => memberBusinessIds.includes(b.id));
    },
    enabled: memberBusinessIds.length > 0,
  });

  // Fetch recent expenses for all businesses (for status calculation)
  const { data: allExpenses = [] } = useQuery({
    queryKey: ['accountant-all-expenses'],
    queryFn: () => base44.entities.ExpenseDocument.list('-created_date', 200),
    enabled: !!user,
  });

  const allBusinesses = useMemo(() => {
    const map = new Map();
    [...ownedBusinesses, ...memberBusinesses].forEach(b => map.set(b.id, b));
    return Array.from(map.values());
  }, [ownedBusinesses, memberBusinesses]);

  const filtered = allBusinesses.filter(b =>
    !search || b.name.toLowerCase().includes(search.toLowerCase())
  );

  const isLoading = loadingOwned || loadingMember;

  const toggleSelect = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () => {
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(b => b.id)));
  };

  const needsReviewTotal = allBusinesses.reduce((sum, b) => {
    const bExpenses = allExpenses.filter(e => e.business_id === b.id);
    return sum + bExpenses.filter(e => e.status === 'needs_review' || (e.confidence_score > 0 && e.confidence_score < 0.6)).length;
  }, 0);

  const vatDueCount = allBusinesses.filter(b => b.vat_registered).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-[#7B3BFF] animate-spin" />
      </div>
    );
  }

  if (allBusinesses.length === 0) {
    return (
      <Card className="bg-[#151528]/80 border-white/5 p-10 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-[#7B3BFF]/15 border border-[#7B3BFF]/25 flex items-center justify-center mx-auto mb-4">
          <UserCircle className="w-8 h-8 text-[#C084FC]" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Accountant Portal</h2>
        <p className="text-slate-400 mb-4 text-sm">
          Manage all your client businesses from one place. Switch between clients, track VAT deadlines, and generate audit packs in bulk.
        </p>
        <p className="text-slate-500 text-xs">
          You'll see all businesses you own or have been added to as a team member here.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portal Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-[#C084FC]" />
            My Clients
            <Badge className="bg-[#7B3BFF]/20 text-[#C084FC] border-[#7B3BFF]/30 ml-1">{allBusinesses.length}</Badge>
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">Switch between clients, track deadlines, and run bulk operations.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            <CalendarDays className="w-3.5 h-3.5" /> Run all VAT periods
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            <FileText className="w-3.5 h-3.5" /> Generate all audit packs
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total clients', value: allBusinesses.length, icon: Building2, color: 'text-[#C084FC]' },
          { label: 'Needs review', value: needsReviewTotal, icon: AlertCircle, color: needsReviewTotal > 0 ? 'text-amber-400' : 'text-slate-500' },
          { label: 'VAT registered', value: vatDueCount, icon: BarChart3, color: 'text-blue-400' },
          { label: 'VAT due <14 days', value: allBusinesses.filter(b => { if (!b.vat_registered) return false; const d = getVatDueDate(b); return Math.round((d - new Date()) / (1000*60*60*24)) <= 14; }).length, icon: Clock, color: 'text-rose-400' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="p-4">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><Icon className={`w-3.5 h-3.5 ${s.color}`} />{s.label}</div>
                <p className="text-white font-bold text-2xl">{s.value}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Search + Batch Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search clients..." className="bg-[#151528] border-white/10 text-white pl-9" />
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-[#7B3BFF]/10 border border-[#7B3BFF]/30 rounded-xl text-sm">
            <span className="text-[#C084FC] font-medium text-xs">{selected.size} selected</span>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
              <CalendarDays className="w-3 h-3" /> VAT periods
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
              <FileText className="w-3 h-3" /> Audit packs
            </Button>
          </div>
        )}
      </div>

      {/* Clients Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-[#0B0B12]/40">
                <th className="px-4 py-3">
                  <input type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="w-4 h-4 accent-[#7B3BFF] rounded cursor-pointer" />
                </th>
                {['Client', 'Last sync', 'VAT filing due', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((business) => {
                const bExpenses = allExpenses.filter(e => e.business_id === business.id);
                return (
                  <ClientRow
                    key={business.id}
                    business={business}
                    expenses={bExpenses}
                    isSelected={selected.has(business.id)}
                    onSelect={() => toggleSelect(business.id)}
                    onSwitchTo={() => switchBusiness && switchBusiness(business)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            No clients found.
          </div>
        )}
      </Card>

      {/* Premium Feature Note */}
      <div className="flex items-start gap-3 p-4 bg-[#7B3BFF]/8 border border-[#7B3BFF]/20 rounded-xl">
        <Sparkles className="w-4 h-4 text-[#C084FC] mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="text-slate-300 font-medium">Accountant Portal — Premium</p>
          <p className="text-slate-500 mt-0.5">Bulk VAT filing, audit pack generation, white-label exports, and accountant-only notes are coming in the premium plan. Manage unlimited clients from a single dashboard.</p>
        </div>
      </div>
    </div>
  );
}