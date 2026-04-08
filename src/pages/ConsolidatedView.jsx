import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

import { calculateFinancials, BENCHMARKS } from '@/components/dashboard/financialCalculations';
import SummaryCards from '@/components/consolidated/SummaryCards';
import PerformanceChart from '@/components/consolidated/PerformanceChart';
import BusinessTable from '@/components/consolidated/BusinessTable';

export default function ConsolidatedView() {
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
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

  const allBusinesses = useMemo(() => [...ownedBusinesses, ...memberBusinesses], [ownedBusinesses, memberBusinesses]);

  const consolidatedMetrics = useMemo(() => {
    if (allBusinesses.length === 0) return null;

    let totalRevenue = 0, totalProfit = 0, totalHealthScore = 0;
    const businessPerformance = [];

    allBusinesses.forEach(business => {
      const financials = calculateFinancials(business, business.business_type);
      const revenue = business.monthly_revenue || 0;

      totalRevenue += revenue;
      totalProfit += financials.netProfit;
      totalHealthScore += financials.healthScore;

      businessPerformance.push({
        name: business.name,
        id: business.id,
        revenue,
        profit: financials.netProfit,
        margin: financials.profitMargin,
        healthScore: financials.healthScore,
        status: financials.overallStatus,
        type: BENCHMARKS[business.business_type]?.displayName || 'Business'
      });
    });

    return {
      totalRevenue,
      totalProfit,
      avgHealthScore: totalHealthScore / allBusinesses.length,
      avgMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      businessCount: allBusinesses.length,
      businessPerformance: businessPerformance.sort((a, b) => b.profit - a.profit)
    };
  }, [allBusinesses]);

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

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      <header className="border-b border-white/5 backdrop-blur-2xl sticky top-0 z-40 bg-[#0B0B12]/95 shadow-[0_4px_30px_rgba(123,59,255,0.1)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/Dashboard')} className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Building2 className="w-6 h-6 text-[#C084FC]" />
              Consolidated View
            </h1>
            <p className="text-slate-500 text-sm">Portfolio analytics across {consolidatedMetrics.businessCount} businesses</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <SummaryCards metrics={consolidatedMetrics} />
        <PerformanceChart data={consolidatedMetrics.businessPerformance} />
        <BusinessTable businesses={consolidatedMetrics.businessPerformance} />
      </main>
    </div>
  );
}