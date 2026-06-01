import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import MarketingHeader from '@/components/layout/MarketingHeader';
import { Check, Zap } from 'lucide-react';

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold, root: null }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

const STARS = Array.from({ length: 50 }, (_, i) => ({
  left: `${(i * 37 + 13) % 100}%`,
  top: `${(i * 53 + 7) % 100}%`,
  opacity: ((i % 5) * 0.1) + 0.2,
}));

function ShowcaseCard() {
  const [ref, inView] = useInView(0.1);
  return (
    <div
      ref={ref}
      className="relative max-w-2xl mx-auto"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0) scale(1)' : 'translateY(60px) scale(0.92)',
        transition: 'opacity 0.8s cubic-bezier(0.22,1,0.36,1), transform 0.8s cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      <div className="absolute inset-0 blur-[80px] opacity-30 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-br from-[#7B3BFF] via-[#A855F7] to-transparent rounded-3xl" />
      </div>
      <div className="relative rounded-2xl border border-[#7B3BFF]/40 bg-[#0D0D1A]/80 backdrop-blur-xl overflow-hidden shadow-[0_0_60px_rgba(123,59,255,0.2)]">
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5 bg-[#0A0A14]/60">
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <span className="ml-3 text-xs text-slate-500">setra.app / Today</span>
        </div>
        <img
          src="https://media.base44.com/images/public/698f4ecdefcf4d820e54e33f/ac7d3cc0c_generated_image.png"
          alt="Setra Today — daily briefing screen"
          className="w-full block"
        />
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [introComplete, setIntroComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIntroComplete(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A14] relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0f2e] via-[#0A0A14] to-[#0A0A14]" />
        {/* Particle stars */}
        {STARS.map((star, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full"
            style={star}
          />
        ))}
      </div>

      {/* Navigation */}
      <MarketingHeader breathCount={introComplete ? 5 : 0} />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            {/* Left Side - Headline + Subhead + Checkmarks + CTAs */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <motion.h1
                  className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-3 tracking-tight"
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <span className="text-white">
                    Know exactly where your venue makes — and loses — money.
                  </span>
                </motion.h1>
                <p className="text-sm sm:text-base text-slate-300 mb-6 max-w-lg leading-relaxed">
                  Setra is the financial brain for independent HoReCa businesses — hotels, restaurants, cafés and bars. It turns your invoices, sales and payroll into clear daily answers, so you protect every margin and hit every Cyprus VAT deadline. From a single café to a whole hotel's P&L. No CFO, no spreadsheets, no chasing.
                </p>
                <div className="space-y-3 mb-7">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-[#A855F7]" />
                    <span className="text-xs sm:text-sm font-medium">See exactly which parts of your business make money — and which leak it</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-[#A855F7]" />
                    <span className="text-xs sm:text-sm font-medium">Hit every VAT and bookkeeping deadline — automatically</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-[#A855F7]" />
                    <span className="text-xs sm:text-sm font-medium">Catch cashflow problems before they happen</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => navigate('/Dashboard')}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#7B3BFF] text-white font-semibold text-sm hover:bg-[#6929e8] hover:shadow-[0_0_30px_rgba(123,59,255,0.6)] transition-all duration-200 hover:scale-105"
                  >
                    Start free — no credit card
                  </button>
                  <button
                    onClick={() => navigate('/Dashboard')}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl border border-white/30 text-white font-medium text-sm hover:border-[#A855F7] hover:bg-white/5 transition-all duration-200"
                  >
                    See it on real data →
                  </button>
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
                    filter: [
                      "drop-shadow(0 0 40px rgba(123,59,255,0.7)) drop-shadow(0 0 20px rgba(168,85,247,0.5)) drop-shadow(0 0 10px rgba(192,132,252,0.4))",
                      "drop-shadow(0 0 50px rgba(123,59,255,0.85)) drop-shadow(0 0 25px rgba(168,85,247,0.65)) drop-shadow(0 0 12px rgba(192,132,252,0.5))",
                      "drop-shadow(0 0 40px rgba(123,59,255,0.7)) drop-shadow(0 0 20px rgba(168,85,247,0.5)) drop-shadow(0 0 10px rgba(192,132,252,0.4))"
                    ]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
            </motion.div>
          </div>

          {/* Spacer — headline + CTAs now live in left column */}
        </div>
      </section>

      {/* ROI + Trust strip — below hero */}
      <div className="relative px-4 sm:px-6 pb-6 -mt-4">
        <div className="max-w-3xl mx-auto space-y-3">
          {/* ROI line */}
          <p className="text-xs text-slate-400 leading-relaxed text-center">
            💡 Setra pays for itself the first time it catches a 1.5% slip on €5,000/month of purchases —{' '}
            <span className="text-slate-300 font-medium">a €75/month saving.</span>
          </p>
          {/* Trust + integrations strip */}
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span className="text-xs text-slate-500">Built hand-in-hand with independent HoReCa operators across Cyprus</span>
            <span className="text-slate-600 text-xs">·</span>
            {['Lightspeed', 'Square', 'Toast', 'Xero', 'QuickBooks'].map((name, i, arr) => (
              <React.Fragment key={name}>
                <span className="text-xs text-slate-500 font-medium">{name}</span>
                {i < arr.length - 1 && <span className="text-slate-700 text-xs">·</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

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
                  <span className="text-[10px] sm:text-xs text-slate-500 italic">Sample data</span>
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
                  <span className="text-[10px] sm:text-xs text-slate-500 italic">Sample data</span>
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

      {/* Product Showcase Band */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Section heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-14"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white">
              See your numbers the moment you open.
            </h2>
          </motion.div>

          {/* Screenshot card */}
          <ShowcaseCard />

          {/* Three captions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 sm:mt-10 text-center"
          >
            {[
              { icon: '✦', label: 'Your daily briefing', desc: 'An AI summary of what happened and what needs your attention today.' },
              { icon: '⚡', label: 'Alerts with €-impact', desc: 'Ranked by financial severity so you fix the costliest problems first.' },
              { icon: '💬', label: 'Ask Setra anything', desc: 'Chat with your numbers — no dashboard hunting, just answers.' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <span className="text-[#A855F7] text-lg">{icon}</span>
                <span className="text-white font-semibold text-sm">{label}</span>
                <span className="text-slate-400 text-xs leading-relaxed max-w-xs">{desc}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Built for Cyprus — Trust Band */}
      <section className="relative py-8 sm:py-10 px-4 sm:px-6 border-t border-white/5 bg-[#0D0D1A]/60">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-lg">🇨🇾</span>
              <span className="font-medium">Built for Cyprus</span>
            </div>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <span className="text-slate-400">€ first — EUR native</span>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <span className="text-slate-400">Cyprus VAT &amp; TAXISnet ready</span>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <span className="text-slate-400">Cyprus phone format +357</span>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <span className="text-slate-400">Support Mon–Fri 9–6 EET</span>
          </div>
        </div>
      </section>

      {/* Try the demo */}
      <section className="relative py-10 sm:py-14 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-slate-400 text-sm mb-3">See real numbers, no account needed</p>
          <h2 className="text-xl sm:text-3xl font-bold text-white mb-4">Try the live demo</h2>
          <p className="text-slate-400 text-sm mb-6">
            Explore Omakase by Lambros — a fully seeded restaurant with real invoices, VAT data, recipes, and audit findings.
            Read-only. No signup. No credit card.
          </p>
          <button
            onClick={() => { window.location.href = '/Dashboard'; }}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[#7B3BFF] to-[#A855F7] text-white font-semibold text-sm hover:shadow-[0_0_30px_rgba(123,59,255,0.6)] transition-all duration-200 hover:scale-105"
          >
            Open sandbox demo →
          </button>
        </div>
      </section>

      {/* Integration Logos Footer */}
      <section className="relative py-8 sm:py-12 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-xs text-slate-600 uppercase tracking-widest mb-4 sm:mb-6">Connects with the tools you already use</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:gap-x-10">
            <span className="text-slate-500 text-sm font-medium">Lightspeed</span>
            <span className="text-slate-500 text-sm font-medium">Square</span>
            <span className="text-slate-500 text-sm font-medium">Toast</span>
            <span className="text-slate-500 text-sm font-medium">Xero</span>
            <span className="text-slate-500 text-sm font-medium">QuickBooks</span>
          </div>
        </div>
      </section>
    </div>
  );
}