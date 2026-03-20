import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function BottomLogoLink({ collapsed = false }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/Integrations')}
      className={cn(
        "w-full flex items-center gap-3 rounded-xl hover:bg-white/5 transition-all duration-200 group border border-transparent hover:border-[#7B3BFF]/30",
        collapsed ? "justify-center p-2" : "p-3"
      )}
    >
      <img
        src="https://media.base44.com/images/public/698f4ecdefcf4d820e54e33f/50df0face_EEEE413D-A65A-4B84-A6CE-9F681EADF652.png"
        alt="SETRA"
        className={cn("transition-all duration-300 group-hover:scale-110 object-contain", collapsed ? "w-10 h-10" : "w-8 h-8 flex-shrink-0")}
        style={{ filter: "drop-shadow(0 0 8px rgba(123,59,255,0.4))" }}
      />
      {!collapsed && (
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-white group-hover:text-[#C084FC] transition-colors">
            SETRA Connect
          </p>
          <p className="text-xs text-slate-500">Platform Services</p>
        </div>
      )}
    </button>
  );
}