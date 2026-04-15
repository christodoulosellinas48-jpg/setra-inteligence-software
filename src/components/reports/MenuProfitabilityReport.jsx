import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, UtensilsCrossed } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const TT_STYLE = { backgroundColor: '#151528', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff' };
const COLORS = ['#7B3BFF', '#A855F7', '#C084FC', '#10b981', '#f59e0b', '#ef4444'];

export default function MenuProfitabilityReport({ business }) {
  const currency = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr', AUD: '$', CAD: '$' }[business?.currency] || '€';

  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ['items', business?.id],
    queryFn: () => base44.entities.Item.filter({ business_id: business.id }),
    enabled: !!business,
  });

  const { data: recipes = [], isLoading: loadingRecipes } = useQuery({
    queryKey: ['recipes', business?.id],
    queryFn: () => base44.entities.Recipe.filter({ business_id: business.id }),
    enabled: !!business,
  });

  const { data: sales = [], isLoading: loadingSales } = useQuery({
    queryKey: ['sales', business?.id],
    queryFn: () => base44.entities.Sale.filter({ business_id: business.id }),
    enabled: !!business,
  });

  const isLoading = loadingItems || loadingRecipes || loadingSales;

  const menuData = useMemo(() => {
    if (!items.length) return [];

    return items.map(item => {
      // Calculate ingredient cost from recipes
      const itemRecipes = recipes.filter(r => r.item_id === item.id);
      const ingredientCost = itemRecipes.reduce((sum, r) => sum + ((r.qty || 0) * (r.unit_cost || 0)), 0);

      // Aggregate sales for this item
      const itemSales = sales.filter(s => s.item_id === item.id);
      const totalUnits = itemSales.reduce((sum, s) => sum + (s.units_sold || 0), 0);
      const totalRevenue = itemSales.reduce((sum, s) => {
        return sum + (s.net_revenue != null ? s.net_revenue : (s.units_sold || 0) * (item.selling_price || 0));
      }, 0);

      const totalCost = ingredientCost * totalUnits;
      const grossProfit = totalRevenue - totalCost;
      const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
      const foodCostPct = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;

      const targetFoodCost = item.ideal_food_cost_pct || business?.target_food_cost_pct || 30;
      const status = foodCostPct === 0 ? 'no-data'
        : foodCostPct <= targetFoodCost ? 'healthy'
        : foodCostPct <= targetFoodCost * 1.2 ? 'warning'
        : 'risk';

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        sellingPrice: item.selling_price || 0,
        ingredientCost,
        totalUnits,
        totalRevenue,
        totalCost,
        grossProfit,
        margin,
        foodCostPct,
        status,
      };
    }).sort((a, b) => b.grossProfit - a.grossProfit);
  }, [items, recipes, sales, business]);

  const chartData = menuData.slice(0, 10).map(d => ({ name: d.name.length > 14 ? d.name.slice(0, 14) + '…' : d.name, profit: Math.max(0, d.grossProfit), margin: parseFloat(d.margin.toFixed(1)) }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-[#7B3BFF] animate-spin" />
      </div>
    );
  }

  if (!menuData.length) {
    return (
      <Card className="bg-[#151528]/80 border-white/5 p-12 text-center rounded-2xl">
        <UtensilsCrossed className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">No menu items found. Add items in Menu Engineering and link recipes to see profitability data.</p>
      </Card>
    );
  }

  const statusBadge = (status) => {
    if (status === 'no-data') return <Badge className="bg-slate-500/15 text-slate-400 border-slate-500/30">No sales data</Badge>;
    if (status === 'healthy') return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Healthy</Badge>;
    if (status === 'warning') return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">Warning</Badge>;
    return <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30">High Cost</Badge>;
  };

  const totalRevenue = menuData.reduce((s, d) => s + d.totalRevenue, 0);
  const totalProfit = menuData.reduce((s, d) => s + d.grossProfit, 0);
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Menu Items', value: menuData.length },
          { label: 'Total Revenue', value: `${currency}${totalRevenue.toLocaleString('en', { minimumFractionDigits: 2 })}` },
          { label: 'Gross Profit', value: `${currency}${totalProfit.toLocaleString('en', { minimumFractionDigits: 2 })}` },
          { label: 'Avg Margin', value: `${avgMargin.toFixed(1)}%` },
        ].map(kpi => (
          <Card key={kpi.label} className="bg-[#151528]/80 border-white/5 p-4">
            <p className="text-xs text-slate-500 mb-1">{kpi.label}</p>
            <p className="text-xl font-bold text-white">{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* Chart */}
      {chartData.some(d => d.profit > 0) && (
        <Card className="bg-[#151528]/80 border-white/5 p-5 rounded-2xl">
          <h4 className="text-sm font-semibold text-white mb-4">Gross Profit by Item (Top 10)</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => `${currency}${v.toLocaleString()}`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={TT_STYLE} formatter={v => [`${currency}${Number(v).toLocaleString()}`, 'Gross Profit']} />
              <Bar dataKey="profit" radius={[0, 6, 6, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Detail Table */}
      <Card className="bg-[#151528]/80 border-white/5 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h4 className="text-sm font-semibold text-white">Item Profitability Breakdown</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-[#0B0B12]/40">
                {['Item', 'Category', 'Price', 'Ingredient Cost', 'Units Sold', 'Revenue', 'Gross Profit', 'Margin', 'Status'].map(h => (
                  <th key={h} className={`py-3 px-4 text-xs text-slate-500 font-medium uppercase ${h === 'Item' || h === 'Category' || h === 'Status' ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {menuData.map((item, i) => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 text-white font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-slate-400 capitalize">{item.category}</td>
                  <td className="px-4 py-3 text-right text-slate-300 font-mono">{currency}{item.sellingPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-slate-400 font-mono">{currency}{item.ingredientCost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{item.totalUnits.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-emerald-400 font-mono">{currency}{item.totalRevenue.toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                  <td className={`px-4 py-3 text-right font-mono font-semibold ${item.grossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {currency}{item.grossProfit.toLocaleString('en', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">{item.margin.toFixed(1)}%</td>
                  <td className="px-4 py-3">{statusBadge(item.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}