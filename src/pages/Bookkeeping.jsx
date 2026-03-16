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
  ArrowLeft,
  Receipt,
  CreditCard,
  Percent,
  TrendingUp,
  Users,
  UserCircle,
  FileText,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { BusinessProvider, useBusiness } from '@/components/business/BusinessContext';

import InboxTab from '@/components/bookkeeping/InboxTab';
import BankReconciliationTab from '@/components/bookkeeping/BankReconciliationTab';
import VATCenterTab from '@/components/bookkeeping/VATCenterTab';
import PLTab from '@/components/bookkeeping/PLTab';
import PayrollTab from '@/components/bookkeeping/PayrollTab';
import AccountantPortalTab from '@/components/bookkeeping/AccountantPortalTab';
import ExportsTab from '@/components/bookkeeping/ExportsTab';

function BookkeepingContent() {
  const navigate = useNavigate();
  const { currentBusiness, loading } = useBusiness();
  const [activeTab, setActiveTab] = useState('inbox');

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
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">No Business Selected</h1>
          <p className="text-slate-400 mb-8">
            Please select a business to access bookkeeping features.
          </p>
          <Button 
            onClick={() => navigate(createPageUrl('Dashboard'))}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Go to Dashboard
          </Button>
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
              <Button
                variant="ghost"
                onClick={() => navigate(createPageUrl('Dashboard'))}
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-[#C084FC]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Bookkeeping</h1>
                <p className="text-sm text-slate-500">{currentBusiness.name}</p>
              </div>
            </div>
            
            {/* Compliance Note for Ltd */}
            {currentBusiness.entity_type === 'ltd' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-amber-400">
                  Ltd: Statutory audit requires licensed auditor sign-off
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-7 gap-2 bg-slate-900/50 p-2 rounded-xl">
            <TabsTrigger value="inbox" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7B3BFF] data-[state=active]:to-[#A855F7]">
              <Inbox className="w-4 h-4 mr-2" />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="bank" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7B3BFF] data-[state=active]:to-[#A855F7]">
              <CreditCard className="w-4 h-4 mr-2" />
              Bank
            </TabsTrigger>
            <TabsTrigger value="vat" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7B3BFF] data-[state=active]:to-[#A855F7]">
              <Percent className="w-4 h-4 mr-2" />
              VAT
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
              <VATCenterTab businessId={currentBusiness.id} business={currentBusiness} />
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

export default function Bookkeeping() {
  return (
    <BusinessProvider>
      <BookkeepingContent />
    </BusinessProvider>
  );
}