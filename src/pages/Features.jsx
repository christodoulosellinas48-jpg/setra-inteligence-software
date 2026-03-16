import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  BarChart3, Receipt, TrendingUp, FileText, Target, 
  Wallet, Plug, Settings, ClipboardCheck, LineChart,
  Shield, Zap, ArrowRight, CheckCircle2
} from 'lucide-react';

export default function Features() {
  const navigate = useNavigate();

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
      gradient: "from-[#7B3BFF] to-[#A855F7]"
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
        "Export-ready accounting packages"
      ],
      gradient: "from-[#A855F7] to-[#C084FC]"
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
      gradient: "from-[#7B3BFF] to-[#8B5CF6]"
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
      gradient: "from-[#8B5CF6] to-[#A855F7]"
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
      gradient: "from-[#C084FC] to-[#E9D5FF]"
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
      gradient: "from-[#7B3BFF] to-[#9333EA]"
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
      gradient: "from-[#A855F7] to-[#C084FC]"
    },
    {
      icon: Plug,
      title: "Integrations",
      description: "Connect your POS, accounting, and business tools seamlessly",
      details: [
        "POS system integrations",
        "Accounting software sync",
        "Bank feed connections",
        "Payroll system links",
        "API access for custom integrations"
      ],
      gradient: "from-[#8B5CF6] to-[#A855F7]"
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
      gradient: "from-[#7B3BFF] to-[#C084FC]"
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
      gradient: "from-[#A855F7] to-[#E9D5FF]"
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
      gradient: "from-[#7B3BFF] to-[#A855F7]"
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
      gradient: "from-[#C084FC] to-[#E9D5FF]"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A14] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0f2e] via-[#0A0A14] to-[#0A0A14]" />
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.3 + 0.1
            }}
            animate={{
              opacity: [0.1, 0.5, 0.1],
              scale: [1, 1.3, 1]
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2
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

      {/* Hero */}
      <section className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-[#7B3BFF] to-[#C084FC] bg-clip-text text-transparent">
                Run Your Business
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              SETRA combines powerful financial tools, AI-driven insights, and automation 
              to give you complete control over your hospitality business operations
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-12 px-6 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-[#151528]/60 backdrop-blur-xl border-[#7B3BFF]/30 p-8 h-full hover:border-[#7B3BFF]/60 transition-all duration-300 group">
                  {/* Icon */}
                  <div className="relative mb-6">
                    <div className="w-16 h-16 relative">
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-20 rounded-2xl blur-xl group-hover:opacity-30 transition-opacity`} />
                      <div className={`relative w-full h-full bg-gradient-to-br ${feature.gradient} opacity-10 rounded-2xl flex items-center justify-center border border-[#7B3BFF]/30 group-hover:scale-110 transition-transform`}>
                        <feature.icon className="w-8 h-8 text-[#E9D5FF]" />
                      </div>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-400 mb-6">{feature.description}</p>

                  {/* Details List */}
                  <ul className="space-y-2">
                    {feature.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-500">
                        <CheckCircle2 className="w-4 h-4 text-[#7B3BFF] mt-0.5 flex-shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Transform Your Business?
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              Join hundreds of hospitality businesses already using SETRA
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button 
                onClick={() => navigate(createPageUrl('Onboarding'))}
                className="px-8 py-6 text-lg"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate(createPageUrl('Dashboard'))}
                className="px-8 py-6 text-lg"
              >
                Client Login
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}