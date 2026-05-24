/**
 * Shown when user tries to pin an 11th item.
 * Lists pinned items and lets them quick-unpin one.
 */
import React from 'react';
import { Pin } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSidebarLayout } from '@/lib/SidebarLayoutContext';
import { MODULE_MAP } from '@/lib/sidebarLayout';

export default function SidebarFullModal({ open, onClose }) {
  const { pinnedIds, unpin } = useSidebarLayout();

  const handleUnpin = (id) => {
    unpin(id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0F0F1E] border border-white/10 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Sidebar is full</DialogTitle>
          <DialogDescription className="text-slate-400">
            You've reached the 10-item limit. Unpin something to make room.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 mt-2">
          {pinnedIds.map(id => {
            const mod = MODULE_MAP[id];
            if (!mod) return null;
            const Icon = mod.icon;
            return (
              <div key={id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5">
                <div className="flex items-center gap-2 text-sm text-white">
                  <Icon className="w-4 h-4 text-slate-400" />
                  {mod.label}
                </div>
                <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white h-7 px-2" onClick={() => handleUnpin(id)}>
                  <Pin className="w-3.5 h-3.5 mr-1" /> Unpin
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}