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
import { ChefHat, Plus, Trash2, Edit2, RefreshCw, DollarSign, Percent, X } from 'lucide-react';

const UNITS = ['kg', 'g', 'l', 'ml', 'pc', 'lb', 'oz'];

function RecipeManagerContent() {
  const { currentBusiness, canEdit } = useBusiness();
  const qc = useQueryClient();
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [itemForm, setItemForm] = useState({ name: '', category: 'main', selling_price: '' });
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
    onSuccess: () => { qc.invalidateQueries(['items', currentBusiness?.id]); setShowItemModal(false); setItemForm({ name: '', category: 'main', selling_price: '' }); }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId) => {
      const toDelete = recipes.filter(r => r.item_id === itemId);
      for (const r of toDelete) await base44.entities.Recipe.delete(r.id);
      await base44.entities.Item.delete(itemId);
    },
    onSuccess: () => { qc.invalidateQueries(['items', currentBusiness?.id]); qc.invalidateQueries(['recipes', currentBusiness?.id]); if (selectedItem?.id === selectedItem?.id) setSelectedItem(null); }
  });

  const saveIngredientMutation = useMutation({
    mutationFn: (data) => editingIngredient
      ? base44.entities.Recipe.update(editingIngredient.id, data)
      : base44.entities.Recipe.create(data),
    onSuccess: () => { qc.invalidateQueries(['recipes', currentBusiness?.id]); setShowIngredientModal(false); setEditingIngredient(null); setIngredientForm({ inventory_item_id: '', ingredient_name: '', qty: '', unit: 'kg', yield_pct: 100 }); }
  });

  const deleteIngredientMutation = useMutation({
    mutationFn: (id) => base44.entities.Recipe.delete(id),
    onSuccess: () => qc.invalidateQueries(['recipes', currentBusiness?.id])
  });

  // Get real-time unit cost from inventory
  const getIngredientCost = (recipe) => {
    const invItem = inventoryItems.find(i => i.id === recipe.inventory_item_id || i.ingredient_name?.toLowerCase() === recipe.ingredient_name?.toLowerCase());
    const unitCost = invItem?.unit_cost ?? recipe.unit_cost ?? 0;
    const effectiveQty = recipe.qty * (100 / (recipe.yield_pct || 100));
    return unitCost * effectiveQty;
  };

  const getDishCost = (itemId) => {
    return recipes.filter(r => r.item_id === itemId).reduce((sum, r) => sum + getIngredientCost(r), 0);
  };

  const getDishFoodCostPct = (item) => {
    if (!item.selling_price || item.selling_price === 0) return null;
    return (getDishCost(item.id) / item.selling_price) * 100;
  };

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

  const fcpColor = foodCostPct === null ? 'text-slate-400'
    : foodCostPct <= 28 ? 'text-emerald-400'
    : foodCostPct <= 35 ? 'text-amber-400'
    : 'text-rose-400';

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
            <Button onClick={() => setShowItemModal(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Menu Item
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Items List */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide px-1">Menu Items ({items.length})</h2>
            {loadingItems ? (
              <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 text-[#7B3BFF] animate-spin" /></div>
            ) : items.length === 0 ? (
              <Card className="p-6 text-center bg-[#151528]/80 border-white/5">
                <ChefHat className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No menu items yet</p>
              </Card>
            ) : (
              items.map(item => {
                const fcp = getDishFoodCostPct(item);
                const fcpC = fcp === null ? 'text-slate-500' : fcp <= 28 ? 'text-emerald-400' : fcp <= 35 ? 'text-amber-400' : 'text-rose-400';
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedItem?.id === item.id ? 'bg-[#7B3BFF]/15 border-[#7B3BFF]/50' : 'bg-[#151528]/60 border-white/5 hover:border-white/15'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{item.name}</p>
                        <p className="text-slate-500 text-xs capitalize mt-0.5">{item.category}</p>
                      </div>
                      <div className="text-right ml-2 shrink-0">
                        <p className="text-white text-sm">€{item.selling_price?.toFixed(2)}</p>
                        {fcp !== null && (
                          <p className={`text-xs font-medium ${fcpC}`}>{fcp.toFixed(1)}% FC</p>
                        )}
                      </div>
                    </div>
                    {canEdit() && (
                      <button
                        onClick={e => { e.stopPropagation(); deleteItemMutation.mutate(item.id); }}
                        className="mt-2 text-xs text-slate-600 hover:text-rose-400 transition-colors"
                      >
                        Delete item
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Recipe Detail */}
          <div className="lg:col-span-2 space-y-4">
            {!selectedItem ? (
              <Card className="p-12 text-center bg-[#151528]/80 border-white/5 h-full flex flex-col items-center justify-center">
                <ChefHat className="w-12 h-12 text-slate-700 mb-3" />
                <p className="text-slate-400">Select a menu item to view its recipe</p>
              </Card>
            ) : (
              <>
                {/* Dish Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <Card className="p-4 bg-[#151528]/80 border-white/5">
                    <p className="text-slate-400 text-xs mb-1">Selling Price</p>
                    <p className="text-xl font-bold text-white">€{selectedItem.selling_price?.toFixed(2)}</p>
                  </Card>
                  <Card className="p-4 bg-[#151528]/80 border-white/5">
                    <div className="flex items-center gap-1 mb-1">
                      <DollarSign className="w-3 h-3 text-amber-400" />
                      <p className="text-slate-400 text-xs">Ingredient Cost</p>
                    </div>
                    <p className="text-xl font-bold text-amber-400">€{dishCost.toFixed(2)}</p>
                  </Card>
                  <Card className={`p-4 border ${foodCostPct === null ? 'bg-[#151528]/80 border-white/5' : foodCostPct <= 28 ? 'bg-emerald-500/10 border-emerald-500/30' : foodCostPct <= 35 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                    <div className="flex items-center gap-1 mb-1">
                      <Percent className="w-3 h-3 text-slate-400" />
                      <p className="text-slate-400 text-xs">Food Cost %</p>
                    </div>
                    <p className={`text-xl font-bold ${fcpColor}`}>
                      {foodCostPct !== null ? `${foodCostPct.toFixed(1)}%` : 'N/A'}
                    </p>
                  </Card>
                </div>

                {/* Ingredients */}
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
                      <p className="text-slate-500 text-sm">No ingredients linked yet. Add ingredients to calculate food cost.</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/5">
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
                                <p className="text-white">{r.ingredient_name}</p>
                                {isLive && <p className="text-xs text-emerald-500">● live price</p>}
                              </td>
                              <td className="px-4 py-3 text-slate-300 font-mono">{r.qty} {r.unit}</td>
                              <td className="px-4 py-3 text-slate-400">{r.yield_pct || 100}%</td>
                              <td className="px-4 py-3 text-slate-300">€{liveUnitCost.toFixed(3)}</td>
                              <td className="px-4 py-3 text-amber-400 font-medium">€{lineCost.toFixed(3)}</td>
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
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader><DialogTitle className="text-white">Add Menu Item</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-slate-400 mb-1.5 block">Item Name</Label>
              <Input value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Grilled Salmon" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400 mb-1.5 block">Category</Label>
                <Select value={itemForm.category} onValueChange={v => setItemForm({ ...itemForm, category: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {['appetizer', 'main', 'dessert', 'beverage', 'side', 'other'].map(c => (
                      <SelectItem key={c} value={c} className="text-white capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-400 mb-1.5 block">Selling Price (€)</Label>
                <Input type="number" value={itemForm.selling_price} onChange={e => setItemForm({ ...itemForm, selling_price: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="0.00" />
              </div>
            </div>
            <Button onClick={() => saveItemMutation.mutate(itemForm)} disabled={!itemForm.name || saveItemMutation.isPending} className="w-full">
              {saveItemMutation.isPending ? 'Saving...' : 'Add Item'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Ingredient Modal */}
      <Dialog open={showIngredientModal} onOpenChange={setShowIngredientModal}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader><DialogTitle className="text-white">{editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-slate-400 mb-1.5 block">Link from Inventory (optional)</Label>
              <Select value={ingredientForm.inventory_item_id || ''} onValueChange={handleIngredientInventorySelect}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select inventory item for live pricing" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {inventoryItems.map(i => (
                    <SelectItem key={i.id} value={i.id} className="text-white">{i.ingredient_name} — €{i.unit_cost}/{i.unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-400 mb-1.5 block">Ingredient Name</Label>
              <Input value={ingredientForm.ingredient_name} onChange={e => setIngredientForm({ ...ingredientForm, ingredient_name: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Salmon fillet" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label className="text-slate-400 mb-1.5 block">Quantity per dish</Label>
                <Input type="number" value={ingredientForm.qty} onChange={e => setIngredientForm({ ...ingredientForm, qty: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="0" />
              </div>
              <div>
                <Label className="text-slate-400 mb-1.5 block">Unit</Label>
                <Select value={ingredientForm.unit} onValueChange={v => setIngredientForm({ ...ingredientForm, unit: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {UNITS.map(u => <SelectItem key={u} value={u} className="text-white">{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-slate-400 mb-1.5 block">Yield % (usable portion)</Label>
              <Input type="number" value={ingredientForm.yield_pct} onChange={e => setIngredientForm({ ...ingredientForm, yield_pct: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="100" min="1" max="100" />
            </div>
            <Button onClick={handleSaveIngredient} disabled={!ingredientForm.ingredient_name || !ingredientForm.qty || saveIngredientMutation.isPending} className="w-full">
              {saveIngredientMutation.isPending ? 'Saving...' : editingIngredient ? 'Update' : 'Add Ingredient'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RecipeManager() {
  return <BusinessProvider><RecipeManagerContent /></BusinessProvider>;
}