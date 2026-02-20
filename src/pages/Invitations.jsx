import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Mail, Check, X, Building2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBusiness } from '@/components/business/BusinessContext';

export default function Invitations() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, refreshBusinesses } = useBusiness();

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['pendingInvitations', user?.email],
    queryFn: () => base44.entities.BusinessMember.filter({ 
      user_email: user.email, 
      invitation_status: 'pending' 
    }),
    enabled: !!user
  });

  const { data: businesses = [] } = useQuery({
    queryKey: ['allBusinesses'],
    queryFn: () => base44.entities.Business.list()
  });

  const respondToInvitation = useMutation({
    mutationFn: async ({ invitationId, accept }) => {
      await base44.entities.BusinessMember.update(invitationId, {
        invitation_status: accept ? 'accepted' : 'declined',
        accepted_at: accept ? new Date().toISOString() : null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingInvitations']);
      refreshBusinesses();
    }
  });

  const getBusinessName = (businessId) => {
    const business = businesses.find(b => b.id === businessId);
    return business?.name || 'Unknown Business';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800/50 backdrop-blur-sm sticky top-0 z-40 bg-slate-950/80">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate(createPageUrl('Dashboard'))}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Mail className="w-6 h-6 text-rose-400" />
                Invitations
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {invitations.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-800 p-12 rounded-2xl text-center">
            <Mail className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No Pending Invitations</h2>
            <p className="text-slate-500">You don't have any pending business invitations.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation, idx) => (
              <motion.div
                key={invitation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-red-500/20 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-rose-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {getBusinessName(invitation.business_id)}
                        </h3>
                        <p className="text-slate-500 text-sm">
                          Invited by {invitation.invited_by} as <span className="capitalize text-slate-300">{invitation.role}</span>
                        </p>
                        <p className="text-slate-600 text-xs mt-1">
                          {new Date(invitation.invited_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => respondToInvitation.mutate({ invitationId: invitation.id, accept: true })}
                        className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-lg shadow-rose-500/25"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => respondToInvitation.mutate({ invitationId: invitation.id, accept: false })}
                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}