import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, CalendarDays, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const STATUS_CONFIG = {
  open:   { label: 'Open',   className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  review: { label: 'Review', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  final:  { label: 'Final',  className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
};

const EMPTY_FORM = {
  period_start: '', period_end: '', filing_deadline: '', status: 'open',
  output_vat: '', input_vat: '',
};

export default function VATPeriodsTab({ business }) {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: periods = [], isLoading } = useQuery({
    queryKey: ['vatPeriods', business?.id],
    queryFn: () => base44.entities.VATPeriod.filter({ business_id: business.id }, '-period_start', 20),
    enabled: !!business,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.VATPeriod.update(editing.id, data)
      : base44.entities.VATPeriod.create(data),
    onSuccess: () => { qc.invalidateQueries(['vatPeriods', business?.id]); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VATPeriod.delete(id),
    onSuccess: () => qc.invalidateQueries(['vatPeriods', business?.id]),
  });

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      period_start: p.period_start || '',
      period_end: p.period_end || '',
      filing_deadline: p.filing_deadline || '',
      status: p.status || 'open',
      output_vat: p.output_vat ?? '',
      input_vat: p.input_vat ?? '',
    });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditing(null); setForm(EMPTY_FORM); };

  const handleSubmit = () => {
    const outputVat = parseFloat(form.output_vat) || 0;
    const inputVat = parseFloat(form.input_vat) || 0;
    saveMutation.mutate({
      business_id: business.id,
      period_start: form.period_start,
      period_end: form.period_end,
      filing_deadline: form.filing_deadline,
      status: form.status,
      output_vat: outputVat,
      input_vat: inputVat,
      net_vat_payable: outputVat - inputVat,
    });
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const daysUntilDeadline = (deadline) => {
    if (!deadline) return null;
    return differenceInDays(new Date(deadline), new Date());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">VAT Periods</h2>
        <Button onClick={openAdd} size="sm">
          <Plus className="w-4 h-4 mr-2" /> New Period
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-4 border-[#7B3BFF]/30 border-t-[#7B3BFF] rounded-full animate-spin" />
        </div>
      ) : periods.length === 0 ? (
        <Card className="bg-[#151528]/80 border-white/5 p-12 text-center">
          <CalendarDays className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No VAT periods yet. Create your first period to get started.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {periods.map(period => {
            const net = period.net_vat_payable ?? (period.output_vat - period.input_vat);
            const days = daysUntilDeadline(period.filing_deadline);
            const cfg = STATUS_CONFIG[period.status] || STATUS_CONFIG.open;
            return (
              <Card key={period.id} className="bg-[#151528]/80 border-white/5 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#7B3BFF]/10 border border-[#7B3BFF]/20 flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="w-5 h-5 text-[#C084FC]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium">
                          {period.period_start && format(new Date(period.period_start), 'dd MMM yyyy')}
                          {' → '}
                          {period.period_end && format(new Date(period.period_end), 'dd MMM yyyy')}
                        </span>
                        <Badge className={cfg.className}>{cfg.label}</Badge>
                        {days !== null && days <= 14 && period.status !== 'final' && (
                          <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {days < 0 ? 'Overdue' : `${days}d left`}
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-500 text-sm mt-0.5">
                        Deadline: {period.filing_deadline ? format(new Date(period.filing_deadline), 'dd MMM yyyy') : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Output VAT</p>
                      <p className="text-white font-medium">€{(period.output_vat ?? 0).toLocaleString('en', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Input VAT</p>
                      <p className="text-emerald-400 font-medium">€{(period.input_vat ?? 0).toLocaleString('en', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Net Payable</p>
                      <p className={`font-bold text-lg ${net >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        €{Math.abs(net).toLocaleString('en', { minimumFractionDigits: 2 })}
                        {net < 0 && <span className="text-xs ml-1">(refund)</span>}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(period)} className="h-8 w-8 text-slate-400 hover:text-white">
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(period.id)} className="h-8 w-8 text-slate-400 hover:text-rose-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[#151528] border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{editing ? 'Edit VAT Period' : 'New VAT Period'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400 mb-1.5 block text-sm">Period Start</Label>
                <Input type="date" value={form.period_start} onChange={e => set('period_start', e.target.value)} className="bg-[#0B0B12] border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-slate-400 mb-1.5 block text-sm">Period End</Label>
                <Input type="date" value={form.period_end} onChange={e => set('period_end', e.target.value)} className="bg-[#0B0B12] border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-slate-400 mb-1.5 block text-sm">Filing Deadline</Label>
                <Input type="date" value={form.filing_deadline} onChange={e => set('filing_deadline', e.target.value)} className="bg-[#0B0B12] border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-slate-400 mb-1.5 block text-sm">Status</Label>
                <Select value={form.status} onValueChange={v => set('status', v)}>
                  <SelectTrigger className="bg-[#0B0B12] border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#151528] border-white/10">
                    <SelectItem value="open" className="text-white">Open</SelectItem>
                    <SelectItem value="review" className="text-white">Under Review</SelectItem>
                    <SelectItem value="final" className="text-white">Final / Submitted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-400 mb-1.5 block text-sm">Output VAT (€) — on Sales</Label>
                <Input type="number" value={form.output_vat} onChange={e => set('output_vat', e.target.value)} className="bg-[#0B0B12] border-white/10 text-white" placeholder="0.00" />
              </div>
              <div>
                <Label className="text-slate-400 mb-1.5 block text-sm">Input VAT (€) — on Purchases</Label>
                <Input type="number" value={form.input_vat} onChange={e => set('input_vat', e.target.value)} className="bg-[#0B0B12] border-white/10 text-white" placeholder="0.00" />
              </div>
            </div>

            {/* Live Net Preview */}
            {(form.output_vat !== '' || form.input_vat !== '') && (
              <div className="rounded-xl bg-[#0B0B12]/60 border border-white/5 p-4">
                <p className="text-xs text-slate-500 mb-1">Net VAT Payable Preview</p>
                {(() => {
                  const net = (parseFloat(form.output_vat) || 0) - (parseFloat(form.input_vat) || 0);
                  return (
                    <p className={`text-xl font-bold ${net >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      €{Math.abs(net).toFixed(2)} {net < 0 ? '(refund due)' : '(payable)'}
                    </p>
                  );
                })()}
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!form.period_start || !form.period_end || saveMutation.isPending}
              className="w-full"
            >
              {saveMutation.isPending ? 'Saving...' : editing ? 'Update Period' : 'Create Period'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}