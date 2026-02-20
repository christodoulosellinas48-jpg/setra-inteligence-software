import React from 'react';
import { Card } from '@/components/ui/card';
import { UserCircle } from 'lucide-react';

export default function AccountantPortalTab() {
  return (
    <Card className="bg-slate-900/50 border-slate-800 p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
        <UserCircle className="w-8 h-8 text-cyan-400" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">Accountant Portal</h2>
      <p className="text-slate-400">
        Multi-client view for accountants (Premium feature).
      </p>
    </Card>
  );
}