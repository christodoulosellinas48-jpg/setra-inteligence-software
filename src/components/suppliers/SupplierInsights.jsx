import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBusiness } from '@/components/business/BusinessContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldCheck,
  ChevronDown, ChevronUp, BarChart2, Activity
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts';

const INFLATION_ALERT_PCT = 10; // alert if unit cost rises ≥10% vs earliest price

function computeSupplierMetrics(purchases, supplier) {
  const supplierPurchases = purchases
    .filter(p => p.supplier_name === supplier.name && p.qty > 0)
    .map(p => ({ ...p, unit_cost: p.total_cost / p.qty, date: new Date(p.date) }))
    .sort((a, b) => a.date - b.date);

  if (supplierPurchases.length === 0) return null;

  // Group by ingredient to track per-item inflation
  const byIngredient = {};
  for (const p of supplierPurchases) {
    if (!byIngredient[p.ingredient_name]) byIngredient[p.ingredient_name] = [];
    byIngredient[p.ingredient_name].push(p);
  }

  const inflationAlerts = [];
  let maxInflationPct = 0;
  const ingredientTrends = [];

  for (const [ingredient, records] of Object.entries(byIngredient)) {
    if (records.length < 2) continue;
    const firstCost = records[0].unit_cost;
    const lastCost = records[records.length - 1].unit_cost;
    const changePct = ((lastCost - firstCost) / firstCost) * 100;
    ingredientTrends.push({ ingredient, firstCost, lastCost, changePct, records });
    if (changePct > maxInflationPct) maxInflationPct = changePct;
    if (changePct >= INFLATION_ALERT_PCT) {
      inflationAlerts.push({ ingredient, changePct, firstCost, lastCost });
    }
  }

  // Monthly invoice frequency (reliability)
  const invoiceDates = supplierPurchases.map(p => p.date);
  const minDate = invoiceDates[0];
  const maxDate = invoiceDates[invoiceDates.length - 1];
  const spanMonths = Math.max(
    1,
    (maxDate.getFullYear() - minDate.getFullYear()) * 12 + (maxDate.getMonth() - minDate.getMonth()) + 1
  );
  const avgOrdersPerMonth = supplierPurchases.length / spanMonths;

  // Overall spend trend: monthly totals
  const monthlySpend = {};
  for (const p of supplierPurchases) {
    const key = `${p.date.getFullYear()}-${String(p.date.getMonth() + 1).padStart(2, '0')}`;
    monthlySpend[key] = (monthlySpend[key] || 0) + p.total_cost;
  }
  const spendTrend = Object.entries(monthlySpend)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total: Math.round(total) }));

  return {
    totalPurchases: supplierPurchases.length,
    avgOrdersPerMonth: Math.round(avgOrdersPerMonth * 10) / 10,
    inflationAlerts,
    maxInflationPct: Math.round(maxInflationPct * 10) / 10,
    ingredientTrends,
    spendTrend,
    totalSpend: supplierPurchases.reduce((s, p) => s + p.total_cost, 0),
  };
}

function InflationBadge({ pct }) {
  if (pct >= INFLATION_ALERT_PCT) return (
    <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/20 border text-xs gap-1">
      <TrendingUp className="w-3 h-3" />+{pct}%
    </Badge>
  );
  if (pct > 0) return (
    <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 border text-xs gap-1">
      <TrendingUp className="w-3 h-3" />+{pct}%
    </Badge>
  );
  if (pct < 0) return (
    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 border text-xs gap-1">
      <TrendingDown className="w-3 h-3" />{pct}%
    </Badge>
  );
  return (
    <Badge className="bg-slate-500/15 text-slate-400 border-slate-500/20 border text-xs gap-1">
      <Minus className="w-3 h-3" />Stable
    </Badge>
  );
}

function SupplierRow({ supplier, metrics, sym, expanded, onToggle }) {
  const hasAlerts = metrics.inflationAlerts.length > 0;

  return (
    <div className={`rounded-xl border transition-all duration-200 ${hasAlerts ? 'border-rose-500/30 bg-rose-500/[0.03]' : 'border-white/5 bg-[#0F0F1E]/60'}`}>
      {/* Summary row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors rounded-xl"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white text-sm">{supplier.name}</span>
            {hasAlerts && (
              <span className="flex items-center gap-1 text-xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                <AlertTriangle className="w-3 h-3" />
                {metrics.inflationAlerts.length} price alert{metrics.inflationAlerts.length !== 1 ? 's' : ''}
              </span>
            )}
            {!hasAlerts && metrics.ingredientTrends.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />Stable pricing
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 capitalize">{(supplier.category || 'other').replace(/_/g, ' ')}</p>
        </div>

        <div className="hidden sm:flex items-center gap-6 shrink-0 text-right">
          <div>
            <p className="text-xs text-slate-500">Total Spend</p>
            <p className="text-sm font-semibold text-white">{sym}{Math.round(metrics.totalSpend).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Orders/mo</p>
            <p className="text-sm font-semibold text-white">{metrics.avgOrdersPerMonth}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Max Inflation</p>
            <InflationBadge pct={metrics.maxInflationPct} />
          </div>
        </div>

        <div className="shrink-0 text-slate-500 ml-2">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-5 space-y-5 border-t border-white/5 pt-4">

          {/* Inflation alerts */}
          {metrics.inflationAlerts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Price Inflation Alerts</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {metrics.inflationAlerts.map(alert => (
                  <div key={alert.ingredient} className="flex items-center justify-between bg-rose-500/[0.07] border border-rose-500/20 rounded-lg px-3 py-2.5">
                    <div>
                      <p className="text-sm text-white font-medium">{alert.ingredient}</p>
                      <p className="text-xs text-slate-500">
                        {sym}{alert.firstCost.toFixed(2)} → {sym}{alert.lastCost.toFixed(2)} per unit
                      </p>
                    </div>
                    <InflationBadge pct={Math.round(alert.changePct * 10) / 10} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All ingredient trends */}
          {metrics.ingredientTrends.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">All Item Price Trends</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['Ingredient', 'First Price', 'Latest Price', 'Change'].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-slate-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.ingredientTrends
                      .sort((a, b) => b.changePct - a.changePct)
                      .map(t => (
                        <tr key={t.ingredient} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                          <td className="py-2 px-3 text-slate-200">{t.ingredient}</td>
                          <td className="py-2 px-3 text-slate-400">{sym}{t.firstCost.toFixed(2)}</td>
                          <td className="py-2 px-3 text-slate-400">{sym}{t.lastCost.toFixed(2)}</td>
                          <td className="py-2 px-3"><InflationBadge pct={Math.round(t.changePct * 10) / 10} /></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Spend trend chart */}
          {metrics.spendTrend.length >= 2 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Spend Trend</p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={metrics.spendTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => `${sym}${v}`} width={48} />
                  <Tooltip
                    contentStyle={{ background: '#151528', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                    formatter={v => [`${sym}${v.toLocaleString()}`, 'Spend']}
                  />
                  <Line type="monotone" dataKey="total" stroke="#7B3BFF" strokeWidth={2} dot={{ fill: '#7B3BFF', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SupplierInsights() {
  const { currentBusiness } = useBusiness();
  const [expandedId, setExpandedId] = useState(null);
  const [sortBy, setSortBy] = useState('alerts'); // 'alerts' | 'spend' | 'inflation'

  const sym = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr', AUD: '$', CAD: '$' }[currentBusiness?.currency] || '€';

  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: ['suppliers', currentBusiness?.id],
    queryFn: () => base44.entities.Supplier.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness,
  });

  const { data: purchases = [], isLoading: loadingPurchases } = useQuery({
    queryKey: ['purchases-insights', currentBusiness?.id],
    queryFn: () => base44.entities.Purchase.filter({ business_id: currentBusiness.id }, 'date', 500),
    enabled: !!currentBusiness,
  });

  const isLoading = loadingSuppliers || loadingPurchases;

  const suppliersWithMetrics = useMemo(() => {
    if (!suppliers.length) return [];
    return suppliers
      .map(s => ({ supplier: s, metrics: computeSupplierMetrics(purchases, s) }))
      .filter(({ metrics }) => metrics !== null);
  }, [suppliers, purchases]);

  const sorted = useMemo(() => {
    const arr = [...suppliersWithMetrics];
    if (sortBy === 'alerts') return arr.sort((a, b) => b.metrics.inflationAlerts.length - a.metrics.inflationAlerts.length || b.metrics.maxInflationPct - a.metrics.maxInflationPct);
    if (sortBy === 'spend')  return arr.sort((a, b) => b.metrics.totalSpend - a.metrics.totalSpend);
    if (sortBy === 'inflation') return arr.sort((a, b) => b.metrics.maxInflationPct - a.metrics.maxInflationPct);
    return arr;
  }, [suppliersWithMetrics, sortBy]);

  const totalAlerts = suppliersWithMetrics.reduce((s, { metrics }) => s + metrics.inflationAlerts.length, 0);
  const alertedSuppliers = suppliersWithMetrics.filter(({ metrics }) => metrics.inflationAlerts.length > 0).length;

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-xl bg-white/[0.03] animate-pulse" />
        ))}
      </div>
    );
  }

  if (suppliersWithMetrics.length === 0) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Card className="p-14 text-center">
          <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium mb-1">No purchase history yet</p>
          <p className="text-slate-500 text-sm">Add purchases via the Inventory module to unlock supplier price trend analysis.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500 mb-1">Suppliers Tracked</p>
          <p className="text-2xl font-bold text-white">{suppliersWithMetrics.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 mb-1">Price Alerts</p>
          <p className={`text-2xl font-bold ${totalAlerts > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{totalAlerts}</p>
          <p className="text-xs text-slate-500 mt-0.5">≥{INFLATION_ALERT_PCT}% increase</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 mb-1">Flagged Suppliers</p>
          <p className={`text-2xl font-bold ${alertedSuppliers > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{alertedSuppliers}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 mb-1">Total Purchases</p>
          <p className="text-2xl font-bold text-white">{purchases.length}</p>
        </Card>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500">Sort by:</span>
        {[
          { id: 'alerts',    label: 'Price Alerts' },
          { id: 'inflation', label: 'Highest Inflation' },
          { id: 'spend',     label: 'Total Spend' },
        ].map(opt => (
          <button
            key={opt.id}
            onClick={() => setSortBy(opt.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              sortBy === opt.id
                ? 'bg-[#7B3BFF] text-white'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Supplier rows */}
      <div className="space-y-3">
        {sorted.map(({ supplier, metrics }) => (
          <SupplierRow
            key={supplier.id}
            supplier={supplier}
            metrics={metrics}
            sym={sym}
            expanded={expandedId === supplier.id}
            onToggle={() => setExpandedId(expandedId === supplier.id ? null : supplier.id)}
          />
        ))}
        {sorted.length === 0 && (
          <Card className="p-10 text-center">
            <BarChart2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No suppliers with purchase history found.</p>
          </Card>
        )}
      </div>

      <p className="text-xs text-slate-600 pb-2">
        Price inflation is calculated per ingredient by comparing the earliest vs. latest recorded unit cost (total cost ÷ qty) for each supplier. Alerts fire at ≥{INFLATION_ALERT_PCT}% increase.
      </p>
    </div>
  );
}