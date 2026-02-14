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
import { UserPlus, Trash2, Mail, Shield, Eye, Edit, Loader2, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const ROLE_CONFIG = {
  owner: { label: 'Owner', icon: Crown, color: 'text-amber-400', description: 'Full access to all features' },
  manager: { label: 'Manager', icon: Edit, color: 'text-blue-400', description: 'Can upload invoices & edit budgets' },
  viewer: { label: 'Viewer', icon: Eye, color: 'text-slate-400', description: 'Read-only dashboard access' }
};

export default function TeamManagement() {
  const { currentBusiness, user, canManageTeam } = useBusiness();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [sending, setSending] = useState(false);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['businessMembers', currentBusiness?.id],
    queryFn: () => base44.entities.BusinessMember.filter({ business_id: currentBusiness.id }),
    enabled: !!currentBusiness
  });

  const deleteMember = useMutation({
    mutationFn: (memberId) => base44.entities.BusinessMember.delete(memberId),
    onSuccess: () => queryClient.invalidateQueries(['businessMembers', currentBusiness?.id])
  });

  const updateRole = useMutation({
    mutationFn: ({ memberId, role }) => base44.entities.BusinessMember.update(memberId, { role }),
    onSuccess: () => queryClient.invalidateQueries(['businessMembers', currentBusiness?.id])
  });

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !currentBusiness) return;
    setSending(true);

    // Check if already a member
    const existing = members.find(m => m.user_email === inviteEmail);
    if (existing) {
      alert('This user is already a member');
      setSending(false);
      return;
    }

    // Create membership
    await base44.entities.BusinessMember.create({
      business_id: currentBusiness.id,
      user_email: inviteEmail,
      role: inviteRole,
      invited_by: user.email,
      invitation_status: 'pending',
      invited_at: new Date().toISOString()
    });

    // Send invitation email
    await base44.integrations.Core.SendEmail({
      to: inviteEmail,
      subject: `You've been invited to ${currentBusiness.name} on Ellinas THE SETTING`,
      body: `
        <h2>You've been invited!</h2>
        <p>${user.full_name || user.email} has invited you to join <strong>${currentBusiness.name}</strong> as a <strong>${ROLE_CONFIG[inviteRole].label}</strong>.</p>
        <p>Log in to Ellinas THE SETTING to accept the invitation and access the business dashboard.</p>
        <p><strong>Role permissions:</strong> ${ROLE_CONFIG[inviteRole].description}</p>
      `
    });

    queryClient.invalidateQueries(['businessMembers', currentBusiness?.id]);
    setInviteEmail('');
    setInviteRole('viewer');
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
          <p className="text-sm text-slate-500">Manage who has access to {currentBusiness?.name}</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700">
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
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="manager" className="text-white hover:bg-slate-700">
                      <div className="flex items-center gap-2">
                        <Edit className="w-4 h-4 text-blue-400" />
                        Manager - Can upload & edit
                      </div>
                    </SelectItem>
                    <SelectItem value="viewer" className="text-white hover:bg-slate-700">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-slate-400" />
                        Viewer - Read-only access
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleInvite} 
                disabled={!inviteEmail.trim() || sending}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                Send Invitation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Owner */}
      <div className="space-y-2">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-white font-medium">{currentBusiness?.owner_email}</p>
              <p className="text-sm text-amber-400">Owner</p>
            </div>
          </div>
          {currentBusiness?.owner_email === user?.email && (
            <span className="text-xs text-slate-500">(You)</span>
          )}
        </motion.div>

        {/* Members */}
        {members.map((member, idx) => {
          const config = ROLE_CONFIG[member.role];
          const Icon = config.icon;
          
          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "flex items-center justify-between p-4 rounded-xl",
                member.invitation_status === 'pending' 
                  ? "bg-slate-800/30 border border-dashed border-slate-700"
                  : "bg-slate-800/50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                  <Icon className={cn("w-5 h-5", config.color)} />
                </div>
                <div>
                  <p className="text-white font-medium">{member.user_email}</p>
                  <div className="flex items-center gap-2">
                    <p className={cn("text-sm", config.color)}>{config.label}</p>
                    {member.invitation_status === 'pending' && (
                      <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">Pending</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select 
                  value={member.role} 
                  onValueChange={(role) => updateRole.mutate({ memberId: member.id, role })}
                >
                  <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="manager" className="text-white hover:bg-slate-700">Manager</SelectItem>
                    <SelectItem value="viewer" className="text-white hover:bg-slate-700">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMember.mutate(member.id)}
                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          );
        })}

        {members.length === 0 && (
          <p className="text-center text-slate-500 py-8">No team members yet. Invite someone to collaborate!</p>
        )}
      </div>
    </Card>
  );
}