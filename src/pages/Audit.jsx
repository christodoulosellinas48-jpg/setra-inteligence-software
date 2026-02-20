import React, { useState } from 'react';
import { BusinessProvider, useBusiness } from '../components/business/BusinessContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { ClipboardCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import AuditOverview from '../components/audit/AuditOverview.jsx';
import PricingAudit from '../components/audit/PricingAudit.jsx';
import FoodCostAudit from '../components/audit/FoodCostAudit.jsx';
import MenuEngineeringAudit from '../components/audit/MenuEngineeringAudit.jsx';
import LaborAudit from '../components/audit/LaborAudit.jsx';
import ActionPlan from '../components/audit/ActionPlan.jsx';

function AuditContent() {
  const navigate = useNavigate();
  const { currentBusiness, loading } = useBusiness();
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!currentBusiness) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <Card className="bg-slate-900/50 border-slate-800 p-8 text-center">
          <p className="text-slate-400 mb-4">No business selected</p>
          <Button onClick={() => navigate(createPageUrl('Dashboard'))}>
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto p-6">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-red-500/20 flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Profit Audit</h1>
            <p className="text-slate-400">
              Identify profit leaks and get actionable recommendations
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-900/50 border border-slate-800 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="foodcost">Food Cost & Waste</TabsTrigger>
            <TabsTrigger value="menu">Menu Engineering</TabsTrigger>
            <TabsTrigger value="labor">Labor</TabsTrigger>
            <TabsTrigger value="action">Action Plan</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AuditOverview businessId={currentBusiness.id} />
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
            <ActionPlan businessId={currentBusiness.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function Audit() {
  return (
    <BusinessProvider>
      <AuditContent />
    </BusinessProvider>
  );
}