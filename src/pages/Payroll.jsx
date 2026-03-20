import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { BusinessProvider, useBusiness } from '@/components/business/BusinessContext';
import { Users, Plus, Trash2, Edit2, FileText, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';

const ROLES = ['chef', 'waiter', 'bartender', 'manager', 'cleaner', 'other'];
const CONTRACT_TYPES = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'monthly', label: 'Monthly Salary' },
  { value: 'part_time', label: 'Part Time' }
];

const EMPTY_FORM = {
  employee_name: '', role: 'waiter', contract_type: 'hourly',
  hourly_rate: '', monthly_salary: '', start_date: '', end_date: '',
  email: '', phone: '', notes: '', status: 'active'
};

function PayrollContent() {
  const { currentBusiness, canEdit } = useBusiness();
  const qc = useQueryClient();
  const [tab, setTab] = useState('employees');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [reportMonth, setReportMonth] = useState(new Date());

  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: ['contracts', currentBusiness?.id],
    queryFn: () => base44.entities.EmployeeContract.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness
  });

  const { data: shifts = [], isLoading: loadingShifts } = useQuery({
    queryKey: ['shifts', currentBusiness?.id, format(reportMonth, 'yyyy-MM')],
    queryFn: () => base44.entities.LaborShift.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness && tab === 'report'
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.EmployeeContract.update(editing.id, data)
      : base44.entities.EmployeeContract.create(data),
    onSuccess: () => { qc.invalidateQueries(['contracts', currentBusiness?.id]); closeModal(); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EmployeeContract.delete(id),
    onSuccess: () => qc.invalidateQueries(['contracts', currentBusiness?.id])
  });

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...c }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); setForm(EMPTY_FORM); };

  const handleSubmit = () => {
    saveMutation.mutate({
      ...form,
      business_id: currentBusiness.id,
      hourly_rate: parseFloat(form.hourly_rate) || 0,
      monthly_salary: parseFloat(form.monthly_salary) || 0
    });
  };

  // Payroll report: group shifts by staff name in the selected month
  const monthStart = startOfMonth(reportMonth);
  const monthEnd = endOfMonth(reportMonth);

  const monthShifts = useMemo(() => shifts.filter(s => {
    const d = new Date(s.date);
    return d >= monthStart && d <= monthEnd;
  }), [shifts, reportMonth]);

  const payrollReport = useMemo(() => {
    const grouped = {};
    monthShifts.forEach(s => {
      if (!grouped[s.staff_name]) grouped[s.staff_name] = { name: s.staff_name, role: s.role, hours: 0, total: 0 };
      grouped[s.staff_name].hours += s.hours || 0;
      grouped[s.staff_name].total += s.total_cost || 0;
    });
    return Object.values(grouped);
  }, [monthShifts]);

  const totalPayroll = payrollReport.reduce((s, r) => s + r.total, 0);
  const totalHours = payrollReport.reduce((s, r) => s + r.hours, 0);

  const activeContracts = contracts.filter(c => c.status === 'active');

  if (!currentBusiness) return (
    <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center">
      <p className="text-slate-400">Please select a business first.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Users className="w-6 h-6 text-[#C084FC]" /> Payroll
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage employee contracts and payroll reports</p>
          </div>
          {tab === 'employees' && canEdit() && (
            <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> Add Employee</Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/5">
          {[{ id: 'employees', label: 'Employees' }, { id: 'report', label: 'Payroll Report' }].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t.id ? 'border-[#7B3BFF] text-[#C084FC]' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Employees Tab */}
        {tab === 'employees' && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-5 bg-[#151528]/80 border-white/5">
                <p className="text-slate-400 text-sm mb-1">Active Employees</p>
                <p className="text-3xl font-bold text-white">{activeContracts.length}</p>
              </Card>
              <Card className="p-5 bg-[#151528]/80 border-white/5">
                <p className="text-slate-400 text-sm mb-1">Hourly Contracts</p>
                <p className="text-3xl font-bold text-white">{activeContracts.filter(c => c.contract_type === 'hourly').length}</p>
              </Card>
              <Card className="p-5 bg-[#151528]/80 border-white/5">
                <p className="text-slate-400 text-sm mb-1">Monthly Salaries</p>
                <p className="text-3xl font-bold text-emerald-400">
                  €{activeContracts.filter(c => c.contract_type === 'monthly').reduce((s, c) => s + (c.monthly_salary || 0), 0).toLocaleString()}
                </p>
              </Card>
            </div>

            {loadingContracts ? (
              <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-[#7B3BFF] animate-spin" /></div>
            ) : contracts.length === 0 ? (
              <Card className="p-12 text-center bg-[#151528]/80 border-white/5">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No employees yet. Add your first employee contract.</p>
              </Card>
            ) : (
              <Card className="bg-[#151528]/80 border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        {['Employee', 'Role', 'Contract', 'Rate', 'Start Date', 'Status', ''].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {contracts.map(c => (
                        <tr key={c.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-white font-medium">{c.employee_name}</p>
                            {c.email && <p className="text-xs text-slate-500">{c.email}</p>}
                          </td>
                          <td className="px-4 py-3 text-slate-400 capitalize">{c.role}</td>
                          <td className="px-4 py-3">
                            <Badge className="bg-[#7B3BFF]/20 text-[#C084FC] border-[#7B3BFF]/30 capitalize">
                              {CONTRACT_TYPES.find(t => t.value === c.contract_type)?.label || c.contract_type}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-white font-mono">
                            {c.contract_type === 'monthly' ? `€${c.monthly_salary}/mo` : `€${c.hourly_rate}/hr`}
                          </td>
                          <td className="px-4 py-3 text-slate-400">{c.start_date || '—'}</td>
                          <td className="px-4 py-3">
                            <Badge className={c.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'}>
                              {c.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {canEdit() && (
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => openEdit(c)} className="h-8 w-8 text-slate-400 hover:text-white">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(c.id)} className="h-8 w-8 text-slate-400 hover:text-rose-400">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Report Tab */}
        {tab === 'report' && (
          <>
            {/* Month Selector */}
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => setReportMonth(subMonths(reportMonth, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-white font-medium text-lg min-w-[140px] text-center">
                {format(reportMonth, 'MMMM yyyy')}
              </span>
              <Button variant="outline" size="icon" onClick={() => setReportMonth(addMonths(reportMonth, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-5 bg-[#151528]/80 border-white/5">
                <p className="text-slate-400 text-sm mb-1">Total Payroll</p>
                <p className="text-3xl font-bold text-white">€{totalPayroll.toLocaleString('en', { maximumFractionDigits: 0 })}</p>
              </Card>
              <Card className="p-5 bg-[#151528]/80 border-white/5">
                <p className="text-slate-400 text-sm mb-1">Total Hours</p>
                <p className="text-3xl font-bold text-white">{totalHours.toFixed(1)}h</p>
              </Card>
              <Card className="p-5 bg-[#151528]/80 border-white/5">
                <p className="text-slate-400 text-sm mb-1">Staff Members</p>
                <p className="text-3xl font-bold text-white">{payrollReport.length}</p>
              </Card>
            </div>

            {loadingShifts ? (
              <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-[#7B3BFF] animate-spin" /></div>
            ) : payrollReport.length === 0 ? (
              <Card className="p-12 text-center bg-[#151528]/80 border-white/5">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No shifts recorded for {format(reportMonth, 'MMMM yyyy')}.</p>
                <p className="text-slate-500 text-sm mt-1">Record staff shifts in the Bookkeeping → Payroll section to generate reports.</p>
              </Card>
            ) : (
              <Card className="bg-[#151528]/80 border-white/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5">
                  <h3 className="text-white font-semibold">Monthly Payroll Report — {format(reportMonth, 'MMMM yyyy')}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        {['Employee', 'Role', 'Hours', 'Total Cost', 'Avg Rate/hr'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {payrollReport.map((r, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/2">
                          <td className="px-4 py-3 text-white font-medium">{r.name}</td>
                          <td className="px-4 py-3 text-slate-400 capitalize">{r.role}</td>
                          <td className="px-4 py-3 text-white font-mono">{r.hours.toFixed(1)}h</td>
                          <td className="px-4 py-3 text-emerald-400 font-medium">€{r.total.toFixed(2)}</td>
                          <td className="px-4 py-3 text-slate-300">€{r.hours > 0 ? (r.total / r.hours).toFixed(2) : '0.00'}/hr</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-white/10 bg-white/2">
                        <td colSpan={2} className="px-4 py-3 text-white font-semibold">TOTAL</td>
                        <td className="px-4 py-3 text-white font-mono font-semibold">{totalHours.toFixed(1)}h</td>
                        <td className="px-4 py-3 text-emerald-400 font-bold">€{totalPayroll.toFixed(2)}</td>
                        <td className="px-4 py-3 text-slate-400">—</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{editing ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-slate-400 mb-1.5 block">Employee Name</Label>
                <Input value={form.employee_name} onChange={e => setForm({ ...form, employee_name: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="Full name" />
              </div>
              <div>
                <Label className="text-slate-400 mb-1.5 block">Role</Label>
                <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {ROLES.map(r => <SelectItem key={r} value={r} className="text-white capitalize">{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-400 mb-1.5 block">Contract Type</Label>
                <Select value={form.contract_type} onValueChange={v => setForm({ ...form, contract_type: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {CONTRACT_TYPES.map(t => <SelectItem key={t.value} value={t.value} className="text-white">{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {form.contract_type === 'monthly' ? (
                <div className="col-span-2">
                  <Label className="text-slate-400 mb-1.5 block">Monthly Salary (€)</Label>
                  <Input type="number" value={form.monthly_salary} onChange={e => setForm({ ...form, monthly_salary: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="0.00" />
                </div>
              ) : (
                <div className="col-span-2">
                  <Label className="text-slate-400 mb-1.5 block">Hourly Rate (€/hr)</Label>
                  <Input type="number" value={form.hourly_rate} onChange={e => setForm({ ...form, hourly_rate: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="0.00" />
                </div>
              )}
              <div>
                <Label className="text-slate-400 mb-1.5 block">Start Date</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-slate-400 mb-1.5 block">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {['active', 'inactive', 'terminated'].map(s => <SelectItem key={s} value={s} className="text-white capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-400 mb-1.5 block">Email</Label>
                <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="email@example.com" />
              </div>
              <div>
                <Label className="text-slate-400 mb-1.5 block">Phone</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="+357..." />
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={!form.employee_name || saveMutation.isPending} className="w-full">
              {saveMutation.isPending ? 'Saving...' : editing ? 'Update Employee' : 'Add Employee'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Payroll() {
  return <BusinessProvider><PayrollContent /></BusinessProvider>;
}