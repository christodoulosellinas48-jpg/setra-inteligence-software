import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import MarketingHeader from '@/components/layout/MarketingHeader';
import { Target, Users, Shield, MapPin } from 'lucide-react';

export default function AboutUs() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A14] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0f2e] via-[#0A0A14] to-[#0A0A14]" />
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.1
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <MarketingHeader />

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              About Setra
            </h1>
            <p className="text-xl text-slate-400 mb-16">
              Empowering Businesses with AI
            </p>

            {/* 3D Logo */}
            <div className="relative mb-20">
              <div className="absolute inset-0 blur-[120px] opacity-30">
                <div className="w-96 h-96 mx-auto bg-gradient-to-br from-[#7B3BFF] via-[#A855F7] to-transparent rounded-full" />
              </div>
              <motion.img 
                src="https://media.base44.com/images/public/698f4ecdefcf4d820e54e33f/50df0face_EEEE413D-A65A-4B84-A6CE-9F681EADF652.png"
                alt="SETRA 3D"
                className="relative h-80 mx-auto"
                animate={{
                  filter: [
                    "drop-shadow(0 0 60px rgba(123,59,255,0.8)) drop-shadow(0 0 100px rgba(168,85,247,0.6))",
                    "drop-shadow(0 0 80px rgba(123,59,255,1)) drop-shadow(0 0 120px rgba(168,85,247,0.8))",
                    "drop-shadow(0 0 60px rgba(123,59,255,0.8)) drop-shadow(0 0 100px rgba(168,85,247,0.6))"
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
      </section>

      {/* Our Mission */}
      <section className="relative py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">Our Mission</h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              We strive to revolutionize business operations through cutting-edge AI technology. 
              Our mission is to enhance the efficiency and intelligence of enterprises worldwide.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Vision, Who We Are, Core Values */}
      <section className="relative py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Our Vision */}
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
                <h3 className="text-2xl font-bold text-white mb-4">Our Vision</h3>
                <p className="text-slate-400">
                  To be the leading AI platform driving the automation of business processes and operational intelligence.
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
                  A local Cyprus-based team of hospitality industry experts, led by professionals specialising in economics, operations management, and AI automation — built to solve real problems for real businesses.
                </p>
              </Card>
            </motion.div>

            {/* Core Values */}
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
                    <Shield className="w-10 h-10 text-[#C084FC]" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Core Values</h3>
                <p className="text-slate-400">
                  Innovation, Reliability, Transparency and Customer Success.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Offices */}
      <section className="relative py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Our Offices</h2>
            <p className="text-xl text-slate-400">Rooted in Cyprus, Built for the World</p>
          </motion.div>

          {/* Cyprus Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="relative mb-12"
          >
            <div className="relative h-[380px] flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-b from-[#7B3BFF]/10 to-transparent rounded-2xl" />
              {/* Ambient glow behind island */}
              <div className="absolute w-[500px] h-[200px] bg-[#7B3BFF]/20 rounded-full blur-[80px]" />
              <svg viewBox="0 0 600 300" className="w-full max-w-2xl h-full">
                <defs>
                  <filter id="cyprusGlow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  <filter id="pinGlow">
                    <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  <radialGradient id="islandFill" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#7B3BFF" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#A855F7" stopOpacity="0.08" />
                  </radialGradient>
                </defs>

                {/* Cyprus island shape — elongated east-west with Karpaz peninsula */}
                <path
                  d="M 70,160 
                     Q 80,150 100,148
                     L 130,145 L 160,143 L 190,142 
                     L 220,141 L 250,140 L 280,139 
                     L 310,138 L 340,137 L 370,136
                     L 400,135 L 420,134
                     Q 430,133 435,128
                     L 450,120 L 470,115 L 495,113 L 520,115
                     Q 530,117 533,122
                     Q 532,128 525,132
                     L 505,137 L 485,140
                     Q 470,143 460,148
                     L 450,155 L 435,165
                     Q 425,170 415,172
                     L 390,175 L 360,177 L 330,178
                     L 300,178 L 270,177 L 240,175
                     L 210,172 L 180,169 L 150,166
                     L 120,163 L 95,161
                     Q 80,160 70,160 Z"
                  fill="url(#islandFill)"
                  stroke="#7B3BFF"
                  strokeWidth="2.5"
                  filter="url(#cyprusGlow)"
                />

                {/* Nicosia pin — center of the island */}
                {/* Pin body */}
                <circle cx="280" cy="150" r="10" fill="#7B3BFF" filter="url(#pinGlow)" opacity="0.9" />
                <circle cx="280" cy="150" r="6" fill="#C084FC" filter="url(#pinGlow)" />
                <circle cx="280" cy="150" r="3" fill="white" />
                {/* Pin tail */}
                <line x1="280" y1="160" x2="280" y2="173" stroke="#A855F7" strokeWidth="2.5" filter="url(#pinGlow)" />
                <circle cx="280" cy="175" r="2" fill="#A855F7" />

                {/* Pulse ring around pin */}
                <circle cx="280" cy="150" r="18" fill="none" stroke="#7B3BFF" strokeWidth="1.5" opacity="0.4" filter="url(#pinGlow)" />

                {/* Label */}
                <text x="293" y="155" fill="#E9D5FF" fontSize="13" fontFamily="system-ui" fontWeight="600">Nicosia</text>
              </svg>
            </div>
          </motion.div>

          {/* Office Locations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            <div className="col-span-2 md:col-span-4 flex justify-center">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 flex items-center justify-center border border-[#7B3BFF]/30">
                  <MapPin className="w-6 h-6 text-[#C084FC]" />
                </div>
                <p className="text-white font-medium">Nicosia, Cyprus</p>
                <p className="text-slate-500 text-sm mt-1">Headquarters</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Join Our Team */}
      <section className="relative py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">Want to Join Our Team?</h2>
            <Button className="px-8 py-6 text-lg">
              View Open Positions
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}