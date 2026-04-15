import React, { useState } from 'react';
import { useBusiness } from '../components/business/BusinessContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { ClipboardCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

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
          <Button onClick={() => navigate('/Dashboard')}>
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B12]">

      <div className="relative max-w-7xl mx-auto p-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/Dashboard')}
          className="text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6 text-[#C084FC]" />
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
  return <AuditContent />;
}