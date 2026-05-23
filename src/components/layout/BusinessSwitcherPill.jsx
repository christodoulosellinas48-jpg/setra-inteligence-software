import React, { useState, useRef, useEffect } from 'react';
import { useBusiness } from '@/components/business/BusinessContext';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronDown, Layers, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BusinessSwitcherPill() {
  const { businesses, groups, currentBusiness, selectedGroupId, switchBusiness, selectGroup } = useBusiness();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedGroupName = selectedGroupId ? groups.find(g => g.id === selectedGroupId)?.name : null;
  const displayName = selectedGroupName || currentBusiness?.name || 'Select Business';
  const isGroup = !!selectedGroupId;

  const handleSelectBusiness = (business) => {
    switchBusiness(business);
    setOpen(false);
    // Small delay then reload to refresh all page data
    setTimeout(() => window.location.reload(), 50);
  };

  const handleSelectGroup = (groupId) => {
    selectGroup(groupId);
    setOpen(false);
    setTimeout(() => window.location.reload(), 50);
  };

  if (businesses.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200 text-sm font-medium',
          'border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#7B3BFF]/40 text-white',
          open && 'border-[#7B3BFF]/60 bg-[#7B3BFF]/10'
        )}
      >
        {isGroup ? (
          <Layers className="w-3.5 h-3.5 text-[#C084FC]" />
        ) : (
          <Building2 className="w-3.5 h-3.5 text-[#C084FC]" />
        )}
        <span className="max-w-[120px] truncate hidden sm:block">{displayName}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 sm:left-0 right-0 sm:right-auto mt-2 w-60 bg-[#151528] border border-white/10 rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] z-50 overflow-hidden">
          {/* Groups */}
          {groups.length > 0 && (
            <>
              <div className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="w-3 h-3" /> Groups
              </div>
              {groups.map(group => (
                <button
                  key={group.id}
                  onClick={() => handleSelectGroup(group.id)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 text-sm text-[#C084FC] transition-colors"
                >
                  <span className="truncate">{group.name}</span>
                  {selectedGroupId === group.id && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                </button>
              ))}
              <div className="h-px bg-white/5 mx-3" />
            </>
          )}

          {/* Businesses */}
          <div className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Building2 className="w-3 h-3" /> Venues
          </div>
          {businesses.map(business => (
            <button
              key={business.id}
              onClick={() => handleSelectBusiness(business)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 text-sm text-white transition-colors"
            >
              <span className="truncate">{business.name}</span>
              {!selectedGroupId && currentBusiness?.id === business.id && (
                <Check className="w-3.5 h-3.5 flex-shrink-0 text-[#C084FC]" />
              )}
            </button>
          ))}

          <div className="h-px bg-white/5" />
          <button
            onClick={() => { setOpen(false); navigate('/CreateBusiness'); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-emerald-400 hover:bg-white/5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add New Venue
          </button>
        </div>
      )}
    </div>
  );
}