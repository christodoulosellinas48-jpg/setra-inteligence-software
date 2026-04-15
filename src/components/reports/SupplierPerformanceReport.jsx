import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Truck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const TT_STYLE = { backgroundColor: '#151528', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff' };
const COLORS = ['#7B3BFF', '#A855F7', '#C084FC', '#10b981', '#f59e0b', '#ef4444'];

function daysBetween(d1, d2) {
  if (!d1 || !d2) return null;
  const diff = new Date(d2) - new Date(d1);
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export default function SupplierPerformanceReport({ business }) {
  const currency = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr', AUD: '$', CAD: '$' }[business?.currency] || '€';

  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: ['suppliers', business?.id],
    queryFn: () => base44.entities.Supplier.filter({ business_id: business.id }),
    enabled: !!business,
  });

  const { data: purchaseOrders = [], isLoading: loadingPOs } = useQuery({
    queryKey: ['purchaseOrders', business?.id],
    queryFn: () => base44.entities.PurchaseOrder.filter({ business_id: business.id }),
    enabled: !!business,
  });

  const { data: expenses = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ['expenses', business?.id],
    queryFn: () => base44.entities.ExpenseDocument.filter({ business_id: business.id }),
    enabled: !!business,
  });

  const isLoading = loadingSuppliers || loadingPOs || loadingExpenses;

  const supplierData = useMemo(() => {
    if (!suppliers.length) return [];

    return suppliers.map(supplier => {
      // Purchase orders for this supplier
      const pos = purchaseOrders.filter(po =>
        po.supplier_name?.toLowerCase() === supplier.name?.toLowerCase()
      );

      // Delivery time analysis (sent → received)
      const deliveries = pos
        .filter(po => po.status === 'received' && po.sent_at && po.expected_delivery)
        .map(po => {
          const sent = new Date(po.sent_at).toISOString().split('T')[0];
          const received = po.expected_delivery; // using expected_delivery as proxy for received date
          return daysBetween(sent, received);
        })
        .filter(d => d !== null && d >= 0);

      const avgDeliveryDays = deliveries.length > 0
        ? deliveries.reduce((s, d) => s + d, 0) / deliveries.length
        : null;

      // Cost variance: compare PO total_cost vs actual expense total
      const poExpenses = expenses.filter(e =>
        e.supplier_name?.toLowerCase() === supplier.name?.toLowerCase() && e.status === 'posted'
      );

      const totalPOValue = pos.reduce((s, po) => s + (po.total_cost || 0), 0);
      const totalActualSpend = poExpenses.reduce((s, e) => s + (e.invoice_total || 0), 0);
      const costVariance = totalPOValue > 0 ? ((totalActualSpend - totalPOValue) / totalPOValue) * 100 : 0;
      const totalSpend = supplier.total_spend || totalActualSpend || 0;

      // Order fulfilment rate
      const sentOrders = pos.filter(po => po.status === 'sent' || po.status === 'received').length;
      const receivedOrders = pos.filter(po => po.status === 'received').length;
      const fulfilmentRate = sentOrders > 0 ? (receivedOrders / sentOrders) * 100 : null;

      // Cancellation rate
      const cancelledOrders = pos.filter(po => po.status === 'cancelled').length;

      // Overall score (0-100)
      let score = 70; // baseline
      if (avgDeliveryDays !== null) {
        if (avgDeliveryDays <= 2) score += 15;
        else if (avgDeliveryDays <= 5) score += 5;
        else score -= 10;
      }
      if (Math.abs(costVariance) <= 2) score += 10;
      else if (Math.abs(costVariance) <= 5) score += 5;
      else score -= 10;
      if (fulfilmentRate !== null) {
        if (fulfilmentRate >= 95) score += 5;
        else if (fulfilmentRate < 80) score -= 15;
      }
      if (cancelledOrders > 0) score -= cancelledOrders * 3;
      score = Math.max(0, Math.min(100, score));

      const perfStatus = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor';

      return {
        id: supplier.id,
        name: supplier.name,
        category: supplier.category,
        totalOrders: pos.length,
        receivedOrders,
        cancelledOrders,
        fulfilmentRate,
        avgDeliveryDays,
        totalSpend,
        totalPOValue,
        totalActualSpend,
        costVariance,
        invoiceCount: supplier.invoice_count || poExpenses.length,
        score,
        perfStatus,
      };
    }).filter(s => s.totalOrders > 0 || s.totalSpend > 0)
      .sort((a, b) => b.totalSpend - a.totalSpend);
  }, [suppliers, purchaseOrders, expenses]);

  const chartData = supplierData.slice(0, 8).map(s => ({
    name: s.name.length > 12 ? s.name.slice(0, 12) + '…' : s.name,
    spend: s.totalSpend,
    score: s.score,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-[#7B3BFF] animate-spin" />
      </div>
    );
  }

  if (!supplierData.length) {
    return (
      <Card className="bg-[#151528]/80 border-white/5 p-12 text-center rounded-2xl">
        <Truck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">No supplier data found. Add suppliers and purchase orders to see performance analytics.</p>
      </Card>
    );
  }

  const perfBadge = (status) => {
    const map = {
      excellent: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      good:      'bg-blue-500/15 text-blue-400 border-blue-500/30',
      fair:      'bg-amber-500/15 text-amber-400 border-amber-500/30',
      poor:      'bg-rose-500/15 text-rose-400 border-rose-500/30',
    };
    return <Badge className={`capitalize ${map[status] || ''}`}>{status}</Badge>;
  };

  const totalSpend = supplierData.reduce((s, d) => s + d.totalSpend, 0);
  const avgScore = supplierData.length > 0 ? supplierData.reduce((s, d) => s + d.score, 0) / supplierData.length : 0;
  const topSupplier = supplierData[0];

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active Suppliers', value: supplierData.length },
          { label: 'Total Spend', value: `${currency}${totalSpend.toLocaleString('en', { minimumFractionDigits: 2 })}` },
          { label: 'Avg Performance', value: `${avgScore.toFixed(0)}/100` },
          { label: 'Top Supplier', value: topSupplier?.name || '—' },
        ].map(kpi => (
          <Card key={kpi.label} className="bg-[#151528]/80 border-white/5 p-4">
            <p className="text-xs text-slate-500 mb-1">{kpi.label}</p>
            <p className="text-xl font-bold text-white truncate">{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* Spend Chart */}
      {chartData.length > 0 && (
        <Card className="bg-[#151528]/80 border-white/5 p-5 rounded-2xl">
          <h4 className="text-sm font-semibold text-white mb-4">Spend by Supplier (Top 8)</h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => `${currency}${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={TT_STYLE} formatter={v => [`${currency}${Number(v).toLocaleString()}`, 'Total Spend']} />
              <Bar dataKey="spend" radius={[6, 6, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Detail Table */}
      <Card className="bg-[#151528]/80 border-white/5 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h4 className="text-sm font-semibold text-white">Supplier Performance Scorecard</h4>
          <p className="text-xs text-slate-500 mt-0.5">Based on purchase order history, delivery times, and cost variance</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-[#0B0B12]/40">
                {['Supplier', 'Category', 'Orders', 'Fulfilment', 'Avg Delivery', 'Total Spend', 'Cost Variance', 'Score', 'Rating'].map(h => (
                  <th key={h} className={`py-3 px-4 text-xs text-slate-500 font-medium uppercase ${['Supplier', 'Category', 'Rating'].includes(h) ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {supplierData.map((s) => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 text-white font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-slate-400 capitalize">{s.category?.replace('_', ' ') || '—'}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{s.totalOrders}</td>
                  <td className="px-4 py-3 text-right">
                    {s.fulfilmentRate !== null
                      ? <span className={s.fulfilmentRate >= 90 ? 'text-emerald-400' : s.fulfilmentRate >= 70 ? 'text-amber-400' : 'text-rose-400'}>
                          {s.fulfilmentRate.toFixed(0)}%
                        </span>
                      : <span className="text-slate-600">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s.avgDeliveryDays !== null
                      ? <span className={s.avgDeliveryDays <= 3 ? 'text-emerald-400' : s.avgDeliveryDays <= 7 ? 'text-amber-400' : 'text-rose-400'}>
                          {s.avgDeliveryDays.toFixed(1)}d
                        </span>
                      : <span className="text-slate-600">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300 font-mono">{currency}{s.totalSpend.toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {s.costVariance !== 0
                      ? <span className={Math.abs(s.costVariance) <= 5 ? 'text-emerald-400' : 'text-rose-400'}>
                          {s.costVariance > 0 ? '+' : ''}{s.costVariance.toFixed(1)}%
                        </span>
                      : <span className="text-slate-600">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${s.score >= 80 ? 'text-emerald-400' : s.score >= 60 ? 'text-blue-400' : s.score >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {s.score}
                    </span>
                  </td>
                  <td className="px-4 py-3">{perfBadge(s.perfStatus)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Scoring Legend */}
      <Card className="bg-[#151528]/80 border-white/5 p-4 rounded-2xl">
        <p className="text-xs text-slate-500 font-semibold uppercase mb-2">Scoring Methodology</p>
        <div className="flex flex-wrap gap-4 text-xs text-slate-400">
          <span>📦 <strong className="text-slate-300">Delivery speed</strong>: ≤2d (+15pts), ≤5d (+5pts), &gt;5d (−10pts)</span>
          <span>💰 <strong className="text-slate-300">Cost variance</strong>: ≤2% (+10pts), ≤5% (+5pts), &gt;5% (−10pts)</span>
          <span>✅ <strong className="text-slate-300">Fulfilment</strong>: ≥95% (+5pts), &lt;80% (−15pts)</span>
          <span>❌ <strong className="text-slate-300">Cancellations</strong>: −3pts each</span>
        </div>
      </Card>
    </div>
  );
}