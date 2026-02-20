// Audit calculations and business logic

export function calculatePortionCost(recipes) {
  if (!recipes || recipes.length === 0) return 0;
  
  return recipes.reduce((total, recipe) => {
    const yieldFactor = (recipe.yield_pct || 100) / 100;
    const wasteFactor = 1 + ((recipe.waste_pct || 0) / 100);
    const ingredientCost = (recipe.qty * recipe.unit_cost) / yieldFactor * wasteFactor;
    return total + ingredientCost;
  }, 0);
}

export function calculateIdealPrice(portionCost, targetProfitMargin) {
  if (targetProfitMargin >= 1) return 0;
  return portionCost / (1 - targetProfitMargin);
}

export function analyzePricing(items, recipes, sales, business) {
  const findings = [];
  const targetMargin = (business.target_profit_margin_pct || 20) / 100;
  
  items.forEach(item => {
    const itemRecipes = recipes.filter(r => r.item_id === item.id);
    const itemSales = sales.filter(s => s.item_id === item.id);
    const unitsSold = itemSales.reduce((sum, s) => sum + s.units_sold, 0);
    
    if (unitsSold < 20) return; // Skip low-volume items
    
    const portionCost = calculatePortionCost(itemRecipes);
    const idealPrice = calculateIdealPrice(portionCost, targetMargin);
    const priceGap = idealPrice - item.selling_price;
    
    if (priceGap > 0.20) {
      const monthlyImpact = priceGap * unitsSold;
      const severity = monthlyImpact >= 150 ? 'high' : monthlyImpact >= 50 ? 'medium' : 'low';
      
      findings.push({
        type: 'pricing',
        severity,
        title: `Underpriced: ${item.name}`,
        description: `Current price €${item.selling_price.toFixed(2)}. Ideal price €${idealPrice.toFixed(2)}. Gap €${priceGap.toFixed(2)}.`,
        estimated_monthly_impact_eur: monthlyImpact,
        recommendation: `Increase price by €${priceGap.toFixed(2)} or reduce portion cost to €${(item.selling_price * (1 - targetMargin)).toFixed(2)}.`,
        metric_snapshot_json: JSON.stringify({
          item_id: item.id,
          item_name: item.name,
          current_price: item.selling_price,
          ideal_price: idealPrice,
          portion_cost: portionCost,
          units_sold: unitsSold,
          price_gap: priceGap
        })
      });
    }
  });
  
  return findings;
}

export function analyzeFoodCost(items, recipes, sales, purchases, business) {
  const findings = [];
  
  // Calculate total COGS from recipes
  const totalCOGS = items.reduce((total, item) => {
    const itemRecipes = recipes.filter(r => r.item_id === item.id);
    const itemSales = sales.filter(s => s.item_id === item.id);
    const unitsSold = itemSales.reduce((sum, s) => sum + s.units_sold, 0);
    const portionCost = calculatePortionCost(itemRecipes);
    return total + (portionCost * unitsSold);
  }, 0);
  
  // Calculate total revenue
  const totalRevenue = sales.reduce((total, sale) => {
    const item = items.find(i => i.id === sale.item_id);
    return total + (sale.net_revenue || (item?.selling_price || 0) * sale.units_sold);
  }, 0);
  
  if (totalRevenue === 0) return findings;
  
  const foodCostPct = (totalCOGS / totalRevenue) * 100;
  const targetFoodCost = business.target_food_cost_pct || 30;
  
  if (foodCostPct > targetFoodCost + 3) {
    const excessPct = (foodCostPct - targetFoodCost) / 100;
    const monthlyImpact = excessPct * totalRevenue;
    
    findings.push({
      type: 'foodcost',
      severity: 'high',
      title: 'Food cost above target',
      description: `Current food cost is ${foodCostPct.toFixed(1)}%, target is ${targetFoodCost}%. Excess of ${(foodCostPct - targetFoodCost).toFixed(1)}%.`,
      estimated_monthly_impact_eur: monthlyImpact,
      recommendation: 'Audit portioning controls, renegotiate top 5 ingredients by spend, and reprice top sellers.',
      metric_snapshot_json: JSON.stringify({
        current_food_cost_pct: foodCostPct,
        target_food_cost_pct: targetFoodCost,
        total_cogs: totalCOGS,
        total_revenue: totalRevenue
      })
    });
  }
  
  // Check for outdated recipes
  const today = new Date();
  const sixtyDaysAgo = new Date(today.setDate(today.getDate() - 60));
  
  recipes.forEach(recipe => {
    const item = items.find(i => i.id === recipe.item_id);
    if (!item) return;
    
    const lastUpdated = recipe.last_updated ? new Date(recipe.last_updated) : null;
    if (lastUpdated && lastUpdated < sixtyDaysAgo) {
      const itemSales = sales.filter(s => s.item_id === recipe.item_id);
      const unitsSold = itemSales.reduce((sum, s) => sum + s.units_sold, 0);
      
      if (unitsSold > 10) {
        findings.push({
          type: 'foodcost',
          severity: 'medium',
          title: `Recipe costs outdated: ${item.name}`,
          description: `Recipe last updated ${lastUpdated.toLocaleDateString()}. Ingredient costs may have changed.`,
          estimated_monthly_impact_eur: 0,
          recommendation: 'Update ingredient costs and yields; re-run pricing audit.',
          metric_snapshot_json: JSON.stringify({
            item_id: item.id,
            item_name: item.name,
            last_updated: recipe.last_updated
          })
        });
      }
    }
  });
  
  return findings;
}

export function analyzeWaste(inventoryAdjustments, totalRevenue) {
  const findings = [];
  
  const wasteAdjustments = inventoryAdjustments.filter(a => 
    a.reason === 'waste' || a.reason === 'spoilage'
  );
  
  // Calculate total waste value (simplified - would need ingredient costs)
  const wasteValue = wasteAdjustments.reduce((sum, adj) => 
    sum + Math.abs(adj.adjustment_qty) * 5, 0
  ); // Placeholder: $5 per unit
  
  if (totalRevenue > 0) {
    const wastePct = (wasteValue / totalRevenue) * 100;
    
    if (wastePct > 1.5) {
      findings.push({
        type: 'waste',
        severity: 'high',
        title: 'Waste spike detected',
        description: `Waste represents ${wastePct.toFixed(1)}% of revenue (€${wasteValue.toFixed(2)}).`,
        estimated_monthly_impact_eur: wasteValue,
        recommendation: 'Investigate prep procedures, storage, FIFO compliance, and staff training. Implement daily waste log.',
        metric_snapshot_json: JSON.stringify({
          waste_value: wasteValue,
          waste_pct: wastePct,
          waste_count: wasteAdjustments.length
        })
      });
    }
  }
  
  return findings;
}

export function analyzeMenuEngineering(items, recipes, sales) {
  const findings = [];
  
  // Calculate contribution margin for each item
  const itemAnalysis = items.map(item => {
    const itemRecipes = recipes.filter(r => r.item_id === item.id);
    const itemSales = sales.filter(s => s.item_id === item.id);
    const unitsSold = itemSales.reduce((sum, s) => sum + s.units_sold, 0);
    const portionCost = calculatePortionCost(itemRecipes);
    const contribMargin = item.selling_price - portionCost;
    
    return {
      ...item,
      unitsSold,
      portionCost,
      contribMargin
    };
  }).filter(item => item.unitsSold > 0);
  
  if (itemAnalysis.length === 0) return findings;
  
  // Calculate medians
  const volumes = itemAnalysis.map(i => i.unitsSold).sort((a, b) => a - b);
  const margins = itemAnalysis.map(i => i.contribMargin).sort((a, b) => a - b);
  const volumeThreshold = volumes[Math.floor(volumes.length / 2)] || 0;
  const marginThreshold = margins[Math.floor(margins.length / 2)] || 0;
  
  // Classify items
  itemAnalysis.forEach(item => {
    const isHighVolume = item.unitsSold >= volumeThreshold;
    const isHighMargin = item.contribMargin >= marginThreshold;
    
    if (isHighVolume && !isHighMargin && item.unitsSold >= 30) {
      // PLOWHORSE
      const neededIncrease = Math.max(0, marginThreshold - item.contribMargin);
      const monthlyImpact = neededIncrease * item.unitsSold;
      
      findings.push({
        type: 'menu',
        severity: 'medium',
        title: `Low margin on popular item: ${item.name}`,
        description: `High volume (${item.unitsSold} units) but low margin (€${item.contribMargin.toFixed(2)}). Target margin: €${marginThreshold.toFixed(2)}.`,
        estimated_monthly_impact_eur: monthlyImpact,
        recommendation: `Increase price by €${neededIncrease.toFixed(2)} OR reduce recipe cost. Don't remove—fix the margin.`,
        metric_snapshot_json: JSON.stringify({
          item_id: item.id,
          category: 'plowhorse',
          units_sold: item.unitsSold,
          contrib_margin: item.contribMargin,
          target_margin: marginThreshold
        })
      });
    } else if (!isHighVolume && !isHighMargin && item.unitsSold <= 10) {
      // DOG
      findings.push({
        type: 'menu',
        severity: 'low',
        title: `Underperformer: ${item.name}`,
        description: `Low volume (${item.unitsSold} units) and low margin (€${item.contribMargin.toFixed(2)}).`,
        estimated_monthly_impact_eur: 0,
        recommendation: 'Consider removing, bundling, or redesigning. Replace with a STAR candidate.',
        metric_snapshot_json: JSON.stringify({
          item_id: item.id,
          category: 'dog',
          units_sold: item.unitsSold,
          contrib_margin: item.contribMargin
        })
      });
    } else if (!isHighVolume && isHighMargin) {
      // PUZZLE
      findings.push({
        type: 'menu',
        severity: 'low',
        title: `High-margin hidden gem: ${item.name}`,
        description: `Great margin (€${item.contribMargin.toFixed(2)}) but low volume (${item.unitsSold} units).`,
        estimated_monthly_impact_eur: 0,
        recommendation: 'Promote via menu placement, staff upsell training, or create combo deals.',
        metric_snapshot_json: JSON.stringify({
          item_id: item.id,
          category: 'puzzle',
          units_sold: item.unitsSold,
          contrib_margin: item.contribMargin
        })
      });
    }
  });
  
  return findings;
}

export function analyzeLabor(laborShifts, sales, business) {
  const findings = [];
  
  // Group by date
  const dailyData = {};
  
  laborShifts.forEach(shift => {
    if (!dailyData[shift.date]) {
      dailyData[shift.date] = { laborCost: 0, hours: 0, revenue: 0 };
    }
    dailyData[shift.date].laborCost += shift.total_cost;
    dailyData[shift.date].hours += shift.hours;
  });
  
  sales.forEach(sale => {
    if (!dailyData[sale.date]) {
      dailyData[sale.date] = { laborCost: 0, hours: 0, revenue: 0 };
    }
    const item = { selling_price: 0 }; // Would need to join with items
    dailyData[sale.date].revenue += sale.net_revenue || (item.selling_price * sale.units_sold);
  });
  
  // Analyze each day
  const targetLaborPct = (business.target_labor_cost_pct || 25) / 100;
  
  Object.entries(dailyData).forEach(([date, data]) => {
    if (data.revenue === 0) return;
    
    const laborPct = data.laborCost / data.revenue;
    
    if (laborPct > targetLaborPct + 0.05) {
      const excessCost = (laborPct - targetLaborPct) * data.revenue;
      
      findings.push({
        type: 'labor',
        severity: 'medium',
        title: `High labor cost on ${date}`,
        description: `Labor was ${(laborPct * 100).toFixed(1)}% of revenue, target is ${(targetLaborPct * 100).toFixed(1)}%.`,
        estimated_monthly_impact_eur: excessCost * 30, // Extrapolate
        recommendation: 'Review scheduling for peak/slow periods. Consider cross-training staff.',
        metric_snapshot_json: JSON.stringify({
          date,
          labor_cost: data.laborCost,
          revenue: data.revenue,
          labor_pct: laborPct,
          hours: data.hours
        })
      });
    }
  });
  
  return findings;
}

export function runFullAudit(data) {
  const { business, items, recipes, sales, purchases, inventoryAdjustments, laborShifts } = data;
  
  const allFindings = [
    ...analyzePricing(items, recipes, sales, business),
    ...analyzeFoodCost(items, recipes, sales, purchases, business),
    ...analyzeWaste(inventoryAdjustments, sales.reduce((sum, s) => sum + (s.net_revenue || 0), 0)),
    ...analyzeMenuEngineering(items, recipes, sales),
    ...analyzeLabor(laborShifts, sales, business)
  ];
  
  // Sort by impact
  return allFindings.sort((a, b) => 
    (b.estimated_monthly_impact_eur || 0) - (a.estimated_monthly_impact_eur || 0)
  );
}