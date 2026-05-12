import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBusiness } from '@/components/business/BusinessContext';
import { Users, Plus, Trash2, Edit2, FileText, RefreshCw, ChevronLeft, ChevronRight, ExternalLink, Sparkles } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import PayrollCycleWidget from '@/components/payroll/PayrollCycleWidget';
import CyprusTaxBreakdown from '@/components/payroll/CyprusTaxBreakdown';
import AddEmployeeModal from '@/components/payroll/AddEmployeeModal';
import { motion } from 'framer-motion';

const CONTRACT_TYPES = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'monthly', label: 'Monthly Salary' },
  { value: 'part_time', label: 'Part Time' }
];

const EMPTY_FORM = {
  employee_name: '', role: 'waiter', contract_type: 'monthly',
  hourly_rate: '', monthly_salary: '', start_date: '',
  email: '', phone: '', notes: '', status: 'active',
  marital_status: 'single', dependents: 0, working_pattern: 'full_time', holiday_days: 20, iban: ''
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
  const openEdit = (c) => { setEditing(c); setForm({ ...EMPTY_FORM, ...c }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); setForm(EMPTY_FORM); };

  const handleSubmit = () => {
    saveMutation.mutate({
      ...form,
      business_id: currentBusiness.id,
      hourly_rate: parseFloat(form.hourly_rate) || 0,
      monthly_salary: parseFloat(form.monthly_salary) || 0
    });
  };

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
  const totalMonthlySalaries = activeContracts.filter(c => c.contract_type === 'monthly').reduce((s, c) => s + (c.monthly_salary || 0), 0);

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
            <p className="text-slate-500 text-sm mt-1">{currentBusiness.name} · Employee contracts & payroll overview</p>
          </div>
          {tab === 'employees' && canEdit() && (
            <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> Add Employee</Button>
          )}
        </div>

        {/* Cyprus Payroll Partner Notice */}
        <div className="flex items-start gap-3 p-4 bg-blue-500/8 border border-blue-500/20 rounded-xl">
          <Sparkles className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm flex-1">
            <p className="text-slate-300 font-medium">Estimated calculations — verify with a payroll specialist</p>
            <p className="text-slate-500 mt-0.5 text-xs">
              Setra shows estimated Cyprus Social Insurance, GHS, and PAYE breakdowns to help you understand your labor costs. 
              For statutory payroll processing, Social Insurance submissions, and tax filings, use a licensed Cyprus payroll provider.
              Rates reflect 2025 law — verify before filing.
            </p>
          </div>
          <a href="https://www.sid.gov.cy" target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 flex-shrink-0 mt-0.5">
            SID Cyprus <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Payroll Cycle Widget */}
        <PayrollCycleWidget
          contracts={activeContracts}
          onRunPayroll={() => {}}
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 bg-[#151528]/80 border-white/5">
            <p className="text-slate-400 text-sm mb-1">Active Employees</p>
            <p className="text-3xl font-bold text-white">{activeContracts.length}</p>
            <p className="text-xs text-slate-600 mt-1">
              {activeContracts.filter(c => c.contract_type === 'monthly').length} salaried · {activeContracts.filter(c => c.contract_type !== 'monthly').length} hourly
            </p>
          </Card>
          <Card className="p-5 bg-[#151528]/80 border-white/5">
            <p className="text-slate-400 text-sm mb-1">Monthly Salaries</p>
            <p className="text-3xl font-bold text-emerald-400">€{totalMonthlySalaries.toLocaleString()}</p>
            <p className="text-xs text-slate-600 mt-1">Gross · employer costs are higher</p>
          </Card>
          <Card className="p-5 bg-[#151528]/80 border-white/5">
            <p className="text-slate-400 text-sm mb-1">Est. Total Employer Cost</p>
            <p className="text-3xl font-bold text-amber-400">
              €{Math.round(totalMonthlySalaries * 1.127).toLocaleString()}
            </p>
            <p className="text-xs text-slate-600 mt-1">Gross + SI + GHS + Cohesion + ITF</p>
          </Card>
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
            {loadingContracts ? (
              <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-[#7B3BFF] animate-spin" /></div>
            ) : contracts.length === 0 ? (
              <Card className="p-12 text-center bg-[#151528]/80 border-white/5">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-300 font-medium mb-1">No employees yet</p>
                <p className="text-slate-500 text-sm mb-4">Add your first employee to start tracking payroll costs and generate estimated payslips.</p>
                {canEdit() && <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" />Add Employee</Button>}
              </Card>
            ) : (
              <div className="space-y-3">
                {contracts.map((c, idx) => (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                    <Card className="bg-[#151528]/80 border-white/5 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#7B3BFF]/15 flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-[#C084FC]" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{c.employee_name}</p>
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                              <span className="text-slate-400 text-xs capitalize">{c.role}</span>
                              <Badge className="bg-[#7B3BFF]/20 text-[#C084FC] border-[#7B3BFF]/30 text-xs capitalize">
                                {CONTRACT_TYPES.find(t => t.value === c.contract_type)?.label || c.contract_type}
                              </Badge>
                              <span className="text-white text-xs font-mono">
                                {c.contract_type === 'monthly' ? `€${(c.monthly_salary || 0).toLocaleString()}/mo` : `€${c.hourly_rate}/hr`}
                              </span>
                              {c.start_date && <span className="text-slate-600 text-xs">Since {c.start_date}</span>}
                            </div>
                            {c.email && <p className="text-xs text-slate-600 mt-1">{c.email}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={c.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs' : 'bg-slate-500/20 text-slate-400 border-slate-500/30 text-xs'}>
                            {c.status}
                          </Badge>
                          {canEdit() && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => openEdit(c)} className="h-8 w-8 text-slate-400 hover:text-white">
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(c.id)} className="h-8 w-8 text-slate-400 hover:text-rose-400">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      {/* Cyprus Tax Breakdown toggle */}
                      <CyprusTaxBreakdown contract={c} />
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Report Tab */}
        {tab === 'report' && (
          <>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-5 bg-[#151528]/80 border-white/5">
                <p className="text-slate-400 text-sm mb-1">Total Payroll (shifts)</p>
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
                <p className="text-slate-300 font-medium mb-1">No shifts recorded for {format(reportMonth, 'MMMM yyyy')}</p>
                <p className="text-slate-500 text-sm">Log staff shifts in the Expenses or Operations Hub to generate payroll reports.</p>
              </Card>
            ) : (
              <Card className="bg-[#151528]/80 border-white/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5">
                  <h3 className="text-white font-semibold">Monthly Payroll Report — {format(reportMonth, 'MMMM yyyy')}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5 bg-[#0B0B12]/40">
                        {['Employee', 'Role', 'Hours', 'Gross Cost', 'Avg Rate/hr'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {payrollReport.map((r, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="px-4 py-3 text-white font-medium">{r.name}</td>
                          <td className="px-4 py-3 text-slate-400 capitalize">{r.role}</td>
                          <td className="px-4 py-3 text-white font-mono">{r.hours.toFixed(1)}h</td>
                          <td className="px-4 py-3 text-emerald-400 font-medium">€{r.total.toFixed(2)}</td>
                          <td className="px-4 py-3 text-slate-300">€{r.hours > 0 ? (r.total / r.hours).toFixed(2) : '0.00'}/hr</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-white/10 bg-white/[0.02]">
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

      <AddEmployeeModal
        open={showModal}
        onClose={closeModal}
        form={form}
        setForm={setForm}
        editing={editing}
        onSubmit={handleSubmit}
        isPending={saveMutation.isPending}
      />
    </div>
  );
}

export default function Payroll() {
  return <PayrollContent />;
}