import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CreditCard, Check, ChevronDown, ChevronUp, ExternalLink, Download, Loader2, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PLANS = [
  {
    key: 'starter', name: 'Starter', monthly: 29, annual: 290,
    features: ['1 venue', '3 users', '100 invoices/mo'],
  },
  {
    key: 'basic', name: 'Basic', monthly: 55, annual: 528,
    features: ['3 venues', '10 users', '500 invoices/mo'],
  },
  {
    key: 'pro', name: 'Pro', monthly: 99, annual: 950, recommended: true,
    features: ['10 venues', 'Unlimited users', '2,000 invoices/mo', 'AI counselor'],
  },
  {
    key: 'premium', name: 'Premium', monthly: 199, annual: 1910,
    features: ['Unlimited venues', 'Unlimited users', 'Unlimited invoices', 'Priority support'],
  },
];

const MOCK_INVOICES = [
  { id: 'INV-2026-05', date: '1 May 2026',  amount: '€99.00', status: 'Paid' },
  { id: 'INV-2026-04', date: '1 Apr 2026',  amount: '€99.00', status: 'Paid' },
  { id: 'INV-2026-03', date: '1 Mar 2026',  amount: '€99.00', status: 'Paid' },
  { id: 'INV-2026-02', date: '1 Feb 2026',  amount: '€55.00', status: 'Paid' },
  { id: 'INV-2026-01', date: '1 Jan 2026',  amount: '€55.00', status: 'Paid' },
];

function PlanSwitcherModal({ current, onClose }) {
  const [billing, setBilling] = useState('monthly');
  const [selected, setSelected] = useState(current);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (selected === current) { onClose(); return; }
    
    // Check if running in iframe (published app warning)
    if (window.self !== window.top) {
      setError('Checkout only works from a published app. Open in a new tab to continue.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('createStripeCheckout', { plan: selected, billing });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        setError('Failed to create checkout session');
      }
    } catch (err) {
      setError(err.message || 'Checkout error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#151528] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-300">{error}</p>
          </div>
        )}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold text-lg">Choose a plan</h3>
          <div className="flex items-center gap-1 bg-white/[0.05] rounded-xl p-1">
            {['monthly','annual'].map(b => (
              <button key={b} onClick={() => setBilling(b)} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${billing === b ? 'bg-[#7B3BFF] text-white' : 'text-slate-400 hover:text-white'}`}>
                {b === 'annual' ? 'Annual (2 months free)' : 'Monthly'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {PLANS.map(p => {
            const price = billing === 'annual' ? Math.round(p.annual / 12) : p.monthly;
            const isSelected = selected === p.key;
            return (
              <button
                key={p.key}
                onClick={() => setSelected(p.key)}
                className={`relative rounded-xl border p-4 text-left transition-all ${isSelected ? 'bg-[#7B3BFF]/20 border-[#7B3BFF]/60' : 'bg-white/[0.03] border-white/[0.07] hover:border-white/20'}`}
              >
                {p.recommended && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#7B3BFF] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Recommended</span>
                )}
                <p className="text-white font-semibold text-sm">{p.name}</p>
                <p className="text-[#C084FC] font-bold text-lg mt-1">€{price}<span className="text-xs text-slate-500 font-normal">/mo</span></p>
                {billing === 'annual' && <p className="text-[10px] text-emerald-400 mt-0.5">€{p.annual}/yr</p>}
                <ul className="mt-3 space-y-1">
                  {p.features.map(f => (
                    <li key={f} className="text-[10px] text-slate-400 flex items-start gap-1">
                      <Check className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
                {isSelected && <Check className="w-4 h-4 text-[#C084FC] absolute top-3 right-3" />}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose} className="text-slate-400">Cancel</Button>
          <Button onClick={handleConfirm} disabled={loading} className="bg-[#7B3BFF] hover:bg-[#6d2ff7]">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            {selected === current ? 'Keep current plan' : `Switch to ${PLANS.find(p=>p.key===selected)?.name}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BillingSection() {
  const [showPlans, setShowPlans] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const currentPlan = PLANS.find(p => p.key === 'pro');

  return (
    <div className="space-y-5">
      {showPlans && <PlanSwitcherModal current="pro" onClose={() => setShowPlans(false)} />}

      {/* Current plan */}
      <div className="flex items-center justify-between p-4 bg-[#7B3BFF]/10 border border-[#7B3BFF]/25 rounded-xl">
        <div>
          <p className="text-white font-semibold">You're on <span className="text-[#C084FC]">{currentPlan?.name}</span></p>
          <p className="text-xs text-slate-400 mt-0.5">€{currentPlan?.monthly}/mo · renews 1 June 2026</p>
        </div>
        <Button size="sm" onClick={() => setShowPlans(true)} className="bg-[#7B3BFF] hover:bg-[#6d2ff7] text-white text-xs">
          Change plan
        </Button>
      </div>

      {/* Payment method */}
      <div className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/[0.07] rounded-xl">
        <div className="flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-slate-400" />
          <div>
            <p className="text-white text-sm font-medium">Visa ending in 4242</p>
            <p className="text-xs text-slate-500">Expires 12/2028</p>
          </div>
        </div>
        <button className="text-xs text-[#C084FC] hover:text-white transition-colors border border-[#7B3BFF]/30 hover:border-[#7B3BFF]/60 px-3 py-1.5 rounded-lg">
          Update card
        </button>
      </div>

      {/* Invoice history */}
      <div>
        <p className="text-sm font-medium text-white mb-3">Invoice history</p>
        <div className="rounded-xl border border-white/[0.07] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Invoice</th>
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Date</th>
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Amount</th>
                <th className="text-center px-4 py-2.5 text-slate-400 font-medium">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {MOCK_INVOICES.map((inv, i) => (
                <tr key={inv.id} className={`border-b border-white/[0.04] ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                  <td className="px-4 py-2.5 text-slate-300 font-mono text-xs">{inv.id}</td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs">{inv.date}</td>
                  <td className="px-4 py-2.5 text-white text-xs font-medium">{inv.amount}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="text-emerald-400 text-[10px] font-medium border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">{inv.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button className="text-xs text-slate-500 hover:text-[#C084FC] transition-colors flex items-center gap-1 ml-auto">
                      <Download className="w-3 h-3" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel subscription */}
      <div className="border border-white/[0.07] rounded-xl overflow-hidden">
        <button
          onClick={() => setShowCancel(c => !c)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-400 hover:text-white hover:bg-white/[0.03] transition-colors"
        >
          <span>Cancel subscription</span>
          {showCancel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showCancel && (
          <div className="px-4 pb-4 space-y-3 bg-white/[0.01]">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200 space-y-1">
              <p className="font-medium">What happens when you cancel:</p>
              <ul className="list-disc ml-4 space-y-0.5 text-amber-300/80">
                <li>Your plan stays active until the end of the billing period</li>
                <li>All your data is preserved for 90 days</li>
                <li>You can re-subscribe at any time to restore access</li>
              </ul>
            </div>
            <Button variant="outline" size="sm" className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10">
              Cancel my subscription
            </Button>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-600">Need help? <a href="mailto:hello@setra.app" className="text-[#C084FC] hover:text-white transition-colors">Email us at hello@setra.app</a></p>
    </div>
  );
}