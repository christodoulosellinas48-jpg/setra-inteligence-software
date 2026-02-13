import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function BusinessTypeCard({ type, icon: Icon, title, description, selected, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative p-8 rounded-2xl border-2 text-left transition-all duration-300",
        "bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm",
        selected 
          ? "border-emerald-500 shadow-lg shadow-emerald-500/20" 
          : "border-slate-700/50 hover:border-slate-600"
      )}
    >
      {selected && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 right-4 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center"
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}
      
      <div className={cn(
        "w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-colors",
        selected ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700/50 text-slate-400"
      )}>
        <Icon className="w-7 h-7" />
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </motion.button>
  );
}