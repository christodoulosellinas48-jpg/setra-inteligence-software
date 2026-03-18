import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export default function MarketingHeader({ breathCount = 10 }) {
  const navigate = useNavigate();

  return (
    <nav className="relative z-50 border-b border-white/5 backdrop-blur-xl bg-[#0A0A14]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-8">
          <div 
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer"
          >
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
          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm">
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
            <button 
              onClick={() => navigate(createPageUrl('AboutUs'))}
              className="text-slate-400 hover:text-white transition-colors"
            >
              About Us
            </button>
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
  );
}