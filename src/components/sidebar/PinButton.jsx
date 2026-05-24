/**
 * PinButton — shown on OperationsHub module cards.
 * Handles all states: pinned, unpinned, locked (sacred/vat), tier-gated, non-owner.
 */
import React from 'react';
import { Pin, PinOff, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarLayout } from '@/lib/SidebarLayoutContext';
import { useNavigate } from 'react-router-dom';

// Modules that can never be pinned/unpinned via the Hub
const SACRED_IDS = ['dashboard', 'ops_hub', 'settings'];

export default function PinButton({ moduleId, isPro = true, className = '' }) {
  const navigate = useNavigate();
  const { canEdit, isPinned, pin, unpin, canPinMore, vatLocked, contextGroupName } = useSidebarLayout();

  const pinned = isPinned(moduleId);
  const isSacred = SACRED_IDS.includes(moduleId);
  const isVatModule = moduleId === 'vat';
  const vatLock = isVatModule && vatLocked;

  if (isSacred) return null; // no pin icon for sacred items

  const handleClick = (e) => {
    e.stopPropagation();

    if (!isPro) {
      navigate('/Pricing');
      return;
    }
    if (!canEdit) return;
    if (vatLock && pinned) return; // can't unpin

    if (pinned) {
      unpin(moduleId);
    } else {
      if (!canPinMore) return; // caller shows modal; for now silently block
      pin(moduleId);
    }
  };

  let tooltip = pinned
    ? `Unpin from sidebar (${contextGroupName})`
    : `Pin to sidebar (${contextGroupName})`;

  if (!isPro) tooltip = 'Customize your sidebar — available on Pro and Premium. Upgrade →';
  if (!canEdit && isPro) tooltip = 'Only the business owner can change the layout.';
  if (vatLock && pinned) tooltip = 'Required — at least one venue in this group is VAT-registered.';

  return (
    <button
      onClick={handleClick}
      title={tooltip}
      className={cn(
        'flex items-center justify-center w-6 h-6 rounded-md transition-all duration-150',
        'opacity-0 group-hover:opacity-100',
        pinned
          ? 'text-[#A855F7]'
          : 'text-slate-500 hover:text-slate-300',
        (!isPro || !canEdit) && 'cursor-default opacity-30 group-hover:opacity-40',
        vatLock && pinned && 'cursor-default',
        className
      )}
    >
      {vatLock && pinned ? (
        <Lock className="w-3.5 h-3.5" />
      ) : pinned ? (
        <Pin className="w-3.5 h-3.5 fill-[#A855F7]" />
      ) : (
        <Pin className="w-3.5 h-3.5" />
      )}
    </button>
  );
}