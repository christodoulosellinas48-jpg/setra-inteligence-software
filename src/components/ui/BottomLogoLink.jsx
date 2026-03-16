import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BottomLogoLink({ collapsed = false }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all duration-200 group border border-transparent hover:border-[#7B3BFF]/30",
            collapsed && "justify-center"
          )}
        >
          <img 
            src="https://media.base44.com/images/public/698f4ecdefcf4d820e54e33f/50df0face_EEEE413D-A65A-4B84-A6CE-9F681EADF652.png"
            alt="SETRA"
            className="w-8 h-8 flex-shrink-0 transition-all duration-300 group-hover:scale-110"
            style={{ filter: "drop-shadow(0 0 8px rgba(123,59,255,0.4))" }}
          />
          {!collapsed && (
            <>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-white group-hover:text-[#C084FC] transition-colors">
                  SETRA Connect
                </p>
                <p className="text-xs text-slate-500">Platform Services</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-[#A855F7] transition-colors" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        side="top" 
        align="start" 
        className="w-56 bg-[#151528]/95 backdrop-blur-xl border-white/10 shadow-[0_0_30px_rgba(123,59,255,0.2)]"
      >
        <div className="p-3 text-center">
          <p className="text-sm text-slate-400">Coming Soon</p>
          <p className="text-xs text-slate-500 mt-1">Advanced platform integrations</p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}