import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BusinessProvider, useBusiness } from '@/components/business/BusinessContext';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';
import { Star, TrendingUp, HelpCircle, TrendingDown, RefreshCw, BarChart3, LayoutGrid, Info, AlertTriangle, ChevronRight } from 'lucide-react';

// Canonical color mapping — consistent everywhere
const QUADRANTS = {
  star:      { label: 'Stars',      icon: Star,         color: '#22c55e', bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', desc: 'High popularity & high profit — promote heavily',       action: 'Promote' },
  plowhorse: { label: 'Plowhorses', icon: TrendingUp,   color: '#f59e0b', bg: 'bg-amber-500/10 border-amber-500/30',    text: 'text-amber-400',   desc: 'High popularity but low profit — reprice or cut cost',  action: 'Reprice' },
  puzzle:    { label: 'Puzzles',    icon: HelpCircle,   color: '#3b82f6', bg: 'bg-blue-500/10 border-blue-500/30',      text: 'text-blue-400',    desc: 'Low popularity but high profit — improve visibility',   action: 'Reposition' },
  dog:       { label: 'Dogs',       icon: TrendingDown, color: '#ef4444', bg: 'bg-rose-500/10 border-rose-500/30',      text: 'text-rose-400',    desc: 'Low popularity & low profit — consider removing',       action: 'Remove' },
};

const PERIODS = [
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last 6 months', days: 180 },
  { label: 'All time', days: 9999 },
];

function getQuadrant(popScore, profScore) {
  if (popScore >= 0 && profScore >= 0) return 'star';
  if (popScore >= 0 && profScore < 0)  return 'plowhorse';
  if (popScore < 0  && profScore >= 0) return 'puzzle';
  return 'dog';
}

function median(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ── Recharts scatter view ────────────────────────────────────
const CustomDot = ({ cx, cy, payload }) => {
  const q = QUADRANTS[payload.quadrant];
  const r = Math.min(8 + payload.units * 0.3, 20);
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={q.color} fillOpacity={0.25} stroke={q.color} strokeWidth={2} />
      <text x={cx} y={cy - r - 4} textAnchor="middle" fill="white" fontSize={10}>{payload.name}</text>
    </g>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const q = QUADRANTS[d.quadrant];
  const Icon = q.icon;
  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-3 shadow-xl text-sm">
      <p className="text-white font-semibold mb-2">{d.name}</p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-4"><span className="text-slate-400">Units sold</span><span className="text-white">{d.units}</span></div>
        <div className="flex justify-between gap-4"><span className="text-slate-400">Sell price</span><span className="text-white">€{d.sellingPrice?.toFixed(2)}</span></div>
        <div className="flex justify-between gap-4"><span className="text-slate-400">Contribution</span><span className="text-emerald-400">€{d.margin?.toFixed(2)}</span></div>
        <div className="flex justify-between gap-4"><span className="text-slate-400">Food cost</span><span className="text-amber-400">{d.foodCostPct?.toFixed(1)}%</span></div>
      </div>
      <div className={`mt-2 flex items-center gap-1.5 px-2 py-1 rounded-lg ${q.bg}`}>
        <Icon className={`w-3 h-3 ${q.text}`} />
        <span className={`text-xs font-medium ${q.text}`}>{q.label} — {q.action}</span>
      </div>
    </div>
  );
};

// ── Bubble heatmap view ──────────────────────────────────────
function BubbleTooltip({ item }) {
  if (!item) return null;
  const q = QUADRANTS[item.quadrant];
  const Icon = q.icon;
  return (
    <div className="absolute z-50 w-56 p-3 rounded-xl bg-[#1a1a2e] border border-white/10 shadow-2xl pointer-events-none"
      style={{ top: '110%', left: '50%', transform: 'translateX(-50%)' }}>
      <p className="text-white font-semibold text-sm mb-1">{item.name}</p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between"><span className="text-slate-400">Price</span><span className="text-white">€{item.sellingPrice?.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Cost</span><span className="text-amber-400">€{item.ingredientCost?.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Margin</span><span className="text-emerald-400">€{item.margin?.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Units sold</span><span className="text-white">{item.units}</span></div>
      </div>
      <div className={`mt-2 flex items-center gap-1.5 px-2 py-1 rounded-lg ${q.bg}`}>
        <Icon className={`w-3 h-3 ${q.text}`} />
        <span className={`text-xs font-medium ${q.text}`}>{q.label} — {q.action}</span>
      </div>
    </div>
  );
}

function BubbleItem({ item, maxUnits, maxMarginAbs }) {
  const [hovered, setHovered] = useState(false);
  const q = QUADRANTS[item.quadrant];
  const size = Math.max(14, Math.min(52, 14 + (item.units / (maxUnits || 1)) * 38));
  // position: x=units (0=left), y=margin (0=bottom)
  const marginNorm = (item.margin + maxMarginAbs) / (2 * maxMarginAbs || 1);
  return (
    <div
      className="absolute"
      style={{
        left: `${(item.units / (maxUnits || 1)) * 86 + 7}%`,
        bottom: `${marginNorm * 86 + 7}%`,
        transform: 'translate(-50%, 50%)',
        zIndex: hovered ? 40 : 10,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center text-white font-bold select-none"
        style={{
          width: size, height: size,
          backgroundColor: q.color,
          opacity: hovered ? 1 : 0.72,
          boxShadow: hovered ? `0 0 18px ${q.color}88` : 'none',
          fontSize: size > 30 ? 10 : 8,
        }}
      >
        {size > 26 ? item.name.slice(0, 2).toUpperCase() : ''}
      </div>
      {hovered && <BubbleTooltip item={item} />}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────
function MenuEngineeringContent() {
  const { currentBusiness } = useBusiness();
  const [period, setPeriod] = useState(30);
  const [view, setView] = useState('matrix'); // 'matrix' | 'bubble'
  const [categoryFilter, setCategoryFilter] = useState('all');

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

  const allDishData = useMemo(() => {
    if (!items.length) return [];
    const salesByItem = {};
    filteredSales.forEach(s => {
      if (!salesByItem[s.item_id]) salesByItem[s.item_id] = 0;
      salesByItem[s.item_id] += s.units_sold || 0;
    });

    const getIngredientCost = (itemId) =>
      recipes.filter(r => r.item_id === itemId).reduce((sum, r) => {
        const inv = inventoryItems.find(i => i.id === r.inventory_item_id || i.ingredient_name?.toLowerCase() === r.ingredient_name?.toLowerCase());
        const unitCost = inv?.unit_cost ?? r.unit_cost ?? 0;
        return sum + unitCost * r.qty * (100 / (r.yield_pct || 100));
      }, 0);

    const allMapped = items.filter(i => i.active !== false).map(item => {
      const units = salesByItem[item.id] || 0;
      const ingredientCost = getIngredientCost(item.id);
      const itemRecipes = recipes.filter(r => r.item_id === item.id);
      const hasRecipe = itemRecipes.length > 0;
      const hasRealCost = ingredientCost > 0;
      const margin = (item.selling_price || 0) - ingredientCost;
      const foodCostPct = item.selling_price ? (ingredientCost / item.selling_price) * 100 : 0;
      return { id: item.id, name: item.name, category: item.category, units, margin, ingredientCost, sellingPrice: item.selling_price || 0, foodCostPct, hasRecipe, hasRealCost };
    });

    // Separate items without real cost — these must NOT enter the quadrant matrix
    const incomplete = allMapped.filter(d => !d.hasRealCost);
    const dishes = allMapped.filter(d => d.hasRealCost);

    if (!dishes.length) return { classified: [], incomplete };
    const avgUnits = dishes.reduce((s, d) => s + d.units, 0) / dishes.length;
    const avgMargin = dishes.reduce((s, d) => s + d.margin, 0) / dishes.length;

    const classified = dishes.map(d => ({
      ...d,
      popScore: d.units - avgUnits,
      profScore: d.margin - avgMargin,
      quadrant: getQuadrant(d.units - avgUnits, d.margin - avgMargin)
    }));

    return { classified, incomplete };
  }, [items, filteredSales, recipes, inventoryItems]);

  const categories = useMemo(() => ['all', ...new Set(items.map(i => i.category))], [items]);

  const { classified: allClassified = [], incomplete: allIncomplete = [] } = allDishData || {};

  const dishData = useMemo(() =>
    categoryFilter === 'all' ? allClassified : allClassified.filter(d => d.category === categoryFilter),
    [allClassified, categoryFilter]
  );

  const incompleteData = useMemo(() =>
    categoryFilter === 'all' ? allIncomplete : allIncomplete.filter(d => d.category === categoryFilter),
    [allIncomplete, categoryFilter]
  );

  const byQuadrant = useMemo(() => {
    const q = { star: [], plowhorse: [], puzzle: [], dog: [] };
    dishData.forEach(d => q[d.quadrant]?.push(d));
    return q;
  }, [dishData]);

  // Bubble chart derivations
  const maxUnits = Math.max(...dishData.map(d => d.units), 1);
  const maxMarginAbs = Math.max(...dishData.map(d => Math.abs(d.margin)), 1);

  const isLoading = li || ls;

  if (!currentBusiness) return (
    <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center">
      <p className="text-slate-400">Please select a business first.</p>
    </div>
  );

  const isEmpty = dishData.length === 0 && incompleteData.length === 0;

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-[#C084FC]" /> Menu Engineering
            </h1>
            <p className="text-slate-500 text-sm mt-1">Popularity vs. Profitability — identify what to promote, reprice, reposition, or remove</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center bg-[#151528] border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setView('matrix')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'matrix' ? 'bg-[#7B3BFF] text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <BarChart3 className="w-3.5 h-3.5" /> Matrix
              </button>
              <button
                onClick={() => setView('bubble')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'bubble' ? 'bg-[#7B3BFF] text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Heatmap
              </button>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-36 bg-[#151528] border-white/10 text-white h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#151528] border-white/10">
                {categories.map(c => (
                  <SelectItem key={c} value={c} className="text-white capitalize">{c === 'all' ? 'All Categories' : c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(period)} onValueChange={v => setPeriod(Number(v))}>
              <SelectTrigger className="w-36 bg-[#151528] border-white/10 text-white h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#151528] border-white/10">
                {PERIODS.map(p => (
                  <SelectItem key={p.days} value={String(p.days)} className="text-white">{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Incomplete items — excluded from quadrant matrix */}
        {incompleteData.length > 0 && (
          <Card className="border border-amber-500/20 bg-amber-500/5 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-amber-500/10">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-amber-300 font-semibold text-sm">Incomplete — needs recipe ({incompleteData.length})</h3>
              <span className="ml-2 text-xs text-amber-500/70">These items are excluded from the quadrant matrix until ingredient cost is set</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-500/10">
                  <th className="text-left px-5 py-2 text-amber-500/60 text-xs">Item</th>
                  <th className="text-right px-5 py-2 text-amber-500/60 text-xs">Sell Price</th>
                  <th className="text-left px-5 py-2 text-amber-500/60 text-xs">Issue</th>
                  <th className="px-5 py-2" />
                </tr>
              </thead>
              <tbody>
                {incompleteData.map(d => (
                  <tr key={d.id} className="border-b border-amber-500/5 hover:bg-amber-500/5">
                    <td className="px-5 py-2.5 text-white">{d.name}</td>
                    <td className="px-5 py-2.5 text-right text-slate-300">€{d.sellingPrice.toFixed(2)}</td>
                    <td className="px-5 py-2.5 text-amber-400 text-xs">
                      {!d.hasRecipe ? 'No recipe linked' : 'Recipe has €0 cost'}
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <a href="/Dishes" className="text-xs text-[#A855F7] hover:text-[#C084FC] flex items-center justify-end gap-0.5">
                        Link recipe <ChevronRight className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Quadrant summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(QUADRANTS).map(([key, q]) => {
            const Icon = q.icon;
            const dishes = byQuadrant[key] || [];
            return (
              <Card key={key} className={`p-4 border ${q.bg}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="w-4 h-4" style={{ color: q.color }} />
                  <span className="text-white font-medium text-sm">{q.label}</span>
                  <Badge className="ml-auto text-xs" style={{ background: q.color + '22', color: q.color, border: `1px solid ${q.color}44` }}>{dishes.length}</Badge>
                </div>
                <p className="text-slate-400 text-xs leading-snug mb-2">{q.desc}</p>
                {dishes.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {dishes.slice(0, 2).map(d => (
                      <span key={d.id} className="text-xs text-slate-300 bg-white/5 rounded px-1.5 py-0.5 truncate max-w-[90px]">{d.name}</span>
                    ))}
                    {dishes.length > 2 && <span className="text-xs text-slate-500">+{dishes.length - 2}</span>}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Chart area */}
        <Card className="bg-[#151528]/80 border-white/5 p-6">
          {view === 'matrix' ? (
            <>
              <h2 className="text-white font-semibold mb-1">Popularity vs. Contribution Margin</h2>
              <p className="text-slate-500 text-xs mb-5 flex items-center gap-1.5">
                <Info className="w-3 h-3" />
                X-axis: units sold (vs average) · Y-axis: contribution margin (vs average) · Bubble size = volume
              </p>
              {isLoading ? (
                <div className="h-80 flex items-center justify-center"><RefreshCw className="w-6 h-6 text-[#7B3BFF] animate-spin" /></div>
              ) : dishData.length === 0 ? (
                <div className="h-80 flex flex-col items-center justify-center gap-3">
                  <BarChart3 className="w-10 h-10 text-slate-700" />
                  <p className="text-slate-500 text-sm">{incompleteData.length > 0 ? 'No items with recipe cost yet — link ingredients above to enable the matrix.' : 'No menu items found. Add items in Recipe Manager first.'}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={380}>
                  <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="popScore" name="Popularity" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} label={{ value: '← Less popular   More popular →', position: 'insideBottom', offset: -16, fill: '#64748b', fontSize: 11 }} />
                    <YAxis dataKey="profScore" name="Profitability" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} label={{ value: 'Margin', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine x={0} stroke="#7B3BFF" strokeDasharray="4 4" strokeOpacity={0.5} />
                    <ReferenceLine y={0} stroke="#7B3BFF" strokeDasharray="4 4" strokeOpacity={0.5} />
                    <Scatter data={dishData} shape={<CustomDot />}>
                      {dishData.map(d => <Cell key={d.id} fill={QUADRANTS[d.quadrant].color} />)}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </>
          ) : (
            <>
              <h2 className="text-white font-semibold mb-1">Margin vs Volume Heatmap</h2>
              <p className="text-slate-500 text-xs mb-4 flex items-center gap-1.5">
                <Info className="w-3 h-3" />
                Hover bubbles for details · Bubble size = volume
              </p>
              {isLoading ? (
                <div className="h-96 flex items-center justify-center"><RefreshCw className="w-6 h-6 text-[#7B3BFF] animate-spin" /></div>
              ) : dishData.length === 0 ? (
                <div className="h-96 flex flex-col items-center justify-center gap-3">
                  <LayoutGrid className="w-10 h-10 text-slate-700" />
                  <p className="text-slate-500 text-sm">{incompleteData.length > 0 ? 'No items with recipe cost yet — link ingredients above to enable the heatmap.' : 'No menu items found. Add items in Recipe Manager first.'}</p>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden" style={{ height: 460 }}>
                  {/* Quadrant zone backgrounds */}
                  <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                    <div className="bg-blue-500/5 border-r border-b border-white/5 flex items-start justify-start p-3">
                      <span className="text-xs text-blue-500/50 font-medium">PUZZLES</span>
                    </div>
                    <div className="bg-emerald-500/5 border-b border-white/5 flex items-start justify-end p-3">
                      <span className="text-xs text-emerald-500/50 font-medium">STARS</span>
                    </div>
                    <div className="bg-rose-500/5 border-r border-white/5 flex items-end justify-start p-3">
                      <span className="text-xs text-rose-500/50 font-medium">DOGS</span>
                    </div>
                    <div className="bg-amber-500/5 flex items-end justify-end p-3">
                      <span className="text-xs text-amber-500/50 font-medium">PLOWHORSES</span>
                    </div>
                  </div>
                  {/* Axis labels */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 pb-1 pointer-events-none">
                    <span className="text-xs text-slate-600">Low Volume</span>
                    <span className="text-xs text-slate-500 font-medium">← Volume (Units Sold) →</span>
                    <span className="text-xs text-slate-600">High Volume</span>
                  </div>
                  <div className="absolute top-0 bottom-6 left-0 flex flex-col justify-between py-2 pl-1 pointer-events-none">
                    <span className="text-xs text-slate-600" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>High Margin</span>
                    <span className="text-xs text-slate-500 font-medium" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>← Margin →</span>
                    <span className="text-xs text-slate-600" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Low Margin</span>
                  </div>
                  {/* Median crosshairs */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute border-l border-dashed border-white/10" style={{ left: '50%', top: '6%', bottom: '6%' }} />
                    <div className="absolute border-b border-dashed border-white/10" style={{ bottom: '50%', left: '6%', right: '6%' }} />
                  </div>
                  {/* Bubbles */}
                  <div className="absolute inset-0">
                    {dishData.map(item => (
                      <BubbleItem key={item.id} item={item} maxUnits={maxUnits} maxMarginAbs={maxMarginAbs} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Per-quadrant breakdown tables */}
        {dishData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(QUADRANTS).map(([key, q]) => {
              const Icon = q.icon;
              const dishes = byQuadrant[key] || [];
              return (
                <Card key={key} className={`border ${q.bg} overflow-hidden`}>
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
                    <Icon className="w-4 h-4" style={{ color: q.color }} />
                    <h3 className="text-white font-semibold">{q.label}</h3>
                    <span className="text-slate-500 text-sm ml-1">({dishes.length})</span>
                    <Badge className="ml-auto text-xs px-2 py-0.5" style={{ background: q.color + '22', color: q.color, border: `1px solid ${q.color}44` }}>
                      Action: {q.action}
                    </Badge>
                  </div>
                  {dishes.length === 0 ? (
                    <p className="text-slate-600 text-sm p-5">No items in this quadrant.</p>
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
                          <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                            <td className="px-4 py-2.5 text-white">{d.name}</td>
                            <td className="px-4 py-2.5 text-right text-slate-300">{d.units}</td>
                            <td className="px-4 py-2.5 text-right text-emerald-400">€{d.margin.toFixed(2)}</td>
                            <td className={`px-4 py-2.5 text-right font-medium ${d.foodCostPct <= 28 ? 'text-emerald-400' : d.foodCostPct <= 35 ? 'text-amber-400' : 'text-rose-400'}`}>
                              {d.foodCostPct.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MenuEngineering() {
  return <BusinessProvider><MenuEngineeringContent /></BusinessProvider>;
}