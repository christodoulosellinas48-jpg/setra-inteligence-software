import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import MarketingHeader from '@/components/layout/MarketingHeader';
import { 
  BarChart3, Receipt, TrendingUp, FileText, Target, 
  Wallet, Plug, Settings, ClipboardCheck, LineChart,
  Shield, Zap, ArrowRight, CheckCircle2, Sparkles, ScanLine,
  Store, RefreshCw, ShoppingCart, Boxes
} from 'lucide-react';

export default function Features() {
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState({ basic: false, pro: false, premium: false });

  const STARS = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    left: `${(i * 43 + 7) % 100}%`,
    top: `${(i * 61 + 11) % 100}%`,
    opacity: ((i % 5) * 0.06) + 0.1,
  })), []);

  const tierConfig = {
    basic: { label: 'BASIC', color: 'from-[#7B3BFF] to-[#A855F7]' },
    pro: { label: 'PRO', color: 'from-[#A855F7] to-[#C084FC]' },
    premium: { label: 'PREMIUM', color: 'from-[#C084FC] to-[#E9D5FF]' }
  };

  const features = [
    {
      icon: BarChart3,
      title: "Dashboard",
      description: "Manage everything from a centralized command center with live feed and auto updates",
      details: [
        "Real-time financial metrics and KPIs",
        "Automated data sync from all sources",
        "Health indicators for business performance",
        "Profit simulators and scenario planning",
        "Customizable widgets and insights"
      ],
      gradient: "from-[#7B3BFF] to-[#A855F7]",
      tier: "basic"
    },
    {
      icon: FileText,
      title: "Reports",
      description: "Comprehensive financial reporting and analysis tools",
      details: [
        "P&L statements with custom date ranges",
        "Expense breakdown visualizations",
        "Revenue trend analysis",
        "Financial snapshots and history",
        "Export to PDF and Excel"
      ],
      gradient: "from-[#C084FC] to-[#E9D5FF]",
      tier: "basic"
    },
    {
      icon: Target,
      title: "Cost Control",
      description: "Monitor and optimize your operational expenses in real-time",
      details: [
        "Food cost ratio tracking",
        "Staff cost analysis",
        "Fixed cost monitoring",
        "Supplier management",
        "Break-even analysis"
      ],
      gradient: "from-[#A855F7] to-[#C084FC]",
      tier: "basic"
    },
    {
      icon: Wallet,
      title: "Budgeting",
      description: "Create, track, and optimize budgets against actual performance",
      details: [
        "Smart budget creation from historical data",
        "Real-time budget vs actual tracking",
        "Automated variance alerts",
        "Visual performance dashboards",
        "Monthly and quarterly planning tools"
      ],
      gradient: "from-[#7B3BFF] to-[#8B5CF6]",
      tier: "pro"
    },
    {
      icon: TrendingUp,
      title: "Analytics",
      description: "Deep insights into business performance and trends",
      details: [
        "Profit margin analysis",
        "Revenue trend tracking",
        "Cost structure breakdown",
        "Comparative period analysis",
        "Custom metric dashboards"
      ],
      gradient: "from-[#7B3BFF] to-[#A855F7]",
      tier: "pro"
    },
    {
      icon: LineChart,
      title: "Forecasting",
      description: "AI-powered financial projections and scenario modeling",
      details: [
        "6-month revenue and expense projections",
        "Multi-scenario analysis (optimistic, baseline, conservative)",
        "Growth rate calculations from historical data",
        "Cash flow forecasting",
        "Data-driven decision support"
      ],
      gradient: "from-[#8B5CF6] to-[#A855F7]",
      tier: "pro"
    },
    {
      icon: Plug,
      title: "Setra Connect",
      description: "Connect your POS, accounting, and business tools seamlessly",
      details: [
        "POS integrations: Square, Toast, Lightspeed, Epos Now (more coming)",
        "Accounting sync: Xero, QuickBooks, Sage",
        "Bank feed connections",
        "Payroll system links",
        "API access for custom integrations"
      ],
      gradient: "from-[#8B5CF6] to-[#A855F7]",
      tier: "pro"
    },
    {
      icon: Receipt,
      title: "Bookkeeping",
      description: "Automated financial record-keeping and compliance infrastructure",
      details: [
        "AI-powered document processing and categorization",
        "Automated invoice and receipt parsing",
        "Bank reconciliation with smart matching",
        "VAT tracking and compliance reporting",
        "Export-ready for Xero, QuickBooks, Sage, and CSV"
      ],
      gradient: "from-[#A855F7] to-[#C084FC]",
      tier: "premium"
    },
    {
      icon: ClipboardCheck,
      title: "Audit",
      description: "AI-powered operational audits to identify profit leaks and optimization opportunities",
      details: [
        "Pricing strategy analysis",
        "Food cost and waste tracking",
        "Menu engineering insights",
        "Labor cost optimization",
        "Actionable recommendations with impact estimates"
      ],
      gradient: "from-[#7B3BFF] to-[#9333EA]",
      tier: "premium"
    },
    {
      icon: Shield,
      title: "Compliance",
      description: "Stay compliant with automated regulatory tracking",
      details: [
        "VAT period management",
        "Corporate tax calculations",
        "Audit-ready documentation",
        "Regulatory deadline tracking",
        "Cyprus tax authority compliance"
      ],
      gradient: "from-[#7B3BFF] to-[#C084FC]",
      tier: "premium"
    },
    {
      icon: Zap,
      title: "Automation",
      description: "Reduce manual work with intelligent process automation",
      details: [
        "Automated invoice processing",
        "Smart expense categorization",
        "Scheduled reports and alerts",
        "Bulk operations and imports",
        "Workflow optimization"
      ],
      gradient: "from-[#A855F7] to-[#E9D5FF]",
      tier: "premium"
    },
    {
      icon: Settings,
      title: "Business Management",
      description: "Configure your business settings and team permissions",
      details: [
        "Multi-business support",
        "Team member invitations",
        "Role-based access control",
        "Chart of accounts customization",
        "Industry-specific templates"
      ],
      gradient: "from-[#C084FC] to-[#E9D5FF]",
      tier: "premium"
    },
    {
      icon: Sparkles,
      title: "AI Counselor Chat",
      description: "24/7 AI assistant for business guidance and platform navigation",
      details: [
        "Real-time business insights and recommendations",
        "Personalized guidance based on your data",
        "Quick answers to financial questions",
        "Help navigating platform features",
        "Actionable profit optimization suggestions"
      ],
      gradient: "from-[#7B3BFF] to-[#A855F7]",
      tier: "premium"
    },
    {
      icon: ScanLine,
      title: "Smart Invoice Extraction",
      description: "AI-powered automatic data extraction from invoices and receipts",
      details: [
        "Automatic supplier and date detection",
        "Line item extraction with VAT details",
        "Invoice number and reference capture",
        "Smart expense categorization",
        "Instant data population to bookkeeping"
      ],
      gradient: "from-[#A855F7] to-[#C084FC]",
      tier: "premium"
    },
    {
      icon: Store,
      title: "Vendor Management",
      description: "Centralized supplier directory with spend analysis and relationship tracking",
      details: [
        "Supplier directory auto-populated from invoices",
        "Total spend and invoice count per supplier",
        "Category-based supplier classification",
        "Contact info and last order tracking",
        "Supplier cost impact analysis"
      ],
      gradient: "from-[#7B3BFF] to-[#A855F7]",
      tier: "pro"
    },
    {
      icon: RefreshCw,
      title: "Supply Chain Automation",
      description: "Automate reordering, supplier communication, and inventory reconciliation",
      details: [
        "Auto-create purchase orders when stock is low",
        "Email purchase orders directly to suppliers",
        "Invoice-to-inventory automatic reconciliation",
        "New ingredients auto-added from invoices",
        "Stock levels updated on invoice upload"
      ],
      gradient: "from-[#C084FC] to-[#E9D5FF]",
      tier: "premium"
    },
    {
      icon: ShoppingCart,
      title: "Smart Procurement",
      description: "Streamlined purchase order management with supplier workflow automation",
      details: [
        "Draft purchase orders from reorder thresholds",
        "Send orders to suppliers with one click",
        "Track order status from draft to received",
        "Supplier-grouped order generation",
        "Purchase history and cost tracking"
      ],
      gradient: "from-[#8B5CF6] to-[#A855F7]",
      tier: "pro"
    },
    {
      icon: Boxes,
      title: "Operations Hub",
      description: "A unified command centre for all your day-to-day operational workflows",
      details: [
        "Menu Engineering: profitability & popularity matrix",
        "Purchase Orders: create, send, and track procurement",
        "Vendors & Suppliers: spend analysis and invoice history",
        "Waste Management: log, track, and reduce food waste",
        "Payroll & Staff: shifts, labour costs, and contracts"
      ],
      gradient: "from-[#7B3BFF] to-[#C084FC]",
      tier: "premium"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A14] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0f2e] via-[#0A0A14] to-[#0A0A14]" />
        {STARS.map((star, i) => (
          <div key={i} className="absolute w-1 h-1 bg-purple-400 rounded-full" style={star} />
        ))}
      </div>

      {/* Navigation */}
      <MarketingHeader />

      {/* Hero */}
      <section className="relative py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4 sm:mb-6">
              From menu margin to VAT return —{' '}
              <span className="bg-gradient-to-r from-[#7B3BFF] to-[#C084FC] bg-clip-text text-transparent">
                one platform for the whole back office.
              </span>
            </h1>
            <p className="text-base sm:text-xl text-slate-400 max-w-3xl mx-auto px-4">
              Connect your POS, invoices, and payroll. Setra turns the chaos into clear, daily answers — from dish-level margins to VAT-ready ledgers.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features by Tier */}
      <section className="relative py-8 sm:py-12 px-4 sm:px-6 pb-20 sm:pb-32">
        <div className="max-w-7xl mx-auto space-y-16">
          {[
            { key: 'basic', label: 'Basic', color: 'from-[#7B3BFF] to-[#A855F7]', desc: 'Best for: a single café or bar just getting numbers under control.' },
            { key: 'pro', label: 'Pro', color: 'from-[#A855F7] to-[#C084FC]', desc: 'Best for: growing operators who want to plan, forecast, and dig into margins.' },
            { key: 'premium', label: 'Premium', color: 'from-[#C084FC] to-[#E9D5FF]', desc: 'Best for: multi-venue groups or operators wanting full bookkeeping automation and compliance.' }
          ].map(tier => {
            const tierFeatures = features.filter(f => f.tier === tier.key);
            const visible = showMore[tier.key] ? tierFeatures : tierFeatures.slice(0, 3);
            return (
              <div key={tier.key}>
                {/* Tier Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`bg-gradient-to-r ${tier.color} text-white text-sm font-bold px-4 py-1.5 rounded-full`}>{tier.label}</div>
                  <p className="text-slate-400 text-sm">{tier.desc}</p>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {visible.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      viewport={{ once: true }}
                    >
                      <Card className="bg-[#151528]/60 backdrop-blur-xl border-[#7B3BFF]/30 p-5 sm:p-6 hover:border-[#7B3BFF]/60 transition-all duration-300 group h-full">
                        <div className="flex items-start gap-4 mb-3">
                          <div className="w-10 h-10 relative flex-shrink-0">
                            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-20 rounded-xl blur-lg`} />
                            <div className={`relative w-full h-full bg-gradient-to-br ${feature.gradient} opacity-10 rounded-xl flex items-center justify-center border border-[#7B3BFF]/30`}>
                              <feature.icon className="w-5 h-5 text-[#E9D5FF]" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-white">{feature.title}</h3>
                            <p className="text-xs text-slate-400 mt-0.5">{feature.description}</p>
                          </div>
                        </div>
                        <ul className="space-y-1.5 border-t border-white/10 pt-3">
                          {feature.details.map((detail, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-500">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#7B3BFF] mt-0.5 flex-shrink-0" />
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Show More */}
                {tierFeatures.length > 3 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setShowMore(prev => ({ ...prev, [tier.key]: !prev[tier.key] }))}
                      className="text-sm text-[#A855F7] hover:text-[#C084FC] transition-colors underline underline-offset-4"
                    >
                      {showMore[tier.key] ? `Show less` : `Show ${tierFeatures.length - 3} more features`}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-12 sm:py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
              Join the early access cohort
            </h2>
            <p className="text-base sm:text-lg text-slate-400 mb-6 sm:mb-8 px-4 max-w-xl mx-auto">
              Setra is currently onboarding a small group of independent operators across Cyprus and Europe. Be among the first.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
              <Button 
                onClick={() => navigate('/Dashboard')}
                className="w-full sm:w-auto px-8 py-6 text-base sm:text-lg bg-gradient-to-r from-[#7B3BFF] to-[#A855F7] hover:shadow-[0_0_30px_rgba(123,59,255,0.5)] transition-all"
              >
                Get early access
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/Dashboard')}
                className="w-full sm:w-auto px-8 py-6 text-base sm:text-lg"
              >
                Client login
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}