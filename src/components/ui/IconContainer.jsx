import React from 'react';
import { cn } from '@/lib/utils';

export default function IconContainer({ icon: Icon, className }) {
  return (
    <div className={cn(
      "w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 border border-[#7B3BFF]/10 flex items-center justify-center shadow-lg shadow-[#7B3BFF]/10 flex-shrink-0",
      className
    )}>
      {Icon && <Icon className="w-5 h-5 text-[#C084FC]" />}
    </div>
  );
}