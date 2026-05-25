import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Upload, AlertTriangle, ChefHat, FileText, PackageSearch, Target, BarChart2, Shield, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useBusiness } from '@/components/business/BusinessContext';

// Per-session dismissed state
const dismissed = new Set();

function useNBA(pathname, currentBusiness) {
  const [nba, setNba] = useState(null);

  useEffect(() => {
    if (!currentBusiness) return;
    if (dismissed.has(pathname)) { setNba(null); return; }

    let cancelled = false;

    async function compute() {
      try {
        if (pathname === '/Today') {
          const alerts = await base44.entities.Alert.filter({ business_id: currentBusiness.id });
          const active = alerts.filter(a => !a.dismissed_at).sort((a, b) => {
            const sev = { high: 0, medium: 1, info: 2 };
            return (sev[a.severity] ?? 3) - (sev[b.severity] ?? 3);
          });
          if (active.length > 0) {
            const a = active[0];
            if (!cancelled) setNba({ icon: AlertTriangle, label: a.headline, btn: 'View alert', action: () => window.location.href = '/Today/alerts' });
          } else {
            if (!cancelled) setNba({ icon: Upload, label: 'Upload a recent invoice to keep your data fresh', btn: 'Smart Upload', action: 'smart-upload' });
          }

        } else if (pathname === '/FinancialData') {
          const txns = await base44.entities.BankTransaction.filter({ business_id: currentBusiness.id });
          const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
          const recent = txns.filter(t => t.date >= cutoff);
          if (recent.length === 0) {
            if (!cancelled) setNba({ icon: FileText, label: 'Upload your bank statement to reconcile expenses', btn: 'Go to Bookkeeping', action: '/VATAndBookkeeping?tab=bank' });
          }

        } else if (pathname === '/Dishes') {
          const items = await base44.entities.Item.filter({ business_id: currentBusiness.id });
          const recipes = await base44.entities.Recipe.filter({ business_id: currentBusiness.id });
          const linkedItemIds = new Set(recipes.map(r => r.item_id).filter(Boolean));
          const unlinked = items.filter(i => !linkedItemIds.has(i.id));
          if (unlinked.length > 0) {
            if (!cancelled) setNba({ icon: ChefHat, label: `Link recipes for ${unlinked.length} dish${unlinked.length > 1 ? 'es' : ''} without one`, btn: 'Add recipe', action: '/Dishes?tab=recipes' });
          }

        } else if (pathname === '/VATAndBookkeeping') {
          const periods = await base44.entities.VATPeriod.filter({ business_id: currentBusiness.id });
          const open = periods.filter(p => p.status !== 'final' && p.filing_deadline);
          const soon = open.filter(p => {
            const days = (new Date(p.filing_deadline) - Date.now()) / 86400000;
            return days >= 0 && days <= 30;
          });
          if (soon.length > 0) {
            if (!cancelled) setNba({ icon: FileText, label: `Review and prepare your VAT filing (due ${soon[0].filing_deadline})`, btn: 'Open VAT', action: '/VATAndBookkeeping?tab=vat' });
          }

        } else if (pathname === '/Stock') {
          const adjustments = await base44.entities.InventoryAdjustment.filter({ business_id: currentBusiness.id });
          const cutoff = new Date(Date.now() - 14 * 86400000).toISOString();
          const recent = adjustments.filter(a => a.created_date >= cutoff);
          if (recent.length === 0) {
            if (!cancelled) setNba({ icon: PackageSearch, label: 'Run a stock take — last one was 14+ days ago', btn: 'Start stock take', action: '/Stock?tab=stocktake' });
          }

        } else if (pathname === '/Plan') {
          const snapshots = await base44.entities.FinancialSnapshot.filter({ business_id: currentBusiness.id });
          const hasTarget = snapshots.some(s => s.monthly_revenue > 0);
          if (!hasTarget) {
            if (!cancelled) setNba({ icon: Target, label: 'Set your monthly revenue target to enable forecasting', btn: 'Set target', action: '/Plan?tab=budget' });
          }

        } else if (pathname === '/Insights') {
          const audits = await base44.entities.AuditRun.filter({ business_id: currentBusiness.id });
          const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
          const recent = audits.filter(a => a.period_end >= cutoff);
          if (recent.length === 0) {
            if (!cancelled) setNba({ icon: BarChart2, label: 'Run a fresh audit to find your biggest profit opportunities', btn: 'Run audit', action: '/Insights?tab=audit' });
          }

        } else if (pathname === '/Settings') {
          // Suggest 2FA or team member
          const members = await base44.entities.BusinessMember.filter({ business_id: currentBusiness.id });
          if (members.length <= 1) {
            if (!cancelled) setNba({ icon: Users, label: 'Invite a team member to collaborate on your financials', btn: 'Invite', action: '/Settings#team' });
          } else {
            if (!cancelled) setNba({ icon: Shield, label: 'Enable 2FA to secure your account', btn: 'Enable 2FA', action: '/Settings#security' });
          }
        }
      } catch {
        // silently skip
      }
    }

    compute();
    return () => { cancelled = true; };
  }, [pathname, currentBusiness?.id]);

  return nba;
}

export default function NextBestAction() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentBusiness } = useBusiness();
  const [sessionDismissed, setSessionDismissed] = useState(false);
  const nba = useNBA(location.pathname, currentBusiness);

  // Reset dismiss when route changes
  useEffect(() => { setSessionDismissed(false); }, [location.pathname]);

  // Auto-hide when user types
  useEffect(() => {
    const handler = (e) => {
      if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        setSessionDismissed(true);
      }
    };
    window.addEventListener('focusin', handler);
    return () => window.removeEventListener('focusin', handler);
  }, []);

  if (!nba || sessionDismissed) return null;

  const Icon = nba.icon;

  const handleAction = () => {
    if (nba.action === 'smart-upload') {
      // trigger smart upload — just navigate to FinancialData for now
      navigate('/FinancialData');
    } else if (typeof nba.action === 'string') {
      navigate(nba.action);
    } else if (typeof nba.action === 'function') {
      nba.action();
    }
  };

  return (
    <div className="fixed bottom-24 md:bottom-6 right-6 z-50 max-w-xs w-full animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-[#151528] border border-[#7B3BFF]/30 rounded-2xl shadow-2xl p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#7B3BFF]/15 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-[#C084FC]" />
            </div>
            <p className="text-white text-xs font-medium leading-snug">{nba.label}</p>
          </div>
          <button
            onClick={() => setSessionDismissed(true)}
            className="text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          onClick={handleAction}
          className="w-full text-center px-3 py-2 rounded-xl bg-[#7B3BFF] hover:bg-[#6d2ff7] text-white text-xs font-medium transition-colors"
        >
          {nba.btn}
        </button>
      </div>
    </div>
  );
}