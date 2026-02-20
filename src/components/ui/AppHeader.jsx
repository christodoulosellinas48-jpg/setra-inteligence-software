import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import LogoLink from '@/components/ui/LogoLink';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, FileText, Settings } from 'lucide-react';

export default function AppHeader() {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <LogoLink className="h-8" />
        
        {/* Navigation */}
        <nav className="flex items-center gap-2">
          <Button 
            variant="ghost"
            onClick={() => navigate(createPageUrl('Dashboard'))}
            className="text-slate-300 hover:text-white hover:bg-slate-800/50"
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button 
            variant="ghost"
            onClick={() => navigate(createPageUrl('Reports'))}
            className="text-slate-300 hover:text-white hover:bg-slate-800/50"
          >
            <FileText className="w-4 h-4 mr-2" />
            Reports
          </Button>
          <Button 
            variant="ghost"
            onClick={() => navigate(createPageUrl('Settings'))}
            className="text-slate-300 hover:text-white hover:bg-slate-800/50"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </nav>
      </div>
    </header>
  );
}