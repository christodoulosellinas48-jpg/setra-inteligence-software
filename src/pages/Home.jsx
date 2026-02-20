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
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-full mb-8"
          >
            <Sparkles className="w-4 h-4 text-rose-400" />
            <span className="text-sm text-rose-300 font-medium">Hospitality Financial Intelligence</span>
          </motion.div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Ellinas
            </span>
            <br />
            <span className="bg-gradient-to-r from-rose-400 to-red-600 bg-clip-text text-transparent">
              THE SETTING
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Complete financial control for hospitality businesses. From real-time bookkeeping to AI-powered audits.
          </p>

          <Link to={createPageUrl('Dashboard')}>
            <Button className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white px-8 py-6 text-lg shadow-lg shadow-rose-500/25 transition-all duration-300 hover:scale-105">
              Enter Dashboard
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
            title="Smart Bookkeeping"
            description="AI-powered invoice parsing, VAT tracking, and Cyprus tax compliance."
            delay={0.1}
          />
          
          <FeatureCard
            icon={ClipboardCheck}
            title="Profit Audits"
            description="Identify profit leaks in pricing, food costs, menu engineering, and labor."
            delay={0.2}
          />
          
          <FeatureCard
            icon={Wallet}
            title="Budget Planning"
            description="Set targets, track spending, and analyze budget vs actual performance."
            delay={0.3}
          />
          
          <FeatureCard
            icon={LineChart}
            title="Forecasting"
            description="Scenario-based projections for revenue, expenses, and cash flow."
            delay={0.4}
          />
          
          <FeatureCard
            icon={BarChart3}
            title="Financial Reports"
            description="Visual insights with P&L, expense breakdowns, and trend analysis."
            delay={0.5}
          />
          
          <FeatureCard
            icon={Sparkles}
            title="AI-Powered Insights"
            description="Get intelligent recommendations to optimize margins and costs."
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
      <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-red-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 hover:border-rose-500/30 rounded-2xl p-6 h-full transition-all duration-300">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-red-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-6 h-6 text-rose-400" />
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-rose-300 transition-colors">
          {title}
        </h3>
        
        <p className="text-slate-400 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}