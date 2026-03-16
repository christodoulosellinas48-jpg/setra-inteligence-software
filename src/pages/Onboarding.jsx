import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import AnimatedLogo from '@/components/ui/AnimatedLogo';
import { 
  Building2, 
  ArrowRight, 
  RefreshCw,
  BarChart3,
  Shield,
  Zap,
  Target,
  FileText,
  LineChart,
  Settings,
  Receipt,
  Plug,
  ClipboardCheck,
  Wallet
} from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [hasBusinesses, setHasBusinesses] = useState(false);

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

      // Set hasBusinesses flag for conditional rendering
      setHasBusinesses(ownedBusinesses.length > 0 || memberships.length > 0);
      setLoading(false);
    } catch (error) {
      console.error('Error checking user status:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#7B3BFF] animate-spin" />
      </div>
    );
  }

  // Show client area if user has businesses
  if (hasBusinesses) {
    return (
      <div className="min-h-screen bg-[#0B0B12] text-white overflow-hidden relative">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7B3BFF]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-[#A855F7]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 py-16 md:py-24">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 flex justify-center"
          >
            <AnimatedLogo className="h-16 md:h-20" />
          </motion.div>

          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Welcome to Your <span className="bg-gradient-to-r from-[#7B3BFF] to-[#C084FC] bg-clip-text text-transparent">Command Center</span>
            </h1>
            <p className="text-xl text-slate-400">
              AI-powered business intelligence at your fingertips
            </p>
          </motion.div>

          {/* Navigation Menu */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto"
          >
            <Button
              onClick={() => navigate(createPageUrl('Dashboard'))}
              className="h-24 text-lg"
            >
              <BarChart3 className="w-6 h-6 mr-3" />
              Dashboard
            </Button>

            <Button
              onClick={() => navigate(createPageUrl('Budgeting'))}
              variant="outline"
              className="h-24 text-lg"
            >
              <Wallet className="w-6 h-6 mr-3" />
              Budgeting
            </Button>

            <Button
              onClick={() => navigate(createPageUrl('Forecasting'))}
              variant="outline"
              className="h-24 text-lg"
            >
              <LineChart className="w-6 h-6 mr-3" />
              Forecasting
            </Button>

            <Button
              onClick={() => navigate(createPageUrl('Reports'))}
              variant="outline"
              className="h-24 text-lg"
            >
              <FileText className="w-6 h-6 mr-3" />
              Reports
            </Button>

            <Button
              onClick={() => navigate(createPageUrl('Audit'))}
              variant="outline"
              className="h-24 text-lg"
            >
              <ClipboardCheck className="w-6 h-6 mr-3" />
              Audit
            </Button>

            <Button
              onClick={() => navigate(createPageUrl('Bookkeeping'))}
              variant="outline"
              className="h-24 text-lg"
            >
              <Receipt className="w-6 h-6 mr-3" />
              Bookkeeping
            </Button>

            <Button
              onClick={() => navigate(createPageUrl('Integrations'))}
              variant="outline"
              className="h-24 text-lg"
            >
              <Plug className="w-6 h-6 mr-3" />
              Integrations
            </Button>

            <Button
              onClick={() => navigate(createPageUrl('Settings'))}
              variant="outline"
              className="h-24 text-lg"
            >
              <Settings className="w-6 h-6 mr-3" />
              Settings
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B12] text-white overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7B3BFF]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-[#A855F7]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-24">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="mb-8 flex justify-center">
            <AnimatedLogo className="h-16 md:h-20" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-[#7B3BFF] to-[#C084FC] bg-clip-text text-transparent">Welcome to SETRA</span>
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
          <div className="bg-[#0B0B12]/80 backdrop-blur-sm border border-[#2A2A3A] rounded-2xl p-6 hover:border-[#7B3BFF]/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 flex items-center justify-center mb-4 shadow-lg shadow-[#7B3BFF]/10">
              <BarChart3 className="w-6 h-6 text-[#C084FC]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Real-Time Intelligence</h3>
            <p className="text-slate-400 text-sm">
              Monitor costs, margins, and performance with enterprise-grade analytics
            </p>
          </div>

          <div className="bg-[#0B0B12]/80 backdrop-blur-sm border border-[#2A2A3A] rounded-2xl p-6 hover:border-[#7B3BFF]/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 flex items-center justify-center mb-4 shadow-lg shadow-[#7B3BFF]/10">
              <Shield className="w-6 h-6 text-[#C084FC]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Financial Control</h3>
            <p className="text-slate-400 text-sm">
              Automated bookkeeping, VAT tracking, and compliance infrastructure
            </p>
          </div>

          <div className="bg-[#0B0B12]/80 backdrop-blur-sm border border-[#2A2A3A] rounded-2xl p-6 hover:border-[#7B3BFF]/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 flex items-center justify-center mb-4 shadow-lg shadow-[#7B3BFF]/10">
              <Zap className="w-6 h-6 text-[#C084FC]" />
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
          <div className="bg-gradient-to-r from-[#7B3BFF]/10 to-[#A855F7]/10 border border-[#7B3BFF]/20 rounded-2xl p-8 max-w-2xl mx-auto backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to get started?</h2>
            <p className="text-slate-400 mb-6">
              Create your first business profile to unlock SETRA's AI-powered intelligence platform
            </p>
            <Button
              onClick={() => navigate(createPageUrl('CreateBusiness'))}
              className="px-8 py-6 text-lg"
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