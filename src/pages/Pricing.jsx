import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';

export default function Pricing() {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Basic',
      price: 59,
      icon: Zap,
      gradient: 'from-[#7B3BFF] to-[#A855F7]',
      features: [
        'Dashboard: Real-time financial metrics and KPIs',
        'Reports: Standard P&L statements, expense breakdowns',
        'Cost Control: Basic tracking of food and staff costs'
      ]
    },
    {
      name: 'Pro',
      price: 109,
      icon: Sparkles,
      gradient: 'from-[#A855F7] to-[#C084FC]',
      features: [
        'All Basic Plan features',
        'Budgeting: Create, track, and optimize budgets',
        'Analytics: Deeper insights, trend analysis, custom dashboards',
        'Forecasting: 6-month revenue and expense projections',
        'Integrations: Core POS and accounting system integrations'
      ]
    },
    {
      name: 'Premium',
      price: 219,
      icon: Crown,
      gradient: 'from-[#C084FC] to-[#E9D5FF]',
      popular: true,
      features: [
        'All Pro Plan features',
        'Early Access to New Features: Get Menu Costing first',
        'Bookkeeping: Automated invoice/receipt parsing, bank reconciliation',
        'Advanced Forecasting: Multi-scenario analysis, cash flow',
        'Audit: AI-powered operational audits, profit leak identification',
        'Compliance: Full VAT management, corporate tax, regulatory tracking',
        'Automation: Intelligent process automation, workflow optimization',
        'Business Management: Multi-business, team management, role-based access'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A14] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0f2e] via-[#0A0A14] to-[#0A0A14]" />
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.3 + 0.1
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/5 backdrop-blur-xl bg-[#0A0A14]/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div 
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-3 cursor-pointer"
          >
            <img 
              src="https://media.base44.com/images/public/698f4ecdefcf4d820e54e33f/50df0face_EEEE413D-A65A-4B84-A6CE-9F681EADF652.png"
              alt="SETRA"
              className="h-8"
              style={{ filter: "drop-shadow(0 0 10px rgba(123,59,255,0.5))" }}
            />
            <span className="text-xl font-bold text-[#E9D5FF] tracking-widest" style={{ fontFamily: 'monospace, system-ui' }}>
              SETRA
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={() => navigate(createPageUrl('Home'))}
            >
              Back to Home
            </Button>
            <Button onClick={() => navigate(createPageUrl('Dashboard'))}>
              Client Area
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Discover Your{' '}
              <span className="bg-gradient-to-r from-[#7B3BFF] to-[#C084FC] bg-clip-text text-transparent">
                Needs
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-12">
              Choose the perfect plan to transform your hospitality business operations
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative py-12 px-6 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                >
                  <Card className={`bg-[#151528]/60 backdrop-blur-xl border-[#7B3BFF]/30 p-8 h-full hover:border-[#7B3BFF]/60 transition-all duration-300 group relative ${plan.popular ? 'ring-2 ring-[#7B3BFF]/50' : ''}`}>
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <div className="bg-gradient-to-r from-[#7B3BFF] to-[#A855F7] text-white text-xs font-bold px-4 py-1 rounded-full">
                          MOST POPULAR
                        </div>
                      </div>
                    )}

                    {/* Icon */}
                    <div className="relative mb-6">
                      <div className="w-16 h-16 relative mx-auto">
                        <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-20 rounded-2xl blur-xl group-hover:opacity-30 transition-opacity`} />
                        <div className={`relative w-full h-full bg-gradient-to-br ${plan.gradient} opacity-10 rounded-2xl flex items-center justify-center border border-[#7B3BFF]/30 group-hover:scale-110 transition-transform`}>
                          <Icon className="w-8 h-8 text-[#E9D5FF]" />
                        </div>
                      </div>
                    </div>

                    {/* Plan Name & Price */}
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-5xl font-bold text-white">${plan.price}</span>
                        <span className="text-slate-400">/month</span>
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                          <Check className="w-5 h-5 text-[#7B3BFF] mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <Button 
                      onClick={() => navigate(createPageUrl('Onboarding'))}
                      className="w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      Get Started
                    </Button>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ or Additional Info Section */}
      <section className="relative py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Still have questions?
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              Our team is here to help you choose the right plan for your business
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline">
                Contact Sales
              </Button>
              <Button onClick={() => navigate(createPageUrl('Features'))}>
                View All Features
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}