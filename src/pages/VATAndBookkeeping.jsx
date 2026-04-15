import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Inbox,
  Building2,
  Receipt,
  CreditCard,
  Percent,
  TrendingUp,
  Users,
  UserCircle,
  FileText,
  AlertCircle,
  RefreshCw,
  CalendarDays,
  Calculator,
  ShieldAlert
} from 'lucide-react';
import { useBusiness } from '@/components/business/BusinessContext';

import InboxTab from '@/components/bookkeeping/InboxTab';
import BankReconciliationTab from '@/components/bookkeeping/BankReconciliationTab';
import PLTab from '@/components/bookkeeping/PLTab';
import PayrollTab from '@/components/bookkeeping/PayrollTab';
import AccountantPortalTab from '@/components/bookkeeping/AccountantPortalTab';
import ExportsTab from '@/components/bookkeeping/ExportsTab';
import VATPeriodsTab from '@/components/vat/VATPeriodsTab';
import VATCalculatorTab from '@/components/vat/VATCalculatorTab';
import VATReportTab from '@/components/vat/VATReportTab';

function VATSection({ business, hasPermission }) {
  const navigate = useNavigate();
  const [vatTab, setVatTab] = useState('periods');

  if (!hasPermission('manage_vat')) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8 text-rose-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
        <p className="text-slate-400 text-sm">You need the <span className="text-purple-400 font-medium">Manage VAT</span> permission to access this module.</p>
      </div>
    );
  }

  if (!business.vat_registered) {
    return (
      <Card className="bg-[#151528]/80 border-white/5 p-10 text-center max-w-md mx-auto mt-8">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">VAT Not Registered</h2>
        <p className="text-slate-400 mb-6">
          Enable VAT registration in business settings to use VAT features.
        </p>
        <Button onClick={() => navigate('/Settings')} variant="outline" className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10">
          Go to Business Settings
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compliance banner */}
      <Card className="bg-blue-500/10 border-blue-500/30 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-300 mb-0.5">Cyprus VAT Compliance</h3>
            <p className="text-sm text-blue-400/80">
              Quarterly filing • 10th of 2nd month after period end • 6-year records retention required
            </p>
            <p className="text-xs text-blue-400/60 mt-1">
              VAT Quarter Group: {business.vat_quarter_group || 'Not set'} •
              VAT Number: {business.vat_number || 'Not set'} •
              VAT Rate: {business.vat_rate ?? 19}%
            </p>
          </div>
        </div>
      </Card>

      <Tabs value={vatTab} onValueChange={setVatTab}>
        <TabsList className="bg-[#151528]/80 border border-white/5">
          <TabsTrigger value="periods" className="data-[state=active]:bg-[#7B3BFF]/20 data-[state=active]:text-[#C084FC]">
            <CalendarDays className="w-4 h-4 mr-2" />
            Periods
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
        <div className="mt-4">
          <TabsContent value="periods">
            <VATPeriodsTab business={business} />
          </TabsContent>
          <TabsContent value="calculator">
            <VATCalculatorTab business={business} />
          </TabsContent>
          <TabsContent value="report">
            <VATReportTab business={business} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export default function VATAndBookkeeping() {
  const navigate = useNavigate();
  const { currentBusiness, loading, hasPermission } = useBusiness();
  const [activeTab, setActiveTab] = useState('vat');

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 border border-[#7B3BFF]/20 flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-[#C084FC]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">No Business Selected</h1>
          <p className="text-slate-400 mb-8">Please select a business to access bookkeeping & VAT features.</p>
          <Button onClick={() => navigate(createPageUrl('Dashboard'))}>Go to Dashboard</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      {/* Header */}
      <header className="border-b border-white/5 backdrop-blur-2xl sticky top-0 z-40 bg-[#0B0B12]/95 shadow-[0_4px_30px_rgba(123,59,255,0.1)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-[#C084FC]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">VAT & Bookkeeping</h1>
                <p className="text-sm text-slate-500">{currentBusiness.name}</p>
              </div>
            </div>
            {currentBusiness.entity_type === 'ltd' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-amber-400">Ltd: Statutory audit requires licensed auditor sign-off</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-8 gap-2 bg-slate-900/50 p-2 rounded-xl">
            <TabsTrigger value="vat" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7B3BFF] data-[state=active]:to-[#A855F7]">
              <Percent className="w-4 h-4 mr-2" />
              VAT
            </TabsTrigger>
            <TabsTrigger value="inbox" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7B3BFF] data-[state=active]:to-[#A855F7]">
              <Inbox className="w-4 h-4 mr-2" />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="bank" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7B3BFF] data-[state=active]:to-[#A855F7]">
              <CreditCard className="w-4 h-4 mr-2" />
              Bank
            </TabsTrigger>
            <TabsTrigger value="pl" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7B3BFF] data-[state=active]:to-[#A855F7]">
              <TrendingUp className="w-4 h-4 mr-2" />
              P&L
            </TabsTrigger>
            <TabsTrigger value="payroll" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7B3BFF] data-[state=active]:to-[#A855F7]">
              <Users className="w-4 h-4 mr-2" />
              Payroll
            </TabsTrigger>
            <TabsTrigger value="accountant" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7B3BFF] data-[state=active]:to-[#A855F7]">
              <UserCircle className="w-4 h-4 mr-2" />
              Accountant
            </TabsTrigger>
            <TabsTrigger value="exports" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7B3BFF] data-[state=active]:to-[#A855F7]">
              <FileText className="w-4 h-4 mr-2" />
              Exports
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="inbox">
              <InboxTab businessId={currentBusiness.id} />
            </TabsContent>
            <TabsContent value="bank">
              <BankReconciliationTab businessId={currentBusiness.id} />
            </TabsContent>
            <TabsContent value="vat">
              <VATSection business={currentBusiness} hasPermission={hasPermission} />
            </TabsContent>
            <TabsContent value="pl">
              <PLTab businessId={currentBusiness.id} />
            </TabsContent>
            <TabsContent value="payroll">
              <PayrollTab businessId={currentBusiness.id} />
            </TabsContent>
            <TabsContent value="accountant">
              <AccountantPortalTab />
            </TabsContent>
            <TabsContent value="exports">
              <ExportsTab businessId={currentBusiness.id} business={currentBusiness} />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}