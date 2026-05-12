import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ROLES = ['chef', 'waiter', 'bartender', 'manager', 'cleaner', 'other'];
const CONTRACT_TYPES = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'monthly', label: 'Monthly Salary' },
  { value: 'part_time', label: 'Part Time' }
];

function Field({ label, children }) {
  return (
    <div>
      <Label className="text-slate-400 text-xs mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

const INPUT_CLS = "bg-[#0B0B12] border-white/10 text-white text-sm";

export default function AddEmployeeModal({ open, onClose, form, setForm, editing, onSubmit, isPending }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#151528] border-white/10 max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{editing ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Core Identity */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Identity</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full legal name *">
                <Input value={form.employee_name} onChange={e => setForm({ ...form, employee_name: e.target.value })}
                  className={INPUT_CLS} placeholder="As on ID/passport" />
              </Field>
              <Field label="Role *">
                <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                  <SelectTrigger className={INPUT_CLS}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#151528] border-white/10">
                    {ROLES.map(r => <SelectItem key={r} value={r} className="text-white capitalize">{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Social Insurance No.">
                <Input value={form.notes?.split('SI:')?.[1]?.split('|')?.[0] || ''} 
                  onChange={e => setForm({ ...form, notes: `SI:${e.target.value}|${(form.notes || '').split('|').slice(1).join('|')}` })}
                  className={INPUT_CLS} placeholder="e.g. 12345678A" />
              </Field>
              <Field label="Tax code">
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className={INPUT_CLS} placeholder="TIC number" />
              </Field>
            </div>
          </div>

          {/* Contract */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Contract</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contract type *">
                <Select value={form.contract_type} onValueChange={v => setForm({ ...form, contract_type: v })}>
                  <SelectTrigger className={INPUT_CLS}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#151528] border-white/10">
                    {CONTRACT_TYPES.map(t => <SelectItem key={t.value} value={t.value} className="text-white">{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              {form.contract_type === 'monthly' ? (
                <Field label="Monthly salary (€)">
                  <Input type="number" value={form.monthly_salary} onChange={e => setForm({ ...form, monthly_salary: e.target.value })}
                    className={INPUT_CLS} placeholder="0.00" />
                </Field>
              ) : (
                <Field label="Hourly rate (€/hr)">
                  <Input type="number" value={form.hourly_rate} onChange={e => setForm({ ...form, hourly_rate: e.target.value })}
                    className={INPUT_CLS} placeholder="0.00" />
                </Field>
              )}
              <Field label="Start date">
                <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                  className={INPUT_CLS} />
              </Field>
              <Field label="Status">
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className={INPUT_CLS}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#151528] border-white/10">
                    {['active', 'inactive', 'terminated'].map(s =>
                      <SelectItem key={s} value={s} className="text-white capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>

          {/* Cyprus-specific */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Cyprus payroll fields</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Marital status">
                <Select value={form.marital_status || 'single'} onValueChange={v => setForm({ ...form, marital_status: v })}>
                  <SelectTrigger className={INPUT_CLS}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#151528] border-white/10">
                    {['single', 'married', 'divorced', 'widowed'].map(s =>
                      <SelectItem key={s} value={s} className="text-white capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Dependents">
                <Input type="number" min={0} value={form.dependents || 0}
                  onChange={e => setForm({ ...form, dependents: e.target.value })}
                  className={INPUT_CLS} placeholder="0" />
              </Field>
              <Field label="Working pattern">
                <Select value={form.working_pattern || 'full_time'} onValueChange={v => setForm({ ...form, working_pattern: v })}>
                  <SelectTrigger className={INPUT_CLS}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#151528] border-white/10">
                    {[{ v: 'full_time', l: 'Full time' }, { v: 'part_time', l: 'Part time' }, { v: 'weekends', l: 'Weekends only' }].map(o =>
                      <SelectItem key={o.v} value={o.v} className="text-white">{o.l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Annual leave (days)">
                <Input type="number" min={20} value={form.holiday_days || 20}
                  onChange={e => setForm({ ...form, holiday_days: e.target.value })}
                  className={INPUT_CLS} placeholder="20 min (4 wks)" />
              </Field>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Contact & payment</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email (for payslips)">
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className={INPUT_CLS} placeholder="employee@email.com" />
              </Field>
              <Field label="IBAN (bank account)">
                <Input value={form.iban || ''} onChange={e => setForm({ ...form, iban: e.target.value })}
                  className={INPUT_CLS} placeholder="CY17 0020 0195..." />
              </Field>
            </div>
          </div>

          <Button onClick={onSubmit} disabled={!form.employee_name || isPending} className="w-full">
            {isPending ? 'Saving...' : editing ? 'Update Employee' : 'Add Employee'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}