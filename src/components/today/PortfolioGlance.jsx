import React from 'react';
import { Building2 } from 'lucide-react';

export default function PortfolioGlance({ businesses, onSelectBusiness }) {
  if (!businesses || businesses.length < 2) return null;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 space-y-3">
      <h3 className="text-sm font-semibold text-white">Portfolio</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {businesses.map(biz => (
          <button
            key={biz.id}
            onClick={() => onSelectBusiness(biz)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.07] hover:border-[#7B3BFF]/30 transition-all text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-[#7B3BFF]/15 border border-[#7B3BFF]/20 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-3.5 h-3.5 text-[#C084FC]" />
            </div>
            <span className="text-xs text-slate-300 font-medium truncate">{biz.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}