import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBusiness } from '@/components/business/BusinessContext';
import BriefingCore from '@/components/today/BriefingCore.jsx';
import AlertsPanel from '@/components/today/AlertsPanel.jsx';
import PortfolioGlance from '@/components/today/PortfolioGlance.jsx';
import ShortcutRow from '@/components/today/ShortcutRow.jsx';
import HealthIndicator from '@/components/today/HealthIndicator.jsx';
import usePageTitle from '@/lib/usePageTitle';
import GuidedTour from '@/components/onboarding/GuidedTour.jsx';
import { Sun } from 'lucide-react';

function sortAlerts(alerts) {
  const timeSensitiveTypes = ['vat_deadline', 'payroll_deadline'];
  const severityOrder = { high: 0, medium: 1, info: 2 };
  return [...alerts].sort((a, b) => {
    const aTime = timeSensitiveTypes.includes(a.type) ? 0 : 1;
    const bTime = timeSensitiveTypes.includes(b.type) ? 0 : 1;
    if (aTime !== bTime) return aTime - bTime;
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return new Date(b.created_date) - new Date(a.created_date);
  });
}

export default function Today() {
  usePageTitle();
  const { currentBusiness, businesses, switchBusiness } = useBusiness();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const bizId = currentBusiness?.id;

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

  const setupProgress = useMemo(() => {
    if (!currentBusiness) return 0;
    let count = 0;
    if (currentBusiness.name && currentBusiness.industry_group) count++;
    if (currentBusiness.vat_registered !== undefined) count++;
    if (snapshots.length > 0) count++;
    if (expenses.length > 0) count++;
    if (members.length > 0) count++;
    return count;
  }, [currentBusiness, snapshots, expenses, members]);

  const { data: allAlerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts-today', bizId, user?.id],
    queryFn: async () => {
      const all = await base44.entities.Alert.filter({ business_id: bizId });
      return sortAlerts(all.filter(a => !a.dismissed_at));
    },
    enabled: !!bizId,
  });

  const handleDismiss = useCallback(async (alertId) => {
    await base44.entities.Alert.update(alertId, { dismissed_at: new Date().toISOString() });
    queryClient.invalidateQueries({ queryKey: ['alerts-today', bizId, user?.id] });
  }, [bizId, user?.id, queryClient]);

  const handleSelectBusiness = useCallback((biz) => {
    switchBusiness(biz);
    queryClient.invalidateQueries({ queryKey: ['alerts-today'] });
    queryClient.invalidateQueries({ queryKey: ['snapshots-today'] });
    queryClient.invalidateQueries({ queryKey: ['expenses-today'] });
    queryClient.invalidateQueries({ queryKey: ['members-today'] });
  }, [switchBusiness, queryClient]);

  // Derive a simple health score from alerts
  const healthScore = useMemo(() => {
    if (!allAlerts.length) return 92;
    const highCount = allAlerts.filter(a => a.severity === 'high').length;
    const medCount = allAlerts.filter(a => a.severity === 'medium').length;
    const score = Math.max(30, 100 - (highCount * 18) - (medCount * 7));
    return score;
  }, [allAlerts]);

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      {/* Page Header */}
      <div className="border-b border-white/[0.06] bg-[#0B0B12]/95 backdrop-blur-xl sticky top-16 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
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
            {/* Health indicator in header */}
            <HealthIndicator score={healthScore} />
          </div>
        </div>
      </div>

      <GuidedTour user={user} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <div data-tour="briefing">
          <BriefingCore
            user={user}
            business={currentBusiness}
            setupProgress={setupProgress}
            alerts={allAlerts}
          />
        </div>

        <div data-tour="checklist">
          <AlertsPanel
            alerts={allAlerts}
            totalCount={allAlerts.length}
            onDismiss={handleDismiss}
            loading={alertsLoading}
          />
        </div>

        <PortfolioGlance
          businesses={businesses}
          onSelectBusiness={handleSelectBusiness}
        />

        <ShortcutRow />
      </main>
    </div>
  );
}