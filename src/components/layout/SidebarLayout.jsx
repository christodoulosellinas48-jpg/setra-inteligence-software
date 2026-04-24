import React, { useState, useEffect } from 'react';
import useRealtimeSync from '@/hooks/useRealtimeSync';
import { useNavigate, useLocation } from 'react-router-dom';
import LogoLink from '@/components/ui/LogoLink';
import BottomLogoLink from '@/components/ui/BottomLogoLink';
import UserMenu from '@/components/ui/UserMenu';
import BottomTabs from '@/components/layout/BottomTabs';
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
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  FileStack,
  LayoutGrid
} from 'lucide-react';
import { useBusiness } from '@/components/business/BusinessContext';

const ALL_NAV_ITEMS = [
  { label: 'Dashboard',   icon: LayoutDashboard, path: '/Dashboard',     permission: null },
  { label: 'Budget',      icon: Wallet,          path: '/Budgeting',     permission: 'manage_budget' },
  { label: 'Forecast',    icon: LineChart,        path: '/Forecasting',   permission: 'manage_budget' },
  { label: 'Reports',     icon: BarChart3,        path: '/Reports',       permission: 'view_reports' },
  { label: 'Audit',       icon: ClipboardCheck,   path: '/Audit',         permission: 'view_reports' },
  { label: 'Expenses',          icon: FileStack,   path: '/Expenses',          permission: 'upload_expenses' },
  { label: 'VAT & Bookkeeping', icon: Receipt,     path: '/VATAndBookkeeping', permission: 'manage_bookkeeping' },
  { label: 'Menu Heatmap',     icon: LayoutGrid,  path: '/MenuHeatmap',       permission: 'view_reports' },
];

export default function SidebarLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useRealtimeSync();

  const { hasPermission, isOwner } = useBusiness();

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const navItems = ALL_NAV_ITEMS.filter(item =>
    !item.permission || hasPermission(item.permission)
  );

  const bottomItems = [
    // Only owners see Settings
    ...(isOwner() ? [{ label: 'Settings', icon: Settings, path: '/Settings' }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  // Determine if the current page is a top-level tab root (no Back button needed)
  const TAB_ROOTS = ['/Dashboard', '/Expenses', '/OperationsHub', '/VATAndBookkeeping', '/Settings', '/Reports', '/Budgeting', '/Forecasting', '/Audit', '/Invitations', '/CreateBusiness', '/ConsolidatedView', '/Vendors', '/Integrations', '/MenuHeatmap'];
  const isTopLevel = TAB_ROOTS.includes(location.pathname);

  return (
    <div className="min-h-screen bg-[#0B0B12] flex">
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-[#0B0B12]/98 border-r border-white/5 backdrop-blur-2xl transition-all duration-300 z-50 flex flex-col shadow-[0_0_60px_rgba(123,59,255,0.2)]',
          // Desktop behaviour
          'md:translate-x-0',
          collapsed ? 'md:w-16' : 'md:w-64',
          // Mobile behaviour
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0',
          // Always w-64 on mobile when open
          !collapsed && 'w-64'
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
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto flex flex-col">
          <div className="space-y-1">
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
          </div>

          {/* Operations Hub — Special CTA */}
          <div className="mt-auto pt-3">
            {!collapsed && <div className="h-px bg-white/5 mb-3" />}
            <button
              onClick={() => navigate('/OperationsHub')}
              className={cn(
                'w-full rounded-xl transition-all duration-200 group relative overflow-hidden',
                collapsed ? 'p-2' : 'p-3',
                isActive('/OperationsHub')
                  ? 'bg-gradient-to-r from-[#7B3BFF] to-[#A855F7] shadow-[0_0_24px_rgba(123,59,255,0.6)]'
                  : 'bg-gradient-to-r from-[#7B3BFF]/20 to-[#A855F7]/10 hover:from-[#7B3BFF]/40 hover:to-[#A855F7]/25 border border-[#7B3BFF]/30 hover:border-[#7B3BFF]/60 hover:shadow-[0_0_20px_rgba(123,59,255,0.4)]'
              )}
            >
              {collapsed ? (
                <div className="flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#C084FC] group-hover:text-white transition-colors" />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#7B3BFF]/30 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-[#C084FC]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">Operations Hub</p>
                    <p className="text-xs text-[#C084FC]/70">All ops in one place</p>
                  </div>
                </div>
              )}
            </button>
          </div>
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
          'flex-1 transition-all duration-300 min-w-0',
          collapsed ? 'md:ml-16' : 'md:ml-64'
        )}
      >
        {/* Top Header with User Menu */}
        <header className="sticky z-30 h-16 border-b border-white/5 bg-[#0B0B12]/95 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 shadow-[0_4px_30px_rgba(123,59,255,0.1)]" style={{ top: 'env(safe-area-inset-top)' }}>
          <div className="flex items-center gap-2">
            {/* Mobile hamburger — only shown on top-level pages */}
            {isTopLevel ? (
              <button
                className="md:hidden text-slate-400 hover:text-white p-1"
                onClick={() => setMobileOpen(o => !o)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            ) : (
              /* Back button for non-root pages on mobile */
              <button
                className="md:hidden flex items-center gap-1.5 text-slate-400 hover:text-white p-1 text-sm"
                onClick={() => navigate(-1)}
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
            )}
          </div>
          <div className="ml-auto">
            <UserMenu />
          </div>
        </header>
        <div className="pb-16 md:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <BottomTabs />
    </div>
  );
}