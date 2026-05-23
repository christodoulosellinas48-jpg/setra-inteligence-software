import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import MarketingHeader from '@/components/layout/MarketingHeader';
import { Target, Users, MapPin, Mail } from 'lucide-react';

const STARS = Array.from({ length: 80 }, (_, i) => ({
  left: `${(i * 41 + 11) % 100}%`,
  top: `${(i * 57 + 3) % 100}%`,
  opacity: ((i % 5) * 0.1) + 0.1,
}));

export default function AboutUs() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A14] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0f2e] via-[#0A0A14] to-[#0A0A14]" />
        {STARS.map((star, i) => (
          <div key={i} className="absolute w-1 h-1 bg-purple-400 rounded-full" style={star} />
        ))}
      </div>

      <MarketingHeader />

      {/* Hero */}
      <section className="relative py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4">About Setra</h1>
            <p className="text-base sm:text-xl text-slate-400 mb-10 sm:mb-16">
              The financial brain for independent hospitality.
            </p>
            <div className="relative mb-16">
              <div className="absolute inset-0 blur-[80px] opacity-20">
                <div className="w-64 h-64 mx-auto bg-gradient-to-br from-[#7B3BFF] via-[#A855F7] to-transparent rounded-full" />
              </div>
              <img
                src="https://media.base44.com/images/public/698f4ecdefcf4d820e54e33f/50df0face_EEEE413D-A65A-4B84-A6CE-9F681EADF652.png"
                alt="SETRA"
                className="relative h-48 mx-auto"
                style={{ filter: "drop-shadow(0 0 40px rgba(123,59,255,0.6))" }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="relative py-10 sm:py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-6">Our Mission</h2>
            <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
              Independent restaurants deserve the same financial intelligence as hotel chains. We're building it.
              <br /><br />
              Most independent café, bar, and restaurant owners are running on gut feel and end-of-year accountant reports.
              By the time the numbers come in, the margin is already gone. Setra turns your invoices, payroll, and sales data
              into clear, daily answers — without the cost or complexity of a CFO.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Three Cards */}
      <section className="relative py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Vision */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="bg-[#151528]/60 backdrop-blur-xl border-[#7B3BFF]/30 p-8 h-full text-center">
                <div className="w-20 h-20 mx-auto mb-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#7B3BFF]/40 to-[#A855F7]/40 rounded-full blur-xl" />
                  <div className="relative w-full h-full bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 rounded-full flex items-center justify-center border border-[#7B3BFF]/30">
                    <Target className="w-10 h-10 text-[#C084FC]" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">The Vision</h3>
                <p className="text-slate-400">
                  A future where running an independent café, bar, or restaurant is a financially sustainable career — not a guessing game.
                </p>
              </Card>
            </motion.div>

            {/* Who We Are */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="bg-[#151528]/60 backdrop-blur-xl border-[#7B3BFF]/30 p-8 h-full text-center">
                <div className="w-20 h-20 mx-auto mb-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#7B3BFF]/40 to-[#A855F7]/40 rounded-full blur-xl" />
                  <div className="relative w-full h-full bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 rounded-full flex items-center justify-center border border-[#7B3BFF]/30">
                    <Users className="w-10 h-10 text-[#C084FC]" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Who We Are</h3>
                <p className="text-slate-400">
                  Built in Cyprus by a solo founder for independent hospitality operators. Every feature comes from a real conversation with a real owner.
                </p>
              </Card>
            </motion.div>

            {/* How We Work */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="bg-[#151528]/60 backdrop-blur-xl border-[#7B3BFF]/30 p-8 h-full text-center">
                <div className="w-20 h-20 mx-auto mb-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#7B3BFF]/40 to-[#A855F7]/40 rounded-full blur-xl" />
                  <div className="relative w-full h-full bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 rounded-full flex items-center justify-center border border-[#7B3BFF]/30">
                    <span className="text-2xl">🧠</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">How We Work</h3>
                <ul className="text-slate-400 text-left space-y-2 text-sm">
                  <li><span className="text-[#C084FC]">Operator-first.</span> If a real café owner wouldn't use it, we don't ship it.</li>
                  <li><span className="text-[#C084FC]">Honest numbers.</span> We show what's true, even when it's uncomfortable.</li>
                  <li><span className="text-[#C084FC]">Less software, more leverage.</span> We'd rather cut a feature than confuse you.</li>
                </ul>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="relative py-16 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-10 text-center">Why I built Setra</h2>
            <Card className="bg-[#151528]/60 backdrop-blur-xl border-[#7B3BFF]/30 p-8">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Avatar placeholder */}
                <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7B3BFF]/30 to-[#A855F7]/20 border border-[#7B3BFF]/30 flex items-center justify-center text-3xl">
                  👤
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">Christodoulos Ellinas</p>
                  <p className="text-[#C084FC] text-sm mb-4">Founder · Nicosia, Cyprus</p>
                  <p className="text-slate-400 leading-relaxed text-sm sm:text-base">
                    Independent restaurants run on incredible energy and almost no information. Big hospitality groups have CFOs,
                    BI dashboards, and consultants. A café down the street has a stack of paper invoices and a worried owner.
                    <br /><br />
                    Setra is my attempt to close that gap — an AI-native financial brain for independent operators.
                    Same intelligence, none of the overhead. Every feature on this platform comes from a real conversation
                    with a real operator. That's how it'll stay.
                    <br /><br />
                    If you run a café, bar, or restaurant and any of this resonates, I'd love to hear from you.
                  </p>
                  <a
                    href="mailto:chris@setra.app"
                    className="inline-flex items-center gap-2 mt-4 text-[#C084FC] hover:text-white text-sm transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    chris@setra.app
                  </a>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Location */}
      <section className="relative py-16 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">Where we're based</h2>
            <p className="text-base sm:text-xl text-slate-400">Rooted in Cyprus. Built for independent operators worldwide.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="relative mb-10 flex justify-center"
          >
            <div className="relative w-full max-w-3xl">
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A14] via-transparent to-transparent opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A14] via-[#0A0A14]/30 to-transparent opacity-95" />
                <div className="absolute inset-0 bg-gradient-to-l from-[#0A0A14] via-transparent to-transparent opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A14] via-transparent to-transparent opacity-80" />
              </div>
              <div className="absolute inset-0 -z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-[#7B3BFF]/15 rounded-full blur-[100px]" />
              </div>
              <img
                src="https://media.base44.com/images/public/698f4ecdefcf4d820e54e33f/d194ec60e_ChatGPTImage18202606_04_03.png"
                alt="Cyprus"
                className="w-full h-auto"
                style={{ maskImage: 'radial-gradient(ellipse 90% 85% at 50% 50%, black 35%, transparent 95%)' }}
              />
            </div>
          </motion.div>

          <div className="flex justify-center">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 flex items-center justify-center border border-[#7B3BFF]/30">
                <MapPin className="w-6 h-6 text-[#C084FC]" />
              </div>
              <p className="text-white font-medium">Nicosia, Cyprus</p>
              <p className="text-slate-500 text-sm mt-1">Headquarters</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — Beta */}
      <section className="relative py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">Join the beta</h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              We're working with a small group of independent operators in Cyprus and Europe. Want to be one of them?
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                className="px-8 py-6 text-base bg-gradient-to-r from-[#7B3BFF] to-[#A855F7] hover:shadow-[0_0_30px_rgba(123,59,255,0.5)] transition-all"
                onClick={() => navigate('/Dashboard')}
              >
                Get early access
              </Button>
              <a
                href="mailto:chris@setra.app"
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                or email chris@setra.app
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}