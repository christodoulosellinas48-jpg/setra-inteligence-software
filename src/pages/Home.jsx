import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Check,
  Sparkles,
  Zap
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A14] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0f2e] via-[#0A0A14] to-[#0A0A14]" />
        {/* Particle stars */}
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.2
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1]
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
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
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
            <div className="hidden md:flex items-center gap-6 text-sm">
              <a href="#features" className="text-slate-400 hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</a>
              <a href="#resources" className="text-slate-400 hover:text-white transition-colors">Resources</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => navigate(createPageUrl('Onboarding'))}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Start Free
            </Button>
            <Button variant="outline">Book Demo</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 py-20">
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text & Features */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="space-y-6 mb-8">
                  <div className="flex items-center gap-2 text-[#C084FC]">
                    <Check className="w-5 h-5" />
                    <span className="text-sm font-medium">Analyze Costs</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#C084FC]">
                    <Check className="w-5 h-5" />
                    <span className="text-sm font-medium">Automate Workflows</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#C084FC]">
                    <Check className="w-5 h-5" />
                    <span className="text-sm font-medium">Power Intelligent Operations</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Center - 3D Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative flex items-center justify-center"
            >
              <div className="relative">
                {/* Hexagon glow */}
                <div className="absolute inset-0 blur-3xl opacity-50">
                  <div className="w-80 h-80 mx-auto bg-gradient-to-br from-[#7B3BFF] to-[#A855F7] rounded-full" />
                </div>
                {/* Logo */}
                <img 
                  src="https://media.base44.com/images/public/698f4ecdefcf4d820e54e33f/50df0face_EEEE413D-A65A-4B84-A6CE-9F681EADF652.png"
                  alt="SETRA 3D"
                  className="relative h-80 mx-auto"
                  style={{ 
                    filter: "drop-shadow(0 0 60px rgba(123,59,255,0.8)) drop-shadow(0 0 30px rgba(168,85,247,0.6))"
                  }}
                />
              </div>
            </motion.div>
          </div>

          {/* Headline Below */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mt-16"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              AI Platform for Business Operations
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Fine-tuned AI engine to optimize and automate your business processes
            </p>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Preview Cards */}
      <section className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* AI Engine Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="bg-[#151528]/60 backdrop-blur-xl border-[#7B3BFF]/30 p-6 h-full">
                <div className="relative mb-4">
                  <div className="w-20 h-20 mx-auto relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#7B3BFF]/40 to-[#A855F7]/40 rounded-2xl blur-xl" />
                    <div className="relative w-full h-full bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 rounded-2xl flex items-center justify-center border border-[#7B3BFF]/30">
                      <Zap className="w-10 h-10 text-[#C084FC]" />
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">AI Engine</h3>
                  <div className="h-2 bg-[#7B3BFF]/20 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[#7B3BFF] to-[#A855F7]"
                      initial={{ width: 0 }}
                      whileInView={{ width: '75%' }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Cost Analysis Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="bg-[#151528]/60 backdrop-blur-xl border-[#7B3BFF]/30 p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm text-slate-400">Cost Analysis</h3>
                  <span className="text-xs text-emerald-400">+82% ON TARGET</span>
                </div>
                <div className="mb-2">
                  <div className="text-3xl font-bold text-white">€524,800</div>
                  <div className="text-xs text-slate-500">Total expenditure</div>
                </div>
                <div className="h-24 flex items-end gap-1">
                  {[40, 60, 45, 70, 55, 80, 65, 90, 75, 85].map((height, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-[#7B3BFF] to-[#A855F7] rounded-t opacity-70" style={{ height: `${height}%` }} />
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Automation Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="bg-[#151528]/60 backdrop-blur-xl border-[#7B3BFF]/30 p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm text-slate-400">Automation</h3>
                  <span className="text-xs text-emerald-400">+55% ON TARGET</span>
                </div>
                <div className="mb-2">
                  <div className="text-3xl font-bold text-white">€ 130,620 <span className="text-sm text-slate-500">/ year</span></div>
                  <div className="text-xs text-slate-500">Improved</div>
                </div>
                <div className="h-24 flex items-end gap-1">
                  {[30, 40, 50, 35, 60, 45, 70, 55, 65, 80].map((height, i) => (
                    <div key={i} className="flex-1 rounded-t" style={{ 
                      height: `${height}%`,
                      background: i % 2 === 0 ? 'linear-gradient(to top, #7B3BFF, #A855F7)' : 'rgba(123, 59, 255, 0.3)'
                    }} />
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Integration Logos Footer */}
      <section className="relative py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-40">
            <span className="text-slate-500 text-sm">AWS</span>
            <span className="text-slate-500 text-sm">Slack</span>
            <span className="text-slate-500 text-sm">Shopify</span>
            <span className="text-slate-500 text-sm">Notion</span>
          </div>
        </div>
      </section>
    </div>
  );
}