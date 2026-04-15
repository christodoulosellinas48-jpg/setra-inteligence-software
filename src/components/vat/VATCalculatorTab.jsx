import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, TrendingDown, FileText, Receipt } from 'lucide-react';
import { format } from 'date-fns';

export default function VATCalculatorTab({ business }) {
  const [selectedPeriodId, setSelectedPeriodId] = useState('');

  const { data: periods = [] } = useQuery({
    queryKey: ['vatPeriods', business?.id],
    queryFn: () => base44.entities.VATPeriod.filter({ business_id: business.id }, '-period_start', 20),
    enabled: !!business,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', business?.id],
    queryFn: () => base44.entities.Document.filter({ business_id: business.id }),
    enabled: !!business,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', business?.id],
    queryFn: () => base44.entities.ExpenseDocument.filter({ business_id: business.id }),
    enabled: !!business,
  });

  const selectedPeriod = periods.find(p => p.id === selectedPeriodId);

  // Filter documents within the selected period date range
  const periodDocs = useMemo(() => {
    if (!selectedPeriod) return { docs: [], exps: [] };
    const start = new Date(selectedPeriod.period_start);
    const end = new Date(selectedPeriod.period_end);

    const docs = documents.filter(d => {
      if (!d.invoice_date) return false;
      const dt = new Date(d.invoice_date);
      return dt >= start && dt <= end;
    });

    const exps = expenses.filter(e => {
      if (!e.invoice_date && !e.created_date) return false;
      const dt = new Date(e.invoice_date || e.created_date);
      return dt >= start && dt <= end;
    });

    return { docs, exps };
  }, [selectedPeriod, documents, expenses]);

  const calculations = useMemo(() => {
    const vatRate = business?.vat_rate ?? 19;

    // Output VAT: from revenue / sales (Document type invoice on sales side)
    // We use monthly_revenue as the base for output VAT calculation
    const revenue = business?.monthly_revenue ?? 0;
    const outputVatFromRevenue = revenue * (vatRate / (100 + vatRate)); // VAT-inclusive extraction

    // Input VAT: sum from expense documents
    const inputVatFromExpenses = periodDocs.exps.reduce((sum, e) => {
      if (e.vat_included && e.invoice_total) {
        return sum + (e.invoice_total * (vatRate / (100 + vatRate)));
      }
      return sum;
    }, 0);

    // Input VAT from uploaded documents (invoices/receipts)
    const inputVatFromDocs = periodDocs.docs.reduce((sum, d) => sum + (d.vat_total ?? 0), 0);

    const totalInputVat = inputVatFromExpenses + inputVatFromDocs;
    const totalOutputVat = periodDocs.docs.filter(d => d.type === 'invoice').reduce((s, d) => s + (d.vat_total ?? 0), 0) || outputVatFromRevenue;
    const netVatPayable = totalOutputVat - totalInputVat;

    return {
      vatRate,
      revenue,
      outputVat: totalOutputVat,
      inputVat: totalInputVat,
      inputFromExpenses: inputVatFromExpenses,
      inputFromDocs: inputVatFromDocs,
      netVatPayable,
      docCount: periodDocs.docs.length,
      expCount: periodDocs.exps.length,
    };
  }, [business, periodDocs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">VAT Calculator</h2>
      </div>

      {/* Period Selector */}
      <Card className="bg-[#151528]/80 border-white/5 p-5">
        <Label className="text-slate-400 mb-2 block text-sm">Select VAT Period to Calculate</Label>
        <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
          <SelectTrigger className="bg-[#0B0B12] border-white/10 text-white max-w-sm">
            <SelectValue placeholder="Choose a period..." />
          </SelectTrigger>
          <SelectContent className="bg-[#151528] border-white/10">
            {periods.map(p => (
              <SelectItem key={p.id} value={p.id} className="text-white">
                {p.period_start && format(new Date(p.period_start), 'dd MMM yyyy')} → {p.period_end && format(new Date(p.period_end), 'dd MMM yyyy')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {!selectedPeriod ? (
        <Card className="bg-[#151528]/80 border-white/5 p-12 text-center">
          <Calculator className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Select a VAT period to calculate liabilities from your uploaded data.</p>
        </Card>
      ) : (
        <>
          {/* Data Sources */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-[#151528]/80 border-white/5 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-sm font-medium text-white">Uploaded Documents</span>
              </div>
              <p className="text-3xl font-bold text-white">{calculations.docCount}</p>
              <p className="text-xs text-slate-500 mt-1">Invoices & receipts in period</p>
            </Card>
            <Card className="bg-[#151528]/80 border-white/5 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-sm font-medium text-white">Expense Documents</span>
              </div>
              <p className="text-3xl font-bold text-white">{calculations.expCount}</p>
              <p className="text-xs text-slate-500 mt-1">Expenses logged in period</p>
            </Card>
          </div>

          {/* VAT Breakdown */}
          <Card className="bg-[#151528]/80 border-white/5 p-6">
            <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#C084FC]" />
              VAT Liability Breakdown
            </h3>

            <div className="space-y-4">
              {/* Output VAT */}
              <div className="flex items-center justify-between p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-rose-400" />
                  <div>
                    <p className="text-white font-medium">Output VAT (on Sales)</p>
                    <p className="text-xs text-slate-500">VAT collected from customers</p>
                  </div>
                </div>
                <p className="text-rose-400 font-bold text-lg">€{calculations.outputVat.toFixed(2)}</p>
              </div>

              {/* Input VAT */}
              <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <TrendingDown className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-white font-medium">Input VAT (on Purchases)</p>
                    <p className="text-xs text-slate-500">
                      From expenses: €{calculations.inputFromExpenses.toFixed(2)} + Docs: €{calculations.inputFromDocs.toFixed(2)}
                    </p>
                  </div>
                </div>
                <p className="text-emerald-400 font-bold text-lg">€{calculations.inputVat.toFixed(2)}</p>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/5" />

              {/* Net */}
              <div className={`flex items-center justify-between p-5 rounded-xl border ${calculations.netVatPayable >= 0 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                <div>
                  <p className="text-white font-semibold text-base">Net VAT {calculations.netVatPayable >= 0 ? 'Payable to Tax Office' : 'Refund Due'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Output VAT − Input VAT</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-2xl ${calculations.netVatPayable >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    €{Math.abs(calculations.netVatPayable).toFixed(2)}
                  </p>
                  <Badge className={calculations.netVatPayable >= 0 ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 mt-1' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 mt-1'}>
                    {calculations.netVatPayable >= 0 ? 'Amount Due' : 'Refund'}
                  </Badge>
                </div>
              </div>

              <p className="text-xs text-slate-500 text-center">
                VAT rate: {calculations.vatRate}% • Calculated from {calculations.docCount} documents and {calculations.expCount} expenses
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}