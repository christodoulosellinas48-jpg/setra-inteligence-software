import React, { useState } from 'react';
import useRealtimeSync from '@/hooks/useRealtimeSync';
import { useNavigate, useLocation } from 'react-router-dom';
import LogoLink from '@/components/ui/LogoLink';
import BottomLogoLink from '@/components/ui/BottomLogoLink';
import UserMenu from '@/components/ui/UserMenu';
import BottomTabs from '@/components/layout/BottomTabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ChevronLeft, ChevronRight, MessageSquare, Search,
  GripVertical, Pin, RotateCcw
} from 'lucide-react';
import AlertsBell from '@/components/today/AlertsBell';
import { useBusiness } from '@/components/business/BusinessContext';
import { useSidebarLayout } from '@/lib/SidebarLayoutContext';
import { MODULE_MAP, buildSidebarItems } from '@/lib/sidebarLayout';
import BusinessSwitcherPill from '@/components/layout/BusinessSwitcherPill';
import SmartUploadButton from '@/components/layout/SmartUploadButton';
import QuickActionChips from '@/components/layout/QuickActionChips';
import CommandPalette from '@/components/CommandPalette';
import SidebarResetModal from '@/components/sidebar/SidebarResetModal';
import { useCommandPalette } from '@/lib/CommandPaletteContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useEffect } from 'react';
import { toast } from 'sonner';

const SACRED_NON_DRAGGABLE = ['today', 'dashboard', 'ops_hub', 'settings'];

export default function SidebarLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  useRealtimeSync();

  const { hasPermission, isOwner, currentBusiness, loading: bizLoading } = useBusiness();
  const { setOpen: openPalette } = useCommandPalette();
  const { pinnedIds, reorder, unpin, canEdit, vatLocked, contextGroupName } = useSidebarLayout();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const TAB_ROOTS = ['/Today', '/Dashboard', '/Money', '/Expenses', '/Income', '/OperationsHub', '/VATAndBookkeeping', '/Settings', '/Reports', '/Budgeting', '/Forecasting', '/Audit', '/Invitations', '/CreateBusiness', '/ConsolidatedView', '/Vendors', '/Integrations', '/MenuHeatmap', '/Payroll', '/MenuEngineering', '/RecipeManager', '/Dishes', '/Suppliers', '/Stock', '/Plan', '/Insights'];
  const isTopLevel = TAB_ROOTS.includes(location.pathname);

  // Build ordered sidebar item ids
  const orderedIds = buildSidebarItems(pinnedIds, vatLocked, isOwner());

  // Pinnable items = those not sacred-position first/last (dashboard/settings/ops_hub)
  const draggableIds = orderedIds.filter(id => !SACRED_NON_DRAGGABLE.includes(id));

  const handleDragEnd = (result) => {
    if (!result.destination || !canEdit) return;
    const reordered = Array.from(draggableIds);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    // reordered = the middle pinned items in new order
    reorder(reordered.filter(id => !['vat'].includes(id) || !vatLocked ? true : true));
  };

  const handleUnpin = (e, id) => {
    e.stopPropagation();
    if (!canEdit) return;
    if (id === 'vat' && vatLocked) return;
    unpin(id);
    toast.success(`Unpinned from ${contextGroupName}`, { duration: 2000 });
  };

  const renderNavItem = (id, idx, isDragging = false, dragHandleProps = null) => {
    const mod = MODULE_MAP[id];
    if (!mod) return null;

    // Settings: only for owners — hide once biz data is confirmed loaded and user is NOT owner
    if (id === 'settings' && !bizLoading && !isOwner()) return null;
    // VAT: hide only once confirmed non-owner AND no permission
    if (id === 'vat' && !bizLoading && !hasPermission('manage_bookkeeping') && !isOwner()) return null;

    const Icon = mod.icon;
    const active = isActive(mod.path);
    const isSacred = SACRED_NON_DRAGGABLE.includes(id) || (id === 'vat' && vatLocked);
    const isPinnableItem = !['dashboard', 'ops_hub', 'settings'].includes(id);

    // Special distinct style for Operations Hub
    if (id === 'ops_hub') {
      return (
        <div
          key={id}
          className={cn(
            'group/item relative flex items-center rounded-xl transition-all duration-300 cursor-pointer border overflow-hidden',
            active
              ? 'bg-gradient-to-br from-[#8B4BFF]/40 via-[#7B3BFF]/35 to-[#9D4EFF]/25 border-[#7B3BFF]/80 text-white shadow-[0_0_32px_rgba(123,59,255,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(123,59,255,0.65),inset_0_1px_0_rgba(255,255,255,0.15)]'
              : 'border-[#7B3BFF]/40 bg-gradient-to-br from-[#7B3BFF]/12 to-[#A855F7]/6 text-[#C084FC] hover:bg-gradient-to-br hover:from-[#7B3BFF]/22 hover:to-[#A855F7]/12 hover:border-[#7B3BFF]/70 hover:text-white hover:shadow-[0_0_28px_rgba(123,59,255,0.4)]',
            collapsed ? 'justify-center px-0 py-3' : 'px-3 py-3',
          )}
          onClick={() => navigate(mod.path)}
        >
          <Icon className={cn('w-5 h-5 flex-shrink-0 transition-all duration-300 group-hover/item:scale-125 group-hover/item:text-[#C084FC]', !collapsed && 'mr-2.5', active && 'text-[#C084FC] drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]')} />
          {!collapsed && (
            <span className={cn('flex-1 text-sm font-bold truncate transition-all duration-300', active && 'text-[#C084FC] drop-shadow-[0_0_6px_rgba(192,132,252,0.4)]', 'group-hover/item:text-white group-hover/item:drop-shadow-[0_0_6px_rgba(192,132,252,0.6)]')}>{mod.label}</span>
          )}
        </div>
      );
    }

    return (
      <div
        key={id}
        className={cn(
          'group/item relative flex items-center rounded-xl transition-all duration-300 cursor-pointer overflow-hidden border',
          active
            ? 'bg-gradient-to-br from-[#8B4BFF]/32 via-[#7B3BFF]/28 to-[#9D4EFF]/18 text-[#C084FC] shadow-[0_0_28px_rgba(123,59,255,0.48),inset_0_1px_0_rgba(255,255,255,0.08)] border-[#7B3BFF]/70 hover:shadow-[0_0_36px_rgba(123,59,255,0.6),inset_0_1px_0_rgba(255,255,255,0.12)]'
            : 'text-slate-400 hover:text-white hover:bg-gradient-to-br hover:from-[#7B3BFF]/16 hover:to-[#A855F7]/8 hover:border-[#7B3BFF]/60 hover:shadow-[0_0_24px_rgba(123,59,255,0.35)] border-[#7B3BFF]/30',
          collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5',
          isDragging && 'opacity-75 bg-gradient-to-r from-[#7B3BFF]/20 to-[#A855F7]/12 border-[#7B3BFF]/50 shadow-[0_0_24px_rgba(123,59,255,0.45)]'
        )}
        onClick={() => navigate(mod.path)}
      >
        {/* Drag handle */}
        {!collapsed && canEdit && !isSacred && dragHandleProps && (
          <span
            {...dragHandleProps}
            onClick={e => e.stopPropagation()}
            className="opacity-0 group-hover/item:opacity-100 mr-1 cursor-grab active:cursor-grabbing text-[#7B3BFF]/60 hover:text-[#A855F7] flex-shrink-0 transition-all duration-200 group-hover/item:scale-110"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </span>
        )}

        <Icon className={cn('w-5 h-5 flex-shrink-0 transition-all duration-300 group-hover/item:scale-125 group-hover/item:text-[#C084FC]', !collapsed && 'mr-2.5', active && 'text-[#C084FC] drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]')} />

        {!collapsed && (
          <span className={cn('flex-1 text-sm font-bold truncate transition-all duration-300', active && 'text-[#C084FC] drop-shadow-[0_0_6px_rgba(192,132,252,0.4)]', 'group-hover/item:text-white group-hover/item:drop-shadow-[0_0_6px_rgba(192,132,252,0.6)]')}>{mod.label}</span>
        )}

        {/* Unpin button — only on pinnable, non-sacred items */}
        {!collapsed && canEdit && isPinnableItem && !isSacred && (
          <button
            onClick={(e) => handleUnpin(e, id)}
            title={`Unpin from sidebar`}
            className="opacity-0 group-hover/item:opacity-100 ml-1 flex-shrink-0 text-[#7B3BFF]/60 hover:text-[#C084FC] transition-all duration-200 group-hover/item:scale-110"
          >
            <Pin className="w-3 h-3 fill-[#A855F7]" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0B12] flex">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-[#07070F]/98 border-r border-[#7B3BFF]/10 backdrop-blur-2xl transition-all duration-300 z-50 flex flex-col shadow-[0_0_80px_rgba(123,59,255,0.25),inset_-1px_0_0_rgba(123,59,255,0.08)]',
          'md:translate-x-0',
          collapsed ? 'md:w-16' : 'md:w-64',
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0',
          !collapsed && 'w-64'
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-[#7B3BFF]/10">
          {collapsed ? (
            <div className="w-10 h-10 mx-auto flex items-center justify-center group cursor-pointer">
              <img
                src="https://media.base44.com/images/public/698f4ecdefcf4d820e54e33f/50df0face_EEEE413D-A65A-4B84-A6CE-9F681EADF652.png"
                alt="S"
                className="w-10 h-10 object-contain transition-all duration-300 group-hover:scale-110"
                style={{ filter: 'drop-shadow(0 0 8px rgba(123,59,255,0.4))' }}
              />
            </div>
          ) : (
            <div>
              <LogoLink className="h-10" />
              <p className="text-[10px] text-slate-500 tracking-wide mt-1 pl-1">Intelligence Platform</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto flex flex-col gap-1">
          {/* Today — always first, not draggable */}
          {renderNavItem('today', -1)}

          {/* Dashboard — always second, not draggable */}
          {renderNavItem('dashboard', 0)}

          {/* Pinned middle items — draggable */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sidebar-pinned" isDropDisabled={!canEdit || collapsed}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-1">
                  {draggableIds.map((id, idx) => (
                    <Draggable key={id} draggableId={id} index={idx} isDragDisabled={!canEdit || collapsed}>
                      {(drag, snapshot) => (
                        <div ref={drag.innerRef} {...drag.draggableProps}>
                          {renderNavItem(id, idx, snapshot.isDragging, drag.dragHandleProps)}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Reset button — owner only, not collapsed */}
          {canEdit && !collapsed && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-[#7B3BFF]/20 to-transparent my-2" />
              <button
                onClick={() => setShowResetModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#7B3BFF]/10 border border-[#7B3BFF]/30 text-[#A855F7] hover:bg-[#7B3BFF]/20 hover:border-[#7B3BFF]/50 hover:shadow-[0_0_16px_rgba(123,59,255,0.25)] text-xs font-semibold transition-all duration-200 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset layout
              </button>
            </>
          )}
        </nav>

        {/* Bottom Items (Settings) */}
        <div className="p-3 border-t border-[#7B3BFF]/10 space-y-1">
          {renderNavItem('ops_hub', 98)}
          <BottomLogoLink collapsed={collapsed} />
          {isOwner() && renderNavItem('settings', 99)}
        </div>

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-[#7B3BFF]/10">
          <Button
            variant="outline"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'w-full border-[#7B3BFF]/40 hover:border-[#7B3BFF]/70 hover:shadow-[0_0_16px_rgba(123,59,255,0.3)] font-semibold',
              collapsed ? 'justify-center px-0' : 'justify-start'
            )}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5 mr-2" />
                <span className="text-sm">Collapse sidebar</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn('flex-1 transition-all duration-300 min-w-0', collapsed ? 'md:ml-16' : 'md:ml-64')}>
        {/* Top Header */}
        <header className={cn(
          'fixed top-0 right-0 z-40 h-16 border-b border-[#7B3BFF]/10 bg-[#07070F]/95 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 shadow-[0_4px_40px_rgba(123,59,255,0.15)]',
          'left-0',
          collapsed ? 'md:left-16' : 'md:left-64'
        )}>
          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              onClick={() => openPalette(true)}
              title="Search (⌘K)"
              className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              <Search className="w-4 h-4" />
            </button>

            {isTopLevel ? (
              <button className="md:hidden text-slate-400 hover:text-white p-1" onClick={() => setMobileOpen(o => !o)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            ) : (
              <button className="md:hidden flex items-center gap-1.5 text-slate-400 hover:text-white p-1 text-sm" onClick={() => navigate(-1)}>
                <ChevronLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <AlertsBell businessId={currentBusiness?.id} userId={undefined} />
            {bizLoading ? (
              <div className="w-28 h-8 rounded-xl bg-white/[0.05] animate-pulse" />
            ) : (
              <BusinessSwitcherPill />
            )}
            <QuickActionChips />
            <SmartUploadButton />
            <button
              onClick={() => navigate('/Dashboard')}
              title="Ask Setra"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#7B3BFF]/10 border border-[#7B3BFF]/20 text-[#C084FC] hover:bg-[#7B3BFF]/20 hover:border-[#7B3BFF]/40 transition-all duration-200 text-sm font-medium"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Ask Setra</span>
            </button>
            <UserMenu />
          </div>
        </header>

        <div className="pt-16 pb-16 md:pb-0">
          {children}
        </div>
      </main>

      <BottomTabs />
      <CommandPalette />

      {showResetModal && (
        <SidebarResetModal open={showResetModal} onClose={() => setShowResetModal(false)} />
      )}
    </div>
  );
}