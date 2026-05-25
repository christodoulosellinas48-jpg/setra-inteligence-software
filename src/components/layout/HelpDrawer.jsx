import React, { useState, useEffect } from 'react';
import { X, HelpCircle, Search, ExternalLink } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const PAGE_TIPS = {
  '/Today': [
    { title: 'Your daily briefing', body: 'The Today page shows your most urgent alerts, revenue snapshot, and setup progress. Check it every morning before opening.' },
    { title: 'Dismiss alerts', body: 'Click the × on any alert to dismiss it for the day. Dismissed alerts reappear tomorrow if still relevant.' },
    { title: 'Portfolio view', body: 'If you own multiple venues, the Portfolio Glance shows all of them at once — click any to switch context.' },
  ],
  '/Dashboard': [
    { title: 'Health score explained', body: 'The health score is a composite of your gross margin, labour ratio, and overhead ratio vs. your targets. Green = on track.' },
    { title: 'Updating your snapshot', body: 'Revenue and costs are pulled from your latest Financial Snapshot. Upload an income report or edit manually in Financial Data.' },
    { title: 'Ask Setra', body: 'Click "Ask Setra" in the top bar to get AI-powered insights about your current numbers without leaving the page.' },
  ],
  '/FinancialData': [
    { title: 'Three views', body: '"Out" shows your expenses, "In" shows your revenue snapshots, and "Net" shows your combined P&L position.' },
    { title: 'Smart Upload', body: 'Drag any PDF invoice onto the page or use Smart Upload in the top bar — AI extracts supplier, date, and amount automatically.' },
    { title: 'Saved views', body: 'Apply filters then click "+ Save view" to pin that filter combination as a pill. Default views like "This month" are pre-loaded.' },
  ],
  '/VATAndBookkeeping': [
    { title: 'Inbox first', body: 'Start in the Inbox tab — every uploaded document appears here for review. Approve or flag before it hits your VAT period.' },
    { title: 'VAT quarters', body: 'Setra auto-creates VAT periods based on your quarter group (A/B/C). Check Settings → VAT & Tax to confirm your group.' },
    { title: 'Bank reconciliation', body: 'Upload a CSV from your bank and Setra will match transactions to approved invoices automatically.' },
  ],
  '/Dishes': [
    { title: 'Food cost per plate', body: 'Link a recipe to each dish and Setra calculates your actual food cost % using current inventory prices.' },
    { title: 'Engineering matrix', body: 'The Matrix tab categorises your dishes into Stars, Plowhorses, Puzzles, and Dogs — prioritise Stars, fix Dogs.' },
    { title: 'Heatmap', body: 'The Heatmap tab shows revenue by dish and time slot so you can optimise your menu and pricing strategy.' },
  ],
  '/Stock': [
    { title: 'Par levels', body: 'Set a reorder threshold for each item — Setra alerts you when stock drops below par so you never run out.' },
    { title: 'Waste log', body: 'Log waste whenever you discard product. This feeds your theoretical vs actual variance and helps reduce food cost.' },
    { title: 'Stock take', body: 'Run a stock take to reconcile theoretical vs actual stock. Setra highlights the highest-cost variances first.' },
  ],
  '/Suppliers': [
    { title: 'Spend analysis', body: 'The Spend Analysis tab shows your top suppliers by spend, helping you spot negotiation opportunities.' },
    { title: 'Purchase orders', body: 'Create a PO in Suppliers → Purchase Orders. Once received, stock levels update automatically.' },
    { title: 'Supplier directory', body: 'Keep supplier contact details here so your whole team can reorder without asking the manager.' },
  ],
  '/Plan': [
    { title: 'Budget vs Actual', body: 'Set monthly targets for revenue, food cost, labour, and overhead. Setra shows you how far off you are in real time.' },
    { title: 'Forecasting', body: 'The Forecast tab uses your last 6 months of data to project the next 6 — adjust assumptions with the sliders.' },
    { title: 'Scenarios', body: 'Run optimistic and conservative scenarios side-by-side to stress-test your pricing or staffing decisions.' },
  ],
  '/Insights': [
    { title: 'Reports first', body: 'The Reports tab gives you ready-made P&L, menu profitability, and supplier performance reports in one click.' },
    { title: 'Audit findings', body: 'Run an audit to get prioritised findings with estimated monthly impact. Tackle high-impact items first.' },
    { title: 'Action plan', body: 'Each audit finding generates a specific action. Mark items done to track your improvement over time.' },
  ],
  '/Settings': [
    { title: 'Billing & Subscription', body: 'Manage your plan, update your payment method, and download past invoices from the Billing section.' },
    { title: 'Notification preferences', body: 'Toggle which alerts come to you by email vs in-app — and set your weekly digest day and time.' },
    { title: 'Security', body: 'Enable 2FA for your account and review active sessions and login history from the Security section.' },
  ],
};

const DEFAULT_TIPS = [
  { title: 'Getting started', body: 'Use Smart Upload in the top bar to upload any document — invoices, payslips, and income reports are all supported.' },
  { title: 'Switch venues', body: 'Use the business chip in the top bar to switch between your venues. All data is scoped to the selected venue.' },
  { title: 'Ask Setra', body: 'The Ask Setra button opens an AI assistant that understands your business data and can answer questions about it.' },
];

export default function HelpDrawer() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const location = useLocation();

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const tips = PAGE_TIPS[location.pathname] || DEFAULT_TIPS;
  const filtered = search
    ? tips.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.body.toLowerCase().includes(search.toLowerCase()))
    : tips;

  return (
    <>
      <button
        data-tour="help-btn"
        onClick={() => setOpen(o => !o)}
        title="Help & tips"
        className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-[200] bg-black/40" onClick={() => setOpen(false)} />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full z-[201] w-80 bg-[#0F0F1E] border-l border-white/[0.08] shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div>
            <h3 className="text-white font-semibold">What can I do here?</h3>
            <p className="text-xs text-slate-500 mt-0.5">{location.pathname.replace('/', '') || 'Home'}</p>
          </div>
          <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 border-b border-white/[0.06]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search help…"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#7B3BFF]/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.map((tip, i) => (
            <div key={i} className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
              <p className="text-white text-sm font-semibold mb-1">{tip.title}</p>
              <p className="text-slate-400 text-xs leading-relaxed">{tip.body}</p>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8">No tips match "{search}"</p>
          )}
        </div>

        <div className="p-4 border-t border-white/[0.06]">
          <a
            href="https://docs.setra.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-sm transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Full documentation
          </a>
        </div>
      </div>
    </>
  );
}