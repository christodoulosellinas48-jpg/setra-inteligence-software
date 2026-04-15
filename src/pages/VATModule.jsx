import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBusiness } from '@/components/business/BusinessContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import VATPeriodsTab from '@/components/vat/VATPeriodsTab';
import VATCalculatorTab from '@/components/vat/VATCalculatorTab';
import VATReportTab from '@/components/vat/VATReportTab';
import { ShieldAlert, FileText, Calculator, CalendarDays } from 'lucide-react';

export default function VATModule() {
  const { currentBusiness, hasPermission, loading } = useBusiness();
  const [activeTab, setActiveTab] = useState('periods');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7B3BFF]/30 border-t-[#7B3BFF] rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasPermission('manage_vat')) {
    return (
      <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-rose-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-slate-400 text-sm">You need the <span className="text-purple-400 font-medium">Manage VAT</span> permission to access this module.</p>
        </div>
      </div>
    );
  }

  if (!currentBusiness) {
    return (
      <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center p-6">
        <p className="text-slate-400">Please select a business first.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0B0B12]/95 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 border border-[#7B3BFF]/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#C084FC]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">VAT Module</h1>
              <p className="text-sm text-slate-500">{currentBusiness.name} • VAT rate: {currentBusiness.vat_rate ?? 19}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#151528]/80 border border-white/5 mb-6">
            <TabsTrigger value="periods" className="data-[state=active]:bg-[#7B3BFF]/20 data-[state=active]:text-[#C084FC]">
              <CalendarDays className="w-4 h-4 mr-2" />
              VAT Periods
            </TabsTrigger>
            <TabsTrigger value="calculator" className="data-[state=active]:bg-[#7B3BFF]/20 data-[state=active]:text-[#C084FC]">
              <Calculator className="w-4 h-4 mr-2" />
              Calculator
            </TabsTrigger>
            <TabsTrigger value="report" className="data-[state=active]:bg-[#7B3BFF]/20 data-[state=active]:text-[#C084FC]">
              <FileText className="w-4 h-4 mr-2" />
              Summary Report
            </TabsTrigger>
          </TabsList>

          <TabsContent value="periods">
            <VATPeriodsTab business={currentBusiness} />
          </TabsContent>
          <TabsContent value="calculator">
            <VATCalculatorTab business={currentBusiness} />
          </TabsContent>
          <TabsContent value="report">
            <VATReportTab business={currentBusiness} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}