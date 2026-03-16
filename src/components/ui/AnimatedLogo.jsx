import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedLogo({ className = "h-24" }) {
  return (
    <motion.img 
      src="https://media.base44.com/images/public/698f4ecdefcf4d820e54e33f/1beb46c74_D415CB8C-67F6-42F2-8DE0-E8098077E205.png"
      alt="SETRA"
      className={className}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    />
  );
}