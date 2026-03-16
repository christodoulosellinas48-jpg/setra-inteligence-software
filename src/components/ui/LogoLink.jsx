import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LogoLink({ className = "h-10" }) {
  return (
    <Link to={createPageUrl('Home')} className="flex items-center hover:opacity-80 transition-opacity">
      <img 
        src="https://media.base44.com/images/public/698f4ecdefcf4d820e54e33f/1beb46c74_D415CB8C-67F6-42F2-8DE0-E8098077E205.png"
        alt="SETRA"
        className={className}
      />
    </Link>
  );
}