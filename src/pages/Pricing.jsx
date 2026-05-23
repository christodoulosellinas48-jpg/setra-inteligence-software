import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import MarketingHeader from '@/components/layout/MarketingHeader';
import { Check, Minus, Zap, Sparkles, Crown, ChevronDown, ChevronUp } from 'lucide-react';

const STARS = Array.from({ length: 30 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top: `${(i * 53 + 7) % 100}%`,
  opacity: ((i * 17 + 5) % 3) * 0.1 + 0.1,
}));

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    icon: Zap,
    gradient: 'from-[#4B6BFF] to-[#7B3BFF]',
    monthlyPrice: 29,
    annualPrice: 290,
    annualMonthly: 24,
    tagline: '1 venue · 1 user · up to 100 invoices/month',
    description: 'Best for: a solo café or bar dipping their toes in.',
    features: [
      'Dashboard: real-time revenue & cost overview',
      'Basic P&L report',
      'Food & staff cost tracking',
      'Stock level alerts',
    ],
    cta: 'Try free for 14 days',
  },
  {
    key: 'basic',
    name: 'Basic',
    icon: Zap,
    gradient: 'from-[#7B3BFF] to-[#A855F7]',
    monthlyPrice: 55,
    annualPrice: 550,
    annualMonthly: 46,
    tagline: '1 venue · 2 users · up to 500 invoices/month',
    description: 'Best for: a single café or bar getting numbers under control.',
    features: [
      'All Starter features',
      'Full reports & expense breakdowns',
      'Inventory management & reorder alerts',
      'Waste tracking & spoilage logs',
      'Basic supplier directory',
    ],
    cta: 'Try free for 14 days',
  },
  {
    key: 'pro',
    name: 'Pro',
    icon: Sparkles,
    gradient: 'from-[#A855F7] to-[#C084FC]',
    monthlyPrice: 99,
    annualPrice: 990,
    annualMonthly: 82,
    tagline: '1 venue · 5 users · unlimited invoices',
    description: 'Best for: growing operators who want to plan, forecast, and dig into margins.',

    features: [
      'All Basic features',
      'Budgeting: create, track, and optimise budgets',
      'Forecasting: 6-month revenue & expense projections',
      'Menu Engineering: popularity vs profitability heatmap',
      'Recipe Costing: ingredient-level food cost calculation',
      'Vendor Management: supplier spend analysis & POs',
      'POS integrations: Square, Toast, Lightspeed, Epos Now',
      'Accounting sync: Xero, QuickBooks, Sage',
      'Cyprus VAT period management',
    ],
    cta: 'Try free for 14 days',
  },
  {
    key: 'premium',
    name: 'Premium',
    icon: Crown,
    gradient: 'from-[#C084FC] to-[#E9D5FF]',
    monthlyPrice: 199,
    annualPrice: 1990,
    annualMonthly: 166,
    tagline: 'Up to 5 venues · unlimited users · all features',
    description: 'Best for: multi-venue groups or operators wanting full bookkeeping automation and compliance.',
    features: [
      'All Pro features',
      'AI Invoice Extraction: auto-parse invoices & receipts',
      'Bookkeeping: bank reconciliation & ledger automation',
      'Payroll: employee contracts, shift tracking, labour costs',
      'Audit: AI-powered profit-leak identification',
      'Full VAT & corporate tax compliance (Cyprus + EU)',
      'AI Counselor Chat: 24/7 personalised business assistant',
      'Multi-venue & role-based team access (up to 5 venues)',
      'Direct line to the founder — monthly check-in & priority support',
    ],
    cta: 'Try free for 14 days',
  },
];

const COMPARISON = [
  { label: 'Dashboard & Reports', starter: true, basic: true, pro: true, premium: true },
  { label: 'Cost Control', starter: true, basic: true, pro: true, premium: true },
  { label: 'Inventory & Waste', starter: false, basic: true, pro: true, premium: true },
  { label: 'Budgeting', starter: false, basic: false, pro: true, premium: true },
  { label: 'Forecasting', starter: false, basic: false, pro: true, premium: true },
  { label: 'Menu Engineering', starter: false, basic: false, pro: true, premium: true },
  { label: 'Vendor Management & POs', starter: false, basic: false, pro: true, premium: true },
  { label: 'POS & Accounting Integrations', starter: false, basic: false, pro: true, premium: true },
  { label: 'Cyprus VAT Management', starter: false, basic: false, pro: true, premium: true },
  { label: 'AI Invoice Extraction', starter: false, basic: false, pro: false, premium: true },
  { label: 'Bookkeeping Automation', starter: false, basic: false, pro: false, premium: true },
  { label: 'Payroll', starter: false, basic: false, pro: false, premium: true },
  { label: 'Audit & Compliance', starter: false, basic: false, pro: false, premium: true },
  { label: 'AI Counselor Chat', starter: false, basic: false, pro: false, premium: true },
  { label: 'Multi-venue (up to 5)', starter: false, basic: false, pro: false, premium: true },
];

const FAQS = [
  {
    q: 'How long does setup take?',
    a: 'About 20 minutes if your POS and accounting are on our integration list. I\'ll walk you through it personally on a quick call if you want.',
  },
  {
    q: 'What POS systems do you support today?',
    a: 'Square, Toast, Lightspeed, and Epos Now. Clover and Revel are coming Q3. Not on the list? Email me — I can usually add new integrations in 1–2 weeks for early customers.',
  },
  {
    q: 'Do you handle Cyprus VAT?',
    a: 'Yes. Pro and Premium include full Cyprus tax authority compliance, VAT period management, and VAT return preparation.',
  },
  {
    q: 'Can I export my data if I leave?',
    a: 'Absolutely — at any time, in CSV or Xero/QuickBooks-ready formats. Your data is always yours.',
  },
  {
    q: 'Can I add more venues later?',
    a: 'Yes. Switch to Premium any time for up to 5 venues. Running more than 5? Email me and we\'ll put together a custom plan.',
  },
  {
    q: 'Is there a setup fee?',
    a: 'No. Just monthly or annual, nothing else. No per-user gotchas, no surprise overages.',
  },
  {
    q: 'What if my POS isn\'t on your list?',
    a: 'Email chris@setra.app — we can usually add new POS integrations in 1–2 weeks for early customers.',
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left text-white font-medium hover:text-[#C084FC] transition-colors gap-4"
      >
        <span>{q}</span>
        {open ? <ChevronUp className="w-4 h-4 flex-shrink-0 text-[#7B3BFF]" /> : <ChevronDown className="w-4 h-4 flex-shrink-0 text-slate-400" />}
      </button>
      {open && (
        <p className="pb-4 text-slate-400 text-sm leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export default function Pricing() {
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A14] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0f2e] via-[#0A0A14] to-[#0A0A14]" />
        {STARS.map((s, i) => (
          <div key={i} className="absolute w-1 h-1 bg-purple-400 rounded-full" style={s} />
        ))}
      </div>

      <MarketingHeader />

      {/* Hero */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-[#7B3BFF] to-[#C084FC] bg-clip-text text-transparent">Pricing</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-6">
              Plans for a single café, a growing bistro group, and multi-venue operators. Pick one, switch any time.
            </p>
            {/* Free trial banner */}
            <div className="inline-flex items-center gap-2 bg-[#7B3BFF]/10 border border-[#7B3BFF]/30 rounded-full px-5 py-2 text-sm text-[#C084FC] font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-[#7B3BFF] inline-block animate-pulse" />
              Try Setra free for 14 days — no credit card, cancel any time
            </div>

            {/* Annual / Monthly toggle */}
            <div className="flex items-center justify-center gap-3">
              <span className={`text-sm font-medium ${!annual ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
              <button
                onClick={() => setAnnual(!annual)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${annual ? 'bg-[#7B3BFF]' : 'bg-[#2A2A3A]'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${annual ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
              <span className={`text-sm font-medium ${annual ? 'text-white' : 'text-slate-400'}`}>
                Annual
                <span className="ml-1.5 bg-[#7B3BFF]/20 text-[#C084FC] text-xs px-2 py-0.5 rounded-full">2 months free</span>
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative py-4 sm:py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
            {PLANS.map((plan, index) => {
              const Icon = plan.icon;
              const price = annual ? plan.annualMonthly : plan.monthlyPrice;
              return (
                <motion.div
                  key={plan.key}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="h-full"
                >
                  <Card className="relative bg-[#151528]/70 backdrop-blur-xl border-[#7B3BFF]/20 p-6 h-full flex flex-col hover:border-[#7B3BFF]/50 transition-all duration-300 group">

                    {/* Icon */}
                    <div className="w-12 h-12 mb-4 mx-auto relative">
                      <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-20 rounded-xl blur-lg group-hover:opacity-40 transition-opacity`} />
                      <div className={`relative w-full h-full bg-gradient-to-br ${plan.gradient} opacity-10 rounded-xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-[#E9D5FF]" />
                      </div>
                    </div>

                    {/* Name & Price */}
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                      <div className="flex items-baseline justify-center gap-1 mb-1">
                        <span className="text-4xl font-bold text-white">€{price}</span>
                        <span className="text-slate-400 text-sm">/mo</span>
                      </div>
                      {annual && (
                        <p className="text-xs text-[#C084FC]">€{plan.annualPrice}/year — 2 months free</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1.5">{plan.tagline}</p>
                      <p className="text-xs text-slate-400 mt-1 italic">{plan.description}</p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-[#7B3BFF] mt-0.5 flex-shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => navigate('/Dashboard')}
                      className="w-full"
                      variant={plan.recommended ? 'default' : 'outline'}
                    >
                      {plan.cta}
                    </Button>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Enterprise note */}
          <p className="text-center text-slate-500 text-sm mt-5">
            More than 5 venues?{' '}
            <a href="mailto:chris@setra.app" className="text-[#A855F7] hover:underline">Contact us for a custom plan.</a>
          </p>
        </div>
      </section>

      {/* Pricing Promise */}
      <section className="relative py-10 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#151528]/60 border border-[#7B3BFF]/20 rounded-2xl p-6 text-center">
            <h3 className="text-white font-semibold mb-2">Our pricing promise</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              No setup fees. No per-user pricing inside a tier. No surprise overages. Cancel any time with one click. Your data is yours — export it whenever you want.
            </p>
          </div>
        </div>
      </section>

      {/* ROI framing */}
      <section className="relative py-4 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#7B3BFF]/8 border border-[#7B3BFF]/20 rounded-2xl p-5 text-center">
            <p className="text-slate-300 text-sm leading-relaxed">
              <span className="text-white font-medium">Pro pays for itself </span>
              if Setra catches a single 1.5% food cost slip on €5,000/month of purchases.
              That's a €75 saving on a €99/month subscription.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="relative py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8">Compare tiers</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-slate-400 font-medium py-3 pr-4 min-w-[180px]">Feature</th>
                    {PLANS.map(p => (
                      <th key={p.key} className="text-center text-white font-semibold py-3 px-3 min-w-[80px]">{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="text-slate-300 py-3 pr-4">{row.label}</td>
                      {PLANS.map(p => (
                        <td key={p.key} className="text-center py-3 px-3">
                          {row[p.key]
                            ? <Check className="w-4 h-4 text-[#7B3BFF] mx-auto" />
                            : <Minus className="w-4 h-4 text-slate-700 mx-auto" />
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Talk to the founder */}
      <section className="relative py-12 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Talk to the founder</h2>
            <p className="text-slate-400 mb-2">
              I'm Chris, the person building Setra. I personally onboard every operator. If you have questions about pricing, integrations, or whether Setra is right for you — just email me directly.
            </p>
            <p className="text-slate-500 text-sm mb-8">No sales team. No ticket queue. Just a straight answer.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                asChild
                className="w-full sm:w-auto"
              >
                <a href="mailto:chris@setra.app">Email Chris</a>
              </Button>
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate('/Features')}>
                View all features
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-12 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8">Frequently asked questions</h2>
            <div className="bg-[#151528]/60 border border-[#7B3BFF]/20 rounded-2xl px-6">
              {FAQS.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}