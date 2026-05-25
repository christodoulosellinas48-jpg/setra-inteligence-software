import React from 'react';
import { Building2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PortfolioGlance({ businesses, onSelectBusiness }) {
  const navigate = useNavigate();
  if (!businesses || businesses.length < 2) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Your businesses</h3>
          <p className="text-xs text-slate-400">{businesses.length} businesses</p>
        </div>
        <button
          onClick={() => navigate('/Settings')}
          className="text-xs text-violet-600 hover:text-violet-800 font-medium flex items-center gap-0.5 transition-colors"
        >
          Manage <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {businesses.map(biz => (
          <button
            key={biz.id}
            onClick={() => onSelectBusiness(biz)}
            className="flex items-center gap-2.5 px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-violet-50 hover:border-violet-200 transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 group-hover:border-violet-200 flex items-center justify-center flex-shrink-0 shadow-sm transition-colors">
              <Building2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-violet-600 transition-colors" />
            </div>
            <span className="text-xs text-slate-700 font-medium truncate group-hover:text-violet-800 transition-colors">
              {biz.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}