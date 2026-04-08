import React from 'react';
import { Card } from '@/components/ui/card';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <Card className="bg-[#151528]/80 border-white/5 p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 border border-[#7B3BFF]/20 flex items-center justify-center mx-auto mb-4">
        {Icon && <Icon className="w-8 h-8 text-[#C084FC]" />}
      </div>
      {title && <h3 className="text-white font-semibold text-lg mb-1">{title}</h3>}
      {description && <p className="text-slate-400 text-sm mb-4">{description}</p>}
      {action && <div>{action}</div>}
    </Card>
  );
}