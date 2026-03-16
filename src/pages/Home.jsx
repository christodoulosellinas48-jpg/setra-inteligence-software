import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  ClipboardCheck, 
  Wallet, 
  Receipt, 
  LineChart, 
  BarChart3, 
  ArrowRight,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AnimatedLogo from '@/components/ui/AnimatedLogo';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0B0B12] text-white overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#7B3BFF]/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-[#A855F7]/8 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-[500px] h-[500px] bg-[#C084FC]/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-24">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#7B3BFF]/10 border border-[#7B3BFF]/20 rounded-full mb-8 backdrop-blur-sm"
          >
            <Zap className="w-4 h-4 text-[#C084FC]" />
            <span className="text-sm text-[#C084FC] font-medium">AI-Powered • Secure • Fast • Scalable</span>
          </motion.div>

          <div className="mb-8 flex justify-center">
            <div className="flex flex-col items-center gap-3">
              <AnimatedLogo className="h-20 md:h-24" />
              <div className="flex flex-col items-center">
                <h1 className="text-4xl md:text-5xl font-bold text-white">SETRA</h1>
                <p className="text-sm text-slate-400 uppercase tracking-wider mt-1">Infrastructure Platform</p>
              </div>
            </div>
          </div>
          
          <p className="text-2xl md:text-3xl text-[#C084FC] font-medium mb-4">
            AI Command Center
          </p>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Transform your business with AI-powered financial control, automated bookkeeping, and real-time operational insights.
          </p>

          <Link to={createPageUrl('Onboarding')}>
            <Button className="px-8 py-6 text-lg">
              Enter Platform
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <FeatureCard
            icon={Receipt}
            title="Bookkeeping Automation"
            description="Automated invoice processing, VAT governance, and compliance infrastructure."
            delay={0.1}
          />
          
          <FeatureCard
            icon={ClipboardCheck}
            title="Audit Engine"
            description="Operational diagnostics for pricing, cost structures, and margin optimization."
            delay={0.2}
          />
          
          <FeatureCard
            icon={Wallet}
            title="Cost Control"
            description="Budget governance, expense monitoring, and performance benchmarking."
            delay={0.3}
          />
          
          <FeatureCard
            icon={LineChart}
            title="Financial Intelligence"
            description="Predictive analytics, scenario modeling, and profitability forecasting."
            delay={0.4}
          />
          
          <FeatureCard
            icon={BarChart3}
            title="Performance Analytics"
            description="Real-time dashboards, financial reporting, and operational intelligence."
            delay={0.5}
          />
          
          <FeatureCard
            icon={Zap}
            title="Enterprise Control"
            description="Multi-unit systems, organizational oversight, and scalable infrastructure."
            delay={0.6}
          />
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="text-center mt-20"
        >
          <p className="text-slate-500 text-sm">
            Trusted by cafés, restaurants, bars, and hospitality businesses across Cyprus
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#7B3BFF]/10 to-[#A855F7]/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative bg-[#151528]/80 backdrop-blur-xl border border-white/5 hover:border-[#7B3BFF]/50 rounded-2xl p-6 h-full transition-all duration-300 hover:shadow-[0_0_40px_rgba(123,59,255,0.2)]">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-[#7B3BFF]/10">
          <Icon className="w-6 h-6 text-[#C084FC]" />
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#C084FC] transition-colors">
          {title}
        </h3>
        
        <p className="text-slate-400 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}