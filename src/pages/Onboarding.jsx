import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { RefreshCw } from 'lucide-react';

import WizardProgress from '@/components/onboarding/WizardProgress';
import StepWelcome from '@/components/onboarding/StepWelcome';
import StepBusinessDetails from '@/components/onboarding/StepBusinessDetails';
import StepConnectPOS from '@/components/onboarding/StepConnectPOS';
import StepConnectAccounting from '@/components/onboarding/StepConnectAccounting';
import StepUploadInvoice from '@/components/onboarding/StepUploadInvoice';
import StepFirstSnapshot from '@/components/onboarding/StepFirstSnapshot';

const TOTAL_STEPS = 6;
const STEP_LABELS = ['Welcome', 'Your business', 'Connect POS', 'Accounting', 'First invoice', 'Your snapshot'];

export default function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [wizardData, setWizardData] = useState({});
  const [creatingBusiness, setCreatingBusiness] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        const ownedBusinesses = await base44.entities.Business.filter({ owner_email: currentUser.email });
        const memberships = await base44.entities.BusinessMember.filter({
          user_email: currentUser.email,
          invitation_status: 'accepted'
        });

        // Returning user — skip onboarding
        if (ownedBusinesses.length > 0 || memberships.length > 0) {
          navigate('/Dashboard', { replace: true });
          return;
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const advance = (data = {}) => {
    setWizardData(prev => ({ ...prev, ...data }));
    if (step < TOTAL_STEPS) {
      setStep(s => s + 1);
    } else {
      finishWizard({ ...wizardData, ...data });
    }
  };

  const skip = () => {
    if (step < TOTAL_STEPS) setStep(s => s + 1);
    else finishWizard(wizardData);
  };

  const finishWizard = async (data) => {
    setCreatingBusiness(true);
    try {
      if (data.name) {
        await base44.entities.Business.create({
          name: data.name,
          industry_group: data.industry_group || 'restaurant',
          currency: data.currency || 'EUR',
          owner_email: user.email,
          vat_registered: data.vat_registered || false,
          vat_rate: data.vat_rate || 19,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      navigate('/Dashboard', { replace: true });
    }
  };

  if (loading || creatingBusiness) {
    return (
      <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-[#7B3BFF] animate-spin mx-auto mb-3" />
          {creatingBusiness && <p className="text-slate-400 text-sm">Setting up your workspace…</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B12] text-white flex flex-col relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7B3BFF]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-[#A855F7]/8 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <span className="text-white font-bold text-lg tracking-tight">
          <span className="bg-gradient-to-r from-[#7B3BFF] to-[#C084FC] bg-clip-text text-transparent">Setra</span>
        </span>
        <button
          onClick={() => navigate('/Dashboard')}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Skip setup — go to dashboard
        </button>
      </div>

      {/* Wizard container */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10">
        {/* Progress — hidden on step 1 (welcome) */}
        {step > 1 && (
          <div className="w-full max-w-xl">
            <WizardProgress currentStep={step - 1} totalSteps={TOTAL_STEPS - 1} stepLabels={STEP_LABELS.slice(1)} />
          </div>
        )}

        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            {step === 1 && <StepWelcome key="welcome" user={user} onNext={advance} />}
            {step === 2 && <StepBusinessDetails key="business" onNext={advance} onSkip={skip} />}
            {step === 3 && <StepConnectPOS key="pos" onNext={advance} onSkip={skip} />}
            {step === 4 && <StepConnectAccounting key="accounting" onNext={advance} onSkip={skip} />}
            {step === 5 && <StepUploadInvoice key="invoice" onNext={advance} onSkip={skip} />}
            {step === 6 && (
              <StepFirstSnapshot
                key="snapshot"
                posConnected={!!wizardData.pos}
                onNext={() => finishWizard(wizardData)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}