import React from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useSidebarLayout } from '@/lib/SidebarLayoutContext';

export default function SidebarResetModal({ open, onClose }) {
  const { reset, contextGroupName } = useSidebarLayout();

  const handleConfirm = async () => {
    await reset();
    onClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="bg-[#0F0F1E] border border-white/10">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Reset sidebar to default?</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400">
            This will reset the sidebar layout for <span className="text-white font-medium">{contextGroupName}</span> to the default.
            All venues in this group will be affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 text-slate-300 hover:text-white">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-[#7B3BFF] hover:bg-[#6B2BEF]">
            Reset
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}