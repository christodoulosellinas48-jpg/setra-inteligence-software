import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LogoLink({ className = "h-10" }) {
  return (
    <Link to={createPageUrl('Home')} className="flex items-center gap-3 group">
      <img 
        src="https://media.base44.com/images/public/698f4ecdefcf4d820e54e33f/50df0face_EEEE413D-A65A-4B84-A6CE-9F681EADF652.png"
        alt="SETRA"
        className={`${className} transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(123,59,255,0.6)]`}
        style={{ filter: "drop-shadow(0 0 8px rgba(123,59,255,0.3))" }}
      />
      <div className="flex flex-col">
        <span className="text-lg font-bold text-[#E9D5FF] group-hover:text-[#C084FC] transition-colors tracking-widest" style={{ fontFamily: 'monospace, system-ui' }}>
          SETRA
        </span>
        <span className="text-xs text-slate-400 uppercase tracking-wider -mt-1">
          Financial Operations
        </span>
      </div>
    </Link>
  );
}