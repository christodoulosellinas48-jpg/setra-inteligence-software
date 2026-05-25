/**
 * Sidebar layout utilities
 *
 * Layout is stored as a JSON array of pinned module ids.
 * Sacred items (dashboard, ops_hub, vat, settings) are injected at
 * render time — they are NOT stored in the layout array.
 *
 * Pinnable module registry — one source of truth.
 */

import {
  LayoutDashboard, TrendingUp, Receipt, UtensilsCrossed,
  Package, Store, Target, Lightbulb, Users, Plug, Zap, Settings
} from 'lucide-react';

export const ALL_MODULES = [
  // Sacred — always in sidebar, not pinnable
  { id: 'dashboard',   label: 'Dashboard',          icon: LayoutDashboard, path: '/Dashboard',         sacred: true,  sacredPosition: 'first' },
  { id: 'ops_hub',     label: 'Operations Hub',      icon: Zap,             path: '/OperationsHub',     sacred: true },
  { id: 'vat',         label: 'VAT & Bookkeeping',   icon: Receipt,         path: '/VATAndBookkeeping', sacred: 'vat_condition' },
  { id: 'integrations',label: 'Integrations',        icon: Plug,            path: '/Integrations',      sacred: false },
  { id: 'settings',    label: 'Settings',            icon: Settings,        path: '/Settings',          sacred: true,  sacredPosition: 'last', ownerOnly: true },

  // Pinnable
  { id: 'money',       label: 'Financial Data',      icon: TrendingUp,      path: '/Money',             sacred: false },
  { id: 'dishes',      label: 'Dishes',              icon: UtensilsCrossed, path: '/Dishes',            sacred: false },
  { id: 'stock',       label: 'Stock',               icon: Package,         path: '/Stock',             sacred: false },
  { id: 'suppliers',   label: 'Suppliers',           icon: Store,           path: '/Suppliers',         sacred: false },
  { id: 'plan',        label: 'Plan',                icon: Target,          path: '/Plan',              sacred: false },
  { id: 'insights',    label: 'Insights',            icon: Lightbulb,       path: '/Insights',          sacred: false },
  { id: 'payroll',     label: 'Payroll',             icon: Users,           path: '/Payroll',           sacred: false },
];

export const MODULE_MAP = Object.fromEntries(ALL_MODULES.map(m => [m.id, m]));

// Default pinned ids by context (excludes sacred items which are auto-injected)
// Starter plan baseline: dashboard, money, vat, stock — included in all defaults
const DEFAULT_GROUP      = ['money', 'vat', 'stock', 'integrations'];
const DEFAULT_RESTAURANT = ['money', 'vat', 'stock', 'dishes', 'insights', 'integrations'];
const DEFAULT_FOOD_TO_GO = ['money', 'vat', 'stock', 'dishes', 'integrations'];
const DEFAULT_COFFEE_SHOP= ['money', 'vat', 'stock', 'integrations'];

export function getDefaultPinned(industryGroup) {
  if (industryGroup === 'restaurant') return DEFAULT_RESTAURANT;
  if (industryGroup === 'food_to_go') return DEFAULT_FOOD_TO_GO;
  if (industryGroup === 'coffee_shop') return DEFAULT_COFFEE_SHOP;
  return DEFAULT_GROUP;
}

export function parseSidebarLayout(json) {
  if (!json) return null;
  try { return JSON.parse(json); } catch { return null; }
}

export function serializeSidebarLayout(ids) {
  return JSON.stringify(ids);
}

export const MAX_SIDEBAR_ITEMS = 10; // including sacred

/**
 * Build the ordered list of module ids to show in the sidebar.
 * Sacred items are injected around the pinned list.
 */
export function buildSidebarItems(pinnedIds, isVatRegistered, isOwner) {
  const sacred = ['dashboard', 'ops_hub'];
  if (isVatRegistered) sacred.push('vat');

  // pinned = user-ordered pinnable items (filter out any sacred ids that slipped in)
  const pinned = (pinnedIds || []).filter(id => !['dashboard', 'ops_hub', 'settings'].includes(id));

  const items = [
    'dashboard',
    ...pinned,
    ...(isOwner ? ['settings'] : []),
  ];

  return [...new Set(items)]; // deduplicate
}

/**
 * Is the VAT item locked (cannot be unpinned)?
 */
export function isVatLocked(businesses, groupId) {
  if (!businesses) return false;
  const scopeBusinesses = groupId
    ? businesses.filter(b => b.group_id === groupId)
    : businesses;
  return scopeBusinesses.some(b => b.vat_registered);
}