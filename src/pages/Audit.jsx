import React, { useState, useEffect } from 'react';
import { useBusiness } from '../components/business/BusinessContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, ArrowLeft, RefreshCw, Play, TrendingUp, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import AuditOverview from '../components/audit/AuditOverview.jsx';
import PricingAudit from '../components/audit/PricingAudit.jsx';
import FoodCostAudit from '../components/audit/FoodCostAudit.jsx';
import MenuEngineeringAudit from '../components/audit/MenuEngineeringAudit.jsx';
import LaborAudit from '../components/audit/LaborAudit.jsx';
import ActionPlan from '../components/audit/ActionPlan.jsx';

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

function TabBadge({ findings, type }) {
  if (!findings || findings.length === 0) return null;
  const filtered = type ? findings.filter(f => f.type === type) : findings;
  if (filtered.length === 0) return null;
  const topSeverity = filtered.reduce((best, f) =>
    SEVERITY_ORDER[f.severity] < SEVERITY_ORDER[best] ? f.severity : best, 'low');
  const color = topSeverity === 'high' ? 'bg-rose-500 text-white' :
    topSeverity === 'medium' ? 'bg-amber-500 text-black' : 'bg-slate-600 text-slate-200';
  return (
    <span className={`ml-1.5 inline-flex items-center justify-center text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 ${color}`}>
      {filtered.length}
    </span>
  );
}

function AuditContent() {
  const navigate = useNavigate();
  const { currentBusiness, loading } = useBusiness();
  const [activeTab, setActiveTab] = useState('overview');
  const [hasRunAudit, setHasRunAudit] = useState(false);

  const { data: latestFindings } = useQuery({
    queryKey: ['allFindings', currentBusiness?.id],
    enabled: !!currentBusiness?.id,
    queryFn: async () => {
      const runs = await base44.entities.AuditRun.filter({ business_id: currentBusiness.id }, '-created_date', 1);
      if (runs.length === 0) return [];
      return base44.entities.AuditFinding.filter({ audit_run_id: runs[0].id });
    }
  });

  // If an audit already exists on first load, show Action Plan
  useEffect(() => {
    if (latestFindings && latestFindings.length > 0 && !hasRunAudit) {
      setActiveTab('action');
    }
  }, [latestFindings]);

  const handleAuditComplete = (findings) => {
    setHasRunAudit(true);
    if (findings && findings.length > 0) {
      setActiveTab('action');
    }
  };

  const handleGoToOverview = () => setActiveTab('overview');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#7B3BFF] animate-spin" />
      </div>
    );
  }

  if (!currentBusiness) {
    return (
      <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center p-6">
        <Card className="bg-slate-900/50 border-slate-800 p-8 text-center">
          <p className="text-slate-400 mb-4">No business selected</p>
          <Button onClick={() => navigate('/Dashboard')}>Go to Dashboard</Button>
        </Card>
      </div>
    );
  }

  const industryLabel = {
    bar: 'Bar', canteen: 'Canteen', coffee_shop: 'Coffee Shop',
    catering_events: 'Catering', confectionery: 'Confectionery',
    deli_cava: 'Deli & Cava', food_to_go: 'Food-to-Go',
    hotels: 'Hotels F&B', restaurant: 'Restaurant'
  }[currentBusiness.industry_group] || 'Business';

  const findings = latestFindings || [];
  const hasPreviousAudit = findings.length > 0;

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      <div className="relative max-w-7xl mx-auto p-6">
        <Button variant="ghost" onClick={() => navigate('/Dashboard')} className="text-slate-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 flex items-center justify-center">
              <ClipboardCheck className="w-6 h-6 text-[#C084FC]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Profit Audit</h1>
              <p className="text-slate-400 text-sm">
                Identify profit leaks and get actionable recommendations ·{' '}
                <span className="text-[#A855F7]">Tuned for {industryLabel}</span>
              </p>
            </div>
          </div>
          {/* "Run New Audit" secondary button accessible from any tab */}
          {activeTab !== 'overview' && (
            <Button variant="outline" size="sm" onClick={handleGoToOverview} className="gap-2">
              <Play className="w-4 h-4 text-[#C084FC]" />
              Run New Audit
            </Button>
          )}
        </div>

        {/* Stats counter */}
        {findings.length > 0 && (() => {
          const fixed = findings.filter(f => f.status === 'fixed');
          const closedImpact = fixed.reduce((s, f) => s + (f.estimated_monthly_impact_eur || 0), 0);
          return closedImpact > 0 ? (
            <div className="mb-6 flex flex-wrap items-center gap-4 px-5 py-4 rounded-2xl bg-gradient-to-r from-emerald-900/20 to-[#0B0B12]/0 border border-emerald-500/20">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 font-bold text-lg">€{closedImpact.toLocaleString()}</span>
                <span className="text-slate-400 text-sm">closed this period</span>
              </div>
              <div className="h-4 w-px bg-white/10 hidden sm:block" />
              <span className="text-slate-400 text-sm">{findings.length} total findings</span>
              <div className="h-4 w-px bg-white/10 hidden sm:block" />
              <div className="flex items-center gap-1.5 text-amber-400 text-sm">
                <Flame className="w-4 h-4" />
                <span>Sort by € impact to prioritise</span>
              </div>
            </div>
          ) : null;
        })()}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#151528]/80 border border-white/5 mb-6 h-auto flex-wrap gap-1 p-1 rounded-xl">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#7B3BFF]/20 data-[state=active]:text-white rounded-lg text-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="pricing" className="data-[state=active]:bg-[#7B3BFF]/20 data-[state=active]:text-white rounded-lg text-sm">
              Pricing
              <TabBadge findings={findings} type="pricing" />
            </TabsTrigger>
            <TabsTrigger value="foodcost" className="data-[state=active]:bg-[#7B3BFF]/20 data-[state=active]:text-white rounded-lg text-sm">
              Food Cost &amp; Waste
              <TabBadge findings={findings} type="foodcost" />
            </TabsTrigger>
            <TabsTrigger value="menu" className="data-[state=active]:bg-[#7B3BFF]/20 data-[state=active]:text-white rounded-lg text-sm">
              Menu Engineering
              <TabBadge findings={findings} type="menu" />
            </TabsTrigger>
            <TabsTrigger value="labor" className="data-[state=active]:bg-[#7B3BFF]/20 data-[state=active]:text-white rounded-lg text-sm">
              Labor
              <TabBadge findings={findings} type="labor" />
            </TabsTrigger>
            <TabsTrigger value="action" className="data-[state=active]:bg-[#7B3BFF]/20 data-[state=active]:text-white rounded-lg text-sm">
              Action Plan
              {findings.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 bg-[#7B3BFF] text-white">
                  {findings.filter(f => f.status !== 'fixed' && f.status !== 'ignored').length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AuditOverview
              businessId={currentBusiness.id}
              onAuditComplete={handleAuditComplete}
              onViewHistoricalAudit={() => {}}
            />
          </TabsContent>

          <TabsContent value="pricing">
            <PricingAudit businessId={currentBusiness.id} />
          </TabsContent>

          <TabsContent value="foodcost">
            <FoodCostAudit businessId={currentBusiness.id} />
          </TabsContent>

          <TabsContent value="menu">
            <MenuEngineeringAudit businessId={currentBusiness.id} />
          </TabsContent>

          <TabsContent value="labor">
            <LaborAudit businessId={currentBusiness.id} />
          </TabsContent>

          <TabsContent value="action">
            <ActionPlan businessId={currentBusiness.id} onRunNewAudit={handleGoToOverview} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function Audit() {
  return <AuditContent />;
}