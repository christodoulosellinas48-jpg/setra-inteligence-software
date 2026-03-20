import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BusinessProvider, useBusiness } from '@/components/business/BusinessContext';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';
import { Star, TrendingUp, HelpCircle, TrendingDown, RefreshCw, BarChart3 } from 'lucide-react';

const QUADRANTS = {
  star:      { label: 'Star',      icon: Star,         color: '#22c55e', bg: 'bg-emerald-500/10 border-emerald-500/30', desc: 'High popularity & high profit — promote heavily', action: 'Promote' },
  plowhorse: { label: 'Plowhorse', icon: TrendingUp,   color: '#f59e0b', bg: 'bg-amber-500/10 border-amber-500/30',   desc: 'High popularity but low profit — reprice or reduce cost', action: 'Reprice' },
  puzzle:    { label: 'Puzzle',    icon: HelpCircle,   color: '#3b82f6', bg: 'bg-blue-500/10 border-blue-500/30',     desc: 'Low popularity but high profit — improve visibility', action: 'Reposition' },
  dog:       { label: 'Dog',       icon: TrendingDown, color: '#ef4444', bg: 'bg-rose-500/10 border-rose-500/30',     desc: 'Low popularity & low profit — consider removing', action: 'Remove' },
};

const PERIODS = [
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'All time',     days: 9999 },
];

function getQuadrant(popScore, profScore) {
  if (popScore >= 0 && profScore >= 0) return 'star';
  if (popScore >= 0 && profScore < 0)  return 'plowhorse';
  if (popScore < 0  && profScore >= 0) return 'puzzle';
  return 'dog';
}

const CustomDot = ({ cx, cy, payload }) => {
  const q = QUADRANTS[payload.quadrant];
  return (
    <g>
      <circle cx={cx} cy={cy} r={Math.min(8 + payload.units * 0.3, 20)} fill={q.color} fillOpacity={0.25} stroke={q.color} strokeWidth={2} />
      <text x={cx} y={cy - 14} textAnchor="middle" fill="white" fontSize={10}>{payload.name}</text>
    </g>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const q = QUADRANTS[d.quadrant];
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl text-sm">
      <p className="text-white font-semibold mb-1">{d.name}</p>
      <p className="text-slate-400">Units sold: <span className="text-white">{d.units}</span></p>
      <p className="text-slate-400">Contribution margin: <span className="text-emerald-400">€{d.margin.toFixed(2)}</span></p>
      <p className="text-slate-400">Food cost: <span className="text-amber-400">{d.foodCostPct.toFixed(1)}%</span></p>
      <Badge className={`mt-2 ${q.bg} text-xs`}>{q.label}</Badge>
    </div>
  );
};

function MenuEngineeringContent() {
  const { currentBusiness } = useBusiness();
  const [period, setPeriod] = useState(30);

  const { data: items = [], isLoading: li } = useQuery({
    queryKey: ['items', currentBusiness?.id],
    queryFn: () => base44.entities.Item.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness
  });

  const { data: sales = [], isLoading: ls } = useQuery({
    queryKey: ['sales', currentBusiness?.id],
    queryFn: () => base44.entities.Sale.filter({ business_id: currentBusiness.id }, '-date', 1000),
    enabled: !!currentBusiness
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ['recipes', currentBusiness?.id],
    queryFn: () => base44.entities.Recipe.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness
  });

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory', currentBusiness?.id],
    queryFn: () => base44.entities.InventoryItem.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness
  });

  const cutoff = useMemo(() => {
    if (period === 9999) return null;
    const d = new Date(); d.setDate(d.getDate() - period); return d;
  }, [period]);

  const filteredSales = useMemo(() =>
    cutoff ? sales.filter(s => new Date(s.date) >= cutoff) : sales,
    [sales, cutoff]
  );

  const dishData = useMemo(() => {
    if (!items.length) return [];

    // Aggregate sales by item
    const salesByItem = {};
    filteredSales.forEach(s => {
      if (!salesByItem[s.item_id]) salesByItem[s.item_id] = 0;
      salesByItem[s.item_id] += s.units_sold || 0;
    });

    // Calculate ingredient cost per dish
    const getIngredientCost = (itemId) => {
      const itemRecipes = recipes.filter(r => r.item_id === itemId);
      return itemRecipes.reduce((sum, r) => {
        const inv = inventoryItems.find(i => i.id === r.inventory_item_id || i.ingredient_name?.toLowerCase() === r.ingredient_name?.toLowerCase());
        const unitCost = inv?.unit_cost ?? r.unit_cost ?? 0;
        const effectiveQty = r.qty * (100 / (r.yield_pct || 100));
        return sum + unitCost * effectiveQty;
      }, 0);
    };

    const dishes = items
      .filter(item => item.active !== false)
      .map(item => {
        const units = salesByItem[item.id] || 0;
        const ingredientCost = getIngredientCost(item.id);
        const margin = (item.selling_price || 0) - ingredientCost;
        const foodCostPct = item.selling_price ? (ingredientCost / item.selling_price) * 100 : 0;
        return { id: item.id, name: item.name, category: item.category, units, margin, ingredientCost, sellingPrice: item.selling_price || 0, foodCostPct };
      });

    if (!dishes.length) return [];

    const avgUnits = dishes.reduce((s, d) => s + d.units, 0) / dishes.length;
    const avgMargin = dishes.reduce((s, d) => s + d.margin, 0) / dishes.length;

    return dishes.map(d => ({
      ...d,
      popScore: d.units - avgUnits,
      profScore: d.margin - avgMargin,
      quadrant: getQuadrant(d.units - avgUnits, d.margin - avgMargin)
    }));
  }, [items, filteredSales, recipes, inventoryItems]);

  const byQuadrant = useMemo(() => {
    const q = { star: [], plowhorse: [], puzzle: [], dog: [] };
    dishData.forEach(d => q[d.quadrant].push(d));
    return q;
  }, [dishData]);

  const isLoading = li || ls;

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
              <BarChart3 className="w-6 h-6 text-[#C084FC]" /> Menu Engineering
            </h1>
            <p className="text-slate-500 text-sm mt-1">Popularity vs. Profitability — identify stars, plowhorses, puzzles and dogs</p>
          </div>
          <Select value={String(period)} onValueChange={v => setPeriod(Number(v))}>
            <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {PERIODS.map(p => (
                <SelectItem key={p.days} value={String(p.days)} className="text-white">{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(QUADRANTS).map(([key, q]) => {
            const Icon = q.icon;
            const count = byQuadrant[key]?.length || 0;
            return (
              <Card key={key} className={`p-4 border ${q.bg}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4" style={{ color: q.color }} />
                  <span className="text-white font-medium text-sm">{q.label}</span>
                  <Badge className="ml-auto text-xs" style={{ background: q.color + '22', color: q.color, border: `1px solid ${q.color}44` }}>{count}</Badge>
                </div>
                <p className="text-slate-400 text-xs leading-snug">{q.desc}</p>
              </Card>
            );
          })}
        </div>

        {/* Scatter Chart */}
        <Card className="bg-[#151528]/80 border-white/5 p-6">
          <h2 className="text-white font-semibold mb-1">Popularity vs. Contribution Margin</h2>
          <p className="text-slate-500 text-xs mb-6">X-axis: units sold (vs average) • Y-axis: contribution margin (vs average) • Bubble size: volume</p>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center"><RefreshCw className="w-6 h-6 text-[#7B3BFF] animate-spin" /></div>
          ) : dishData.length === 0 ? (
            <div className="h-80 flex flex-col items-center justify-center gap-2">
              <BarChart3 className="w-10 h-10 text-slate-600" />
              <p className="text-slate-500">No sales data yet. Add sales records to see the matrix.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={380}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="popScore" name="Popularity" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} label={{ value: '← Less popular   More popular →', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }} />
                <YAxis dataKey="profScore" name="Profitability" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} label={{ value: 'Profit', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine x={0} stroke="#7B3BFF" strokeDasharray="4 4" strokeOpacity={0.5} />
                <ReferenceLine y={0} stroke="#7B3BFF" strokeDasharray="4 4" strokeOpacity={0.5} />
                <Scatter data={dishData} shape={<CustomDot />}>
                  {dishData.map((d, i) => (
                    <Cell key={d.id} fill={QUADRANTS[d.quadrant].color} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Item Tables by Quadrant */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(QUADRANTS).map(([key, q]) => {
            const Icon = q.icon;
            const dishes = byQuadrant[key] || [];
            return (
              <Card key={key} className={`border ${q.bg} overflow-hidden`}>
                <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
                  <Icon className="w-4 h-4" style={{ color: q.color }} />
                  <h3 className="text-white font-semibold">{q.label}s</h3>
                  <span className="text-slate-500 text-sm ml-1">({dishes.length})</span>
                  <Badge className="ml-auto text-xs px-2 py-0.5" style={{ background: q.color + '22', color: q.color, border: `1px solid ${q.color}44` }}>Action: {q.action}</Badge>
                </div>
                {dishes.length === 0 ? (
                  <p className="text-slate-500 text-sm p-5">No items in this quadrant.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left px-4 py-2 text-slate-500 text-xs">Dish</th>
                        <th className="text-right px-4 py-2 text-slate-500 text-xs">Units</th>
                        <th className="text-right px-4 py-2 text-slate-500 text-xs">Margin</th>
                        <th className="text-right px-4 py-2 text-slate-500 text-xs">FC%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dishes.sort((a, b) => b.units - a.units).map(d => (
                        <tr key={d.id} className="border-b border-white/5 hover:bg-white/2">
                          <td className="px-4 py-2.5 text-white">{d.name}</td>
                          <td className="px-4 py-2.5 text-right text-slate-300">{d.units}</td>
                          <td className="px-4 py-2.5 text-right text-emerald-400">€{d.margin.toFixed(2)}</td>
                          <td className={`px-4 py-2.5 text-right font-medium ${d.foodCostPct <= 28 ? 'text-emerald-400' : d.foodCostPct <= 35 ? 'text-amber-400' : 'text-rose-400'}`}>{d.foodCostPct.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function MenuEngineering() {
  return <BusinessProvider><MenuEngineeringContent /></BusinessProvider>;
}