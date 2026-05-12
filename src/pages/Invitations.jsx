import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useBusiness } from '@/components/business/BusinessContext';
import TeamManagement from '@/components/business/TeamManagement';
import {
  Users, Mail, Check, X, Building2, RefreshCw,
  Clock, CheckCircle2, XCircle, ArrowLeft
} from 'lucide-react';

const TABS = [
  { key: 'members', label: 'Team Members', icon: Users },
  { key: 'received', label: 'Received', icon: Mail },
];

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  icon: Clock,         color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30' },
  accepted: { label: 'Accepted', icon: CheckCircle2,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  declined: { label: 'Declined', icon: XCircle,       color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/30' },
};

function ReceivedTab({ user, businesses }) {
  const queryClient = useQueryClient();
  const { refreshBusinesses } = useBusiness();
  const [filter, setFilter] = useState('pending');

  const { data: allInvitations = [], isLoading } = useQuery({
    queryKey: ['myInvitations', user?.email],
    queryFn: () => base44.entities.BusinessMember.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const respondToInvitation = useMutation({
    mutationFn: async ({ invitationId, accept }) => {
      await base44.entities.BusinessMember.update(invitationId, {
        invitation_status: accept ? 'accepted' : 'declined',
        accepted_at: accept ? new Date().toISOString() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myInvitations']);
      queryClient.invalidateQueries(['pendingInvitations']);
      refreshBusinesses();
    },
  });

  const getBusinessName = (businessId) => {
    const b = businesses.find(b => b.id === businessId);
    return b?.name || 'Unknown Business';
  };

  const filtered = allInvitations.filter(i => i.invitation_status === filter);
  const pendingCount = allInvitations.filter(i => i.invitation_status === 'pending').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-[#7B3BFF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Status filter tabs */}
      <div className="flex gap-2">
        {['pending', 'accepted', 'declined'].map(s => {
          const cfg = STATUS_CONFIG[s];
          const count = allInvitations.filter(i => i.invitation_status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                filter === s
                  ? 'bg-[#7B3BFF]/20 border-[#7B3BFF]/50 text-white'
                  : 'bg-[#151528]/50 border-white/5 text-slate-400 hover:text-slate-300'
              }`}
            >
              {cfg.label}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === s ? 'bg-[#7B3BFF]/40 text-white' : 'bg-white/10 text-slate-500'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Card className="bg-[#151528]/50 border-white/5 p-12 rounded-2xl text-center">
          <Mail className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">
            {filter === 'pending' ? 'No pending invitations' : `No ${filter} invitations`}
          </h2>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            {filter === 'pending'
              ? "When someone invites you to manage their venue on Setra, it'll show up here so you can accept or decline."
              : `You have no ${filter} invitations.`}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((inv, idx) => {
            const cfg = STATUS_CONFIG[inv.invitation_status] || STATUS_CONFIG.pending;
            const Icon = cfg.icon;
            return (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
              >
                <Card className={`border p-5 rounded-2xl ${cfg.bg}`}>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-[#C084FC]" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">{getBusinessName(inv.business_id)}</p>
                        <p className="text-slate-400 text-sm">
                          Invited by <span className="text-slate-300">{inv.invited_by}</span> as{' '}
                          <span className="capitalize text-slate-300">{inv.role}</span>
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                          <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                          {inv.invited_at && (
                            <span className="text-xs text-slate-600 ml-1">
                              · {new Date(inv.invited_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {inv.invitation_status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => respondToInvitation.mutate({ invitationId: inv.id, accept: true })}
                          disabled={respondToInvitation.isPending}
                        >
                          <Check className="w-3.5 h-3.5 mr-1.5" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => respondToInvitation.mutate({ invitationId: inv.id, accept: false })}
                          disabled={respondToInvitation.isPending}
                          className="border-slate-700 text-slate-300 hover:bg-slate-800"
                        >
                          <X className="w-3.5 h-3.5 mr-1.5" />
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Invitations() {
  const navigate = useNavigate();
  const { user, currentBusiness } = useBusiness();
  const [activeTab, setActiveTab] = useState('members');

  const { data: businesses = [] } = useQuery({
    queryKey: ['allBusinesses'],
    queryFn: () => base44.entities.Business.list(),
  });

  const { data: pendingReceived = [] } = useQuery({
    queryKey: ['pendingInvitations', user?.email],
    queryFn: () => base44.entities.BusinessMember.filter({ user_email: user.email, invitation_status: 'pending' }),
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      <header className="border-b border-white/5 backdrop-blur-2xl sticky top-0 z-40 bg-[#0B0B12]/95">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/Dashboard')}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#C084FC]" />
              Team & Invitations
            </h1>
            {currentBusiness && (
              <p className="text-xs text-slate-500 mt-0.5">{currentBusiness.name}</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Tab bar */}
        <div className="flex gap-1 mb-8 bg-[#151528]/60 border border-white/5 rounded-xl p-1 w-fit">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const badge = tab.key === 'received' && pendingReceived.length > 0 ? pendingReceived.length : null;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-[#7B3BFF]/20 text-white shadow-inner'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === 'members' && <TeamManagement />}
        {activeTab === 'received' && <ReceivedTab user={user} businesses={businesses} />}
      </main>
    </div>
  );
}