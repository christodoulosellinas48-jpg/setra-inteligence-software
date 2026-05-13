import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layers, Plus, Check, Loader2 } from 'lucide-react';

export default function AddToGroupModal({ business, userEmail, open, onClose, onSaved }) {
  const [groups, setGroups] = useState([]);
  const [mode, setMode] = useState('existing'); // 'existing' | 'new'
  const [selectedGroupId, setSelectedGroupId] = useState(business?.group_id || '');
  const [newGroupName, setNewGroupName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !userEmail) return;
    base44.entities.BusinessGroup.filter({ owner_email: userEmail })
      .then(g => {
        setGroups(g || []);
        setSelectedGroupId(business?.group_id || '');
        setMode((g || []).length > 0 ? 'existing' : 'new');
      })
      .catch(() => {});
  }, [open, userEmail, business?.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      let groupId = selectedGroupId;
      if (mode === 'new' && newGroupName.trim()) {
        const g = await base44.entities.BusinessGroup.create({ name: newGroupName.trim(), owner_email: userEmail });
        groupId = g.id;
      }
      await base44.entities.Business.update(business.id, { group_id: groupId || null });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const canSave = mode === 'existing' ? !!selectedGroupId : !!newGroupName.trim();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1A1A30] border-white/10 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Layers className="w-5 h-5 text-violet-400" />
            Assign Group — {business?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="flex gap-2">
            {groups.length > 0 && (
              <button
                onClick={() => setMode('existing')}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                  mode === 'existing' ? 'bg-[#7B3BFF]/20 border-[#7B3BFF]/50 text-white' : 'bg-[#0B0B12] border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                Existing group
              </button>
            )}
            <button
              onClick={() => setMode('new')}
              className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                mode === 'new' ? 'bg-[#7B3BFF]/20 border-[#7B3BFF]/50 text-white' : 'bg-[#0B0B12] border-white/10 text-slate-400 hover:border-white/20'
              }`}
            >
              <Plus className="w-3.5 h-3.5 inline mr-1" />
              New group
            </button>
          </div>

          {mode === 'existing' && groups.length > 0 && (
            <div className="space-y-1.5">
              {groups.map(g => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGroupId(g.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm transition-all ${
                    selectedGroupId === g.id
                      ? 'bg-[#7B3BFF]/20 border-[#7B3BFF]/50 text-white'
                      : 'bg-[#0B0B12] border-white/10 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    {g.name}
                  </span>
                  {selectedGroupId === g.id && <Check className="w-4 h-4 text-[#C084FC]" />}
                </button>
              ))}
            </div>
          )}

          {mode === 'new' && (
            <div>
              <Label className="text-slate-400 mb-1.5 block text-sm">New group name</Label>
              <Input
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                placeholder="e.g., Mezé Co. Group"
                className="bg-[#0B0B12] border-white/10 text-white"
              />
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 border-white/10 text-slate-300" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving || !canSave}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}