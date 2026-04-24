import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BusinessProvider, useBusiness } from '@/components/business/BusinessContext';
import { LayoutGrid, TrendingUp, TrendingDown, Star, AlertTriangle, Info } from 'lucide-react';

// Quadrant definitions
const QUADRANTS = {
  star:     { label: 'Stars',        color: '#22c55e', bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-400', icon: Star,          desc: 'High margin · High volume — your best performers' },
  plow:     { label: 'Plowhorses',   color: '#3b82f6', bg: 'bg-blue-500/15 border-blue-500/30',       text: 'text-blue-400',    icon: TrendingUp,    desc: 'Low margin · High volume — popular but costly' },
  puzzle:   { label: 'Puzzles',      color: '#f59e0b', bg: 'bg-amber-500/15 border-amber-500/30',     text: 'text-amber-400',   icon: AlertTriangle, desc: 'High margin · Low volume — profitable but underordered' },
  dog:      { label: 'Dogs',         color: '#ef4444', bg: 'bg-rose-500/15 border-rose-500/30',       text: 'text-rose-400',    icon: TrendingDown,  desc: 'Low margin · Low volume — consider removing' },
};

function getQuadrant(margin, volume, medianMargin, medianVolume) {
  const highMargin = margin >= medianMargin;
  const highVolume = volume >= medianVolume;
  if (highMargin && highVolume)  return 'star';
  if (!highMargin && highVolume) return 'plow';
  if (highMargin && !highVolume) return 'puzzle';
  return 'dog';
}

function median(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function TooltipCard({ item }) {
  if (!item) return null;
  const q = QUADRANTS[item.quadrant];
  const Icon = q.icon;
  return (
    <div className="absolute z-50 w-56 p-3 rounded-xl bg-[#1a1a2e] border border-white/10 shadow-2xl pointer-events-none"
      style={{ top: '110%', left: '50%', transform: 'translateX(-50%)' }}>
      <p className="text-white font-semibold text-sm mb-1">{item.name}</p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between"><span className="text-slate-400">Category</span><span className="text-white capitalize">{item.category}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Selling Price</span><span className="text-white">€{item.sellingPrice?.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Ingredient Cost</span><span className="text-amber-400">€{item.dishCost?.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Gross Margin</span><span className={q.text}>{item.margin?.toFixed(1)}%</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Units Sold</span><span className="text-white">{item.volume}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Total Revenue</span><span className="text-white">€{item.totalRevenue?.toFixed(2)}</span></div>
      </div>
      <div className={`mt-2 flex items-center gap-1.5 px-2 py-1 rounded-lg ${q.bg}`}>
        <Icon className={`w-3 h-3 ${q.text}`} />
        <span className={`text-xs font-medium ${q.text}`}>{q.label}</span>
      </div>
    </div>
  );
}

function HeatmapBubble({ item, maxVolume, maxMargin }) {
  const [hovered, setHovered] = useState(false);
  const q = QUADRANTS[item.quadrant];

  // Normalize bubble size 12–48px based on volume
  const size = Math.max(12, Math.min(48, 12 + (item.volume / (maxVolume || 1)) * 36));

  return (
    <div
      className="absolute"
      style={{
        left: `${(item.volume / (maxVolume || 1)) * 88 + 6}%`,
        bottom: `${(item.margin / (maxMargin || 1)) * 88 + 6}%`,
        transform: 'translate(-50%, 50%)',
        zIndex: hovered ? 40 : 10,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center text-white font-bold"
        style={{
          width: size,
          height: size,
          backgroundColor: q.color,
          opacity: hovered ? 1 : 0.75,
          boxShadow: hovered ? `0 0 16px ${q.color}88` : 'none',
          fontSize: size > 28 ? 10 : 8,
        }}
        title={item.name}
      >
        {size > 24 ? item.name.slice(0, 2).toUpperCase() : ''}
      </div>
      {hovered && <TooltipCard item={item} />}
    </div>
  );
}

function MenuHeatmapContent() {
  const { currentBusiness } = useBusiness();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [periodDays, setPeriodDays] = useState('90');

  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ['items', currentBusiness?.id],
    queryFn: () => base44.entities.Item.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness,
  });

  const { data: recipes = [], isLoading: loadingRecipes } = useQuery({
    queryKey: ['recipes', currentBusiness?.id],
    queryFn: () => base44.entities.Recipe.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness,
  });

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory', currentBusiness?.id],
    queryFn: () => base44.entities.InventoryItem.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness,
  });

  const { data: sales = [], isLoading: loadingSales } = useQuery({
    queryKey: ['sales', currentBusiness?.id, periodDays],
    queryFn: async () => {
      const allSales = await base44.entities.Sale.filter({ business_id: currentBusiness.id });
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(periodDays));
      return allSales.filter(s => new Date(s.date) >= cutoff);
    },
    enabled: !!currentBusiness,
  });

  const convertToBaseUnit = (qty, fromUnit, toUnit) => {
    if (fromUnit === toUnit) return qty;
    const map = { kg: 1, g: 0.001, lb: 0.453592, oz: 0.028349, l: 1, ml: 0.001, pc: 1 };
    return qty * ((map[fromUnit] ?? 1) / (map[toUnit] ?? 1));
  };

  const getIngredientCost = (recipe) => {
    const inv = inventoryItems.find(i => i.id === recipe.inventory_item_id || i.ingredient_name?.toLowerCase() === recipe.ingredient_name?.toLowerCase());
    const unitCost = inv?.unit_cost ?? recipe.unit_cost ?? 0;
    const invUnit = inv?.unit ?? recipe.unit;
    const convertedQty = convertToBaseUnit(recipe.qty, recipe.unit, invUnit);
    return unitCost * convertedQty * (100 / (recipe.yield_pct || 100));
  };

  const getDishCost = (itemId) =>
    recipes.filter(r => r.item_id === itemId).reduce((sum, r) => sum + getIngredientCost(r), 0);

  const enrichedItems = useMemo(() => {
    const salesByItem = {};
    sales.forEach(s => {
      if (!salesByItem[s.item_id]) salesByItem[s.item_id] = { units: 0, revenue: 0 };
      salesByItem[s.item_id].units += s.units_sold || 0;
      salesByItem[s.item_id].revenue += s.net_revenue ?? ((s.units_sold || 0) * 0);
    });

    return items.map(item => {
      const dishCost = getDishCost(item.id);
      const margin = item.selling_price > 0 ? ((item.selling_price - dishCost) / item.selling_price) * 100 : 0;
      const saleData = salesByItem[item.id] || { units: 0, revenue: 0 };
      const volume = saleData.units;
      const totalRevenue = volume * (item.selling_price || 0);
      return { ...item, dishCost, margin, volume, totalRevenue, quadrant: null };
    });
  }, [items, recipes, inventoryItems, sales]);

  const filtered = useMemo(() =>
    enrichedItems.filter(i => categoryFilter === 'all' || i.category === categoryFilter),
    [enrichedItems, categoryFilter]
  );

  const medMargin = median(filtered.map(i => i.margin));
  const medVolume = median(filtered.map(i => i.volume));

  const plotItems = useMemo(() =>
    filtered.map(i => ({ ...i, quadrant: getQuadrant(i.margin, i.volume, medMargin, medVolume) })),
    [filtered, medMargin, medVolume]
  );

  const maxVolume = Math.max(...plotItems.map(i => i.volume), 1);
  const maxMargin = Math.max(...plotItems.map(i => i.margin), 1);

  const quadrantCounts = useMemo(() => {
    const counts = { star: [], plow: [], puzzle: [], dog: [] };
    plotItems.forEach(i => counts[i.quadrant]?.push(i));
    return counts;
  }, [plotItems]);

  const categories = ['all', ...new Set(items.map(i => i.category))];
  const isLoading = loadingItems || loadingRecipes || loadingSales;

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
              <LayoutGrid className="w-6 h-6 text-[#C084FC]" /> Menu Performance Heatmap
            </h1>
            <p className="text-slate-500 text-sm mt-1">Visualise which items are Stars, Plowhorses, Puzzles, or Dogs</p>
          </div>
          <div className="flex gap-3">
            <Select value={periodDays} onValueChange={setPeriodDays}>
              <SelectTrigger className="w-36 bg-[#151528] border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#151528] border-white/10">
                <SelectItem value="30" className="text-white">Last 30 days</SelectItem>
                <SelectItem value="60" className="text-white">Last 60 days</SelectItem>
                <SelectItem value="90" className="text-white">Last 90 days</SelectItem>
                <SelectItem value="180" className="text-white">Last 6 months</SelectItem>
                <SelectItem value="365" className="text-white">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-36 bg-[#151528] border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#151528] border-white/10">
                {categories.map(c => (
                  <SelectItem key={c} value={c} className="text-white capitalize">{c === 'all' ? 'All Categories' : c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quadrant Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(QUADRANTS).map(([key, q]) => {
            const Icon = q.icon;
            const group = quadrantCounts[key] || [];
            return (
              <Card key={key} className={`p-4 border ${q.bg}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${q.text}`} />
                  <span className={`font-semibold text-sm ${q.text}`}>{q.label}</span>
                  <Badge className={`ml-auto text-xs ${q.bg} ${q.text} border-0`}>{group.length}</Badge>
                </div>
                <p className="text-xs text-slate-500">{q.desc}</p>
                {group.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {group.slice(0, 3).map(i => (
                      <span key={i.id} className="text-xs text-slate-300 bg-white/5 rounded px-1.5 py-0.5 truncate max-w-[80px]">{i.name}</span>
                    ))}
                    {group.length > 3 && <span className="text-xs text-slate-500">+{group.length - 3} more</span>}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Heatmap Chart */}
        <Card className="bg-[#151528]/80 border-white/5 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base flex items-center gap-2">
              Margin vs Volume Matrix
              <span className="text-xs text-slate-500 font-normal flex items-center gap-1">
                <Info className="w-3 h-3" /> Hover bubbles for details · Bubble size = volume
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-96 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#7B3BFF] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : plotItems.length === 0 ? (
              <div className="h-96 flex flex-col items-center justify-center gap-3">
                <LayoutGrid className="w-10 h-10 text-slate-700" />
                <p className="text-slate-500 text-sm">No menu items found. Add items in Recipe Manager first.</p>
              </div>
            ) : (
              <div className="relative" style={{ height: 460 }}>
                {/* Quadrant background zones */}
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 rounded-xl overflow-hidden">
                  <div className="bg-amber-500/5 border-r border-b border-white/5 flex items-start justify-start p-3">
                    <span className="text-xs text-amber-500/50 font-medium">PUZZLES</span>
                  </div>
                  <div className="bg-emerald-500/5 border-b border-white/5 flex items-start justify-end p-3">
                    <span className="text-xs text-emerald-500/50 font-medium">STARS</span>
                  </div>
                  <div className="bg-rose-500/5 border-r border-white/5 flex items-end justify-start p-3">
                    <span className="text-xs text-rose-500/50 font-medium">DOGS</span>
                  </div>
                  <div className="bg-blue-500/5 flex items-end justify-end p-3">
                    <span className="text-xs text-blue-500/50 font-medium">PLOWHORSES</span>
                  </div>
                </div>

                {/* Axis labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 pb-1">
                  <span className="text-xs text-slate-600">Low Volume</span>
                  <span className="text-xs text-slate-500 font-medium">← Volume (Units Sold) →</span>
                  <span className="text-xs text-slate-600">High Volume</span>
                </div>
                <div className="absolute top-0 bottom-6 left-0 flex flex-col justify-between py-2 pl-1">
                  <span className="text-xs text-slate-600" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>High Margin</span>
                  <span className="text-xs text-slate-500 font-medium" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>← Margin % →</span>
                  <span className="text-xs text-slate-600" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Low Margin</span>
                </div>

                {/* Median crosshairs */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute border-l border-dashed border-white/10"
                    style={{ left: `${(medVolume / (maxVolume || 1)) * 88 + 6}%`, top: '6%', bottom: '6%' }} />
                  <div className="absolute border-b border-dashed border-white/10"
                    style={{ bottom: `${(medMargin / (maxMargin || 1)) * 88 + 6}%`, left: '6%', right: '6%' }} />
                </div>

                {/* Bubbles */}
                <div className="absolute inset-0">
                  {plotItems.map(item => (
                    <HeatmapBubble key={item.id} item={item} maxVolume={maxVolume} maxMargin={maxMargin} />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Item Table */}
        {plotItems.length > 0 && (
          <Card className="bg-[#151528]/80 border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base">Item Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['Item', 'Category', 'Price', 'Cost', 'Margin %', 'Units Sold', 'Revenue', 'Quadrant'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...plotItems].sort((a, b) => b.totalRevenue - a.totalRevenue).map(item => {
                      const q = QUADRANTS[item.quadrant];
                      const Icon = q.icon;
                      return (
                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3 text-white font-medium">{item.name}</td>
                          <td className="px-4 py-3 text-slate-400 capitalize">{item.category}</td>
                          <td className="px-4 py-3 text-slate-300">€{item.selling_price?.toFixed(2)}</td>
                          <td className="px-4 py-3 text-amber-400">€{item.dishCost?.toFixed(2)}</td>
                          <td className={`px-4 py-3 font-semibold ${item.margin >= medMargin ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {item.margin.toFixed(1)}%
                          </td>
                          <td className="px-4 py-3 text-slate-300">{item.volume}</td>
                          <td className="px-4 py-3 text-slate-300">€{item.totalRevenue.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${q.bg} ${q.text}`}>
                              <Icon className="w-3 h-3" />
                              {q.label}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function MenuHeatmap() {
  return <BusinessProvider><MenuHeatmapContent /></BusinessProvider>;
}