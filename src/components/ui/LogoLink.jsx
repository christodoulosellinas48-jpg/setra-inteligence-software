import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LogoLink({ className = "h-10" }) {
  return (
    <Link to={createPageUrl('Home')} className="flex items-center hover:opacity-80 transition-opacity">
      <img 
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698f4ecdefcf4d820e54e33f/1490b4d9d_setrasymbol.png"
        alt="SETRA"
        className={className}
      />
    </Link>
  );
}