import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Building2, RefreshCw, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculateFinancials, BENCHMARKS } from '@/components/dashboard/financialCalculations';
import SummaryCards from '@/components/consolidated/SummaryCards';
import PerformanceChart from '@/components/consolidated/PerformanceChart';
import BusinessTable from '@/components/consolidated/BusinessTable';
import CrossVenueInsights from '@/components/consolidated/CrossVenueInsights';

const DATE_RANGE_OPTIONS = [
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'last_3_months', label: 'Last 3 months' },
  { value: 'last_12_months', label: 'Last 12 months' },
  { value: 'ytd', label: 'Year to date' },
];

// Revenue scaling multiplier based on date range (relative to monthly)
function getRevenueMultiplier(range) {
  switch (range) {
    case 'last_3_months': return 3;
    case 'last_12_months': return 12;
    case 'ytd': return new Date().getMonth() + 1;
    default: return 1; // this_month, last_month
  }
}

export default function ConsolidatedView() {
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);
  const [dateRange, setDateRange] = useState('this_month');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: ownedBusinesses = [], isLoading } = useQuery({
    queryKey: ['ownedBusinesses', user?.email],
    queryFn: () => base44.entities.Business.filter({ owner_email: user.email }),
    enabled: !!user,
    staleTime: 5 * 60 * 1000
  });

  const { data: memberships = [] } = useQuery({
    queryKey: ['businessMemberships', user?.email],
    queryFn: () => base44.entities.BusinessMember.filter({ user_email: user.email, invitation_status: 'accepted' }),
    enabled: !!user,
    staleTime: 5 * 60 * 1000
  });

  const { data: memberBusinesses = [] } = useQuery({
    queryKey: ['memberBusinessesData', memberships],
    queryFn: async () => {
      const ids = memberships.map(m => m.business_id);
      if (ids.length === 0) return [];
      const businesses = await Promise.all(ids.map(id => base44.entities.Business.filter({ id })));
      return businesses.flat();
    },
    enabled: memberships.length > 0,
    staleTime: 5 * 60 * 1000
  });

  // Deduplicate by id
  const allBusinesses = useMemo(() => {
    const seen = new Set();
    return [...ownedBusinesses, ...memberBusinesses].filter(b => {
      if (seen.has(b.id)) return false;
      seen.add(b.id);
      return true;
    });
  }, [ownedBusinesses, memberBusinesses]);

  const multiplier = getRevenueMultiplier(dateRange);

  const consolidatedMetrics = useMemo(() => {
    if (allBusinesses.length === 0) return null;

    let totalRevenue = 0, totalProfit = 0;
    const businessPerformance = [];

    allBusinesses.forEach(business => {
      const financials = calculateFinancials(business, business.industry_group || business.business_type);
      const revenue = (business.monthly_revenue || 0) * multiplier;
      const profit = financials ? financials.netProfit * multiplier : null;
      const margin = financials ? financials.profitMargin : null;

      totalRevenue += revenue;
      if (profit !== null) totalProfit += profit;

      const industryKey = business.industry_group || business.business_type;
      businessPerformance.push({
        name: business.name,
        id: business.id,
        revenue,
        profit,
        margin,
        healthScore: financials ? financials.healthScore : null,
        status: financials ? financials.overallStatus : null,
        type: BENCHMARKS[industryKey]?.displayName || industryKey || 'Business',
        industryGroup: industryKey,
        hasData: !!financials,
        // raw monthly values for cross-venue insights
        foodCostRatio: financials ? financials.foodCostRatio : null,
        staffCostRatio: financials ? financials.staffCostRatio : null,
      });
    });

    const venuesWithData = businessPerformance.filter(b => b.hasData);
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const avgHealthScore = venuesWithData.length > 0
      ? venuesWithData.reduce((s, b) => s + b.healthScore, 0) / venuesWithData.length
      : null;

    return {
      totalRevenue,
      totalProfit,
      avgHealthScore,
      avgMargin,
      businessCount: allBusinesses.length,
      businessPerformance: businessPerformance.sort((a, b) => (b.profit ?? -Infinity) - (a.profit ?? -Infinity)),
      dateRangeLabel: DATE_RANGE_OPTIONS.find(o => o.value === dateRange)?.label || 'This month',
    };
  }, [allBusinesses, multiplier, dateRange]);

  const handleViewBusiness = (business) => {
    if (business.id) {
      // Use the same localStorage key that BusinessContext reads on load
      localStorage.setItem('currentBusinessId', business.id);
      navigate('/Dashboard');
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#7B3BFF] animate-spin" />
      </div>
    );
  }

  if (allBusinesses.length === 0) {
    return (
      <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
          <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">No Businesses Found</h1>
          <p className="text-slate-400 mb-8">Create your first business to see consolidated analytics.</p>
          <Button onClick={() => navigate('/CreateBusiness')}>Create Business</Button>
        </motion.div>
      </div>
    );
  }

  if (allBusinesses.length === 1) {
    return (
      <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
          <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-3">Portfolio View Unlocks at 2+ Venues</h1>
          <p className="text-slate-400 mb-8">Add a second venue to compare performance, spot cross-venue opportunities, and unlock multi-site insights.</p>
          <Button onClick={() => navigate('/CreateBusiness')}>Add a Second Venue</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      <header className="border-b border-white/5 backdrop-blur-2xl sticky top-0 z-40 bg-[#0B0B12]/95 shadow-[0_4px_30px_rgba(123,59,255,0.1)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Building2 className="w-6 h-6 text-[#C084FC]" />
              Consolidated View
            </h1>
            <p className="text-slate-500 text-sm">
              Portfolio analytics across {consolidatedMetrics?.businessCount} {consolidatedMetrics?.businessCount === 1 ? 'business' : 'businesses'}
            </p>
          </div>
          {/* Date range selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-44 bg-[#151528]/80 border-white/10 text-white text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGE_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <SummaryCards metrics={consolidatedMetrics} />
        <CrossVenueInsights businesses={consolidatedMetrics.businessPerformance} />
        <PerformanceChart data={consolidatedMetrics.businessPerformance} />
        <BusinessTable businesses={consolidatedMetrics.businessPerformance} onViewBusiness={handleViewBusiness} />
      </main>
    </div>
  );
}