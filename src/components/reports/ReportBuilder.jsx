import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, FileSpreadsheet, Download, BarChart3, TrendingUp, Receipt, Building2, Loader2, UtensilsCrossed, Truck, Lock } from 'lucide-react';
import MenuProfitabilityReport from './MenuProfitabilityReport';
import SupplierPerformanceReport from './SupplierPerformanceReport';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, subQuarters, subYears } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { calculateFinancials } from '@/components/dashboard/financialCalculations';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const REPORT_TYPES = [
  { value: 'pl', label: 'Profit & Loss', icon: TrendingUp, desc: 'Revenue, costs, and net profit breakdown' },
  { value: 'cashflow', label: 'Cash Flow Summary', icon: BarChart3, desc: 'Operating cash inflows and outflows' },
  { value: 'vat', label: 'VAT Summary', icon: Receipt, desc: 'VAT collected vs reclaimable by period' },
  { value: 'expense', label: 'Expense Analysis', icon: Building2, desc: 'Detailed cost category breakdown' },
  { value: 'menu_profit', label: 'Menu Profitability', icon: UtensilsCrossed, desc: 'Item-level margin from recipes & sales' },
  { value: 'supplier_perf', label: 'Supplier Performance', icon: Truck, desc: 'Delivery, cost variance & quality score' },
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

function PLReport({ business, calculations, dateRange, comparisonData }) {
  const currency = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr', AUD: '$', CAD: '$' }[business.currency] || '€';
  const totalExpenses = (business.purchases_food_bev || 0) + (business.staff_costs || 0) +
    (business.rent_fixed_costs || 0) + (business.utilities || 0) + (business.other_operating || 0);
  const compCalc = comparisonData ? calculateFinancials(comparisonData, business.industry_group) : null;
  const compTotalExpenses = comparisonData
    ? (comparisonData.purchases_food_bev || 0) + (comparisonData.staff_costs || 0) +
      (comparisonData.rent_fixed_costs || 0) + (comparisonData.utilities || 0) + (comparisonData.other_operating || 0)
    : null;

  const fmt = v => v != null ? `${v < 0 ? '-' : ''}${currency}${Math.abs(v).toLocaleString('en', { minimumFractionDigits: 2 })}` : '';
  const delta = (curr, prev) => {
    if (prev == null || curr == null) return null;
    const d = curr - prev;
    const pct = prev !== 0 ? ((d / Math.abs(prev)) * 100).toFixed(1) : null;
    return { d, pct };
  };

  const rows = [
    { label: 'Revenue', value: business.monthly_revenue || 0, comp: comparisonData?.monthly_revenue, type: 'revenue' },
    { label: '', value: null, type: 'spacer' },
    { label: 'COST OF GOODS SOLD', value: null, type: 'header' },
    { label: 'Food & Beverage Purchases', value: business.purchases_food_bev || 0, comp: comparisonData?.purchases_food_bev, type: 'expense' },
    { label: '', value: null, type: 'spacer' },
    { label: 'OPERATING EXPENSES', value: null, type: 'header' },
    { label: 'Staff Costs', value: business.staff_costs || 0, comp: comparisonData?.staff_costs, type: 'expense' },
    { label: 'Rent & Fixed Costs', value: business.rent_fixed_costs || 0, comp: comparisonData?.rent_fixed_costs, type: 'expense' },
    { label: 'Utilities', value: business.utilities || 0, comp: comparisonData?.utilities, type: 'expense' },
    { label: 'Other Operating', value: business.other_operating || 0, comp: comparisonData?.other_operating, type: 'expense' },
    { label: '', value: null, type: 'spacer' },
    { label: 'Total Expenses', value: totalExpenses, comp: compTotalExpenses, type: 'subtotal' },
    { label: 'Net Profit (Before Tax)', value: calculations.netProfitBeforeTax, comp: compCalc?.netProfitBeforeTax, type: 'subtotal' },
    { label: `Tax (${calculations.taxRate}%)`, value: -calculations.taxAmount, comp: compCalc ? -compCalc.taxAmount : null, type: 'expense' },
    { label: 'Net Profit After Tax', value: calculations.netProfit, comp: compCalc?.netProfit, type: 'total' },
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
                <th className="text-right px-5 py-3 text-xs text-slate-500 font-medium uppercase">This Period</th>
                {comparisonData && <th className="text-right px-5 py-3 text-xs text-slate-500 font-medium uppercase">{comparisonData.label}</th>}
                {comparisonData && <th className="text-right px-5 py-3 text-xs text-slate-500 font-medium uppercase">Δ</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const colSpan = comparisonData ? 4 : 2;
                if (row.type === 'spacer') return <tr key={i}><td colSpan={colSpan} className="py-1" /></tr>;
                if (row.type === 'header') return (
                  <tr key={i} className="bg-[#0B0B12]/20">
                    <td colSpan={colSpan} className="px-5 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{row.label}</td>
                  </tr>
                );
                const d = comparisonData ? delta(row.value, row.comp) : null;
                const isPositiveDelta = d ? (row.type === 'expense' ? d.d < 0 : d.d > 0) : false;
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
                      {row.value != null ? fmt(row.value) : ''}
                    </td>
                    {comparisonData && (
                      <td className="px-5 py-3 text-right font-mono text-slate-500">
                        {row.comp != null ? fmt(row.comp) : '—'}
                      </td>
                    )}
                    {comparisonData && (
                      <td className={`px-5 py-3 text-right font-mono text-xs ${d ? (isPositiveDelta ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-600'}`}>
                        {d ? `${d.d >= 0 ? '+' : ''}${fmt(d.d)}${d.pct ? ` (${d.d >= 0 ? '+' : ''}${d.pct}%)` : ''}` : '—'}
                      </td>
                    )}
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
      {(() => {
        const hasData = (business.monthly_revenue || 0) > 0;
        const kpis = hasData ? [
          { label: 'Profit Margin', value: `${calculations.profitMargin.toFixed(1)}%`, status: calculations.profitMarginStatus },
          { label: 'Food Cost %', value: `${calculations.foodCostRatio.toFixed(1)}%`, status: calculations.foodCostStatus },
          { label: 'Staff Cost %', value: `${calculations.staffCostRatio.toFixed(1)}%`, status: calculations.staffCostStatus },
          { label: 'Health Score', value: `${calculations.healthScore}/100`, status: calculations.overallStatus },
        ] : [
          { label: 'Profit Margin', value: '—' },
          { label: 'Food Cost %', value: '—' },
          { label: 'Staff Cost %', value: '—' },
          { label: 'Health Score', value: '—' },
        ];
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {kpis.map(kpi => (
              <Card key={kpi.label} className="bg-[#151528]/80 border-white/5 p-4">
                <p className="text-xs text-slate-500 mb-1">{kpi.label}</p>
                <p className={`text-xl font-bold ${hasData ? 'text-white' : 'text-slate-600'}`}>{kpi.value}</p>
                {hasData && kpi.status ? (
                  <Badge className={`mt-1 text-xs capitalize ${kpi.status === 'healthy' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : kpi.status === 'warning' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30'}`}>{kpi.status}</Badge>
                ) : hasData ? null : (
                  <p className="mt-1 text-xs text-slate-600">No data yet</p>
                )}
              </Card>
            ))}
          </div>
        );
      })()}
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
  const [compareTo, setCompareTo] = useState('none');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);

  // Check prerequisites for gated reports
  const { data: recipes = [] } = useQuery({
    queryKey: ['recipes_check', business?.id],
    queryFn: () => base44.entities.Recipe.filter({ business_id: business.id }),
    enabled: !!business?.id,
    staleTime: 5 * 60 * 1000,
  });
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers_check', business?.id],
    queryFn: () => base44.entities.Supplier.filter({ business_id: business.id }),
    enabled: !!business?.id,
    staleTime: 5 * 60 * 1000,
  });

  const lockedReports = {
    vat: !business?.vat_registered ? 'VAT registration required. Set this up in Settings → Tax & VAT.' : null,
    menu_profit: recipes.length === 0 ? 'Add recipes in Recipe Manager to enable this report.' : null,
    supplier_perf: suppliers.length === 0 ? 'Add suppliers in Vendors to enable this report.' : null,
  };

  const calculations = useMemo(() => business ? calculateFinancials(business, business.industry_group) : null, [business]);
  const currency = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr', AUD: '$', CAD: '$' }[business?.currency] || '€';

  // Build comparison period business-like object from snapshots
  const comparisonData = useMemo(() => {
    if (compareTo === 'none' || snapshots.length === 0) return null;
    // Use the most recent snapshot as a proxy for the comparison period
    const sortedSnaps = [...snapshots].sort((a, b) => b.period_start.localeCompare(a.period_start));
    // prev period = second most recent; same period last year = snapshot ~12m ago
    let snap = null;
    if (compareTo === 'prev_period') snap = sortedSnaps[1] || null;
    if (compareTo === 'last_year') {
      const targetYear = new Date(dateRange.from).getFullYear() - 1;
      snap = sortedSnaps.find(s => new Date(s.period_start).getFullYear() === targetYear) || null;
    }
    if (!snap) return null;
    return {
      monthly_revenue: snap.monthly_revenue || 0,
      purchases_food_bev: snap.purchases_food_bev || 0,
      staff_costs: snap.staff_costs || 0,
      rent_fixed_costs: snap.rent_fixed_costs || 0,
      utilities: snap.utilities || 0,
      other_operating: snap.other_operating || 0,
      net_profit: snap.net_profit || 0,
      label: `${snap.period_start}`,
    };
  }, [compareTo, snapshots, dateRange]);

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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {REPORT_TYPES.map(rt => {
          const Icon = rt.icon;
          const active = reportType === rt.value;
          const lockMsg = lockedReports[rt.value];
          const isLocked = !!lockMsg;
          return (
            <div key={rt.value} className="relative group">
              <button
                onClick={() => !isLocked && setReportType(rt.value)}
                disabled={isLocked}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  isLocked ? 'bg-[#151528]/40 border-white/5 opacity-50 cursor-not-allowed' :
                  active ? 'bg-[#7B3BFF]/15 border-[#7B3BFF]/50 shadow-[0_0_20px_rgba(123,59,255,0.2)]' :
                  'bg-[#151528]/80 border-white/5 hover:border-white/20'
                }`}>
                <div className="flex items-start justify-between mb-2">
                  <Icon className={`w-5 h-5 ${isLocked ? 'text-slate-600' : active ? 'text-[#C084FC]' : 'text-slate-500'}`} />
                  {isLocked && <Lock className="w-3.5 h-3.5 text-slate-600" />}
                </div>
                <p className={`text-sm font-semibold ${isLocked ? 'text-slate-600' : active ? 'text-white' : 'text-slate-400'}`}>{rt.label}</p>
                <p className="text-xs text-slate-600 mt-0.5">{rt.desc}</p>
              </button>
              {isLocked && (
                <div className="absolute bottom-full left-0 mb-2 w-56 bg-[#1a1a2e] border border-white/10 rounded-xl p-3 text-xs text-slate-400 shadow-xl z-10 hidden group-hover:block">
                  {lockMsg}
                </div>
              )}
            </div>
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
          <div className="flex items-end gap-3">
            <div>
              <Label className="text-slate-400 text-sm mb-1.5 block">Compare to</Label>
              <Select value={compareTo} onValueChange={setCompareTo}>
                <SelectTrigger className="bg-[#0B0B12] border-white/10 text-white w-44 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No comparison</SelectItem>
                  <SelectItem value="prev_period">Previous period</SelectItem>
                  <SelectItem value="last_year">Same period last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
      {reportType === 'pl' && <PLReport business={business} calculations={calculations} dateRange={dateRange} comparisonData={comparisonData} />}
      {reportType === 'expense' && <ExpenseReport business={business} />}
      {reportType === 'vat' && <VATReport vatPeriods={filteredVat} />}
      {reportType === 'menu_profit' && <MenuProfitabilityReport business={business} />}
      {reportType === 'supplier_perf' && <SupplierPerformanceReport business={business} />}
      {reportType === 'cashflow' && (
        <Card className="bg-[#151528]/80 border-white/5 p-6 rounded-2xl text-center">
          <BarChart3 className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">View the full Cash Flow forecast with 12-month projections in the <strong className="text-white">Financial Intelligence</strong> page.</p>
        </Card>
      )}
    </div>
  );
}