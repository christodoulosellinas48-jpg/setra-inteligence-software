import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STEPS = [
  {
    id: 'topbar',
    selector: '[data-tour="topbar"]',
    title: 'Your command centre',
    body: 'Switch venues with the business chip, upload any document with Smart Upload, and ask Setra anything with Ask Setra — all from here.',
    position: 'bottom',
  },
  {
    id: 'briefing',
    selector: '[data-tour="briefing"]',
    title: 'Start every morning here',
    body: 'The Briefing shows your day at a glance — revenue, margin, pending invoices, and any alerts that need your attention.',
    position: 'bottom',
  },
  {
    id: 'checklist',
    selector: '[data-tour="checklist"]',
    title: 'Get set up in 5 steps',
    body: 'Complete the setup checklist to unlock the full power of Setra — from your first invoice to your first automated VAT period.',
    position: 'top',
  },
  {
    id: 'vat-sidebar',
    selector: '[data-tour="vat-sidebar"]',
    title: 'Cyprus VAT, automated',
    body: 'Setra tracks every invoice, reconciles your bank, and prepares your quarterly VAT filing. Your accountant will love it.',
    position: 'right',
  },
];

function getElementRect(selector) {
  const el = document.querySelector(selector);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height, bottom: rect.bottom, right: rect.right };
}

function TooltipCard({ step, stepIndex, total, onNext, onSkip, rect }) {
  if (!rect) return null;

  const PAD = 12;
  let style = {};

  if (step.position === 'bottom') {
    style = { top: rect.bottom + PAD, left: Math.max(PAD, rect.left) };
  } else if (step.position === 'top') {
    style = { bottom: window.innerHeight - rect.top + PAD, left: Math.max(PAD, rect.left) };
  } else if (step.position === 'right') {
    style = { top: rect.top, left: rect.right + PAD };
  }

  // Clamp right edge
  const maxLeft = window.innerWidth - 340;
  if (style.left > maxLeft) style.left = maxLeft;

  return (
    <div
      className="fixed z-[10001] w-80 bg-[#151528] border border-[#7B3BFF]/40 rounded-2xl shadow-2xl p-5"
      style={style}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-[#C084FC] font-semibold tracking-wide uppercase">Step {stepIndex + 1} of {total}</span>
        <button onClick={onSkip} className="text-slate-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <h3 className="text-white font-bold text-base mb-2">{step.title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed mb-4">{step.body}</p>
      <div className="flex items-center justify-between">
        <button onClick={onSkip} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
          Skip tour
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7B3BFF] hover:bg-[#6d2ff7] text-white text-sm font-medium transition-colors"
        >
          {stepIndex < total - 1 ? 'Next' : 'Done'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      {/* Step dots */}
      <div className="flex items-center gap-1.5 mt-3 justify-center">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === stepIndex ? 'bg-[#7B3BFF]' : 'bg-white/15'}`} />
        ))}
      </div>
    </div>
  );
}

export default function GuidedTour({ user, onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.has_seen_tour) return;
    // Small delay so page elements render first
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, [user]);

  useEffect(() => {
    if (!visible) return;
    const step = STEPS[stepIndex];
    const r = getElementRect(step.selector);
    setRect(r);
  }, [stepIndex, visible]);

  const finish = async () => {
    setVisible(false);
    try { await base44.auth.updateMe({ has_seen_tour: true }); } catch {}
    onComplete?.();
  };

  const next = () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(i => i + 1);
    } else {
      finish();
    }
  };

  if (!visible) return null;

  const step = STEPS[stepIndex];

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 z-[10000] pointer-events-none" style={{ background: 'rgba(0,0,0,0.65)' }} />

      {/* Cutout highlight */}
      {rect && (
        <div
          className="fixed z-[10000] pointer-events-none rounded-xl ring-2 ring-[#7B3BFF] ring-offset-2 ring-offset-transparent"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
          }}
        />
      )}

      {/* Tooltip */}
      <TooltipCard
        step={step}
        stepIndex={stepIndex}
        total={STEPS.length}
        onNext={next}
        onSkip={finish}
        rect={rect}
      />
    </>
  );
}