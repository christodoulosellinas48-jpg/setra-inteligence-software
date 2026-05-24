import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import MarketingHeader from '@/components/layout/MarketingHeader';
import { 
  BarChart3, Receipt, TrendingUp, FileText, Target, 
  Wallet, Plug, Settings, ClipboardCheck, LineChart,
  Shield, Zap, ArrowRight, CheckCircle2, Sparkles, ScanLine,
  Store, ShoppingCart, Boxes, Users, ChefHat, Copy
} from 'lucide-react';

const STARS = Array.from({ length: 30 }, (_, i) => ({
  left: `${(i * 43 + 7) % 100}%`,
  top: `${(i * 61 + 11) % 100}%`,
  opacity: ((i % 5) * 0.06) + 0.1,
}));

const TIERS = [
  {
    key: 'starter',
    label: 'Starter',
    price: '€29/mo',
    color: 'from-[#4B6BFF] to-[#7B3BFF]',
    desc: 'Best for: a solo café or bar dipping their toes in.',
    features: [
      { icon: BarChart3, title: 'Dashboard', description: 'Real-time revenue & cost overview with live P&L', details: ['Real-time financial metrics', 'Food, staff & fixed cost tracking', 'Health indicators', 'Stock level alerts'] },
      { icon: FileText, title: 'Reports', description: 'Basic P&L report with expense breakdowns', details: ['Basic P&L statement', 'Expense overview', 'Export to CSV'] },
      { icon: TrendingUp, title: 'Income', description: 'Monthly revenue snapshots to track performance over time', details: ['Monthly revenue logging', 'Period-over-period comparisons', 'Snapshot history'] },
      { icon: Receipt, title: 'Expenses', description: 'Manual invoice and receipt upload with categorisation', details: ['Upload invoices & receipts', 'Manual expense categorisation', 'Supplier name & date tracking'] },
    ]
  },
  {
    key: 'basic',
    label: 'Basic',
    price: '€55/mo',
    color: 'from-[#7B3BFF] to-[#A855F7]',
    desc: 'Best for: a single café or bar getting numbers under control.',
    features: [
      { icon: Boxes, title: 'Inventory', description: 'Track stock levels, set par levels, and get low-stock alerts', details: ['Real-time stock levels', 'Reorder threshold alerts', 'Unit-cost tracking', 'Supplier linked to items'] },
      { icon: Zap, title: 'Waste Management', description: 'Log and track spoilage to reduce food waste costs', details: ['Waste logging by item', 'Cost-impact calculation', 'Period waste reports'] },
      { icon: Store, title: 'Supplier Directory', description: 'Basic supplier directory auto-populated from invoices', details: ['Contact management', 'Invoice history per supplier', 'Category classification'] },
      { icon: FileText, title: 'Full Reports', description: 'Complete P&L, expense breakdowns, and revenue trends', details: ['Full P&L statements', 'Expense breakdown visualisations', 'Revenue trend analysis', 'Financial snapshots'] },
    ]
  },
  {
    key: 'pro',
    label: 'Pro',
    price: '€99/mo',
    color: 'from-[#A855F7] to-[#C084FC]',
    desc: 'Best for: growing operators who want to plan, forecast, and dig into margins.',
    features: [
      { icon: Wallet, title: 'Budget', description: 'Create, track, and optimise budgets against actual performance', details: ['Smart budget creation from historical data', 'Real-time budget vs actual tracking', 'Automated variance alerts', 'Monthly and quarterly planning'] },
      { icon: LineChart, title: 'Forecast', description: 'AI-powered 6-month financial projections and scenario modelling', details: ['6-month revenue & expense projections', 'Optimistic / baseline / conservative scenarios', 'Cash flow forecasting', 'Growth rate calculations'] },
      { icon: Target, title: 'Menu Engineering', description: 'Popularity vs profitability matrix to optimise your menu', details: ['Star/Plough/Puzzle/Dog matrix', 'Item-level margin analysis', 'Heatmap view', 'Recipe-linked food cost'] },
      { icon: ChefHat, title: 'Recipe Manager', description: 'Ingredient-level food cost calculation per dish', details: ['Recipe → inventory item linking', 'Actual food cost per dish', 'Portion size management', 'Cost % per selling price'] },
      { icon: Store, title: 'Vendors & Suppliers', description: 'Full supplier spend analysis, invoice history, and category tracking', details: ['Spend analysis by supplier', 'Category breakdown', 'Invoice count & last order', 'Dominant-category auto-classification'] },
      { icon: ShoppingCart, title: 'Purchase Orders', description: 'Create, send, and track procurement from draft to received', details: ['Draft POs from reorder thresholds', 'One-click send to supplier', 'Status tracking: draft → sent → received', 'Purchase history'] },
      { icon: Plug, title: 'Integrations', description: 'Connect your POS and accounting tools seamlessly', details: ['POS: Square, Toast, Lightspeed, Epos Now', 'Accounting: Xero, QuickBooks, Sage', 'Automatic data sync', 'Bank feed connections'] },
      { icon: Shield, title: 'Cyprus VAT Management', description: 'VAT period management and compliance deadline tracking', details: ['Auto-generate VAT periods from invoice dates', 'Cyprus quarterly filing deadlines', 'Input/output VAT tracking', 'VAT return preparation'] },
    ]
  },
  {
    key: 'premium',
    label: 'Premium',
    price: '€199/mo',
    color: 'from-[#C084FC] to-[#E9D5FF]',
    desc: 'Best for: multi-venue groups or operators wanting full bookkeeping automation and compliance.',
    features: [
      { icon: ScanLine, title: 'Smart Upload', description: 'AI reads every invoice and auto-fills all fields — supplier, amount, VAT, category', details: ['AI invoice extraction (100% confidence)', 'Line-item VAT parsing', 'Smart expense categorisation', 'Instant posting to ledger'] },
      { icon: Receipt, title: 'Bookkeeping Automation', description: 'Bank reconciliation, ledger automation, and export-ready records', details: ['Smart bank reconciliation', 'Automated ledger entries', 'Export to Xero / QuickBooks / CSV', 'Audit-ready documentation'] },
      { icon: Users, title: 'Payroll', description: 'Employee contracts, shift tracking, and Cyprus employer cost calculation', details: ['Employee contracts & roles', 'Shift & hours tracking', 'Cyprus employer cost multiplier (1.127×)', 'Payroll cycle management'] },
      { icon: ClipboardCheck, title: 'Audit', description: 'AI-powered operational audit to surface profit leaks and opportunities', details: ['Pricing strategy analysis', 'Food cost & waste audit', 'Labour cost optimisation', 'Actionable findings with €-impact estimates'] },
      { icon: Copy, title: 'Duplicate Detector', description: 'Automatically flags duplicate invoices, menu items, and recipes', details: ['Invoice duplicate detection', 'Menu item deduplication', 'Recipe conflict detection', 'One-click resolution'] },
      { icon: Shield, title: 'Full VAT & Tax Compliance', description: 'Complete Cyprus + EU VAT compliance including reverse-charge and TAXISnet export', details: ['Cyprus + EU VAT periods', 'Reverse-charge mechanism', 'Corporate tax calculations', 'TAXISnet-ready export pack'] },
      { icon: Sparkles, title: 'Ask Setra', description: '24/7 AI assistant with real business insights and personalised guidance', details: ['Real-time business insights', 'Personalised margin recommendations', 'Quick answers to financial questions', 'Profit optimisation suggestions'] },
      { icon: Boxes, title: 'Multi-venue', description: 'Up to 5 venues under one account with consolidated reporting', details: ['Up to 5 venues', 'Consolidated P&L across venues', 'Group health dashboard', 'Cross-venue comparison'] },
      { icon: Settings, title: 'Accountant Portal', description: 'Read-only client view, bulk VAT packs, and white-label branding for firms', details: ['Read-only client access', 'Bulk VAT pack generation', 'Scheduled P&L delivery', 'White-label branding'] },
    ]
  },
];

export default function Features() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A14] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0f2e] via-[#0A0A14] to-[#0A0A14]" />
        {STARS.map((star, i) => (
          <div key={i} className="absolute w-1 h-1 bg-purple-400 rounded-full" style={star} />
        ))}
      </div>

      <MarketingHeader />

      {/* Hero */}
      <section className="relative py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4 sm:mb-6">
              From menu margin to VAT return —{' '}
              <span className="bg-gradient-to-r from-[#7B3BFF] to-[#C084FC] bg-clip-text text-transparent">
                one platform for the whole back office.
              </span>
            </h1>
            <p className="text-base sm:text-xl text-slate-400 max-w-3xl mx-auto px-4">
              Every feature below ships in the listed tier. Same product, same data — pick the tier that fits where you are today.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features by Tier */}
      <section className="relative py-8 sm:py-12 px-4 sm:px-6 pb-20 sm:pb-32">
        <div className="max-w-7xl mx-auto space-y-20">
          {TIERS.map(tier => (
            <div key={tier.key}>
              {/* Tier Header */}
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <div className={`bg-gradient-to-r ${tier.color} text-white text-sm font-bold px-4 py-1.5 rounded-full`}>
                  {tier.label}
                </div>
                <span className="text-white font-semibold">{tier.price}</span>
                <span className="text-slate-400 text-sm">·</span>
                <p className="text-slate-400 text-sm">{tier.desc}</p>
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {tier.features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    viewport={{ once: true }}
                  >
                    <Card className="bg-[#151528]/60 backdrop-blur-xl border-[#7B3BFF]/30 p-5 sm:p-6 hover:border-[#7B3BFF]/60 transition-all duration-300 h-full">
                      <div className="flex items-start gap-4 mb-3">
                        <div className="w-10 h-10 relative flex-shrink-0">
                          <div className={`absolute inset-0 bg-gradient-to-br ${tier.color} opacity-20 rounded-xl blur-lg`} />
                          <div className={`relative w-full h-full bg-gradient-to-br ${tier.color} opacity-10 rounded-xl flex items-center justify-center border border-[#7B3BFF]/30`}>
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
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-12 sm:py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">Join the early access cohort</h2>
            <p className="text-base sm:text-lg text-slate-400 mb-6 sm:mb-8 px-4 max-w-xl mx-auto">
              Setra is onboarding a small group of independent operators across Cyprus and Europe. Be among the first.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
              <Button onClick={() => navigate('/Dashboard')} className="w-full sm:w-auto px-8 py-6 text-base sm:text-lg">
                Get early access
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button variant="outline" onClick={() => navigate('/Pricing')} className="w-full sm:w-auto px-8 py-6 text-base sm:text-lg">
                See pricing
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}