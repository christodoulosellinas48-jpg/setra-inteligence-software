import React, { useState, useEffect } from 'react';
import { X, Plus, Star, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * SavedViews — generic saved filter views component.
 *
 * Props:
 *   pageKey      — string identifier for this page (e.g. 'financial_data')
 *   currentFilters — object of active filters (serialised to JSON for storage)
 *   onApplyView  — callback(filters) when a view pill is clicked
 *   defaultViews — array of { name, filters } pre-seeded views
 *   hasActiveFilters — boolean, show "+ Save view" when true
 *   userId       — string
 *   businessId   — string
 */
export default function SavedViews({ pageKey, currentFilters, onApplyView, defaultViews = [], hasActiveFilters = false, userId, businessId }) {
  const [views, setViews] = useState([]);
  const [activeViewName, setActiveViewName] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [makeDefault, setMakeDefault] = useState(false);

  const storageKey = `setra_views_${pageKey}_${userId}_${businessId}`;

  // Load persisted views, merge with defaults
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const names = new Set(saved.map(v => v.name));
      const merged = [...saved, ...defaultViews.filter(d => !names.has(d.name))];
      setViews(merged);
    } catch {
      setViews(defaultViews);
    }
  }, [storageKey]);

  const persist = (newViews) => {
    setViews(newViews);
    try { localStorage.setItem(storageKey, JSON.stringify(newViews)); } catch {}
  };

  const handleSave = () => {
    if (!newName.trim()) return;
    const view = { name: newName.trim(), filters: currentFilters, isDefault: makeDefault, isCustom: true };
    const updated = [...views.filter(v => v.name !== newName.trim()), view];
    persist(updated);
    setActiveViewName(newName.trim());
    setShowSaveModal(false);
    setNewName('');
    setMakeDefault(false);
  };

  const handleDelete = (e, name) => {
    e.stopPropagation();
    persist(views.filter(v => v.name !== name));
    if (activeViewName === name) setActiveViewName(null);
  };

  const handleApply = (view) => {
    setActiveViewName(view.name);
    onApplyView?.(view.filters);
  };

  if (!views.length && !hasActiveFilters) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 flex-nowrap">
        {views.map(view => (
          <button
            key={view.name}
            onClick={() => handleApply(view)}
            className={`group flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
              activeViewName === view.name
                ? 'bg-[#7B3BFF]/25 border-[#7B3BFF]/60 text-[#C084FC]'
                : 'bg-white/[0.04] border-white/[0.07] text-slate-400 hover:text-white hover:border-white/20'
            }`}
          >
            {view.isDefault && <Star className="w-2.5 h-2.5" />}
            {view.name}
            {view.isCustom && (
              <span
                onClick={e => handleDelete(e, view.name)}
                className="ml-0.5 opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-all"
              >
                <X className="w-2.5 h-2.5" />
              </span>
            )}
          </button>
        ))}
      </div>

      {hasActiveFilters && (
        <button
          onClick={() => setShowSaveModal(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-white/20 text-slate-500 hover:text-white hover:border-white/40 transition-all whitespace-nowrap"
        >
          <Plus className="w-3 h-3" /> Save view
        </button>
      )}

      {/* Save modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={e => { if (e.target === e.currentTarget) setShowSaveModal(false); }}>
          <div className="bg-[#151528] border border-white/10 rounded-2xl shadow-2xl p-5 w-full max-w-xs">
            <h3 className="text-white font-semibold mb-3">Name this view</h3>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowSaveModal(false); }}
              placeholder="e.g. Last 90 days food"
              className="w-full bg-[#0B0B12] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#7B3BFF]/40 mb-3"
            />
            <label className="flex items-center gap-2 text-sm text-slate-400 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={makeDefault}
                onChange={e => setMakeDefault(e.target.checked)}
                className="rounded border-white/20"
              />
              Make default for this page
            </label>
            <div className="flex gap-2">
              <button onClick={() => setShowSaveModal(false)} className="flex-1 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={!newName.trim()} className="flex-1 py-2 rounded-xl bg-[#7B3BFF] hover:bg-[#6d2ff7] disabled:opacity-50 text-white text-sm font-medium transition-colors">
                <Check className="w-3.5 h-3.5 inline mr-1" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}