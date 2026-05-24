/**
 * SidebarLayoutContext
 *
 * Provides pinned module ids and pin/unpin/reorder operations.
 * Layout is per-group (for grouped venues) or per-venue (standalone).
 * Persisted to BusinessGroup.sidebar_layout or Business.sidebar_layout.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { parseSidebarLayout, serializeSidebarLayout, getDefaultPinned, isVatLocked, MAX_SIDEBAR_ITEMS, buildSidebarItems } from './sidebarLayout';

const SidebarLayoutContext = createContext(null);

export function SidebarLayoutProvider({ children, currentBusiness, groups, businesses, userRole }) {
  const [pinnedIds, setPinnedIds] = useState(null); // null = loading
  const saveTimer = useRef(null);

  // Determine if the current business is in a group
  const currentGroup = groups?.find(g => g.id === currentBusiness?.group_id) ?? null;
  const layoutKey = currentGroup ? `group:${currentGroup.id}` : `biz:${currentBusiness?.id}`;

  // Load layout when business/group changes
  useEffect(() => {
    if (!currentBusiness) return;

    let raw = null;
    if (currentGroup) {
      raw = currentGroup.sidebar_layout;
    } else {
      raw = currentBusiness.sidebar_layout;
    }

    const parsed = parseSidebarLayout(raw);
    if (parsed) {
      setPinnedIds(parsed);
    } else {
      // Fall back to business-type default
      setPinnedIds(getDefaultPinned(currentBusiness.industry_group));
    }
  }, [layoutKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const vatLocked = isVatLocked(businesses, currentGroup?.id ?? null);

  const persistLayout = useCallback(async (ids) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const json = serializeSidebarLayout(ids);
      try {
        if (currentGroup) {
          await base44.entities.BusinessGroup.update(currentGroup.id, { sidebar_layout: json });
        } else if (currentBusiness) {
          await base44.entities.Business.update(currentBusiness.id, { sidebar_layout: json });
        }
      } catch (e) {
        console.error('Failed to save sidebar layout', e);
      }
    }, 300);
  }, [currentGroup, currentBusiness]);

  const canEdit = userRole === 'owner';

  const pin = useCallback((moduleId) => {
    if (!canEdit) return;
    setPinnedIds(prev => {
      const current = prev || [];
      if (current.includes(moduleId)) return prev;
      // Check max (sacred = dashboard + ops_hub + settings = 3, vat if locked)
      const sacredCount = 2 + (vatLocked ? 1 : 0) + 1; // +1 for settings
      if (current.length + sacredCount >= MAX_SIDEBAR_ITEMS) {
        return prev; // caller should check canPin first
      }
      const next = [...current, moduleId];
      persistLayout(next);
      return next;
    });
  }, [canEdit, vatLocked, persistLayout]);

  const unpin = useCallback((moduleId) => {
    if (!canEdit) return;
    // vat locked check
    if (moduleId === 'vat' && vatLocked) return;
    setPinnedIds(prev => {
      const next = (prev || []).filter(id => id !== moduleId);
      persistLayout(next);
      return next;
    });
  }, [canEdit, vatLocked, persistLayout]);

  const reorder = useCallback((newOrder) => {
    if (!canEdit) return;
    setPinnedIds(newOrder);
    persistLayout(newOrder);
  }, [canEdit, persistLayout]);

  const reset = useCallback(async () => {
    if (!canEdit) return;
    const defaultIds = getDefaultPinned(currentBusiness?.industry_group);
    setPinnedIds(defaultIds);
    const json = serializeSidebarLayout(defaultIds);
    try {
      if (currentGroup) {
        await base44.entities.BusinessGroup.update(currentGroup.id, { sidebar_layout: json });
      } else if (currentBusiness) {
        await base44.entities.Business.update(currentBusiness.id, { sidebar_layout: json });
      }
    } catch (e) {
      console.error('Failed to reset sidebar layout', e);
    }
  }, [canEdit, currentBusiness, currentGroup]);

  const isPinned = (id) => (pinnedIds || []).includes(id);

  // How many more items can be pinned?
  const pinnedCount = (pinnedIds || []).length;
  const sacredCount = 2 + (vatLocked ? 1 : 0) + 1; // dashboard + ops_hub + (vat) + settings
  const canPinMore = (pinnedCount + sacredCount) < MAX_SIDEBAR_ITEMS;

  const contextGroupName = currentGroup?.name ?? currentBusiness?.name ?? 'this venue';

  return (
    <SidebarLayoutContext.Provider value={{
      pinnedIds: pinnedIds || [],
      currentGroup,
      vatLocked,
      canEdit,
      canPinMore,
      contextGroupName,
      isPinned,
      pin,
      unpin,
      reorder,
      reset,
    }}>
      {children}
    </SidebarLayoutContext.Provider>
  );
}

export function useSidebarLayout() {
  const ctx = useContext(SidebarLayoutContext);
  if (!ctx) throw new Error('useSidebarLayout must be used within SidebarLayoutProvider');
  return ctx;
}