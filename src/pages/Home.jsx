import React, { useState, useEffect } from 'react';
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
  const [typedText1, setTypedText1] = useState('');
  const [typedText2, setTypedText2] = useState('');
  const [breathCount, setBreathCount] = useState(0);
  const text1 = 'Transforming Financial Chaos';
  const text2 = 'into Strategic Control';

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= text1.length) {
        setTypedText1(text1.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 50);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      let index = 0;
      const timer = setInterval(() => {
        if (index <= text2.length) {
          setTypedText2(text2.slice(0, index));
          index++;
        } else {
          clearInterval(timer);
        }
      }, 50);
      return () => clearInterval(timer);
    }, text1.length * 50 + 200);
    return () => clearTimeout(delay);
  }, []);

  useEffect(() => {
    if (breathCount < 5) {
      const timer = setTimeout(() => {
        setBreathCount(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [breathCount]);

  return (
    <div className="min-h-screen bg-[#0A0A14] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0f2e] via-[#0A0A14] to-[#0A0A14]" />
        {/* Particle stars */}
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.2
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/5 backdrop-blur-xl bg-[#0A0A14]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-8">
            <div className="flex items-center gap-2 sm:gap-3">
            <motion.img 
              src="https://media.base44.com/images/public/698f4ecdefcf4d820e54e33f/50df0face_EEEE413D-A65A-4B84-A6CE-9F681EADF652.png"
              alt="SETRA"
              className="h-6 sm:h-8"
              animate={{
                filter: breathCount < 5 
                  ? [
                      "drop-shadow(0 0 10px rgba(123,59,255,0.5))",
                      "drop-shadow(0 0 25px rgba(123,59,255,0.9))",
                      "drop-shadow(0 0 10px rgba(123,59,255,0.5))"
                    ]
                  : [
                      "drop-shadow(0 0 10px rgba(123,59,255,0.5))",
                      "drop-shadow(0 0 20px rgba(123,59,255,0.7))",
                      "drop-shadow(0 0 10px rgba(123,59,255,0.5))"
                    ]
              }}
              transition={{
                duration: breathCount < 5 ? 0.8 : 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
              <span className="text-lg sm:text-xl font-bold text-[#E9D5FF] tracking-widest" style={{ fontFamily: 'monospace, system-ui' }}>
                SETRA
              </span>
            </div>
            <div className="hidden lg:flex items-center gap-6 text-sm">
              <button 
                onClick={() => navigate(createPageUrl('Features'))}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => navigate(createPageUrl('Pricing'))}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Pricing
              </button>
              <a href="#resources" className="text-slate-400 hover:text-white transition-colors">Resources</a>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              onClick={() => navigate(createPageUrl('Onboarding'))}
              className="gap-2"
              size="sm"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Start Free</span>
              <span className="sm:hidden">Start</span>
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:flex">Book Demo</Button>
            <Button 
              variant="outline"
              onClick={() => navigate(createPageUrl('Dashboard'))}
              size="sm"
            >
              <span className="hidden sm:inline">Client Area</span>
              <span className="sm:hidden">Login</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            {/* Left Side - Text & Features */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
                  <div className="flex items-center gap-2 text-[#C084FC]">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm font-medium">Analyze Costs</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#C084FC]">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm font-medium">Automate Workflows</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#C084FC]">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm font-medium">Power Intelligent Operations</span>
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
                {/* Hexagon glow layers */}
                <div className="absolute inset-0 blur-[100px] opacity-20">
                  <div className="w-72 h-72 mx-auto bg-gradient-to-br from-[#5B1FBF] via-[#7B3BFF] to-transparent rounded-full" />
                </div>
                <div className="absolute inset-0 blur-[60px] opacity-15">
                  <div className="w-64 h-64 mx-auto bg-gradient-to-br from-[#7B3BFF] to-transparent rounded-full" />
                </div>
                <div className="absolute inset-0 blur-[40px] opacity-10">
                  <div className="w-56 h-56 mx-auto bg-[#8B4BFF] rounded-full" />
                </div>
                {/* Logo */}
                <motion.img 
                  src="https://media.base44.com/images/public/698f4ecdefcf4d820e54e33f/50df0face_EEEE413D-A65A-4B84-A6CE-9F681EADF652.png"
                  alt="SETRA 3D"
                  className="relative h-48 sm:h-64 mx-auto opacity-90"
                  animate={{
                    filter: breathCount < 5 
                      ? [
                          "drop-shadow(0 0 40px rgba(123,59,255,0.7)) drop-shadow(0 0 20px rgba(168,85,247,0.5)) drop-shadow(0 0 10px rgba(192,132,252,0.4))",
                          "drop-shadow(0 0 60px rgba(123,59,255,1)) drop-shadow(0 0 30px rgba(168,85,247,0.8)) drop-shadow(0 0 15px rgba(192,132,252,0.6))",
                          "drop-shadow(0 0 40px rgba(123,59,255,0.7)) drop-shadow(0 0 20px rgba(168,85,247,0.5)) drop-shadow(0 0 10px rgba(192,132,252,0.4))"
                        ]
                      : [
                          "drop-shadow(0 0 40px rgba(123,59,255,0.7)) drop-shadow(0 0 20px rgba(168,85,247,0.5)) drop-shadow(0 0 10px rgba(192,132,252,0.4))",
                          "drop-shadow(0 0 50px rgba(123,59,255,0.85)) drop-shadow(0 0 25px rgba(168,85,247,0.65)) drop-shadow(0 0 12px rgba(192,132,252,0.5))",
                          "drop-shadow(0 0 40px rgba(123,59,255,0.7)) drop-shadow(0 0 20px rgba(168,85,247,0.5)) drop-shadow(0 0 10px rgba(192,132,252,0.4))"
                        ]
                  }}
                  transition={{
                    duration: breathCount < 5 ? 0.8 : 3,
                    repeat: Infinity,
                    ease: "easeInOut"
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
            className="text-center mt-8 sm:mt-16"
          >
            <motion.h1 
              className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-3 sm:mb-4 tracking-wide uppercase px-4"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '0.15em' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <span className="bg-gradient-to-r from-[#E9D5FF] via-white to-[#E9D5FF] bg-clip-text text-transparent">
                {typedText1}
                {typedText1.length < text1.length && <span className="animate-pulse">|</span>}
              </span>
              <br />
              <span className="bg-gradient-to-r from-[#7B3BFF] via-[#A855F7] to-[#C084FC] bg-clip-text text-transparent">
                {typedText2}
                {typedText2.length > 0 && typedText2.length < text2.length && <span className="animate-pulse">|</span>}
              </span>
            </motion.h1>
            <p className="text-sm sm:text-lg text-slate-400 max-w-2xl mx-auto px-4">
              Fine-tuned AI engine to optimize and automate your business processes
            </p>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Preview Cards */}
      <section className="relative py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* AI Engine Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="bg-[#151528]/60 backdrop-blur-xl border-[#7B3BFF]/30 p-4 sm:p-6 h-full">
                <div className="relative mb-3 sm:mb-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#7B3BFF]/40 to-[#A855F7]/40 rounded-2xl blur-xl" />
                    <div className="relative w-full h-full bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 rounded-2xl flex items-center justify-center border border-[#7B3BFF]/30">
                      <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-[#C084FC]" />
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-2">AI Engine</h3>
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
              <Card className="bg-[#151528]/60 backdrop-blur-xl border-[#7B3BFF]/30 p-4 sm:p-6 h-full">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-xs sm:text-sm text-slate-400">Cost Analysis</h3>
                  <span className="text-[10px] sm:text-xs text-emerald-400">+82% ON TARGET</span>
                </div>
                <div className="mb-2">
                  <div className="text-2xl sm:text-3xl font-bold text-white">€524,800</div>
                  <div className="text-[10px] sm:text-xs text-slate-500">Total expenditure</div>
                </div>
                <div className="h-16 sm:h-24 flex items-end gap-1">
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
              <Card className="bg-[#151528]/60 backdrop-blur-xl border-[#7B3BFF]/30 p-4 sm:p-6 h-full">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-xs sm:text-sm text-slate-400">Automation</h3>
                  <span className="text-[10px] sm:text-xs text-emerald-400">+55% ON TARGET</span>
                </div>
                <div className="mb-2">
                  <div className="text-2xl sm:text-3xl font-bold text-white">€ 130,620 <span className="text-xs sm:text-sm text-slate-500">/ year</span></div>
                  <div className="text-[10px] sm:text-xs text-slate-500">Improved</div>
                </div>
                <div className="h-16 sm:h-24 flex items-end gap-1">
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
      <section className="relative py-8 sm:py-12 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 opacity-40">
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