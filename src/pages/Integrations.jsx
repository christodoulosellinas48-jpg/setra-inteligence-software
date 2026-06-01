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
  Plug, Search, CreditCard, Package, Users,
  FileText, ShoppingCart, Database, Check, ExternalLink,
  Bell, Building2, Zap, ChevronRight, MapPin
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
  // POS — Lightspeed first
  { id: 'lightspeed', name: 'Lightspeed', category: 'pos', description: 'Cloud POS with EU restaurant support. Syncs sales by category and staff. Connect your Lightspeed location to activate the Operations Hub live feed.', logo: '⚡', status: 'available', popular: true, featured: true },
  { id: 'toast', name: 'Toast POS', category: 'pos', description: 'Sync daily sales, tips, refunds, and menu data. Setra reads sales; nothing is written back.', logo: '🍞', status: 'available', popular: true },
  { id: 'square', name: 'Square', category: 'pos', description: 'Pull transactions, items, and payment summaries directly into your P&L.', logo: '⬛', status: 'available', popular: true },

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

  // Reservations
  { id: 'opentable', name: 'OpenTable', category: 'reservations', description: 'Sync cover counts and reservation trends with your revenue data.', logo: '🍽️', status: 'coming_soon' },
  { id: 'thefork', name: 'TheFork', category: 'reservations', description: 'Leading reservation platform across Europe.', logo: '🍴', status: 'coming_soon' },

  // Banking
  { id: 'revolut_business', name: 'Revolut Business', category: 'banking', description: 'Live bank feed for automatic reconciliation. Popular with SMB founders in Cyprus.', logo: '🟣', status: 'coming_soon', popular: true },
  { id: 'bank_of_cyprus', name: 'Bank of Cyprus', category: 'banking', description: 'Import BOC statements for automatic bank reconciliation.', logo: '🏦', status: 'coming_soon' },
  { id: 'hellenic_bank', name: 'Hellenic Bank', category: 'banking', description: 'Connect your Hellenic Bank account for live transaction feeds.', logo: '🏛️', status: 'coming_soon' },
  { id: 'jcc', name: 'JCC Payment Systems', category: 'banking', description: 'Cyprus card processor. Import settlement reports into bookkeeping.', logo: '🎫', status: 'coming_soon' },
  { id: 'stripe', name: 'Stripe', category: 'banking', description: 'Import Stripe payouts and fees into your P&L automatically.', logo: '💳', status: 'coming_soon', popular: true },

  // Payroll
  { id: 'gusto', name: 'Gusto', category: 'payroll', description: 'Pull payroll runs into your staff costs automatically.', logo: '💼', status: 'available' },

  // Inventory
  { id: 'marketman', name: 'MarketMan', category: 'inventory', description: 'Sync inventory levels and purchase orders bi-directionally.', logo: '🏪', status: 'available' },
];

function LightspeedConnectModal({ open, onClose, onConnected }) {
  const [step, setStep] = useState('choose'); // choose | mapping | done
  const [selectedLocation, setSelectedLocation] = useState(null);

  const MOCK_LOCATIONS = [
    { id: 'loc_01', name: 'Omakase by Lambros', address: '7 Saint Andreou, Limassol' },
    { id: 'loc_02', name: 'Limassol Central', address: '3 Makarios Ave, Limassol' },
  ];

  const MOCK_MAPPING = [
    { pos_id: 'LS-001', pos_name: 'Wagyu Beef Tataki', recipe: 'Wagyu Tataki (8-piece)', confidence: 97 },
    { pos_id: 'LS-002', pos_name: 'Salmon Nigiri x6', recipe: 'Salmon Nigiri Set', confidence: 91 },
    { pos_id: 'LS-003', pos_name: 'House Miso Soup', recipe: 'Miso Soup Base', confidence: 84 },
    { pos_id: 'LS-004', pos_name: 'Gyoza (5pcs)', recipe: null, confidence: 0 },
  ];

  const handleDone = () => {
    onConnected(selectedLocation);
    onClose();
    setStep('choose');
    setSelectedLocation(null);
  };

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); setStep('choose'); setSelectedLocation(null); }}>
      <DialogContent className="bg-[#151528] border-white/10 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <span className="text-xl">⚡</span>
            Connect Lightspeed
          </DialogTitle>
        </DialogHeader>

        {step === 'choose' && (
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">Select the Lightspeed location to connect with this business.</p>
            <div className="space-y-2">
              {MOCK_LOCATIONS.map(loc => (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedLocation?.id === loc.id
                      ? 'border-[#7B3BFF]/60 bg-[#7B3BFF]/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <div>
                      <p className="text-white text-sm font-medium">{loc.name}</p>
                      <p className="text-slate-500 text-xs">{loc.address}</p>
                    </div>
                    {selectedLocation?.id === loc.id && (
                      <Check className="w-4 h-4 text-[#C084FC] ml-auto" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            <Button
              onClick={() => setStep('mapping')}
              disabled={!selectedLocation}
              className="w-full"
            >
              Continue to menu mapping →
            </Button>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">
              Map Lightspeed menu items to Setra recipes. Confirm or correct AI suggestions.
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {MOCK_MAPPING.map(item => (
                <div key={item.pos_id} className="flex items-center justify-between p-3 rounded-lg bg-[#0B0B12]/60 border border-white/[0.05] gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{item.pos_name}</p>
                    <p className="text-slate-500 text-[11px]">{item.pos_id}</p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {item.recipe ? (
                      <p className="text-[#C084FC] text-xs truncate">{item.recipe}</p>
                    ) : (
                      <p className="text-amber-400 text-xs">No match — skip</p>
                    )}
                  </div>
                  <div className={`text-xs font-bold w-10 text-right flex-shrink-0 ${
                    item.confidence >= 90 ? 'text-emerald-400' : item.confidence > 0 ? 'text-amber-400' : 'text-slate-600'
                  }`}>
                    {item.confidence > 0 ? `${item.confidence}%` : '—'}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep('choose')} className="flex-1">← Back</Button>
              <Button onClick={handleDone} className="flex-2 flex-grow">Looks right — confirm all ✓</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

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
  const [showLightspeedModal, setShowLightspeedModal] = useState(false);
  const [lightspeedLocation, setLightspeedLocation] = useState(null);
  const [connectionStatuses, setConnectionStatuses] = useState({});
  const [notifyIntegration, setNotifyIntegration] = useState(null);
  

  useEffect(() => {
    if (!currentBusiness) return;
    base44.functions.invoke('toastPosSync', { action: 'status', business_id: currentBusiness.id })
      .then(res => setConnectionStatuses(prev => ({ ...prev, toast: res.data })))
      .catch(() => {});
  }, [currentBusiness]);

  const handleConnect = (integrationId) => {
    if (integrationId === 'toast') setShowToastModal(true);
    if (integrationId === 'lightspeed') setShowLightspeedModal(true);
  };

  const handleLightspeedConnected = (location) => {
    setLightspeedLocation(location);
    setConnectionStatuses(prev => ({ ...prev, lightspeed: { connected: true, location } }));
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Page title row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 flex items-center justify-center">
              <Plug className="w-5 h-5 text-[#C084FC]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Integrations</h1>
              <p className="text-xs text-slate-500">Connect Setra with the tools you already use</p>
            </div>
          </div>
          <a
            href="mailto:chris@setra.app?subject=Vote for next POS"
            className="hidden sm:flex items-center gap-1 text-sm text-[#A855F7] hover:text-[#C084FC] border border-[#7B3BFF]/30 rounded-lg px-3 py-2 transition-all hover:border-[#7B3BFF]/60"
          >
            Vote for next POS →
          </a>
        </div>

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
            <a
              href="mailto:chris@setra.app?subject=Vote for next POS"
              className="text-[#A855F7] hover:text-[#C084FC] underline underline-offset-2 text-sm transition-colors"
            >
              Vote for the next POS →
            </a>
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

        {/* Lightspeed Featured Hero */}
        {selectedCategory === 'all' && !searchQuery && (
          <Card className="bg-gradient-to-r from-[#7B3BFF]/15 to-[#A855F7]/10 border-[#7B3BFF]/30 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#7B3BFF]/20 border border-[#7B3BFF]/40 flex items-center justify-center text-2xl flex-shrink-0">⚡</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-bold text-lg">Lightspeed</h3>
                    <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/20 border text-[10px]">Available</Badge>
                  </div>
                  <p className="text-slate-400 text-sm max-w-xl">
                    Connect your Lightspeed location and activate the live Operations Hub feed — real-time sales, top dishes, running food cost %.
                  </p>
                  {lightspeedLocation && (
                    <p className="text-emerald-400 text-xs mt-1.5 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Connected to {lightspeedLocation.name} · Last sync: just now
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={() => setShowLightspeedModal(true)}
                className={lightspeedLocation ? 'bg-emerald-600 hover:bg-emerald-700 flex-shrink-0' : 'flex-shrink-0'}
              >
                {lightspeedLocation ? <><Check className="w-4 h-4 mr-2" />Connected</> : <><Zap className="w-4 h-4 mr-2" />Connect Lightspeed</>}
              </Button>
            </div>
          </Card>
        )}

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
            <a href="mailto:chris@setra.app?subject=Vote for next POS" className="mt-2 text-[#A855F7] text-sm hover:text-[#C084FC] underline underline-offset-2 transition-colors">
              Vote for the next POS →
            </a>
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
                <a
                  href="mailto:chris@setra.app?subject=Vote for next POS"
                  className="bg-white/[0.02] border-dashed border-white/10 p-5 h-full flex flex-col items-center justify-center text-center hover:border-[#7B3BFF]/30 hover:bg-[#7B3BFF]/5 transition-all group rounded-2xl"
                >
                  <div className="text-3xl mb-3">🗳️</div>
                  <h3 className="font-semibold text-slate-300 group-hover:text-white text-sm mb-1">Vote for the next POS</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">Tell us which POS you use — most-voted gets built next.</p>
                  <span className="mt-3 text-xs text-[#A855F7]">Cast your vote →</span>
                </a>
              </motion.div>
            )}
          </div>
        )}

        {/* Vote for next POS */}
        <Card className="bg-[#7B3BFF]/5 border-[#7B3BFF]/20 p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h4 className="text-white font-semibold text-sm mb-1">Which POS should we connect next?</h4>
            <p className="text-slate-400 text-xs">Your vote shapes our integration roadmap. Takes 30 seconds.</p>
          </div>
          <a
            href="mailto:chris@setra.app?subject=Vote for next POS"
            className="flex-shrink-0 px-4 py-2 rounded-lg border border-[#7B3BFF]/40 text-[#C084FC] text-sm hover:bg-[#7B3BFF]/10 transition-all"
          >
            Vote for the next POS →
          </a>
        </Card>

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

      <LightspeedConnectModal
        open={showLightspeedModal}
        onClose={() => setShowLightspeedModal(false)}
        onConnected={handleLightspeedConnected}
      />
    </div>
  );
}