import React, { useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import MarketingHeader from '@/components/layout/MarketingHeader';
import OrbitalRings from '@/components/ui/OrbitalRings';
import { Target, Users, Shield, MapPin } from 'lucide-react';

export default function AboutUs() {
  const navigate = useNavigate();
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const logoRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: logoRef,
    offset: ["start end", "end start"]
  });

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
            <div 
              ref={logoRef}
              className="relative mb-20"
              onMouseEnter={() => setIsLogoHovered(true)}
              onMouseLeave={() => setIsLogoHovered(false)}
            >
              <div className="absolute inset-0 blur-[120px] opacity-30">
                <div className="w-96 h-96 mx-auto bg-gradient-to-br from-[#7B3BFF] via-[#A855F7] to-transparent rounded-full" />
              </div>
              
              {/* Orbital Rings */}
              <OrbitalRings isHovered={isLogoHovered} scrollProgress={scrollYProgress} />
              
              <motion.img 
                src="https://media.base44.com/images/public/698f4ecdefcf4d820e54e33f/50df0face_EEEE413D-A65A-4B84-A6CE-9F681EADF652.png"
                alt="SETRA 3D"
                className="relative h-80 mx-auto cursor-pointer"
                animate={{
                  filter: [
                    "drop-shadow(0 0 60px rgba(123,59,255,0.8)) drop-shadow(0 0 100px rgba(168,85,247,0.6))",
                    "drop-shadow(0 0 80px rgba(123,59,255,1)) drop-shadow(0 0 120px rgba(168,85,247,0.8))",
                    "drop-shadow(0 0 60px rgba(123,59,255,0.8)) drop-shadow(0 0 100px rgba(168,85,247,0.6))"
                  ],
                  scale: isLogoHovered ? 1.05 : 1
                }}
                transition={{
                  filter: {
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  },
                  scale: {
                    duration: 0.3
                  }
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
                  To be the leading AI platform driving business profitability through automation and operational intelligence — helping businesses grow more profitable day after day, year over year.
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
                <div className="text-slate-400 text-left space-y-3">
                  <p><span className="text-[#C084FC] font-semibold">Innovation:</span> Pioneering cutting-edge solutions for a dynamic market.</p>
                  <p><span className="text-[#C084FC] font-semibold">Reliability:</span> Building trust through consistent performance and unwavering commitment.</p>
                  <p><span className="text-[#C084FC] font-semibold">Transparency:</span> Fostering open communication and ensuring integrity in all our operations.</p>
                  <p><span className="text-[#C084FC] font-semibold">Customer Success:</span> Empowering clients with insights for their highest potential and sustainable growth.</p>
                </div>
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
            className="relative mb-12 flex justify-center"
          >
            <div className="relative w-full max-w-3xl">
              {/* Gradient fade overlay to blend with background */}
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A14] via-transparent to-transparent opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A14] via-[#0A0A14]/30 to-transparent opacity-95" />
                <div className="absolute inset-0 bg-gradient-to-l from-[#0A0A14] via-transparent to-transparent opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A14] via-transparent to-transparent opacity-80" />
              </div>
              
              {/* Ambient glow */}
              <div className="absolute inset-0 -z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-[#7B3BFF]/15 rounded-full blur-[100px]" />
              </div>
              
              <img 
                src="https://media.base44.com/images/public/698f4ecdefcf4d820e54e33f/d194ec60e_ChatGPTImage18202606_04_03.png"
                alt="Cyprus - Global Impact, Local Presence"
                className="w-full h-auto"
                style={{ maskImage: 'radial-gradient(ellipse 90% 85% at 50% 50%, black 35%, transparent 95%)' }}
              />
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