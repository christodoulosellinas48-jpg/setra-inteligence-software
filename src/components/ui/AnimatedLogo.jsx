import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedLogo({ className = "h-24" }) {
  return (
    <motion.div
      className={`${className} flex items-center justify-center`}
      initial={{ opacity: 0, scale: 0.8, rotateY: -180 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        rotateY: 0,
      }}
      transition={{ 
        duration: 1, 
        ease: [0.16, 1, 0.3, 1],
        rotateY: { duration: 1.2, ease: "easeOut" }
      }}
    >
      <motion.img 
        src="https://media.base44.com/images/public/698f4ecdefcf4d820e54e33f/50df0face_EEEE413D-A65A-4B84-A6CE-9F681EADF652.png"
        alt="SETRA"
        className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(123,59,255,0.5)]"
        animate={{ 
          filter: [
            "drop-shadow(0 0 20px rgba(123,59,255,0.4))",
            "drop-shadow(0 0 40px rgba(168,85,247,0.6))",
            "drop-shadow(0 0 20px rgba(123,59,255,0.4))",
          ]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
}