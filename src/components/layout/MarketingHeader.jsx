import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';


export default function MarketingHeader() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Features', page: 'Features' },
    { label: 'Pricing',  page: 'Pricing' },
    { label: 'About Us', page: 'AboutUs' },
  ];

  return (
    <nav className="relative z-50 border-b border-white/5 backdrop-blur-xl bg-[#0A0A14]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div
          onClick={() => { navigate(createPageUrl('Home')); setMenuOpen(false); }}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer"
        >
          <img
            src="https://media.base44.com/images/public/698f4ecdefcf4d820e54e33f/50df0face_EEEE413D-A65A-4B84-A6CE-9F681EADF652.png"
            alt="SETRA"
            className="h-6 sm:h-8"
          />
          <span className="text-lg sm:text-xl font-bold text-[#E9D5FF] tracking-widest" style={{ fontFamily: 'monospace, system-ui' }}>
            SETRA
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          {navLinks.map(link => (
            <button
              key={link.page}
              onClick={() => navigate(createPageUrl(link.page))}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Desktop Login */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(createPageUrl('Dashboard'))} size="sm">
            Login
          </Button>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-slate-400 hover:text-white transition-colors p-1"
          onClick={() => setMenuOpen(o => !o)}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#0A0A14]/98 px-4 pb-4 space-y-1">
          {navLinks.map(link => (
            <button
              key={link.page}
              onClick={() => { navigate(createPageUrl(link.page)); setMenuOpen(false); }}
              className="block w-full text-left py-3 text-slate-300 hover:text-white text-sm border-b border-white/5 last:border-0 transition-colors"
            >
              {link.label}
            </button>
          ))}
          <div className="pt-3">
            <Button
              className="w-full"
              onClick={() => { navigate(createPageUrl('Dashboard')); setMenuOpen(false); }}
            >
              Login
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}