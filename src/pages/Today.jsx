import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBusiness } from '@/components/business/BusinessContext';
import BriefingCore from '@/components/today/BriefingCore.jsx';
import AlertsPanel from '@/components/today/AlertsPanel.jsx';
import PortfolioGlance from '@/components/today/PortfolioGlance.jsx';
import ShortcutRow from '@/components/today/ShortcutRow.jsx';
import { Sun } from 'lucide-react';
import usePageTitle from '@/lib/usePageTitle';
import GuidedTour from '@/components/onboarding/GuidedTour.jsx';

export default function Today() {
  usePageTitle();

  const { currentBusiness, businesses, switchBusiness } = useBusiness();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  // Load current user
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const bizId = currentBusiness?.id;

  // Setup progress calculation
  const { data: snapshots = [] } = useQuery({
    queryKey: ['snapshots-today', bizId],
    queryFn: () => base44.entities.FinancialSnapshot.filter({ business_id: bizId }),
    enabled: !!bizId,
  });
  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses-today', bizId],
    queryFn: () => base44.entities.ExpenseDocument.filter({ business_id: bizId }),
    enabled: !!bizId,
  });
  const { data: members = [] } = useQuery({
    queryKey: ['members-today', bizId],
    queryFn: () => base44.entities.BusinessMember.filter({ business_id: bizId }),
    enabled: !!bizId,
  });

  const setupProgress = React.useMemo(() => {
    if (!currentBusiness) return 0;
    let count = 0;
    if (currentBusiness.name && currentBusiness.industry_group) count++;
    if (currentBusiness.vat_registered !== undefined) count++;
    if (snapshots.length > 0) count++;
    if (expenses.length > 0) count++;
    if (members.length > 0) count++;
    return count;
  }, [currentBusiness, snapshots, expenses, members]);

  // Alerts — fetch for current business + user
  const { data: allAlerts = [], isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['alerts-today', bizId, user?.id],
    queryFn: async () => {
      const all = await base44.entities.Alert.filter({ business_id: bizId });
      return all
        .filter(a => !a.dismissed_at)
        .sort((a, b) => {
          const sev = { high: 0, medium: 1, info: 2 };
          if (sev[a.severity] !== sev[b.severity]) return sev[a.severity] - sev[b.severity];
          return new Date(b.created_date) - new Date(a.created_date);
        });
    },
    enabled: !!bizId,
  });

  const handleDismiss = useCallback(async (alertId) => {
    await base44.entities.Alert.update(alertId, { dismissed_at: new Date().toISOString() });
    queryClient.invalidateQueries({ queryKey: ['alerts-today', bizId, user?.id] });
  }, [bizId, user?.id, queryClient]);

  const handleSelectBusiness = useCallback((biz) => {
    switchBusiness(biz);
    // Refetch data for new business
    queryClient.invalidateQueries({ queryKey: ['alerts-today'] });
    queryClient.invalidateQueries({ queryKey: ['snapshots-today'] });
    queryClient.invalidateQueries({ queryKey: ['expenses-today'] });
    queryClient.invalidateQueries({ queryKey: ['members-today'] });
  }, [switchBusiness, queryClient]);

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      {/* Page Header */}
      <div className="border-b border-white/[0.06] bg-[#0B0B12]/95 backdrop-blur-xl sticky top-16 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/15 border border-amber-500/25 flex items-center justify-center">
              <Sun className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">Today</h1>
              <p className="text-xs text-slate-500">
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <GuidedTour user={user} />

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Widget 1: Briefing Core */}
        <div data-tour="briefing">
          <BriefingCore
            user={user}
            business={currentBusiness}
            setupProgress={setupProgress}
          />
        </div>

        {/* Widget 2: Alerts Panel */}
        <div data-tour="checklist">
          <AlertsPanel
            alerts={allAlerts}
            totalCount={allAlerts.length}
            onDismiss={handleDismiss}
            loading={alertsLoading}
          />
        </div>

        {/* Widget 3: Portfolio Glance (2+ businesses only) */}
        <PortfolioGlance
          businesses={businesses}
          onSelectBusiness={handleSelectBusiness}
        />

        {/* Widget 4: Shortcut Row */}
        <ShortcutRow />
      </main>
    </div>
  );
}