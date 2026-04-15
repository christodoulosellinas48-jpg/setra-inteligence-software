import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, CheckCircle2, AlertTriangle, Building2, Calendar, Hash } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  open:   { label: 'Open',   className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  review: { label: 'Under Review', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  final:  { label: 'Final / Submitted', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
};

export default function VATReportTab({ business }) {
  const [selectedPeriodId, setSelectedPeriodId] = useState('');

  const { data: periods = [] } = useQuery({
    queryKey: ['vatPeriods', business?.id],
    queryFn: () => base44.entities.VATPeriod.filter({ business_id: business.id }, '-period_start', 20),
    enabled: !!business,
  });

  const { data: summaryLines = [] } = useQuery({
    queryKey: ['vatSummaryLines', selectedPeriodId],
    queryFn: () => base44.entities.VATSummaryLine.filter({ vat_period_id: selectedPeriodId }),
    enabled: !!selectedPeriodId,
  });

  const selectedPeriod = periods.find(p => p.id === selectedPeriodId);

  const reportRows = useMemo(() => {
    if (!selectedPeriod) return [];
    const vatRate = business?.vat_rate ?? 19;

    // If we have detailed summary lines, use them; else build from period totals
    if (summaryLines.length > 0) return summaryLines;

    // Synthetic single-line summary from period data
    return [
      {
        vat_rate_code: String(vatRate),
        direction: 'output',
        taxable_base: selectedPeriod.output_vat ? (selectedPeriod.output_vat / (vatRate / 100)) : 0,
        vat_amount: selectedPeriod.output_vat ?? 0,
      },
      {
        vat_rate_code: String(vatRate),
        direction: 'input',
        taxable_base: selectedPeriod.input_vat ? (selectedPeriod.input_vat / (vatRate / 100)) : 0,
        vat_amount: selectedPeriod.input_vat ?? 0,
      },
    ];
  }, [selectedPeriod, summaryLines, business]);

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    if (!selectedPeriod) return;
    const lines = [
      ['VAT Summary Report'],
      [`Business: ${business?.name}`],
      [`Period: ${selectedPeriod.period_start} to ${selectedPeriod.period_end}`],
      [`Filing Deadline: ${selectedPeriod.filing_deadline || '—'}`],
      [`Status: ${selectedPeriod.status}`],
      [],
      ['VAT Rate', 'Direction', 'Taxable Base (€)', 'VAT Amount (€)'],
      ...reportRows.map(r => [r.vat_rate_code + '%', r.direction, (r.taxable_base ?? 0).toFixed(2), (r.vat_amount ?? 0).toFixed(2)]),
      [],
      ['Output VAT', '', '', (selectedPeriod.output_vat ?? 0).toFixed(2)],
      ['Input VAT', '', '', (selectedPeriod.input_vat ?? 0).toFixed(2)],
      ['Net VAT Payable', '', '', (selectedPeriod.net_vat_payable ?? 0).toFixed(2)],
    ];
    const csv = lines.map(l => l.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VAT_Report_${selectedPeriod.period_start}_${selectedPeriod.period_end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-white">Summary Report</h2>
        {selectedPeriod && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <FileText className="w-4 h-4 mr-2" /> Print
            </Button>
          </div>
        )}
      </div>

      {/* Period Selector */}
      <Card className="bg-[#151528]/80 border-white/5 p-5">
        <Label className="text-slate-400 mb-2 block text-sm">Select VAT Period</Label>
        <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
          <SelectTrigger className="bg-[#0B0B12] border-white/10 text-white max-w-sm">
            <SelectValue placeholder="Choose a period..." />
          </SelectTrigger>
          <SelectContent className="bg-[#151528] border-white/10">
            {periods.map(p => (
              <SelectItem key={p.id} value={p.id} className="text-white">
                {p.period_start && format(new Date(p.period_start), 'dd MMM yyyy')} → {p.period_end && format(new Date(p.period_end), 'dd MMM yyyy')}
                {' '}({STATUS_CONFIG[p.status]?.label})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {!selectedPeriod ? (
        <Card className="bg-[#151528]/80 border-white/5 p-12 text-center">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Select a VAT period to generate its summary report.</p>
        </Card>
      ) : (
        <div id="vat-report-printable" className="space-y-5">
          {/* Report Header Card */}
          <Card className="bg-[#151528]/80 border-white/5 p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">VAT Return Summary</h3>
                <p className="text-slate-400 text-sm">For submission to tax authorities</p>
              </div>
              <Badge className={STATUS_CONFIG[selectedPeriod.status]?.className ?? ''}>
                {STATUS_CONFIG[selectedPeriod.status]?.label}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-white/5">
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-[#C084FC] mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Business</p>
                  <p className="text-white text-sm font-medium">{business?.name}</p>
                  {business?.vat_number && <p className="text-slate-400 text-xs">VAT: {business.vat_number}</p>}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-[#C084FC] mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Period</p>
                  <p className="text-white text-sm font-medium">
                    {format(new Date(selectedPeriod.period_start), 'dd MMM yyyy')} – {format(new Date(selectedPeriod.period_end), 'dd MMM yyyy')}
                  </p>
                  <p className="text-slate-400 text-xs">
                    Deadline: {selectedPeriod.filing_deadline ? format(new Date(selectedPeriod.filing_deadline), 'dd MMM yyyy') : '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Hash className="w-4 h-4 text-[#C084FC] mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">VAT Rate</p>
                  <p className="text-white text-sm font-medium">{business?.vat_rate ?? 19}%</p>
                  <p className="text-slate-400 text-xs">{business?.vat_quarter_group ? `Quarter Group: ${business.vat_quarter_group}` : 'Standard rate'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* VAT Breakdown Table */}
          <Card className="bg-[#151528]/80 border-white/5 overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <h4 className="text-sm font-semibold text-white">VAT Breakdown by Rate</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0B0B12]/40">
                    <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase tracking-wide">VAT Rate</th>
                    <th className="text-left px-5 py-3 text-xs text-slate-500 uppercase tracking-wide">Type</th>
                    <th className="text-right px-5 py-3 text-xs text-slate-500 uppercase tracking-wide">Taxable Base (€)</th>
                    <th className="text-right px-5 py-3 text-xs text-slate-500 uppercase tracking-wide">VAT Amount (€)</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((row, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="px-5 py-3 text-white">{row.vat_rate_code}%</td>
                      <td className="px-5 py-3">
                        <Badge className={row.direction === 'output' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'}>
                          {row.direction === 'output' ? 'Output (Sales)' : 'Input (Purchases)'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right text-slate-300 font-mono">
                        {(row.taxable_base ?? 0).toLocaleString('en', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`px-5 py-3 text-right font-mono font-semibold ${row.direction === 'output' ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {(row.vat_amount ?? 0).toLocaleString('en', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Summary Totals */}
          <Card className="bg-[#151528]/80 border-white/5 p-6">
            <h4 className="text-sm font-semibold text-white mb-4">Return Summary Totals</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-slate-400">Box 1 — VAT due on sales (Output VAT)</span>
                <span className="text-white font-medium font-mono">€{(selectedPeriod.output_vat ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-slate-400">Box 4 — VAT reclaimed on purchases (Input VAT)</span>
                <span className="text-emerald-400 font-medium font-mono">€{(selectedPeriod.input_vat ?? 0).toFixed(2)}</span>
              </div>
              <div className={`flex justify-between items-center py-3 px-4 rounded-xl mt-2 ${(selectedPeriod.net_vat_payable ?? 0) >= 0 ? 'bg-rose-500/10 border border-rose-500/30' : 'bg-emerald-500/10 border border-emerald-500/30'}`}>
                <span className="text-white font-semibold">Box 5 — Net VAT payable / refundable</span>
                <span className={`font-bold text-xl font-mono ${(selectedPeriod.net_vat_payable ?? 0) >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  €{Math.abs(selectedPeriod.net_vat_payable ?? 0).toFixed(2)}
                  {(selectedPeriod.net_vat_payable ?? 0) < 0 && <span className="text-sm ml-1">(refund)</span>}
                </span>
              </div>
            </div>
          </Card>

          {/* Status Notice */}
          {selectedPeriod.status === 'final' ? (
            <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <p className="text-emerald-300 text-sm">This VAT period has been marked as <strong>Final / Submitted</strong>. No further changes expected.</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <p className="text-amber-300 text-sm">This period is <strong>{STATUS_CONFIG[selectedPeriod.status]?.label}</strong>. Mark it as <em>Final</em> once submitted to the tax office.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}