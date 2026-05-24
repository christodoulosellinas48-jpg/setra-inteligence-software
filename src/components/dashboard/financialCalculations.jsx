// Industry benchmarks by business type
export const BENCHMARKS = {
  bar: {
    foodCostRatio: { healthy: 25, warning: 30, risk: 35 },
    staffCostRatio: { healthy: 30, warning: 35, risk: 40 },
    fixedCostRatio: { healthy: 15, warning: 20, risk: 25 },
    profitMargin: { healthy: 18, warning: 12, risk: 6 },
    displayName: 'Bar'
  },
  canteen: {
    foodCostRatio: { healthy: 35, warning: 40, risk: 45 },
    staffCostRatio: { healthy: 25, warning: 30, risk: 35 },
    fixedCostRatio: { healthy: 18, warning: 22, risk: 28 },
    profitMargin: { healthy: 12, warning: 8, risk: 4 },
    displayName: 'Canteen'
  },
  coffee_shop: {
    foodCostRatio: { healthy: 30, warning: 35, risk: 40 },
    staffCostRatio: { healthy: 30, warning: 35, risk: 40 },
    fixedCostRatio: { healthy: 15, warning: 20, risk: 25 },
    profitMargin: { healthy: 15, warning: 10, risk: 5 },
    displayName: 'Coffee Shop'
  },
  catering_events: {
    foodCostRatio: { healthy: 30, warning: 35, risk: 42 },
    staffCostRatio: { healthy: 28, warning: 33, risk: 38 },
    fixedCostRatio: { healthy: 10, warning: 15, risk: 20 },
    profitMargin: { healthy: 20, warning: 15, risk: 8 },
    displayName: 'Catering/Events'
  },
  confectionery: {
    foodCostRatio: { healthy: 28, warning: 33, risk: 38 },
    staffCostRatio: { healthy: 25, warning: 30, risk: 35 },
    fixedCostRatio: { healthy: 18, warning: 22, risk: 28 },
    profitMargin: { healthy: 20, warning: 15, risk: 8 },
    displayName: 'Confectionery'
  },
  deli_cava: {
    foodCostRatio: { healthy: 32, warning: 37, risk: 42 },
    staffCostRatio: { healthy: 28, warning: 33, risk: 38 },
    fixedCostRatio: { healthy: 15, warning: 20, risk: 25 },
    profitMargin: { healthy: 15, warning: 10, risk: 5 },
    displayName: 'Deli/Cava'
  },
  food_to_go: {
    foodCostRatio: { healthy: 30, warning: 35, risk: 40 },
    staffCostRatio: { healthy: 25, warning: 30, risk: 35 },
    fixedCostRatio: { healthy: 12, warning: 18, risk: 22 },
    profitMargin: { healthy: 18, warning: 12, risk: 6 },
    displayName: 'Food To Go'
  },
  hotels: {
    foodCostRatio: { healthy: 32, warning: 38, risk: 45 },
    staffCostRatio: { healthy: 35, warning: 40, risk: 45 },
    fixedCostRatio: { healthy: 12, warning: 18, risk: 22 },
    profitMargin: { healthy: 12, warning: 8, risk: 4 },
    displayName: 'Hotels'
  },
  restaurant: {
    foodCostRatio: { healthy: 32, warning: 38, risk: 45 },
    staffCostRatio: { healthy: 33, warning: 38, risk: 45 },
    fixedCostRatio: { healthy: 12, warning: 18, risk: 22 },
    profitMargin: { healthy: 12, warning: 8, risk: 4 },
    displayName: 'Restaurant'
  }
};

// Returns null when there is no meaningful data to calculate from.
// "Complete enough" = revenue is set. Without revenue, ratios and margins
// are mathematically undefined and the dashboard would show misleading KPIs.
export function hasData(data) {
  return (data?.monthly_revenue || 0) > 0;
}

export function calculateFinancials(data, businessType) {
  // Guard: don't calculate when revenue is missing
  if (!hasData(data)) return null;

  const benchmarks = BENCHMARKS[businessType] || BENCHMARKS.coffee_shop;
  
  const revenue = data.monthly_revenue || 0;
  const foodCost = data.purchases_food_bev || 0;
  const staffCost = data.staff_costs || 0;
  const fixedCost = data.rent_fixed_costs || 0;
  const utilities = data.utilities || 0;
  const otherOps = data.other_operating || 0;
  
  const totalCosts = foodCost + staffCost + fixedCost + utilities + otherOps;
  const netProfitBeforeTax = revenue - totalCosts;
  const taxRate = data.corporate_tax_rate || 12.5;
  const taxAmount = netProfitBeforeTax > 0 ? (netProfitBeforeTax * taxRate) / 100 : 0;
  const netProfit = netProfitBeforeTax - taxAmount;
  
  const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const foodCostRatio = revenue > 0 ? (foodCost / revenue) * 100 : 0;
  const staffCostRatio = revenue > 0 ? (staffCost / revenue) * 100 : 0;
  const fixedCostRatio = revenue > 0 ? (fixedCost / revenue) * 100 : 0;
  
  const variableCostRatio = (foodCost + staffCost * 0.3) / (revenue || 1);
  const fixedCostsTotal = fixedCost + utilities + otherOps + staffCost * 0.7;
  const breakEvenRevenue = variableCostRatio < 1 ? fixedCostsTotal / (1 - variableCostRatio) : 0;
  
  const getStatus = (value, thresholds, inverse = false) => {
    if (inverse) {
      if (value >= thresholds.healthy) return 'healthy';
      if (value >= thresholds.warning) return 'warning';
      return 'risk';
    }
    if (value <= thresholds.healthy) return 'healthy';
    if (value <= thresholds.warning) return 'warning';
    return 'risk';
  };
  
  const profitMarginStatus = getStatus(profitMargin, benchmarks.profitMargin, true);
  const foodCostStatus = getStatus(foodCostRatio, benchmarks.foodCostRatio);
  const staffCostStatus = getStatus(staffCostRatio, benchmarks.staffCostRatio);
  const fixedCostStatus = getStatus(fixedCostRatio, benchmarks.fixedCostRatio);
  
  const statusScores = { healthy: 100, warning: 60, risk: 20 };
  const healthScore = Math.round(
    (statusScores[profitMarginStatus] * 0.4 +
     statusScores[foodCostStatus] * 0.25 +
     statusScores[staffCostStatus] * 0.25 +
     statusScores[fixedCostStatus] * 0.1)
  );
  
  const overallStatus = healthScore >= 65 ? 'healthy' : healthScore >= 40 ? 'warning' : 'risk';
  
  return {
    revenue,
    totalCosts,
    netProfitBeforeTax,
    taxAmount,
    taxRate,
    netProfit,
    profitMargin,
    foodCostRatio,
    staffCostRatio,
    fixedCostRatio,
    breakEvenRevenue,
    profitMarginStatus,
    foodCostStatus,
    staffCostStatus,
    fixedCostStatus,
    overallStatus,
    healthScore,
    benchmarks
  };
}

export function generateInsights(calculations, businessType) {
  if (!calculations) {
    return [{
      type: 'tip',
      message: "Once your financial data is in, I'll surface what's worth your attention here — cost pressures, pricing gaps, and margin opportunities specific to your venue."
    }];
  }
  const insights = [];
  const { netProfit, profitMargin, foodCostRatio, staffCostRatio, fixedCostRatio, benchmarks } = calculations;
  
  if (profitMargin < benchmarks.profitMargin.risk) {
    insights.push({
      type: 'warning',
      message: `Your profit margin of ${profitMargin.toFixed(1)}% is critically below the ${benchmarks.profitMargin.healthy}% target for ${BENCHMARKS[businessType]?.displayName || 'your business'}. Immediate cost optimization is essential.`
    });
  } else if (profitMargin < benchmarks.profitMargin.warning) {
    insights.push({
      type: 'warning',
      message: `Profit margin at ${profitMargin.toFixed(1)}% shows room for improvement. Industry leaders achieve ${benchmarks.profitMargin.healthy}%+ margins.`
    });
  } else if (profitMargin >= benchmarks.profitMargin.healthy) {
    // Sanity check: if food/staff costs are implausibly low, warn instead of celebrate
    const foodCostTooLow = foodCostRatio > 0 && foodCostRatio < benchmarks.foodCostRatio.healthy * 0.5;
    const staffCostTooLow = staffCostRatio > 0 && staffCostRatio < benchmarks.staffCostRatio.healthy * 0.5;
    if (foodCostTooLow || staffCostTooLow) {
      if (foodCostTooLow) {
        insights.push({
          type: 'warning',
          message: `Your food cost is ${foodCostRatio.toFixed(1)}% of revenue — well below the typical ${benchmarks.foodCostRatio.healthy}%+ range for a ${BENCHMARKS[businessType]?.displayName || 'restaurant'}. Have you entered all your F&B purchases?`
        });
      }
      if (staffCostTooLow) {
        insights.push({
          type: 'warning',
          message: `Your staff cost is ${staffCostRatio.toFixed(1)}% of revenue — well below the typical ${benchmarks.staffCostRatio.healthy}%+ range. Have you entered all your staff costs?`
        });
      }
    } else {
      insights.push({
        type: 'success',
        message: `Excellent profit margin of ${profitMargin.toFixed(1)}%! You're outperforming typical ${BENCHMARKS[businessType]?.displayName || 'hospitality'} benchmarks.`
      });
    }
  }
  
  if (foodCostRatio > benchmarks.foodCostRatio.warning) {
    insights.push({
      type: 'warning',
      message: `Food & beverage costs at ${foodCostRatio.toFixed(1)}% exceed healthy thresholds. Consider supplier renegotiation, menu engineering, or portion control.`
    });
  }
  
  if (staffCostRatio > benchmarks.staffCostRatio.warning) {
    insights.push({
      type: 'warning',
      message: `Staff costs at ${staffCostRatio.toFixed(1)}% are above optimal range. Review scheduling efficiency and peak-hour staffing optimization.`
    });
  }
  
  if (fixedCostRatio > benchmarks.fixedCostRatio.warning) {
    insights.push({
      type: 'tip',
      message: `Fixed cost load at ${fixedCostRatio.toFixed(1)}% indicates high overhead. Increasing revenue volume could significantly improve your cost structure.`
    });
  }
  
  if (netProfit < 0) {
    insights.push({
      type: 'warning',
      message: `Currently operating at a €${Math.abs(netProfit).toLocaleString()} monthly loss. Focus on revenue growth and cost reduction simultaneously.`
    });
  }
  
  if (insights.length < 3) {
    insights.push({
      type: 'tip',
      message: 'Regular expense tracking and monthly financial reviews are key to maintaining healthy margins in hospitality.'
    });
  }
  
  return insights.slice(0, 4);
}

export function simulateChanges(baseData, businessType, revenueChange, foodCostChange, staffCostChange) {
  const simulatedData = {
    ...baseData,
    monthly_revenue: baseData.monthly_revenue * (1 + revenueChange / 100),
    purchases_food_bev: baseData.purchases_food_bev * (1 + foodCostChange / 100),
    staff_costs: baseData.staff_costs * (1 + staffCostChange / 100)
  };
  
  return calculateFinancials(simulatedData, businessType);
}