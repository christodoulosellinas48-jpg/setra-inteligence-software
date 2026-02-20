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

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-8"
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-300 font-medium">Operational & Financial Intelligence Platform</span>
          </motion.div>

          <div className="mb-8">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698f4ecdefcf4d820e54e33f/a667c0b9f_ChatGPTImage20202610_05_09.png"
              alt="SETRA"
              className="h-24 md:h-32 mx-auto"
            />
          </div>
          
          <p className="text-2xl md:text-3xl text-cyan-400 font-medium mb-4">
            Where Operations Meet Profit.
          </p>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Structured control over costs, performance, and profitability by connecting operational data with financial outcomes.
          </p>

          <Link to={createPageUrl('Onboarding')}>
            <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-8 py-6 text-lg shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-105">
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
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 hover:border-cyan-500/30 rounded-2xl p-6 h-full transition-all duration-300">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-6 h-6 text-cyan-400" />
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-300 transition-colors">
          {title}
        </h3>
        
        <p className="text-slate-400 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}