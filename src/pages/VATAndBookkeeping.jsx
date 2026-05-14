import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  ShieldAlert,
  BookOpen,
  Download,
  CheckCircle2,
  Clock
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
      <Card className="bg-[#151528]/80 border-white/5 p-8 max-w-lg mx-auto mt-8">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-5">
          <AlertCircle className="w-7 h-7 text-amber-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">VAT Not Registered</h2>
        <p className="text-slate-400 text-sm mb-5">
          You haven't enabled VAT registration for this business. Turning it on unlocks:
        </p>
        <ul className="space-y-2 mb-6">
          {[
            'Automatic VAT period calculations (input vs output)',
            'Filing-ready reports for the Cyprus tax authority',
            'Audit-pack generation with full VAT trail',
            'One-click VAT exports for your accountant',
          ].map(item => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-5 text-xs text-blue-300">
          <strong>Not sure if you're VAT-registered?</strong> In Cyprus, businesses with turnover above{' '}
          <strong>€15,600/year</strong> must register.{' '}
          <a href="https://www.mof.gov.cy/mof/vat/vat.nsf/index_en/index_en" target="_blank" rel="noopener noreferrer"
            className="underline hover:text-blue-200">Check Cyprus VAT thresholds →</a>
        </div>
        <Button onClick={() => navigate('/Settings')} className="w-full">
          Enable VAT registration →
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
              Standard Rate: {business.vat_rate ?? 19}%
              {business.default_vat_rates && (() => {
                try {
                  const rates = JSON.parse(business.default_vat_rates);
                  const standardRate = business.vat_rate ?? 19;
                  const reduced = rates.filter(r => typeof r === 'number' && r > 0 && r < standardRate);
                  if (reduced.length === 0) return null;
                  return ' · Reduced: ' + reduced.map(r => `${r}%`).join(', ');
                } catch { return null; }
              })()}
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
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 border border-[#7B3BFF]/20 flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-[#C084FC]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">No Business Selected</h1>
          <p className="text-slate-400 mb-8">Please select a business to access bookkeeping & VAT features.</p>
          <Button onClick={() => navigate('/Dashboard')}>Go to Dashboard</Button>
        </motion.div>
      </div>
    );
  }

  const TAB_CONFIG = [
    { value: 'inbox',      icon: Inbox,        label: 'Inbox',       desc: 'Review & process uploaded documents' },
    { value: 'bank',       icon: CreditCard,   label: 'Bank',        desc: 'Reconcile bank transactions' },
    { value: 'vat',        icon: Percent,      label: 'VAT',         desc: 'Periods, calculator, filing reports' },
    { value: 'pl',         icon: TrendingUp,   label: 'P&L',         desc: 'Profit & loss statement' },
    { value: 'payroll',    icon: Users,        label: 'Payroll',     desc: 'Staff costs & shifts' },
    { value: 'exports',    icon: Download,     label: 'Exports',     desc: 'Download reports & data' },
    { value: 'accountant', icon: UserCircle,   label: 'Accountant',  desc: 'Multi-client portal for accountants' },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      {/* Page Header */}
      <div className="border-b border-white/[0.06] bg-[#0B0B12]/95 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/15 border border-[#7B3BFF]/25 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-[#C084FC]" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-lg font-bold text-white">VAT & Bookkeeping</h1>
                  {currentBusiness.vat_registered && (
                    <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/20 text-[10px] px-2 py-0">
                      <CheckCircle2 className="w-2.5 h-2.5 mr-1" />VAT Registered
                    </Badge>
                  )}
                  {currentBusiness.entity_type === 'ltd' && (
                    <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/20 text-[10px] px-2 py-0">
                      Ltd Company
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{currentBusiness.name} · Financial compliance & bookkeeping</p>
              </div>
            </div>
            {currentBusiness.entity_type === 'ltd' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/25 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-xs text-amber-400/90">Statutory audit requires licensed auditor sign-off</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>

          {/* Premium Tab Navigation */}
          <div className="flex gap-1 p-1 bg-[#0F0F1E] border border-white/[0.06] rounded-2xl overflow-x-auto">
            {TAB_CONFIG.map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#7B3BFF] to-[#A855F7] text-white shadow-lg shadow-[#7B3BFF]/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Active tab description strip */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 mb-5 flex items-center gap-2"
          >
            {(() => {
              const tab = TAB_CONFIG.find(t => t.value === activeTab);
              if (!tab) return null;
              const TabIcon = tab.icon;
              return (
                <>
                  <TabIcon className="w-3.5 h-3.5 text-[#C084FC]" />
                  <span className="text-xs text-slate-500">{tab.desc}</span>
                </>
              );
            })()}
          </motion.div>

          <motion.div
            key={`content-${activeTab}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <TabsContent value="inbox" className="mt-0">
              <InboxTab businessId={currentBusiness.id} />
            </TabsContent>
            <TabsContent value="bank" className="mt-0">
              <BankReconciliationTab businessId={currentBusiness.id} />
            </TabsContent>
            <TabsContent value="vat" className="mt-0">
              <VATSection business={currentBusiness} hasPermission={hasPermission} />
            </TabsContent>
            <TabsContent value="pl" className="mt-0">
              <PLTab businessId={currentBusiness.id} />
            </TabsContent>
            <TabsContent value="payroll" className="mt-0">
              <PayrollTab businessId={currentBusiness.id} />
            </TabsContent>
            <TabsContent value="accountant" className="mt-0">
              <AccountantPortalTab />
            </TabsContent>
            <TabsContent value="exports" className="mt-0">
              <ExportsTab businessId={currentBusiness.id} business={currentBusiness} />
            </TabsContent>
          </motion.div>
        </Tabs>
      </main>
    </div>
  );
}