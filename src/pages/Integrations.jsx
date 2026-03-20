import React, { useState, useEffect } from 'react';
import ToastConnectModal from '@/components/integrations/ToastConnectModal';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Plug, 
  Search,
  CreditCard,
  Package,
  Users,
  FileText,
  ShoppingCart,
  Database,
  Check,
  ExternalLink
} from 'lucide-react';
import { BusinessProvider, useBusiness } from '@/components/business/BusinessContext';

const INTEGRATION_CATEGORIES = [
  { id: 'all', label: 'All Integrations', icon: Plug },
  { id: 'pos', label: 'Point of Sale', icon: CreditCard },
  { id: 'accounting', label: 'Accounting', icon: FileText },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'payroll', label: 'Payroll', icon: Users },
  { id: 'ecommerce', label: 'E-Commerce', icon: ShoppingCart },
  { id: 'data', label: 'Data & Analytics', icon: Database }
];

const INTEGRATIONS = [
  // POS Systems
  {
    id: 'toast',
    name: 'Toast POS',
    category: 'pos',
    description: 'Restaurant POS system with integrated payment processing',
    logo: '🍞',
    status: 'available',
    popular: true
  },
  {
    id: 'square',
    name: 'Square',
    category: 'pos',
    description: 'All-in-one POS and payment solution',
    logo: '⬛',
    status: 'available',
    popular: true
  },
  {
    id: 'lightspeed',
    name: 'Lightspeed',
    category: 'pos',
    description: 'Cloud-based POS for restaurants and retail',
    logo: '⚡',
    status: 'available'
  },
  {
    id: 'clover',
    name: 'Clover',
    category: 'pos',
    description: 'Flexible POS system with business management tools',
    logo: '🍀',
    status: 'coming_soon'
  },
  
  // Accounting
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    category: 'accounting',
    description: 'Comprehensive accounting and financial management',
    logo: '📊',
    status: 'available',
    popular: true
  },
  {
    id: 'xero',
    name: 'Xero',
    category: 'accounting',
    description: 'Cloud accounting software for small businesses',
    logo: '📈',
    status: 'available',
    popular: true
  },
  {
    id: 'sage',
    name: 'Sage',
    category: 'accounting',
    description: 'Business management and accounting software',
    logo: '🌿',
    status: 'coming_soon'
  },
  
  // Inventory
  {
    id: 'upserve',
    name: 'Upserve',
    category: 'inventory',
    description: 'Restaurant inventory and management platform',
    logo: '📦',
    status: 'available'
  },
  {
    id: 'marketman',
    name: 'MarketMan',
    category: 'inventory',
    description: 'Inventory management for restaurants',
    logo: '🏪',
    status: 'available'
  },
  {
    id: 'orderly',
    name: 'Orderly',
    category: 'inventory',
    description: 'Smart inventory control system',
    logo: '📋',
    status: 'coming_soon'
  },
  
  // Payroll
  {
    id: 'gusto',
    name: 'Gusto',
    category: 'payroll',
    description: 'Full-service payroll and HR platform',
    logo: '💼',
    status: 'available'
  },
  {
    id: 'adp',
    name: 'ADP',
    category: 'payroll',
    description: 'Enterprise payroll and workforce management',
    logo: '👥',
    status: 'available'
  },
  {
    id: 'paychex',
    name: 'Paychex',
    category: 'payroll',
    description: 'Payroll, HR, and benefits services',
    logo: '💰',
    status: 'coming_soon'
  },
  
  // E-Commerce
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'ecommerce',
    description: 'E-commerce platform for online stores',
    logo: '🛍️',
    status: 'available'
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    category: 'ecommerce',
    description: 'WordPress e-commerce plugin',
    logo: '🛒',
    status: 'coming_soon'
  },
  
  // Data & Analytics
  {
    id: 'tableau',
    name: 'Tableau',
    category: 'data',
    description: 'Business intelligence and analytics',
    logo: '📊',
    status: 'coming_soon'
  },
  {
    id: 'powerbi',
    name: 'Power BI',
    category: 'data',
    description: 'Microsoft business analytics service',
    logo: '📈',
    status: 'coming_soon'
  }
];

function IntegrationsContent() {
  const navigate = useNavigate();
  const { currentBusiness } = useBusiness();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showToastModal, setShowToastModal] = useState(false);
  const [connectionStatuses, setConnectionStatuses] = useState({});

  useEffect(() => {
    if (!currentBusiness) return;
    base44.functions.invoke('toastPosSync', {
      action: 'status',
      business_id: currentBusiness.id
    }).then(res => {
      setConnectionStatuses(prev => ({ ...prev, toast: res.data }));
    }).catch(() => {});
  }, [currentBusiness]);

  const handleConnect = (integrationId) => {
    if (integrationId === 'toast') setShowToastModal(true);
  };

  const popularIntegrations = INTEGRATIONS.filter(i => i.popular);

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      {/* Header */}
      <header className="border-b border-white/5 backdrop-blur-2xl sticky top-0 z-40 bg-[#0B0B12]/95 shadow-[0_4px_30px_rgba(123,59,255,0.1)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate(createPageUrl('Dashboard'))}
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 flex items-center justify-center">
                <Plug className="w-5 h-5 text-[#C084FC]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Setra Connect</h1>
                <p className="text-sm text-slate-500">Connect SETRA with your business systems</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Hero Section */}
        <Card className="bg-gradient-to-r from-[#7B3BFF]/10 to-[#A855F7]/10 border-[#7B3BFF]/20 p-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">Setra Connect — Enterprise Integration Infrastructure</h2>
              <p className="text-slate-400 mb-4 max-w-2xl">
                Connect SETRA to your existing business systems for unified operational and financial intelligence. 
                Seamless data flow across POS, accounting, inventory, and payroll platforms.
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-slate-300">{INTEGRATIONS.filter(i => i.status === 'available').length} Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-slate-300">{INTEGRATIONS.filter(i => i.status === 'coming_soon').length} Coming Soon</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-slate-900/50 border-slate-800 text-white h-12"
          />
        </div>

        {/* Popular Integrations */}
        {selectedCategory === 'all' && !searchQuery && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Popular Integrations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {popularIntegrations.map((integration, idx) => (
                <motion.div
                  key={integration.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <IntegrationCard integration={integration} compact />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {INTEGRATION_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-[#7B3BFF]/10 border-[#7B3BFF]/50 text-[#C084FC]'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{category.label}</span>
              </button>
            );
          })}
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIntegrations.map((integration, idx) => (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <IntegrationCard integration={integration} />
            </motion.div>
          ))}
        </div>

        {filteredIntegrations.length === 0 && (
          <Card className="bg-slate-900/50 border-slate-800 p-12 text-center">
            <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No integrations found matching your search</p>
          </Card>
        )}
      </main>

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
    </div>
  );
}

function IntegrationCard({ integration, compact = false }) {
  const getStatusBadge = (status) => {
    if (status === 'available') {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
          <Check className="w-3 h-3 mr-1" />
          Available
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
        Coming Soon
      </Badge>
    );
  };

  if (compact) {
    return (
      <Card className="bg-slate-900/50 border-slate-800 p-4 hover:border-[#7B3BFF]/30 transition-all cursor-pointer group">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-2xl">{integration.logo}</div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white group-hover:text-[#C084FC] transition-colors truncate">
              {integration.name}
            </h4>
          </div>
        </div>
        {getStatusBadge(integration.status)}
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-6 hover:border-[#7B3BFF]/30 transition-all group h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{integration.logo}</div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-[#C084FC] transition-colors">
              {integration.name}
            </h3>
            <p className="text-xs text-slate-500 capitalize">{integration.category}</p>
          </div>
        </div>
        {getStatusBadge(integration.status)}
      </div>

      <p className="text-sm text-slate-400 mb-4 flex-1">{integration.description}</p>

      <Button
        disabled={integration.status !== 'available'}
        className={`w-full ${
          integration.status === 'available'
            ? ''
            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
        }`}
      >
        {integration.status === 'available' ? (
          <>
            <ExternalLink className="w-4 h-4 mr-2" />
            Connect
          </>
        ) : (
          'Coming Soon'
        )}
      </Button>
    </Card>
  );
}

export default function Integrations() {
  return (
    <BusinessProvider>
      <IntegrationsContent />
    </BusinessProvider>
  );
}