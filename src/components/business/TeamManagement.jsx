import React, { useState } from 'react';
import { useBusiness } from './BusinessContext';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Trash2, Mail, Shield, Eye, Edit, Loader2, Crown, Calculator, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PERMISSIONS, ROLE_CONFIG, ROLE_DEFAULT_PERMISSIONS, getMemberPermissions } from './permissions';

const ROLE_ICONS = { owner: Crown, manager: Edit, accountant: Calculator, viewer: Eye };

function PermissionsEditor({ permissions, onChange }) {
  return (
    <div className="grid grid-cols-1 gap-2 mt-3">
      {Object.entries(PERMISSIONS).map(([key, { label, description }]) => {
        const checked = permissions.includes(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(checked ? permissions.filter(p => p !== key) : [...permissions, key])}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
              checked
                ? 'bg-purple-500/10 border-purple-500/40 text-white'
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'
            )}
          >
            <div className={cn(
              'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0',
              checked ? 'bg-purple-500 border-purple-500' : 'border-slate-600'
            )}>
              {checked && <Check className="w-3 h-3 text-white" />}
            </div>
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-slate-500">{description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function MemberRow({ member, onRoleChange, onPermissionsChange, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const config = ROLE_CONFIG[member.role] || ROLE_CONFIG.viewer;
  const Icon = ROLE_ICONS[member.role] || Eye;
  const currentPerms = getMemberPermissions(member);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-700 overflow-hidden"
    >
      <div className={cn(
        'flex items-center justify-between p-4',
        member.invitation_status === 'pending' ? 'bg-slate-800/30' : 'bg-slate-800/50'
      )}>
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', config.bg)}>
            <Icon className={cn('w-5 h-5', config.color)} />
          </div>
          <div>
            <p className="text-white font-medium">{member.user_email}</p>
            <div className="flex items-center gap-2">
              <p className={cn('text-sm', config.color)}>{config.label}</p>
              {member.invitation_status === 'pending' && (
                <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">Pending</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={member.role} onValueChange={(role) => onRoleChange(member.id, role)}>
            <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {['manager', 'accountant', 'viewer'].map(r => (
                <SelectItem key={r} value={r} className="text-white hover:bg-slate-700">
                  {ROLE_CONFIG[r].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(v => !v)}
            className="text-slate-400 hover:text-white"
            title="Edit permissions"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(member.id)}
            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-700 bg-slate-900/50 px-4 pb-4 overflow-hidden"
          >
            <div className="flex items-center gap-2 pt-3 mb-1">
              <Shield className="w-4 h-4 text-purple-400" />
              <p className="text-sm font-medium text-white">Granular Permissions</p>
              <span className="text-xs text-slate-500 ml-auto">Override role defaults</span>
            </div>
            <PermissionsEditor
              permissions={currentPerms}
              onChange={(perms) => onPermissionsChange(member.id, perms)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function TeamManagement() {
  const { currentBusiness, user, canManageTeam } = useBusiness();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [invitePerms, setInvitePerms] = useState(ROLE_DEFAULT_PERMISSIONS.viewer);
  const [sending, setSending] = useState(false);

  const { data: members = [] } = useQuery({
    queryKey: ['businessMembers', currentBusiness?.id],
    queryFn: () => base44.entities.BusinessMember.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness
  });

  const deleteMember = useMutation({
    mutationFn: (memberId) => base44.entities.BusinessMember.delete(memberId),
    onSuccess: () => queryClient.invalidateQueries(['businessMembers', currentBusiness?.id])
  });

  const updateMember = useMutation({
    mutationFn: ({ memberId, data }) => base44.entities.BusinessMember.update(memberId, data),
    onSuccess: () => queryClient.invalidateQueries(['businessMembers', currentBusiness?.id])
  });

  const handleRoleChange = (memberId, role) => {
    updateMember.mutate({
      memberId,
      data: { role, permissions: JSON.stringify(ROLE_DEFAULT_PERMISSIONS[role] || []) }
    });
  };

  const handlePermissionsChange = (memberId, perms) => {
    updateMember.mutate({ memberId, data: { permissions: JSON.stringify(perms) } });
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !currentBusiness) return;
    setSending(true);
    const existing = members.find(m => m.user_email === inviteEmail);
    if (existing) { alert('This user is already a member'); setSending(false); return; }

    await base44.entities.BusinessMember.create({
      business_id: currentBusiness.id,
      user_email: inviteEmail,
      role: inviteRole,
      permissions: JSON.stringify(invitePerms),
      invited_by: user.email,
      invitation_status: 'pending',
      invited_at: new Date().toISOString()
    });

    await base44.integrations.Core.SendEmail({
      to: inviteEmail,
      subject: `You've been invited to ${currentBusiness.name} on Setra Connect`,
      body: `
        <h2>You've been invited!</h2>
        <p>${user.full_name || user.email} has invited you to join <strong>${currentBusiness.name}</strong> as a <strong>${ROLE_CONFIG[inviteRole].label}</strong>.</p>
        <p><strong>Your permissions:</strong> ${invitePerms.map(p => PERMISSIONS[p]?.label).filter(Boolean).join(', ')}</p>
        <p>Log in to Setra Connect to accept the invitation.</p>
      `
    });

    queryClient.invalidateQueries(['businessMembers', currentBusiness?.id]);
    setInviteEmail('');
    setInviteRole('viewer');
    setInvitePerms(ROLE_DEFAULT_PERMISSIONS.viewer);
    setInviteOpen(false);
    setSending(false);
  };

  if (!canManageTeam()) {
    return (
      <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl">
        <p className="text-slate-400">Only business owners can manage team members.</p>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Team Members</h3>
          <p className="text-sm text-slate-500">Manage access to {currentBusiness?.name}</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Invite Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label className="text-slate-400">Email Address</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-slate-400">Role</Label>
                <Select value={inviteRole} onValueChange={(r) => { setInviteRole(r); setInvitePerms(ROLE_DEFAULT_PERMISSIONS[r] || []); }}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {[
                      { value: 'manager', Icon: Edit },
                      { value: 'accountant', Icon: Calculator },
                      { value: 'viewer', Icon: Eye },
                    ].map(({ value, Icon }) => (
                      <SelectItem key={value} value={value} className="text-white hover:bg-slate-700">
                        <div className="flex items-center gap-2">
                          <Icon className={cn('w-4 h-4', ROLE_CONFIG[value].color)} />
                          <span>{ROLE_CONFIG[value].label}</span>
                          <span className="text-slate-500 text-xs">— {ROLE_CONFIG[value].description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Permissions */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <Label className="text-slate-400">Permissions</Label>
                </div>
                <p className="text-xs text-slate-500 mb-2">Customize what this person can do</p>
                <PermissionsEditor permissions={invitePerms} onChange={setInvitePerms} />
              </div>

              <Button
                onClick={handleInvite}
                disabled={!inviteEmail.trim() || sending}
                className="w-full"
              >
                {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                Send Invitation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {/* Owner row */}
        <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-white font-medium">{currentBusiness?.owner_email}</p>
              <p className="text-sm text-amber-400">Owner — Full access</p>
            </div>
          </div>
          {currentBusiness?.owner_email === user?.email && (
            <span className="text-xs text-slate-500">(You)</span>
          )}
        </div>

        {members.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            onRoleChange={handleRoleChange}
            onPermissionsChange={handlePermissionsChange}
            onDelete={(id) => deleteMember.mutate(id)}
          />
        ))}

        {members.length === 0 && (
          <p className="text-center text-slate-500 py-8">No team members yet. Invite someone to collaborate!</p>
        )}
      </div>
    </Card>
  );
}