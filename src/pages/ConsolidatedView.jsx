import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Building2, RefreshCw, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import { calculateFinancials, BENCHMARKS } from '@/components/dashboard/financialCalculations';

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
    queryFn: () => base44.entities.BusinessMember.filter({ 
      user_email: user.email, 
      invitation_status: 'accepted' 
    }),
    enabled: !!user,
    staleTime: 5 * 60 * 1000
  });

  const { data: memberBusinesses = [] } = useQuery({
    queryKey: ['memberBusinessesData', memberships],
    queryFn: async () => {
      const ids = memberships.map(m => m.business_id);
      if (ids.length === 0) return [];
      const businesses = await Promise.all(
        ids.map(id => base44.entities.Business.filter({ id }))
      );
      return businesses.flat();
    },
    enabled: memberships.length > 0,
    staleTime: 5 * 60 * 1000
  });

  const allBusinesses = useMemo(() => {
    return [...ownedBusinesses, ...memberBusinesses];
  }, [ownedBusinesses, memberBusinesses]);

  const consolidatedMetrics = useMemo(() => {
    if (allBusinesses.length === 0) return null;

    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalProfit = 0;
    let totalHealthScore = 0;
    const businessPerformance = [];

    allBusinesses.forEach(business => {
      const financials = calculateFinancials(business, business.business_type);
      const revenue = business.monthly_revenue || 0;
      const expenses = (business.purchases_food_bev || 0) + 
                      (business.staff_costs || 0) + 
                      (business.rent_fixed_costs || 0) + 
                      (business.utilities || 0) + 
                      (business.other_operating || 0);

      totalRevenue += revenue;
      totalExpenses += expenses;
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

    const avgHealthScore = allBusinesses.length > 0 ? totalHealthScore / allBusinesses.length : 0;
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalExpenses,
      totalProfit,
      avgHealthScore,
      avgMargin,
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">No Businesses Found</h1>
          <p className="text-slate-400 mb-8">
            Create your first business to see consolidated analytics.
          </p>
          <Button 
            onClick={() => navigate(createPageUrl('CreateBusiness'))}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
          >
            Create Business
          </Button>
        </motion.div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <p className="text-white font-medium mb-1">{data.name}</p>
          <p className="text-slate-400 text-sm">{data.type}</p>
          <p className="text-cyan-400 mt-2">Revenue: €{data.revenue.toLocaleString()}</p>
          <p className={data.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
            Profit: €{data.profit.toLocaleString()}
          </p>
          <p className="text-slate-300">Margin: {data.margin.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      <header className="border-b border-white/5 backdrop-blur-2xl sticky top-0 z-40 bg-[#0B0B12]/95 shadow-[0_4px_30px_rgba(123,59,255,0.1)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate(createPageUrl('Dashboard'))}
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-cyan-400" />
                  Consolidated View
                </h1>
                <p className="text-slate-500 text-sm">Portfolio analytics across {consolidatedMetrics.businessCount} businesses</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Total Monthly Revenue</span>
            </div>
            <p className="text-3xl font-bold text-white">€{consolidatedMetrics.totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-slate-500 mt-1">Across all entities</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Combined Net Profit</span>
            </div>
            <p className={`text-3xl font-bold ${consolidatedMetrics.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              €{consolidatedMetrics.totalProfit.toLocaleString()}
            </p>
            <p className="text-sm text-slate-500 mt-1">{consolidatedMetrics.avgMargin.toFixed(1)}% avg margin</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm">Portfolio Health Score</span>
            </div>
            <p className="text-3xl font-bold text-white">{consolidatedMetrics.avgHealthScore.toFixed(0)}</p>
            <p className="text-sm text-slate-500 mt-1">Average across businesses</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Building2 className="w-4 h-4" />
              <span className="text-sm">Active Businesses</span>
            </div>
            <p className="text-3xl font-bold text-white">{consolidatedMetrics.businessCount}</p>
            <p className="text-sm text-slate-500 mt-1">In your portfolio</p>
          </motion.div>
        </div>

        {/* Comparative Performance Chart */}
        <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">Business Performance Comparison</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consolidatedMetrics.businessPerformance} margin={{ left: 20, right: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#64748b" 
                  tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="profit" name="Net Profit" radius={[8, 8, 0, 0]}>
                  {consolidatedMetrics.businessPerformance.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.profit >= 0 ? '#10b981' : '#f43f5e'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Business Details Table */}
        <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">Business Unit Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Business</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Type</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Revenue</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Profit</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Margin</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Health</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {consolidatedMetrics.businessPerformance.map((business, idx) => (
                  <motion.tr
                    key={business.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-b border-slate-800 hover:bg-slate-800/30"
                  >
                    <td className="py-3 px-4 text-white font-medium">{business.name}</td>
                    <td className="py-3 px-4 text-slate-400">{business.type}</td>
                    <td className="py-3 px-4 text-right text-cyan-400">€{business.revenue.toLocaleString()}</td>
                    <td className={`py-3 px-4 text-right ${business.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      €{business.profit.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300">{business.margin.toFixed(1)}%</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        business.status === 'healthy' ? 'bg-emerald-500/20 text-emerald-400' :
                        business.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-rose-500/20 text-rose-400'
                      }`}>
                        {business.healthScore.toFixed(0)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(createPageUrl('Dashboard'))}
                        className="text-cyan-400 hover:text-cyan-300"
                      >
                        View
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}