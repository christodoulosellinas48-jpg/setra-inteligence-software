import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BarChart3, Wallet, TrendingUp, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-4xl space-y-6">

        <h1 className="text-5xl font-extrabold tracking-tight text-emerald-400 sm:text-6xl md:text-7xl">Setting

        </h1>
        <p className="text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Your ultimate financial partner for hospitality businesses. We empower cafés, restaurants, bakeries, and food trucks to gain crystal-clear insights, optimize costs, and maximize profitability.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-10">
          <FeatureCard
            icon={TrendingUp}
            title="Boost Profitability"
            description="Identify key areas for improvement and unlock your business's full earning potential." />

          <FeatureCard
            icon={BarChart3}
            title="Strategic Insights"
            description="Leverage AI-driven analytics to make smarter, data-backed business decisions." />

          <FeatureCard
            icon={Wallet}
            title="Streamlined Management"
            description="Effortlessly track finances, manage expenses, and plan budgets with ease." />

        </div>

        <div className="pt-10">
          <Link to={createPageUrl('Dashboard')}>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-6 text-lg shadow-lg transition-all duration-300 transform hover:scale-105">

              Get Started Now <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>);

}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}>

      <Card className="bg-slate-900/50 border-slate-800 text-center p-6 flex flex-col items-center h-full">
        <CardHeader>
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <Icon className="w-8 h-8 text-emerald-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-white mb-2">{title}</CardTitle>
          <CardDescription className="text-slate-400">{description}</CardDescription>
        </CardHeader>
      </Card>
    </motion.div>);

}