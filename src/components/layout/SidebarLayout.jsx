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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-slate-900/50 border-r border-slate-800/50 backdrop-blur-sm transition-all duration-300 z-50 flex flex-col',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-slate-800/50">
          {collapsed ? (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 mx-auto" />
          ) : (
            <LogoLink className="h-8" />
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
                'w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors',
                isActive(item.path) && 'bg-slate-800/70 text-white',
                collapsed && 'justify-center px-0'
              )}
            >
              <item.icon className={cn('w-5 h-5', !collapsed && 'mr-3')} />
              {!collapsed && <span>{item.label}</span>}
            </Button>
          ))}
        </nav>

        {/* Bottom Items */}
        <div className="p-3 border-t border-slate-800/50 space-y-1">
          {bottomItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors',
                isActive(item.path) && 'bg-slate-800/70 text-white',
                collapsed && 'justify-center px-0'
              )}
            >
              <item.icon className={cn('w-5 h-5', !collapsed && 'mr-3')} />
              {!collapsed && <span>{item.label}</span>}
            </Button>
          ))}
        </div>

        {/* Toggle Button */}
        <div className="p-3 border-t border-slate-800/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full text-slate-400 hover:text-white hover:bg-slate-800/50"
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