import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, FileSpreadsheet, Download, BarChart3, TrendingUp, Receipt, Building2, Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, subQuarters, subYears } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { calculateFinancials } from '@/components/dashboard/financialCalculations';

const REPORT_TYPES = [
  { value: 'pl', label: 'Profit & Loss', icon: TrendingUp, desc: 'Revenue, costs, and net profit breakdown' },
  { value: 'cashflow', label: 'Cash Flow Summary', icon: BarChart3, desc: 'Operating cash inflows and outflows' },
  { value: 'vat', label: 'VAT Summary', icon: Receipt, desc: 'VAT collected vs reclaimable by period' },
  { value: 'expense', label: 'Expense Analysis', icon: Building2, desc: 'Detailed cost category breakdown' },
];

const PRESETS = [
  { label: 'This Month',   fn: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: 'Last Month',   fn: () => { const d = subMonths(new Date(), 1); return { from: startOfMonth(d), to: endOfMonth(d) }; } },
  { label: 'This Quarter', fn: () => ({ from: startOfQuarter(new Date()), to: endOfQuarter(new Date()) }) },
  { label: 'Last Quarter', fn: () => { const d = subQuarters(new Date(), 1); return { from: startOfQuarter(d), to: endOfQuarter(d) }; } },
  { label: 'This Year',    fn: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
  { label: 'Last Year',    fn: () => { const d = subYears(new Date(), 1); return { from: startOfYear(d), to: endOfYear(d) }; } },
];

const COLORS = ['#7B3BFF', '#A855F7', '#C084FC', '#E879F9', '#F0ABFC', '#DDD6FE'];
const TT_STYLE = { backgroundColor: '#151528', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff' };

function PLReport({ business, calculations, dateRange }) {
  const currency = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr', AUD: '$', CAD: '$' }[business.currency] || '€';
  const totalExpenses = (business.purchases_food_bev || 0) + (business.staff_costs || 0) +
    (business.rent_fixed_costs || 0) + (business.utilities || 0) + (business.other_operating || 0);

  const rows = [
    { label: 'Revenue', value: business.monthly_revenue || 0, type: 'revenue' },
    { label: '', value: null, type: 'spacer' },
    { label: 'COST OF GOODS SOLD', value: null, type: 'header' },
    { label: 'Food & Beverage Purchases', value: business.purchases_food_bev || 0, type: 'expense' },
    { label: '', value: null, type: 'spacer' },
    { label: 'OPERATING EXPENSES', value: null, type: 'header' },
    { label: 'Staff Costs', value: business.staff_costs || 0, type: 'expense' },
    { label: 'Rent & Fixed Costs', value: business.rent_fixed_costs || 0, type: 'expense' },
    { label: 'Utilities', value: business.utilities || 0, type: 'expense' },
    { label: 'Other Operating', value: business.other_operating || 0, type: 'expense' },
    { label: '', value: null, type: 'spacer' },
    { label: 'Total Expenses', value: totalExpenses, type: 'subtotal' },
    { label: 'Net Profit (Before Tax)', value: calculations.netProfitBeforeTax, type: 'subtotal' },
    { label: `Tax (${calculations.taxRate}%)`, value: -calculations.taxAmount, type: 'expense' },
    { label: 'Net Profit After Tax', value: calculations.netProfit, type: 'total' },
  ];

  const barData = [
    { name: 'Revenue', value: business.monthly_revenue || 0 },
    { name: 'Food & Bev', value: business.purchases_food_bev || 0 },
    { name: 'Staff', value: business.staff_costs || 0 },
    { name: 'Fixed', value: business.rent_fixed_costs || 0 },
    { name: 'Utilities', value: business.utilities || 0 },
    { name: 'Other', value: business.other_operating || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* P&L Table */}
        <Card className="bg-[#151528]/80 border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-[#0B0B12]/40">
                <th className="text-left px-5 py-3 text-xs text-slate-500 font-medium uppercase">Account</th>
                <th className="text-right px-5 py-3 text-xs text-slate-500 font-medium uppercase">Amount ({currency})</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                if (row.type === 'spacer') return <tr key={i}><td colSpan={2} className="py-1" /></tr>;
                if (row.type === 'header') return (
                  <tr key={i} className="bg-[#0B0B12]/20">
                    <td colSpan={2} className="px-5 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{row.label}</td>
                  </tr>
                );
                return (
                  <tr key={i} className={`border-b border-white/5 ${row.type === 'total' ? 'bg-[#7B3BFF]/10' : ''}`}>
                    <td className={`px-5 py-3 ${row.type === 'total' ? 'font-bold text-white' : row.type === 'subtotal' ? 'font-semibold text-white' : 'text-slate-300'}`}>
                      {row.label}
                    </td>
                    <td className={`px-5 py-3 text-right font-mono ${
                      row.type === 'total' ? (row.value >= 0 ? 'font-bold text-emerald-400' : 'font-bold text-rose-400') :
                      row.type === 'revenue' ? 'text-emerald-400' :
                      row.type === 'expense' ? 'text-rose-400' : 'text-white font-semibold'
                    }`}>
                      {row.value != null ? `${row.value < 0 ? '-' : ''}${currency}${Math.abs(row.value).toLocaleString('en', { minimumFractionDigits: 2 })}` : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        {/* Bar Chart */}
        <Card className="bg-[#151528]/80 border-white/5 p-5 rounded-2xl">
          <h4 className="text-sm font-semibold text-white mb-4">Cost vs Revenue</h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => `${currency}${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={TT_STYLE} formatter={v => [`${currency}${v.toLocaleString()}`, '']} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {barData.map((_, i) => <Cell key={i} fill={i === 0 ? '#10b981' : COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Profit Margin', value: `${calculations.profitMargin.toFixed(1)}%`, status: calculations.profitMarginStatus },
          { label: 'Food Cost %', value: `${calculations.foodCostRatio.toFixed(1)}%`, status: calculations.foodCostStatus },
          { label: 'Staff Cost %', value: `${calculations.staffCostRatio.toFixed(1)}%`, status: calculations.staffCostStatus },
          { label: 'Health Score', value: `${calculations.healthScore}/100`, status: calculations.overallStatus },
        ].map(kpi => (
          <Card key={kpi.label} className="bg-[#151528]/80 border-white/5 p-4">
            <p className="text-xs text-slate-500 mb-1">{kpi.label}</p>
            <p className="text-xl font-bold text-white">{kpi.value}</p>
            <Badge className={`mt-1 text-xs capitalize ${kpi.status === 'healthy' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : kpi.status === 'warning' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30'}`}>{kpi.status}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ExpenseReport({ business }) {
  const currency = { EUR: '€', USD: '$', GBP: '£' }[business.currency] || '€';
  const categories = [
    { name: 'Food & Beverage', value: business.purchases_food_bev || 0 },
    { name: 'Staff Costs', value: business.staff_costs || 0 },
    { name: 'Rent & Fixed', value: business.rent_fixed_costs || 0 },
    { name: 'Utilities', value: business.utilities || 0 },
    { name: 'Other Operating', value: business.other_operating || 0 },
  ].filter(c => c.value > 0);

  const total = categories.reduce((s, c) => s + c.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-[#151528]/80 border-white/5 p-5 rounded-2xl">
        <h4 className="text-sm font-semibold text-white mb-4">Expense Distribution</h4>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={categories} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
              {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={TT_STYLE} formatter={v => [`${currency}${v.toLocaleString()}`, '']} />
          </PieChart>
        </ResponsiveContainer>
      </Card>
      <Card className="bg-[#151528]/80 border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-[#0B0B12]/40">
              <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase">Category</th>
              <th className="text-right px-5 py-3 text-xs text-slate-500 uppercase">Amount</th>
              <th className="text-right px-5 py-3 text-xs text-slate-500 uppercase">% of Total</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, i) => (
              <tr key={i} className="border-b border-white/5">
                <td className="px-5 py-3 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-300">{cat.name}</span>
                </td>
                <td className="px-5 py-3 text-right text-white font-mono">{currency}{cat.value.toLocaleString()}</td>
                <td className="px-5 py-3 text-right text-slate-400">{total > 0 ? ((cat.value / total) * 100).toFixed(1) : 0}%</td>
              </tr>
            ))}
            <tr className="bg-[#0B0B12]/40">
              <td className="px-5 py-3 font-semibold text-white">Total</td>
              <td className="px-5 py-3 text-right font-bold text-white font-mono">{currency}{total.toLocaleString()}</td>
              <td className="px-5 py-3 text-right text-slate-400">100%</td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function VATReport({ vatPeriods }) {
  if (vatPeriods.length === 0) {
    return <Card className="bg-[#151528]/80 border-white/5 p-12 text-center rounded-2xl">
      <Receipt className="w-10 h-10 text-slate-600 mx-auto mb-3" />
      <p className="text-slate-400">No VAT periods found. Create VAT periods in the VAT module first.</p>
    </Card>;
  }
  const totals = vatPeriods.reduce((acc, p) => ({ out: acc.out + (p.output_vat || 0), inp: acc.inp + (p.input_vat || 0), net: acc.net + (p.net_vat_payable || 0) }), { out: 0, inp: 0, net: 0 });

  return (
    <Card className="bg-[#151528]/80 border-white/5 rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5 bg-[#0B0B12]/40">
            {['Period', 'Status', 'Output VAT', 'Input VAT', 'Net Payable'].map(h => (
              <th key={h} className={`py-3 px-4 text-xs text-slate-500 font-medium uppercase ${h === 'Period' || h === 'Status' ? 'text-left' : 'text-right'}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {vatPeriods.map((p, i) => (
            <tr key={i} className="border-b border-white/5">
              <td className="px-4 py-3 text-slate-300">{p.period_start} → {p.period_end}</td>
              <td className="px-4 py-3">
                <Badge className={p.status === 'final' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : p.status === 'review' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-blue-500/15 text-blue-400 border-blue-500/30'} >{p.status}</Badge>
              </td>
              <td className="px-4 py-3 text-right text-rose-400 font-mono">€{(p.output_vat || 0).toFixed(2)}</td>
              <td className="px-4 py-3 text-right text-emerald-400 font-mono">€{(p.input_vat || 0).toFixed(2)}</td>
              <td className={`px-4 py-3 text-right font-mono font-semibold ${(p.net_vat_payable || 0) >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                €{Math.abs(p.net_vat_payable || 0).toFixed(2)}{(p.net_vat_payable || 0) < 0 ? ' (refund)' : ''}
              </td>
            </tr>
          ))}
          <tr className="bg-[#0B0B12]/40 font-semibold">
            <td colSpan={2} className="px-4 py-3 text-white">Totals</td>
            <td className="px-4 py-3 text-right text-rose-400 font-mono">€{totals.out.toFixed(2)}</td>
            <td className="px-4 py-3 text-right text-emerald-400 font-mono">€{totals.inp.toFixed(2)}</td>
            <td className={`px-4 py-3 text-right font-mono font-bold ${totals.net >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>€{Math.abs(totals.net).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </Card>
  );
}

export default function ReportBuilder({ business, snapshots, vatPeriods }) {
  const [reportType, setReportType] = useState('pl');
  const [dateRange, setDateRange] = useState({ from: format(startOfMonth(new Date()), 'yyyy-MM-dd'), to: format(endOfMonth(new Date()), 'yyyy-MM-dd') });
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);

  const calculations = useMemo(() => business ? calculateFinancials(business, business.industry_group) : null, [business]);
  const currency = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr', AUD: '$', CAD: '$' }[business?.currency] || '€';

  const filteredVat = vatPeriods.filter(p => {
    if (!dateRange.from || !dateRange.to) return true;
    return p.period_start >= dateRange.from && p.period_end <= dateRange.to;
  });

  const applyPreset = (preset) => {
    const { from, to } = preset.fn();
    setDateRange({ from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') });
  };

  const buildCSVRows = () => {
    if (!business || !calculations) return [];
    const header = [`${reportType.toUpperCase()} Report — ${business.name}`, '', format(new Date(), 'dd MMM yyyy')];
    const period = [`Period: ${dateRange.from} to ${dateRange.to}`];
    if (reportType === 'pl') {
      return [header, period, [], ['Account', `Amount (${currency})`],
        ['Revenue', business.monthly_revenue || 0],
        ['Food & Beverage', business.purchases_food_bev || 0],
        ['Staff Costs', business.staff_costs || 0],
        ['Rent & Fixed', business.rent_fixed_costs || 0],
        ['Utilities', business.utilities || 0],
        ['Other Operating', business.other_operating || 0],
        ['Net Profit Before Tax', calculations.netProfitBeforeTax],
        ['Tax', calculations.taxAmount],
        ['Net Profit After Tax', calculations.netProfit],
        [], ['KEY RATIOS'],
        ['Profit Margin %', calculations.profitMargin.toFixed(1)],
        ['Food Cost %', calculations.foodCostRatio.toFixed(1)],
        ['Staff Cost %', calculations.staffCostRatio.toFixed(1)],
        ['Health Score', calculations.healthScore],
      ];
    }
    if (reportType === 'vat') {
      return [header, period, [], ['Period Start', 'Period End', 'Status', 'Output VAT', 'Input VAT', 'Net Payable'],
        ...filteredVat.map(p => [p.period_start, p.period_end, p.status, p.output_vat || 0, p.input_vat || 0, p.net_vat_payable || 0])
      ];
    }
    if (reportType === 'expense') {
      return [header, period, [], ['Category', `Amount (${currency})`, '% of Total'],
        ...['Food & Bev', 'Staff', 'Fixed', 'Utilities', 'Other'].map((n, i) => {
          const vals = [business.purchases_food_bev, business.staff_costs, business.rent_fixed_costs, business.utilities, business.other_operating];
          const total = vals.reduce((s, v) => s + (v || 0), 0);
          return [n, vals[i] || 0, total > 0 ? ((vals[i] || 0) / total * 100).toFixed(1) + '%' : '0%'];
        })
      ];
    }
    return [header, period, ['Report data not available for this type in CSV']];
  };

  const exportCSV = () => {
    setExportingCsv(true);
    const rows = buildCSVRows();
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${reportType}_report_${dateRange.from}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    setExportingCsv(false);
  };

  // Excel: tab-separated values with .xls extension (compatible with Excel)
  const exportXLSX = () => {
    setExportingXlsx(true);
    const rows = buildCSVRows();
    const tsv = rows.map(r => r.join('\t')).join('\n');
    const blob = new Blob([tsv], { type: 'application/vnd.ms-excel' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${reportType}_report_${dateRange.from}.xls`;
    a.click();
    URL.revokeObjectURL(a.href);
    setExportingXlsx(false);
  };

  const exportPDF = () => {
    setExportingPdf(true);
    const rows = buildCSVRows();
    const tableRows = rows.slice(4).map(r =>
      `<tr>${r.map((c, i) => `<${i === 0 ? 'td' : 'td style="text-align:right"'}>${c}</${i === 0 ? 'td' : 'td'}>`).join('')}</tr>`
    ).join('');
    const html = `<!DOCTYPE html><html><head><title>${reportType.toUpperCase()} Report</title>
    <style>body{font-family:Arial,sans-serif;padding:40px;color:#1e293b}h1{color:#7B3BFF;margin-bottom:4px}
    p.sub{color:#64748b;font-size:13px;margin:0 0 24px}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th,td{padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px}
    th{background:#f8fafc;font-weight:600;color:#475569}
    .footer{margin-top:32px;font-size:11px;color:#94a3b8}</style></head>
    <body><h1>${REPORT_TYPES.find(r => r.value === reportType)?.label} Report</h1>
    <p class="sub">${business?.name} · Period: ${dateRange.from} to ${dateRange.to}</p>
    <table><thead><tr>${buildCSVRows()[3]?.map(h => `<th>${h}</th>`).join('') || ''}</tr></thead>
    <tbody>${tableRows}</tbody></table>
    <div class="footer">Generated by Setra Connect · ${format(new Date(), 'dd MMM yyyy HH:mm')}</div>
    </body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.onload = () => { w.print(); setExportingPdf(false); };
  };

  if (!business || !calculations) return null;

  return (
    <div className="space-y-6">
      {/* Report Type Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {REPORT_TYPES.map(rt => {
          const Icon = rt.icon;
          const active = reportType === rt.value;
          return (
            <button key={rt.value} onClick={() => setReportType(rt.value)}
              className={`p-4 rounded-xl border text-left transition-all ${active ? 'bg-[#7B3BFF]/15 border-[#7B3BFF]/50 shadow-[0_0_20px_rgba(123,59,255,0.2)]' : 'bg-[#151528]/80 border-white/5 hover:border-white/20'}`}>
              <Icon className={`w-5 h-5 mb-2 ${active ? 'text-[#C084FC]' : 'text-slate-500'}`} />
              <p className={`text-sm font-semibold ${active ? 'text-white' : 'text-slate-400'}`}>{rt.label}</p>
              <p className="text-xs text-slate-600 mt-0.5">{rt.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Date Range + Presets */}
      <Card className="bg-[#151528]/80 border-white/5 p-5 rounded-2xl">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label className="text-slate-400 text-sm mb-1.5 block">From</Label>
            <Input type="date" value={dateRange.from} onChange={e => setDateRange(r => ({ ...r, from: e.target.value }))}
              className="bg-[#0B0B12] border-white/10 text-white w-40" />
          </div>
          <div>
            <Label className="text-slate-400 text-sm mb-1.5 block">To</Label>
            <Input type="date" value={dateRange.to} onChange={e => setDateRange(r => ({ ...r, to: e.target.value }))}
              className="bg-[#0B0B12] border-white/10 text-white w-40" />
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => applyPreset(p)}
                className="px-3 py-1.5 rounded-lg bg-[#0B0B12]/60 border border-white/5 text-xs text-slate-400 hover:text-white hover:border-white/20 transition-all">
                {p.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={exportingCsv}>
              {exportingCsv ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1.5" />} CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportXLSX} disabled={exportingXlsx}>
              {exportingXlsx ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />} Excel
            </Button>
            <Button size="sm" onClick={exportPDF} disabled={exportingPdf}>
              {exportingPdf ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 mr-1.5" />} PDF
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Content */}
      {reportType === 'pl' && <PLReport business={business} calculations={calculations} dateRange={dateRange} />}
      {reportType === 'expense' && <ExpenseReport business={business} />}
      {reportType === 'vat' && <VATReport vatPeriods={filteredVat} />}
      {reportType === 'cashflow' && (
        <Card className="bg-[#151528]/80 border-white/5 p-6 rounded-2xl text-center">
          <BarChart3 className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">View the full Cash Flow forecast with 12-month projections in the <strong className="text-white">Financial Intelligence</strong> page.</p>
        </Card>
      )}
    </div>
  );
}