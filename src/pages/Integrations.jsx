import React, { useState, useEffect } from 'react';
import ToastConnectModal from '@/components/integrations/ToastConnectModal';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ArrowLeft, Plug, Search, CreditCard, Package, Users,
  FileText, ShoppingCart, Database, Check, ExternalLink,
  Bell, Building2, Code2, Webhook, Send
} from 'lucide-react';
import { useBusiness } from '@/components/business/BusinessContext';

const INTEGRATION_CATEGORIES = [
  { id: 'all', label: 'All', icon: Plug },
  { id: 'pos', label: 'Point of Sale', icon: CreditCard },
  { id: 'accounting', label: 'Accounting', icon: FileText },
  { id: 'delivery', label: 'Delivery', icon: ShoppingCart },
  { id: 'reservations', label: 'Reservations', icon: Building2 },
  { id: 'banking', label: 'Banking', icon: CreditCard },
  { id: 'payroll', label: 'Payroll', icon: Users },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'data', label: 'Data & Analytics', icon: Database },
];

const INTEGRATIONS = [
  // POS
  { id: 'toast', name: 'Toast POS', category: 'pos', description: 'Sync daily sales, tips, refunds, and menu data. Setra reads sales; nothing is written back.', logo: '🍞', status: 'available', popular: true },
  { id: 'square', name: 'Square', category: 'pos', description: 'Pull transactions, items, and payment summaries directly into your P&L.', logo: '⬛', status: 'available', popular: true },
  { id: 'lightspeed', name: 'Lightspeed', category: 'pos', description: 'Cloud POS with EU restaurant support. Syncs sales by category and staff.', logo: '⚡', status: 'available', popular: true },
  { id: 'epos_now', name: 'Epos Now', category: 'pos', description: 'Popular in UK and Cyprus venues. Syncs hourly sales and product mix.', logo: '🖥️', status: 'coming_soon' },
  { id: 'clover', name: 'Clover', category: 'pos', description: 'Flexible POS with business management tools.', logo: '🍀', status: 'coming_soon' },

  // Accounting
  { id: 'quickbooks', name: 'QuickBooks', category: 'accounting', description: 'Two-way sync for expenses, invoices, and chart of accounts.', logo: '📊', status: 'available', popular: true },
  { id: 'xero', name: 'Xero', category: 'accounting', description: 'Push posted entries and VAT returns directly into Xero.', logo: '📈', status: 'available', popular: true },
  { id: 'sage', name: 'Sage', category: 'accounting', description: 'Business management and accounting software widely used in the EU.', logo: '🌿', status: 'coming_soon' },
  { id: 'cyprus_tax', name: 'Cyprus Tax Authority', category: 'accounting', description: 'Auto-submit VAT returns and corporate tax declarations. Pre-fill forms, submit electronically, archive confirmations.', logo: '🇨🇾', status: 'coming_soon', priority: true },

  // Delivery
  { id: 'wolt', name: 'Wolt', category: 'delivery', description: 'Import Wolt orders into Setra revenue automatically. Major in Cyprus & Northern Europe.', logo: '🔵', status: 'coming_soon', popular: true },
  { id: 'bolt_food', name: 'Bolt Food', category: 'delivery', description: 'Sync Bolt Food orders and commissions. Growing fast in Cyprus and Eastern Europe.', logo: '🟢', status: 'coming_soon' },
  { id: 'deliveroo', name: 'Deliveroo', category: 'delivery', description: 'Pull Deliveroo order revenue and net payouts into your P&L.', logo: '🦘', status: 'coming_soon' },
  { id: 'uber_eats', name: 'Uber Eats', category: 'delivery', description: 'Consolidate Uber Eats earnings alongside in-house sales.', logo: '🚗', status: 'coming_soon' },
  { id: 'glovo', name: 'Glovo', category: 'delivery', description: 'Delivery platform strong in Iberia and Southern Europe.', logo: '🟡', status: 'coming_soon' },

  // Reservations
  { id: 'opentable', name: 'OpenTable', category: 'reservations', description: 'Sync cover counts and reservation trends with your revenue data.', logo: '🍽️', status: 'coming_soon' },
  { id: 'resy', name: 'Resy', category: 'reservations', description: 'Modern reservation platform for independent restaurants.', logo: '🗓️', status: 'coming_soon' },
  { id: 'thefork', name: 'TheFork', category: 'reservations', description: 'Leading reservation platform across Europe.', logo: '🍴', status: 'coming_soon' },
  { id: 'sevenrooms', name: 'SevenRooms', category: 'reservations', description: 'Guest experience platform with CRM and reservations.', logo: '🔑', status: 'coming_soon' },

  // Banking
  { id: 'revolut_business', name: 'Revolut Business', category: 'banking', description: 'Live bank feed for automatic reconciliation. Popular with SMB founders in Cyprus.', logo: '🟣', status: 'coming_soon', popular: true },
  { id: 'bank_of_cyprus', name: 'Bank of Cyprus', category: 'banking', description: 'Import BOC statements for automatic bank reconciliation.', logo: '🏦', status: 'coming_soon' },
  { id: 'hellenic_bank', name: 'Hellenic Bank', category: 'banking', description: 'Connect your Hellenic Bank account for live transaction feeds.', logo: '🏛️', status: 'coming_soon' },
  { id: 'truelayer', name: 'TrueLayer / Tink', category: 'banking', description: 'EU bank-feed aggregator — connect any SEPA bank for automatic reconciliation.', logo: '🔗', status: 'coming_soon' },
  { id: 'stripe', name: 'Stripe', category: 'banking', description: 'Import Stripe payouts and fees into your P&L automatically.', logo: '💳', status: 'coming_soon', popular: true },
  { id: 'jcc', name: 'JCC Payment Systems', category: 'banking', description: 'Cyprus card processor. Import settlement reports into bookkeeping.', logo: '🎫', status: 'coming_soon' },

  // Payroll
  { id: 'gusto', name: 'Gusto', category: 'payroll', description: 'Pull payroll runs into your staff costs automatically.', logo: '💼', status: 'available' },
  { id: 'adp', name: 'ADP', category: 'payroll', description: 'Enterprise payroll and workforce management.', logo: '👥', status: 'available' },

  // Inventory
  { id: 'marketman', name: 'MarketMan', category: 'inventory', description: 'Sync inventory levels and purchase orders bi-directionally.', logo: '🏪', status: 'available' },
  { id: 'upserve', name: 'Upserve', category: 'inventory', description: 'Restaurant inventory and management platform.', logo: '📦', status: 'available' },

  // Data
  { id: 'powerbi', name: 'Power BI', category: 'data', description: 'Push Setra financial summaries into your Power BI dashboards.', logo: '📈', status: 'coming_soon' },
];

function NotifyModal({ integration, open, onClose }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    await base44.integrations.Core.SendEmail({
      to: 'hello@setra.app',
      subject: `Integration interest: ${integration?.name}`,
      body: `A user (${email}) wants to be notified when the ${integration?.name} integration launches.`,
    });
    setSent(true);
  };

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); setSent(false); setEmail(''); }}>
      <DialogContent className="bg-[#151528] border-white/10 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#A855F7]" />
            Notify me — {integration?.name}
          </DialogTitle>
        </DialogHeader>
        {sent ? (
          <div className="py-4 text-center">
            <Check className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-white font-medium">You're on the list!</p>
            <p className="text-slate-400 text-sm mt-1">We'll email you when {integration?.name} launches.</p>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            <p className="text-slate-400 text-sm">
              Enter your email and we'll let you know the moment this integration goes live.
            </p>
            <Input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@yourvenue.com"
              className="bg-[#0B0B12] border-white/10 text-white"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <Button onClick={handleSubmit} disabled={!email.trim()} className="w-full">
              <Bell className="w-4 h-4 mr-2" /> Notify me when it launches
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RequestModal({ open, onClose }) {
  const [tool, setTool] = useState('');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!tool.trim()) return;
    await base44.integrations.Core.SendEmail({
      to: 'hello@setra.app',
      subject: `Integration request: ${tool}`,
      body: `Tool: ${tool}\nFrom: ${email || 'anonymous'}\n\nPlease build this integration!`,
    });
    setSent(true);
  };

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); setSent(false); setTool(''); setEmail(''); }}>
      <DialogContent className="bg-[#151528] border-white/10 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Request an Integration</DialogTitle>
        </DialogHeader>
        {sent ? (
          <div className="py-4 text-center">
            <Check className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-white font-medium">Request received!</p>
            <p className="text-slate-400 text-sm mt-1">Every request helps us prioritise what to build next.</p>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            <p className="text-slate-400 text-sm">Tell us what tool you use — if there's demand, we'll build it.</p>
            <Input value={tool} onChange={e => setTool(e.target.value)} placeholder="e.g. Wolt, JCC, Mews..." className="bg-[#0B0B12] border-white/10 text-white" />
            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email (optional)" className="bg-[#0B0B12] border-white/10 text-white" />
            <Button onClick={handleSubmit} disabled={!tool.trim()} className="w-full">
              <Send className="w-4 h-4 mr-2" /> Submit Request
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function IntegrationCard({ integration, compact = false, onConnect, connectionStatuses = {}, onNotify }) {
  const isConnected = connectionStatuses[integration.id]?.connected;

  const statusBadge = integration.status === 'available' ? (
    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 border">
      <Check className="w-3 h-3 mr-1" /> Available
    </Badge>
  ) : integration.priority ? (
    <Badge className="bg-[#7B3BFF]/20 text-[#C084FC] border-[#7B3BFF]/30 border">
      Priority · Soon
    </Badge>
  ) : (
    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 border">Coming Soon</Badge>
  );

  if (compact) {
    return (
      <Card className="bg-[#151528]/80 border-white/5 p-4 hover:border-[#7B3BFF]/30 transition-all cursor-pointer group">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-2xl">{integration.logo}</div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white group-hover:text-[#C084FC] transition-colors truncate text-sm">{integration.name}</h4>
          </div>
        </div>
        {statusBadge}
      </Card>
    );
  }

  return (
    <Card className="bg-[#151528]/80 border-white/5 p-5 hover:border-[#7B3BFF]/30 transition-all group h-full flex flex-col">
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{integration.logo}</div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-[#C084FC] transition-colors text-sm leading-tight">{integration.name}</h3>
            <p className="text-[11px] text-slate-500 capitalize mt-0.5">{integration.category.replace(/_/g, ' ')}</p>
          </div>
        </div>
        {statusBadge}
      </div>

      <p className="text-xs text-slate-400 mb-4 flex-1 leading-relaxed">{integration.description}</p>

      {integration.status === 'available' ? (
        <Button
          onClick={() => onConnect?.(integration.id)}
          className={`w-full ${isConnected ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
          size="sm"
        >
          {isConnected ? <><Check className="w-3 h-3 mr-1.5" />Connected</> : <><ExternalLink className="w-3 h-3 mr-1.5" />Connect</>}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-slate-400 border-white/10 hover:border-[#7B3BFF]/40 hover:text-[#C084FC]"
          onClick={() => onNotify?.(integration)}
        >
          <Bell className="w-3 h-3 mr-1.5" /> Notify me
        </Button>
      )}
    </Card>
  );
}

export default function Integrations() {
  const navigate = useNavigate();
  const { currentBusiness } = useBusiness();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showToastModal, setShowToastModal] = useState(false);
  const [connectionStatuses, setConnectionStatuses] = useState({});
  const [notifyIntegration, setNotifyIntegration] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    if (!currentBusiness) return;
    base44.functions.invoke('toastPosSync', { action: 'status', business_id: currentBusiness.id })
      .then(res => setConnectionStatuses(prev => ({ ...prev, toast: res.data })))
      .catch(() => {});
  }, [currentBusiness]);

  const handleConnect = (integrationId) => {
    if (integrationId === 'toast') setShowToastModal(true);
  };

  const filteredIntegrations = INTEGRATIONS.filter(integration => {
    const categoryMatch = selectedCategory === 'all' || integration.category === selectedCategory;
    const searchMatch = !searchQuery ||
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const popularIntegrations = INTEGRATIONS.filter(i => i.popular);
  const availableCount = INTEGRATIONS.filter(i => i.status === 'available').length;
  const comingSoonCount = INTEGRATIONS.filter(i => i.status === 'coming_soon').length;

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      {/* Header */}
      <header className="border-b border-white/5 backdrop-blur-2xl sticky top-0 z-40 bg-[#0B0B12]/95 shadow-[0_4px_30px_rgba(123,59,255,0.1)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/Dashboard')} className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
            </Button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 flex items-center justify-center">
              <Plug className="w-5 h-5 text-[#C084FC]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Setra Connect</h1>
              <p className="text-xs text-slate-500">Connect Setra with the tools you already use</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowRequestModal(true)} className="hidden sm:flex">
            Don't see yours? Request →
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Hero */}
        <Card className="bg-gradient-to-r from-[#7B3BFF]/10 to-[#A855F7]/10 border-[#7B3BFF]/20 p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            One-click sync for your whole venue stack.
          </h2>
          <p className="text-slate-400 mb-5 max-w-2xl text-sm">
            Connect your POS, accounting, delivery, banking, and payroll platforms. Setra handles the wiring — you focus on the venue.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-300">{availableCount} live</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-slate-300">{comingSoonCount} coming soon</span>
            </div>
            <button
              onClick={() => setShowRequestModal(true)}
              className="text-[#A855F7] hover:text-[#C084FC] underline underline-offset-2 text-sm transition-colors"
            >
              Don't see yours? Request an integration →
            </button>
          </div>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search integrations…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-11 bg-[#151528]/80 border-white/10 text-white h-11"
          />
        </div>

        {/* Popular */}
        {selectedCategory === 'all' && !searchQuery && (
          <div>
            <h3 className="text-base font-semibold text-white mb-3">Popular Integrations</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {popularIntegrations.map((integration, idx) => (
                <motion.div key={integration.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                  <IntegrationCard integration={integration} compact onConnect={handleConnect} connectionStatuses={connectionStatuses} onNotify={setNotifyIntegration} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          {INTEGRATION_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            const count = cat.id === 'all' ? INTEGRATIONS.length : INTEGRATIONS.filter(i => i.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all ${
                  isActive
                    ? 'bg-[#7B3BFF]/10 border-[#7B3BFF]/50 text-[#C084FC]'
                    : 'bg-white/[0.03] border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
                <span className="opacity-50 text-[11px]">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {filteredIntegrations.length === 0 ? (
          <Card className="bg-[#151528]/80 border-white/5 p-12 text-center">
            <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No integrations found.</p>
            <button onClick={() => setShowRequestModal(true)} className="mt-2 text-[#A855F7] text-sm hover:text-[#C084FC] underline underline-offset-2 transition-colors">
              Request this integration →
            </button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIntegrations.map((integration, idx) => (
              <motion.div key={integration.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                <IntegrationCard integration={integration} onConnect={handleConnect} connectionStatuses={connectionStatuses} onNotify={setNotifyIntegration} />
              </motion.div>
            ))}

            {/* Request card */}
            {selectedCategory === 'all' && !searchQuery && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: filteredIntegrations.length * 0.03 }}>
                <Card
                  className="bg-white/[0.02] border-dashed border-white/10 p-5 h-full flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#7B3BFF]/30 hover:bg-[#7B3BFF]/5 transition-all group"
                  onClick={() => setShowRequestModal(true)}
                >
                  <div className="text-3xl mb-3">🔌</div>
                  <h3 className="font-semibold text-slate-300 group-hover:text-white text-sm mb-1">Don't see your tool?</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">Tell us what you use — if there's demand, we'll build it.</p>
                  <span className="mt-3 text-xs text-[#A855F7]">Request an integration →</span>
                </Card>
              </motion.div>
            )}
          </div>
        )}

        {/* API & Webhooks */}
        <div>
          <h3 className="text-base font-semibold text-white mb-3">For developers & accountants</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-[#151528]/80 border-white/5 p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#7B3BFF]/10 flex items-center justify-center flex-shrink-0">
                <Code2 className="w-5 h-5 text-[#A855F7]" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Setra API</h4>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">Pull your financial data programmatically. Build custom integrations, run bulk operations across clients, or embed Setra data in your own dashboards.</p>
                <Badge className="mt-2 bg-amber-500/10 text-amber-400 border-amber-500/20 border text-[10px]">Coming Soon</Badge>
              </div>
            </Card>
            <Card className="bg-[#151528]/80 border-white/5 p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#7B3BFF]/10 flex items-center justify-center flex-shrink-0">
                <Webhook className="w-5 h-5 text-[#A855F7]" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Webhooks</h4>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">Get notified instantly when invoices are parsed, budgets exceed targets, or audits complete. Push events to any endpoint.</p>
                <Badge className="mt-2 bg-amber-500/10 text-amber-400 border-amber-500/20 border text-[10px]">Coming Soon</Badge>
              </div>
            </Card>
          </div>
        </div>

      </main>

      {/* Modals */}
      {currentBusiness && (
        <ToastConnectModal
          open={showToastModal}
          onOpenChange={setShowToastModal}
          businessId={currentBusiness.id}
          onConnected={() => {
            setConnectionStatuses(prev => ({ ...prev, toast: { connected: true } }));
            setShowToastModal(false);
          }}
        />
      )}

      <NotifyModal
        integration={notifyIntegration}
        open={!!notifyIntegration}
        onClose={() => setNotifyIntegration(null)}
      />

      <RequestModal
        open={showRequestModal}
        onClose={() => setShowRequestModal(false)}
      />
    </div>
  );
}