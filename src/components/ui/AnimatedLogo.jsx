import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedLogo({ className = "h-24" }) {
  return (
    <div className={`relative ${className} flex items-center justify-center overflow-visible`}>
      <motion.img 
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698f4ecdefcf4d820e54e33f/1b5f5ef6f_ChatGPTImage20202610_12_34.png"
        alt="SETRA"
        className="h-full w-auto"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        className="absolute left-full ml-2 flex items-center h-full"
      >
        <motion.span 
          className="text-6xl font-bold text-white tracking-wider"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '0.1em' }}
        >
          SETRA
        </motion.span>
      </motion.div>
    </div>
  );
}