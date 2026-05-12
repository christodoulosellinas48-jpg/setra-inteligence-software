import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function StepWelcome({ user, onNext }) {
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center max-w-xl mx-auto"
    >
      <div className="text-5xl mb-6">👋</div>
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
        Hi {firstName}! Let's get your venue set up.
      </h1>
      <p className="text-slate-400 text-base sm:text-lg mb-3 leading-relaxed">
        This takes about <span className="text-white font-medium">10 minutes</span>. Skip any step and come back later — your dashboard fills in as you connect things.
      </p>
      <p className="text-slate-500 text-sm mb-10">
        We'll walk you through: business details → POS → accounting → first invoice upload.
      </p>
      <Button onClick={onNext} className="px-10 py-6 text-lg">
        Let's go
        <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
    </motion.div>
  );
}