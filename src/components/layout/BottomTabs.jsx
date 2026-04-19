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

// Persistent per-tab navigation stacks (survive re-renders)
const tabStacks = {};
TABS.forEach(t => { tabStacks[t.path] = [t.path]; });

// Returns which tab root owns the current pathname
function getActiveTab(pathname) {
  return TABS.find(t => pathname === t.path)
    || TABS.find(t => pathname.startsWith(t.path + '/'))
    || null;
}

export default function BottomTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  const prevTabRef = useRef(null);

  const activeTab = getActiveTab(location.pathname);

  // Keep the active tab's stack in sync with the real pathname
  React.useEffect(() => {
    if (!activeTab) return;
    const stack = tabStacks[activeTab.path];
    const top = stack[stack.length - 1];
    if (top !== location.pathname) {
      if (stack.includes(location.pathname)) {
        // popped back — trim stack
        tabStacks[activeTab.path] = stack.slice(0, stack.lastIndexOf(location.pathname) + 1);
      } else {
        tabStacks[activeTab.path] = [...stack, location.pathname];
      }
    }
    prevTabRef.current = activeTab.path;
  }, [location.pathname, activeTab]);

  const handleTabPress = (tab) => {
    const isAlreadyOnTab = activeTab?.path === tab.path;

    if (isAlreadyOnTab) {
      // Tap same tab → pop back to root
      if (location.pathname !== tab.path) {
        tabStacks[tab.path] = [tab.path];
        navigate(tab.path, { replace: true });
      }
    } else {
      // Restore last position in that tab's stack
      const savedPath = tabStacks[tab.path]?.[tabStacks[tab.path].length - 1] ?? tab.path;
      navigate(savedPath);
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