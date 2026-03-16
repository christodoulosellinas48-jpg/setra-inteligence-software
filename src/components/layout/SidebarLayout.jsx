import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import LogoLink from '@/components/ui/LogoLink';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  Wallet,
  LineChart,
  BarChart3,
  ClipboardCheck,
  Receipt,
  Plug,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function SidebarLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/Dashboard' },
    { label: 'Consolidated', icon: Building2, path: '/ConsolidatedView' },
    { label: 'Budget', icon: Wallet, path: '/Budgeting' },
    { label: 'Forecast', icon: LineChart, path: '/Forecasting' },
    { label: 'Reports', icon: BarChart3, path: '/Reports' },
    { label: 'Audit', icon: ClipboardCheck, path: '/Audit' },
    { label: 'Bookkeeping', icon: Receipt, path: '/Bookkeeping' },
    { label: 'Integrations', icon: Plug, path: '/Integrations' },
  ];

  const bottomItems = [
    { label: 'Settings', icon: Settings, path: '/Settings' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#0B0B12] flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-[#0B0B12]/95 border-r border-[#2A2A3A]/50 backdrop-blur-xl transition-all duration-300 z-50 flex flex-col shadow-2xl',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-[#2A2A3A]/50">
          {collapsed ? (
            <div className="w-10 h-10 mx-auto flex items-center justify-center group cursor-pointer">
              <img 
                src="https://media.base44.com/images/public/698f4ecdefcf4d820e54e33f/50df0face_EEEE413D-A65A-4B84-A6CE-9F681EADF652.png"
                alt="S"
                className="w-10 h-10 object-contain transition-all duration-300 group-hover:scale-110"
                style={{ filter: "drop-shadow(0 0 8px rgba(123,59,255,0.4))" }}
              />
            </div>
          ) : (
            <LogoLink className="h-10" />
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full justify-start text-slate-400 hover:text-white hover:bg-[#2A2A3A]/50 transition-all duration-200',
                isActive(item.path) && 'bg-gradient-to-r from-[#7B3BFF]/20 to-[#A855F7]/20 text-[#C084FC] border-l-2 border-[#7B3BFF]',
                collapsed && 'justify-center px-0'
              )}
            >
              <item.icon className={cn('w-5 h-5', !collapsed && 'mr-3')} />
              {!collapsed && <span>{item.label}</span>}
            </Button>
          ))}
        </nav>

        {/* Bottom Items */}
        <div className="p-3 border-t border-[#2A2A3A]/50 space-y-1">
          {bottomItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full justify-start text-slate-400 hover:text-white hover:bg-[#2A2A3A]/50 transition-all duration-200',
                isActive(item.path) && 'bg-gradient-to-r from-[#7B3BFF]/20 to-[#A855F7]/20 text-[#C084FC] border-l-2 border-[#7B3BFF]',
                collapsed && 'justify-center px-0'
              )}
            >
              <item.icon className={cn('w-5 h-5', !collapsed && 'mr-3')} />
              {!collapsed && <span>{item.label}</span>}
            </Button>
          ))}
        </div>

        {/* Toggle Button */}
        <div className="p-3 border-t border-[#2A2A3A]/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full text-slate-400 hover:text-[#A855F7] hover:bg-[#2A2A3A]/50 transition-all duration-200"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 transition-all duration-300',
          collapsed ? 'ml-16' : 'ml-64'
        )}
      >
        {children}
      </main>
    </div>
  );
}