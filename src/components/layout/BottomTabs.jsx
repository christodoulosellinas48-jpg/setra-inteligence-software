import React, { useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileStack, Receipt, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/Dashboard' },
  { label: 'Expenses',  icon: FileStack,        path: '/Expenses' },
  { label: 'Ops Hub',   icon: Zap,              path: '/OperationsHub' },
  { label: 'VAT',       icon: Receipt,          path: '/VATAndBookkeeping' },
];

// Track per-tab history stacks
const tabStacks = {};
TABS.forEach(t => { tabStacks[t.path] = [t.path]; });

export default function BottomTabs() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine which tab root is active (or nearest ancestor)
  const activeTab = TABS.find(t => location.pathname === t.path)
    || TABS.find(t => location.pathname.startsWith(t.path + '/'))
    || null;

  const handleTabPress = (tab) => {
    const isAlreadyOnTab = activeTab?.path === tab.path;

    if (isAlreadyOnTab) {
      // Tap same tab → reset to root
      if (location.pathname !== tab.path) {
        navigate(tab.path, { replace: true });
      }
    } else {
      // Switch to another tab — push into history so browser back works
      navigate(tab.path);
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0B0B12]/97 backdrop-blur-xl border-t border-white/[0.06] flex items-stretch"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab?.path === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => handleTabPress(tab)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors select-none relative',
              active ? 'text-[#C084FC]' : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <Icon className={cn('w-5 h-5', active && 'drop-shadow-[0_0_6px_rgba(192,132,252,0.8)]')} />
            {tab.label}
            {active && (
              <span
                className="absolute bottom-0 w-8 h-0.5 rounded-full bg-[#7B3BFF]"
                style={{ bottom: 'calc(env(safe-area-inset-bottom) + 0px)' }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}