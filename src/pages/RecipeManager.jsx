import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { BusinessProvider, useBusiness } from '@/components/business/BusinessContext';
import { ChefHat, Plus, Trash2, Edit2, RefreshCw, DollarSign, Percent, X, Upload, TrendingUp, TrendingDown } from 'lucide-react';
import MenuImportModal from '@/components/recipes/MenuImportModal';

const CATEGORIES = ['appetizer', 'main', 'dessert', 'beverage', 'side', 'other'];
const CATEGORY_LABELS = {
  appetizer: 'Starters', main: 'Mains', dessert: 'Desserts',
  beverage: 'Drinks', side: 'Sides', other: 'Other'
};
const UNITS = ['kg', 'g', 'l', 'ml', 'pc', 'lb', 'oz'];

function FoodCostDisplay({ pct, target }) {
  if (pct === null) return null;
  const diff = target ? pct - target : null;
  const color = !target ? 'text-slate-300'
    : pct <= target ? 'text-emerald-400'
    : pct <= target + 5 ? 'text-amber-400'
    : 'text-rose-400';
  const bgColor = !target ? 'bg-[#151528]/80 border-white/5'
    : pct <= target ? 'bg-emerald-500/10 border-emerald-500/25'
    : pct <= target + 5 ? 'bg-amber-500/10 border-amber-500/25'
    : 'bg-rose-500/10 border-rose-500/25';

  return (
    <div className={`rounded-2xl border p-5 ${bgColor}`}>
      <div className="flex items-center gap-2 mb-1">
        <Percent className="w-4 h-4 text-slate-400" />
        <p className="text-slate-400 text-sm">Food Cost %</p>
        {diff !== null && diff > 0 && <TrendingUp className="w-3.5 h-3.5 text-rose-400 ml-auto" />}
        {diff !== null && diff <= 0 && <TrendingDown className="w-3.5 h-3.5 text-emerald-400 ml-auto" />}
      </div>
      <p className={`text-4xl font-bold tracking-tight ${color}`}>{pct.toFixed(1)}%</p>
      {target && (
        <p className="text-slate-500 text-xs mt-1.5">
          Target ≤{target}% {diff !== null && diff > 0 ? `· ${diff.toFixed(1)}% over` : diff !== null ? '· on target' : ''}
        </p>
      )}
    </div>
  );
}

function RecipeManagerContent() {
  const { currentBusiness, canEdit } = useBusiness();
  const qc = useQueryClient();
  const [selectedItem, setSelectedItem] = useState(null);
  const [sectionFilter, setSectionFilter] = useState('all');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [itemForm, setItemForm] = useState({ name: '', category: 'main', selling_price: '', notes: '', prep_time_min: '' });
  const [ingredientForm, setIngredientForm] = useState({ inventory_item_id: '', ingredient_name: '', qty: '', unit: 'kg', yield_pct: 100 });

  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ['items', currentBusiness?.id],
    queryFn: () => base44.entities.Item.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness
  });

  const { data: recipes = [], isLoading: loadingRecipes } = useQuery({
    queryKey: ['recipes', currentBusiness?.id],
    queryFn: () => base44.entities.Recipe.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness
  });

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory', currentBusiness?.id],
    queryFn: () => base44.entities.InventoryItem.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness
  });

  const saveItemMutation = useMutation({
    mutationFn: (data) => base44.entities.Item.create({ ...data, business_id: currentBusiness.id, selling_price: parseFloat(data.selling_price) || 0 }),
    onSuccess: () => { qc.invalidateQueries(['items', currentBusiness?.id]); setShowItemModal(false); setItemForm({ name: '', category: 'main', selling_price: '', notes: '', prep_time_min: '' }); }
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (importedItems) => {
      for (const item of importedItems) {
        await base44.entities.Item.create({
          business_id: currentBusiness.id,
          name: item.name,
          category: item.category || 'main',
          selling_price: parseFloat(item.selling_price) || 0,
          active: true
        });
      }
    },
    onSuccess: () => qc.invalidateQueries(['items', currentBusiness?.id])
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId) => {
      const toDelete = recipes.filter(r => r.item_id === itemId);
      for (const r of toDelete) await base44.entities.Recipe.delete(r.id);
      await base44.entities.Item.delete(itemId);
    },
    onSuccess: () => {
      qc.invalidateQueries(['items', currentBusiness?.id]);
      qc.invalidateQueries(['recipes', currentBusiness?.id]);
      setSelectedItem(prev => prev?.id ? null : prev);
    }
  });

  const saveIngredientMutation = useMutation({
    mutationFn: (data) => editingIngredient
      ? base44.entities.Recipe.update(editingIngredient.id, data)
      : base44.entities.Recipe.create(data),
    onSuccess: () => {
      qc.invalidateQueries(['recipes', currentBusiness?.id]);
      setShowIngredientModal(false);
      setEditingIngredient(null);
      setIngredientForm({ inventory_item_id: '', ingredient_name: '', qty: '', unit: 'kg', yield_pct: 100 });
    }
  });

  const deleteIngredientMutation = useMutation({
    mutationFn: (id) => base44.entities.Recipe.delete(id),
    onSettled: () => qc.invalidateQueries(['recipes', currentBusiness?.id])
  });

  const convertToBaseUnit = (qty, fromUnit, toUnit) => {
    if (fromUnit === toUnit) return qty;
    const toKgOrL = { kg: 1, g: 0.001, lb: 0.453592, oz: 0.028349, l: 1, ml: 0.001, pc: 1 };
    const fromFactor = toKgOrL[fromUnit] ?? 1;
    const toFactor = toKgOrL[toUnit] ?? 1;
    return qty * (fromFactor / toFactor);
  };

  const getIngredientCost = (recipe) => {
    const invItem = inventoryItems.find(i => i.id === recipe.inventory_item_id || i.ingredient_name?.toLowerCase() === recipe.ingredient_name?.toLowerCase());
    const unitCost = invItem?.unit_cost ?? recipe.unit_cost ?? 0;
    const invUnit = invItem?.unit ?? recipe.unit;
    const convertedQty = convertToBaseUnit(recipe.qty, recipe.unit, invUnit);
    const effectiveQty = convertedQty * (100 / (recipe.yield_pct || 100));
    return unitCost * effectiveQty;
  };

  const getDishCost = (itemId) => recipes.filter(r => r.item_id === itemId).reduce((sum, r) => sum + getIngredientCost(r), 0);

  const getDishFoodCostPct = (item) => {
    if (!item.selling_price || item.selling_price === 0) return null;
    return (getDishCost(item.id) / item.selling_price) * 100;
  };

  // Section counts
  const sectionCounts = useMemo(() => {
    const counts = { all: items.length };
    CATEGORIES.forEach(cat => {
      counts[cat] = items.filter(i => i.category === cat).length;
    });
    return counts;
  }, [items]);

  const filteredItems = sectionFilter === 'all' ? items : items.filter(i => i.category === sectionFilter);

  const openAddIngredient = () => {
    setEditingIngredient(null);
    setIngredientForm({ inventory_item_id: '', ingredient_name: '', qty: '', unit: 'kg', yield_pct: 100 });
    setShowIngredientModal(true);
  };

  const openEditIngredient = (r) => {
    setEditingIngredient(r);
    setIngredientForm({ inventory_item_id: r.inventory_item_id || '', ingredient_name: r.ingredient_name, qty: r.qty, unit: r.unit, yield_pct: r.yield_pct || 100 });
    setShowIngredientModal(true);
  };

  const handleIngredientInventorySelect = (invItemId) => {
    const inv = inventoryItems.find(i => i.id === invItemId);
    setIngredientForm(f => ({ ...f, inventory_item_id: invItemId, ingredient_name: inv?.ingredient_name || '', unit: inv?.unit || 'kg' }));
  };

  const handleSaveIngredient = () => {
    const inv = inventoryItems.find(i => i.id === ingredientForm.inventory_item_id);
    saveIngredientMutation.mutate({
      business_id: currentBusiness.id,
      item_id: selectedItem.id,
      ingredient_name: ingredientForm.ingredient_name,
      inventory_item_id: ingredientForm.inventory_item_id || null,
      qty: parseFloat(ingredientForm.qty) || 0,
      unit: ingredientForm.unit,
      unit_cost: inv?.unit_cost || 0,
      yield_pct: parseFloat(ingredientForm.yield_pct) || 100,
      last_updated: new Date().toISOString().split('T')[0]
    });
  };

  const selectedRecipes = selectedItem ? recipes.filter(r => r.item_id === selectedItem.id) : [];
  const dishCost = selectedItem ? getDishCost(selectedItem.id) : 0;
  const foodCostPct = selectedItem ? getDishFoodCostPct(selectedItem) : null;
  const contributionMargin = selectedItem && foodCostPct !== null ? selectedItem.selling_price - dishCost : null;
  const targetFcp = currentBusiness?.target_food_cost_pct || null;

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
              <ChefHat className="w-6 h-6 text-[#C084FC]" /> Recipe Manager
            </h1>
            <p className="text-slate-500 text-sm mt-1">Link inventory ingredients to menu items and track food cost %</p>
          </div>
          {canEdit() && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowImportModal(true)} className="gap-2">
                <Upload className="w-4 h-4" /> Import Menu
              </Button>
              <Button onClick={() => setShowItemModal(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Menu Item
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Menu Items List */}
          <div className="space-y-3">
            {/* Section filter pills */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSectionFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${sectionFilter === 'all' ? 'bg-[#7B3BFF] text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
              >
                All ({sectionCounts.all})
              </button>
              {CATEGORIES.filter(c => sectionCounts[c] > 0).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSectionFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${sectionFilter === cat ? 'bg-[#7B3BFF] text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                >
                  {CATEGORY_LABELS[cat]} ({sectionCounts[cat]})
                </button>
              ))}
            </div>

            <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider px-1">
              Menu Items ({filteredItems.length})
            </h2>

            {loadingItems ? (
              <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 text-[#7B3BFF] animate-spin" /></div>
            ) : filteredItems.length === 0 ? (
              <Card className="p-6 text-center bg-[#151528]/80 border-white/5">
                <ChefHat className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">
                  {items.length === 0 ? 'No menu items yet. Import your menu or add items one by one.' : 'No items in this section.'}
                </p>
                {items.length === 0 && canEdit() && (
                  <Button size="sm" className="mt-3" onClick={() => setShowImportModal(true)}>
                    <Upload className="w-3.5 h-3.5 mr-1.5" /> Import Menu
                  </Button>
                )}
              </Card>
            ) : (
              filteredItems.map(item => {
                const fcp = getDishFoodCostPct(item);
                const fcpC = fcp === null ? 'text-slate-500'
                  : !targetFcp ? 'text-slate-400'
                  : fcp <= targetFcp ? 'text-emerald-400'
                  : fcp <= targetFcp + 5 ? 'text-amber-400'
                  : 'text-rose-400';
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedItem?.id === item.id ? 'bg-[#7B3BFF]/15 border-[#7B3BFF]/50' : 'bg-[#151528]/60 border-white/5 hover:border-white/15'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{item.name}</p>
                        <p className="text-slate-500 text-xs capitalize mt-0.5">{CATEGORY_LABELS[item.category] || item.category}</p>
                      </div>
                      <div className="text-right ml-2 shrink-0">
                        <p className="text-white text-sm">€{item.selling_price?.toFixed(2)}</p>
                        {fcp !== null && (
                          <p className={`text-xs font-semibold ${fcpC}`}>{fcp.toFixed(1)}% FC</p>
                        )}
                      </div>
                    </div>
                    {canEdit() && (
                      <button
                        onClick={e => { e.stopPropagation(); deleteItemMutation.mutate(item.id); }}
                        className="mt-2 text-xs text-slate-700 hover:text-rose-400 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Recipe Detail */}
          <div className="lg:col-span-2 space-y-4">
            {!selectedItem ? (
              <Card className="p-12 text-center bg-[#151528]/80 border-white/5 flex flex-col items-center justify-center min-h-64">
                <ChefHat className="w-12 h-12 text-slate-700 mb-3" />
                <p className="text-slate-400">Select a menu item to view its recipe</p>
              </Card>
            ) : (
              <>
                {/* Dish name + category */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedItem.name}</h2>
                    <p className="text-slate-500 text-sm capitalize">{CATEGORY_LABELS[selectedItem.category]}</p>
                  </div>
                </div>

                {/* 4-metric summary — food cost % is the hero */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card className="p-4 bg-[#151528]/80 border-white/5">
                    <p className="text-slate-400 text-xs mb-1">Sell Price</p>
                    <p className="text-2xl font-bold text-white">€{selectedItem.selling_price?.toFixed(2)}</p>
                  </Card>
                  <Card className="p-4 bg-[#151528]/80 border-white/5">
                    <div className="flex items-center gap-1 mb-1">
                      <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                      <p className="text-slate-400 text-xs">Ingredient Cost</p>
                    </div>
                    <p className="text-2xl font-bold text-amber-400">€{dishCost.toFixed(2)}</p>
                  </Card>
                  {/* Hero metric — food cost % */}
                  <FoodCostDisplay pct={foodCostPct} target={selectedItem.ideal_food_cost_pct || targetFcp} />
                  <Card className={`p-4 border ${contributionMargin === null ? 'bg-[#151528]/80 border-white/5' : contributionMargin >= 0 ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-rose-500/8 border-rose-500/20'}`}>
                    <p className="text-slate-400 text-xs mb-1">Contribution</p>
                    <p className={`text-2xl font-bold ${contributionMargin === null ? 'text-slate-400' : contributionMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {contributionMargin !== null ? `€${contributionMargin.toFixed(2)}` : 'N/A'}
                    </p>
                  </Card>
                </div>

                {/* Ingredients table */}
                <Card className="bg-[#151528]/80 border-white/5">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                    <h3 className="text-white font-semibold">Ingredients — {selectedItem.name}</h3>
                    {canEdit() && (
                      <Button size="sm" onClick={openAddIngredient}>
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add
                      </Button>
                    )}
                  </div>
                  {selectedRecipes.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-slate-500 text-sm">No ingredients linked yet.</p>
                      <p className="text-slate-600 text-xs mt-1">Add ingredients to calculate food cost. Link to Inventory for live pricing.</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/5 bg-[#0B0B12]/30">
                          {['Ingredient', 'Qty', 'Yield %', 'Unit Cost', 'Line Cost', ''].map(h => (
                            <th key={h} className="text-left px-4 py-2.5 text-xs text-slate-500 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRecipes.map(r => {
                          const invItem = inventoryItems.find(i => i.id === r.inventory_item_id || i.ingredient_name?.toLowerCase() === r.ingredient_name?.toLowerCase());
                          const liveUnitCost = invItem?.unit_cost ?? r.unit_cost ?? 0;
                          const lineCost = getIngredientCost(r);
                          const isLive = !!invItem;
                          return (
                            <tr key={r.id} className="border-b border-white/5 hover:bg-white/2">
                              <td className="px-4 py-3">
                                <p className="text-white text-sm">{r.ingredient_name}</p>
                                {isLive
                                  ? <p className="text-xs text-emerald-500">● live price</p>
                                  : <p className="text-xs text-slate-600">no inventory link</p>
                                }
                              </td>
                              <td className="px-4 py-3 text-slate-300 font-mono text-sm">{r.qty} {r.unit}</td>
                              <td className="px-4 py-3 text-slate-400 text-sm">{r.yield_pct || 100}%</td>
                              <td className="px-4 py-3 text-slate-300 text-sm">€{liveUnitCost.toFixed(3)}</td>
                              <td className="px-4 py-3 text-amber-400 font-medium text-sm">€{lineCost.toFixed(3)}</td>
                              <td className="px-4 py-3">
                                {canEdit() && (
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-white" onClick={() => openEditIngredient(r)}>
                                      <Edit2 className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-rose-400" onClick={() => deleteIngredientMutation.mutate(r.id)}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {/* Cost bar */}
                        {selectedRecipes.length > 0 && (
                          <tr className="border-t border-white/10 bg-[#0B0B12]/20">
                            <td colSpan={4} className="px-4 py-3 text-slate-400 text-sm font-medium">Total ingredient cost</td>
                            <td className="px-4 py-3 text-amber-400 font-bold">€{dishCost.toFixed(3)}</td>
                            <td />
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </Card>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Menu Item Modal */}
      <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
        <DialogContent className="bg-[#0F0F1E] border-white/10 max-w-md">
          <DialogHeader><DialogTitle className="text-white">Add Menu Item</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-slate-400 mb-1.5 block text-xs">Item Name *</Label>
              <Input value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} className="bg-[#151528] border-white/10 text-white" placeholder="e.g. Grilled Salmon" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400 mb-1.5 block text-xs">Section</Label>
                <Select value={itemForm.category} onValueChange={v => setItemForm({ ...itemForm, category: v })}>
                  <SelectTrigger className="bg-[#151528] border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#151528] border-white/10">
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c} className="text-white">{CATEGORY_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-400 mb-1.5 block text-xs">Selling Price (€)</Label>
                <Input type="number" value={itemForm.selling_price} onChange={e => setItemForm({ ...itemForm, selling_price: e.target.value })} className="bg-[#151528] border-white/10 text-white" placeholder="0.00" />
              </div>
            </div>
            <div>
              <Label className="text-slate-400 mb-1.5 block text-xs">Chef notes (optional)</Label>
              <Input value={itemForm.notes} onChange={e => setItemForm({ ...itemForm, notes: e.target.value })} className="bg-[#151528] border-white/10 text-white" placeholder="Prep method, plating notes..." />
            </div>
            <Button onClick={() => saveItemMutation.mutate(itemForm)} disabled={!itemForm.name || saveItemMutation.isPending} className="w-full">
              {saveItemMutation.isPending ? 'Saving...' : 'Add Item'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Ingredient Modal */}
      <Dialog open={showIngredientModal} onOpenChange={setShowIngredientModal}>
        <DialogContent className="bg-[#0F0F1E] border-white/10 max-w-md">
          <DialogHeader><DialogTitle className="text-white">{editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-slate-400 mb-1.5 block text-xs">Link from Inventory (recommended)</Label>
              <Select value={ingredientForm.inventory_item_id || ''} onValueChange={handleIngredientInventorySelect}>
                <SelectTrigger className="bg-[#151528] border-white/10 text-white"><SelectValue placeholder="Select inventory item for live pricing" /></SelectTrigger>
                <SelectContent className="bg-[#151528] border-white/10">
                  {inventoryItems.map(i => (
                    <SelectItem key={i.id} value={i.id} className="text-white text-sm">{i.ingredient_name} — €{i.unit_cost}/{i.unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-slate-600 text-xs mt-1">Linked ingredients auto-update cost when inventory prices change.</p>
            </div>
            <div>
              <Label className="text-slate-400 mb-1.5 block text-xs">Ingredient Name</Label>
              <Input value={ingredientForm.ingredient_name} onChange={e => setIngredientForm({ ...ingredientForm, ingredient_name: e.target.value })} className="bg-[#151528] border-white/10 text-white" placeholder="e.g. Salmon fillet" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label className="text-slate-400 mb-1.5 block text-xs">Quantity per portion</Label>
                <Input type="number" value={ingredientForm.qty} onChange={e => setIngredientForm({ ...ingredientForm, qty: e.target.value })} className="bg-[#151528] border-white/10 text-white" placeholder="0" />
              </div>
              <div>
                <Label className="text-slate-400 mb-1.5 block text-xs">Unit</Label>
                <Select value={ingredientForm.unit} onValueChange={v => setIngredientForm({ ...ingredientForm, unit: v })}>
                  <SelectTrigger className="bg-[#151528] border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#151528] border-white/10">
                    {UNITS.map(u => <SelectItem key={u} value={u} className="text-white">{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-slate-400 mb-1.5 block text-xs">Yield % (usable portion after prep waste)</Label>
              <Input type="number" value={ingredientForm.yield_pct} onChange={e => setIngredientForm({ ...ingredientForm, yield_pct: e.target.value })} className="bg-[#151528] border-white/10 text-white" placeholder="100" min="1" max="100" />
            </div>
            <Button onClick={handleSaveIngredient} disabled={!ingredientForm.ingredient_name || !ingredientForm.qty || saveIngredientMutation.isPending} className="w-full">
              {saveIngredientMutation.isPending ? 'Saving...' : editingIngredient ? 'Update' : 'Add Ingredient'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Import Modal */}
      <MenuImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={async (importedItems) => {
          await bulkImportMutation.mutateAsync(importedItems);
        }}
        businessId={currentBusiness?.id}
      />
    </div>
  );
}

export default function RecipeManager() {
  return <BusinessProvider><RecipeManagerContent /></BusinessProvider>;
}