import React, { useState } from 'react';
import { Mail, Copy, CheckCircle2, ChevronDown, ChevronUp, X } from 'lucide-react';

export default function EmailIngestBanner({ business }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  // Generate a deterministic slug from business name
  const slug = (business?.name || 'mybusiness')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20);
  const inboxEmail = `expenses-${slug}@inbox.setra.app`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inboxEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#151528]/80 border border-[#7B3BFF]/30 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#7B3BFF]/20 flex items-center justify-center flex-shrink-0">
            <Mail className="w-4 h-4 text-[#C084FC]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Auto-import invoices from email</p>
            <p className="text-xs text-slate-400 mt-0.5">Forward supplier invoices — Setra extracts & categorizes automatically</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs text-[#C084FC] hover:text-white flex items-center gap-1 transition-colors"
          >
            {expanded ? 'Hide' : 'Set up'}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <button onClick={() => setDismissed(true)} className="text-slate-600 hover:text-slate-400 transition-colors ml-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/5 p-4 space-y-4">
          <div>
            <p className="text-xs text-slate-500 mb-2">Your unique invoice inbox:</p>
            <div className="flex items-center gap-2 bg-[#0B0B12] border border-white/10 rounded-xl px-4 py-3">
              <code className="flex-1 text-[#C084FC] text-sm font-mono">{inboxEmail}</code>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#7B3BFF]/20 hover:bg-[#7B3BFF]/40 text-[#C084FC] hover:text-white transition-all"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400">
            <div className="space-y-1.5">
              <p className="text-slate-300 font-medium">Setra will automatically:</p>
              <ul className="space-y-1">
                {['Extract supplier, date, line items & VAT', 'Match to an existing vendor or create new', 'Categorize into the right expense category', 'Add to your list, ready for review'].map(t => (
                  <li key={t} className="flex items-start gap-1.5"><span className="text-emerald-400 mt-0.5">•</span>{t}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-1.5">
              <p className="text-slate-300 font-medium">How to set it up:</p>
              <ul className="space-y-1">
                {[
                  'Copy your inbox address above',
                  'Forward one invoice to test it',
                  'Or set up an auto-forward rule in Gmail / Outlook for all invoices from your suppliers',
                ].map((t, i) => (
                  <li key={t} className="flex items-start gap-1.5"><span className="text-[#C084FC]">{i + 1}.</span>{t}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            💡 Tip: Set Gmail / Outlook to auto-forward emails with attachments from your known suppliers to this address.
          </p>
        </div>
      )}
    </div>
  );
}