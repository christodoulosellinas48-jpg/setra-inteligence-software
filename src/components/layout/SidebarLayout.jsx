import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import LogoLink from '@/components/ui/LogoLink';
import BottomLogoLink from '@/components/ui/BottomLogoLink';
import UserMenu from '@/components/ui/UserMenu';
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
  Package,
  Users,
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
    { label: 'Inventory', icon: Package, path: '/Inventory' },
    { label: 'Payroll', icon: Users, path: '/Payroll' },
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
          'fixed left-0 top-0 h-screen bg-[#0B0B12]/98 border-r border-white/5 backdrop-blur-2xl transition-all duration-200 z-50 flex flex-col shadow-[0_0_60px_rgba(123,59,255,0.2)]',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-white/5">
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
                'w-full justify-start text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200',
                isActive(item.path) && 'bg-[#7B3BFF]/15 text-[#C084FC] border-l-3 border-[#7B3BFF] shadow-[0_0_15px_rgba(123,59,255,0.3)]',
                collapsed && 'justify-center px-0'
              )}
            >
              <item.icon className={cn('w-5 h-5', !collapsed && 'mr-3')} />
              {!collapsed && <span>{item.label}</span>}
            </Button>
          ))}
        </nav>

        {/* Bottom Items */}
        <div className="p-3 border-t border-white/5 space-y-1">
          <BottomLogoLink collapsed={collapsed} />
          {bottomItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full justify-start text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200',
                isActive(item.path) && 'bg-[#7B3BFF]/15 text-[#C084FC] border-l-3 border-[#7B3BFF] shadow-[0_0_15px_rgba(123,59,255,0.3)]',
                collapsed && 'justify-center px-0'
              )}
            >
              <item.icon className={cn('w-5 h-5', !collapsed && 'mr-3')} />
              {!collapsed && <span>{item.label}</span>}
            </Button>
          ))}
        </div>

        {/* Toggle Button */}
        <div className="p-3 border-t border-white/5">
          <Button
            variant="ghost"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "w-full text-slate-400 hover:text-[#A855F7] hover:bg-white/5 transition-all duration-200",
              collapsed ? 'justify-center px-0' : 'justify-start'
            )}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5 mr-2" />
                <span className="text-sm">Close</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 transition-all duration-200',
          collapsed ? 'ml-16' : 'ml-64'
        )}
      >
        {/* Top Header with User Menu */}
        <header className="sticky top-0 z-30 h-16 border-b border-white/5 bg-[#0B0B12]/95 backdrop-blur-xl flex items-center justify-end px-6 shadow-[0_4px_30px_rgba(123,59,255,0.1)]">
          <UserMenu />
        </header>
        {children}
      </main>
    </div>
  );
}