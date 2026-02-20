import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  ArrowRight, 
  RefreshCw,
  BarChart3,
  Shield,
  Zap
} from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Check if user has any businesses
      const ownedBusinesses = await base44.entities.Business.filter({ 
        owner_email: currentUser.email 
      });

      const memberships = await base44.entities.BusinessMember.filter({ 
        user_email: currentUser.email,
        invitation_status: 'accepted'
      });

      // If user has businesses, go directly to dashboard
      if (ownedBusinesses.length > 0 || memberships.length > 0) {
        navigate(createPageUrl('Dashboard'));
      } else {
        // New user - show onboarding
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking user status:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-24">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698f4ecdefcf4d820e54e33f/a667c0b9f_ChatGPTImage20202610_05_09.png"
              alt="SETRA"
              className="h-20 md:h-24 mx-auto"
            />
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome to SETRA
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-2">
            Where Operations Meet Profit
          </p>
          
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Let's set up your business and unlock operational & financial intelligence
          </p>
        </motion.div>

        {/* Value Props */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Real-Time Intelligence</h3>
            <p className="text-slate-400 text-sm">
              Monitor costs, margins, and performance with enterprise-grade analytics
            </p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Financial Control</h3>
            <p className="text-slate-400 text-sm">
              Automated bookkeeping, VAT tracking, and compliance infrastructure
            </p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Profit Optimization</h3>
            <p className="text-slate-400 text-sm">
              AI-powered audits to identify profit leaks and optimization opportunities
            </p>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to get started?</h2>
            <p className="text-slate-400 mb-6">
              Create your first business profile to unlock SETRA's full operational intelligence platform
            </p>
            <Button
              onClick={() => navigate(createPageUrl('CreateBusiness'))}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-8 py-6 text-lg shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-105"
            >
              Create Your Business
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}