import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedLogo({ className = "h-24" }) {
  return (
    <div className={`relative ${className} flex items-center overflow-visible`}>
      {/* Symbol - fades in and scales */}
      <motion.img 
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698f4ecdefcf4d820e54e33f/1490b4d9d_setrasymbol.png"
        alt="SETRA Symbol"
        className="h-full w-auto"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      
      {/* Text - slides out from behind symbol */}
      <motion.img
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698f4ecdefcf4d820e54e33f/4a6c9d6d0_setratext.png"
        alt="SETRA"
        className="h-[70%] w-auto"
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}