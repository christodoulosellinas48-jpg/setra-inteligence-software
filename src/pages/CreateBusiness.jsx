import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import {
  Wine, Users, Coffee, PartyPopper, Cake, Store, ShoppingBag, Hotel, UtensilsCrossed,
  ArrowRight, ArrowLeft, Building2, Loader2, Info, Plus, X
} from 'lucide-react';

// Country config: currency, VAT rate, corp tax
const COUNTRIES = [
  { value: 'CY', label: '🇨🇾 Cyprus',        currency: 'EUR', vat: 19, corp_tax: 12.5 },
  { value: 'DE', label: '🇩🇪 Germany',        currency: 'EUR', vat: 19, corp_tax: 15 },
  { value: 'FR', label: '🇫🇷 France',         currency: 'EUR', vat: 20, corp_tax: 25 },
  { value: 'GR', label: '🇬🇷 Greece',         currency: 'EUR', vat: 24, corp_tax: 22 },
  { value: 'IT', label: '🇮🇹 Italy',          currency: 'EUR', vat: 22, corp_tax: 24 },
  { value: 'ES', label: '🇪🇸 Spain',          currency: 'EUR', vat: 21, corp_tax: 25 },
  { value: 'PT', label: '🇵🇹 Portugal',       currency: 'EUR', vat: 23, corp_tax: 21 },
  { value: 'NL', label: '🇳🇱 Netherlands',    currency: 'EUR', vat: 21, corp_tax: 25.8 },
  { value: 'BE', label: '🇧🇪 Belgium',        currency: 'EUR', vat: 21, corp_tax: 25 },
  { value: 'AT', label: '🇦🇹 Austria',        currency: 'EUR', vat: 20, corp_tax: 24 },
  { value: 'GB', label: '🇬🇧 United Kingdom', currency: 'GBP', vat: 20, corp_tax: 25 },
  { value: 'CH', label: '🇨🇭 Switzerland',    currency: 'CHF', vat: 8.1, corp_tax: 14.9 },
  { value: 'US', label: '🇺🇸 United States',  currency: 'USD', vat: 0,   corp_tax: 21 },
  { value: 'AU', label: '🇦🇺 Australia',      currency: 'AUD', vat: 10,  corp_tax: 30 },
  { value: 'CA', label: '🇨🇦 Canada',         currency: 'CAD', vat: 5,   corp_tax: 15 },
  { value: 'OTHER', label: '🌍 Other',         currency: 'EUR', vat: 0,   corp_tax: 0 },
];

const CURRENCIES = [
  { value: 'EUR', label: '€ Euro' },
  { value: 'GBP', label: '£ British Pound' },
  { value: 'USD', label: '$ US Dollar' },
  { value: 'CHF', label: 'Fr Swiss Franc' },
  { value: 'AUD', label: '$ Australian Dollar' },
  { value: 'CAD', label: '$ Canadian Dollar' },
];

// Industry-level reduced VAT rates (Cyprus defaults)
const INDUSTRY_REDUCED_VAT = {
  bar: 9, canteen: 9, coffee_shop: 9, catering_events: 9,
  confectionery: 19, deli_cava: 19, food_to_go: 9, hotels: 9, restaurant: 9
};

const BUSINESS_TYPES = [
  { type: 'bar',            icon: Wine,          title: 'Bar',            description: 'Pubs, cocktail bars, nightlife' },
  { type: 'canteen',        icon: Users,         title: 'Canteen',        description: 'Staff cafeterias, institutional dining' },
  { type: 'coffee_shop',    icon: Coffee,        title: 'Coffee Shop',    description: 'Coffee houses, espresso bars' },
  { type: 'catering_events',icon: PartyPopper,   title: 'Catering/Events',description: 'Event catering, banquets' },
  { type: 'confectionery',  icon: Cake,          title: 'Confectionery',  description: 'Sweet shops, chocolatiers' },
  { type: 'deli_cava',      icon: Store,         title: 'Deli/Cava',      description: 'Delicatessens, casual eateries' },
  { type: 'food_to_go',     icon: ShoppingBag,   title: 'Food To Go',     description: 'Takeaway, quick service' },
  { type: 'hotels',         icon: Hotel,         title: 'Hotels',         description: 'Hotel dining, room service' },
  { type: 'restaurant',     icon: UtensilsCrossed, title: 'Restaurant',   description: 'Full-service dining' },
];

const VENUE_COUNT_OPTIONS = [
  { value: '1',    label: '1', sub: 'Solo venue' },
  { value: '2-5',  label: '2–5', sub: 'Small group' },
  { value: '6+',   label: '6+', sub: 'Larger group' },
];

const DRAFT_KEY = 'setra_create_business_draft';

export default function CreateBusiness() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNotSureTooltip, setShowNotSureTooltip] = useState(false);

  const defaultFormData = {
    name: '',
    industry_group: '',
    country: 'CY',
    currency: 'EUR',
    address: '',
    venue_count: '1',
    vat_registered: 'yes',
    vat_number: '',
    vat_rate: 19,
    corp_tax_rate: 12.5,
    reduced_rates_apply: false,
    reduced_rates: [],
  };

  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      return saved ? JSON.parse(saved) : defaultFormData;
    } catch {
      return defaultFormData;
    }
  });

  // Persist draft on every change
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData]);

  const update = (patch) => setFormData(prev => ({ ...prev, ...patch }));

  // Auto-fill currency + VAT + corp tax when country changes
  const handleCountryChange = (countryCode) => {
    const c = COUNTRIES.find(c => c.value === countryCode);
    if (!c) return;
    // Always use the standard VAT rate for the country (never a reduced rate as the default)
    update({
      country: countryCode,
      currency: c.currency,
      vat_rate: c.vat,
      corp_tax_rate: c.corp_tax,
    });
  };

  // Auto-adjust industry group (keep standard VAT rate unchanged)
  const handleIndustryChange = (type) => {
    update({ industry_group: type });
  };

  const addReducedRate = () => {
    update({ reduced_rates: [...formData.reduced_rates, { rate: '', label: '' }] });
  };

  const removeReducedRate = (i) => {
    update({ reduced_rates: formData.reduced_rates.filter((_, idx) => idx !== i) });
  };

  const updateReducedRate = (i, field, value) => {
    const rates = [...formData.reduced_rates];
    rates[i] = { ...rates[i], [field]: value };
    update({ reduced_rates: rates });
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.industry_group || !formData.country) return;

    try {
      setLoading(true);
      setError('');

      const isAuthenticated = await base44.auth.isAuthenticated();
      if (!isAuthenticated) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }

      const user = await base44.auth.me();

      const business = await base44.entities.Business.create({
        name: formData.name,
        industry_group: formData.industry_group,
        currency: formData.currency,
        address: formData.address,
        owner_email: user.email,
        vat_registered: formData.vat_registered === 'yes',
        vat_number: formData.vat_number || '',
        vat_rate: Number(formData.vat_rate) || 19,
        corporate_tax_rate: Number(formData.corp_tax_rate) || 12.5,
        monthly_revenue: 0,
        rent_fixed_costs: 0,
        staff_costs: 0,
        purchases_food_bev: 0,
        utilities: 0,
        other_operating: 0,
      });

      await base44.entities.BusinessMember.create({
        business_id: business.id,
        user_email: user.email,
        role: 'owner',
        invited_by: user.email,
        invitation_status: 'accepted',
        invited_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
      });

      localStorage.setItem('currentBusinessId', business.id);
      localStorage.removeItem(DRAFT_KEY);
      navigate('/Dashboard');
    } catch (err) {
      console.error('Error creating business:', err);
      setError(err.message || 'Failed to create business. Please try again.');
      setLoading(false);
    }
  };

  const isLargeGroup = formData.venue_count === '6+';
  const canSubmit = !!formData.name && !!formData.industry_group && !!formData.country;

  return (
    <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#7B3BFF]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[#A855F7]/8 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-w-2xl w-full"
      >
        <Button
          variant="ghost"
          onClick={() => navigate('/Dashboard')}
          className="text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="bg-[#151528]/80 border-white/5 p-8 rounded-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-[#C084FC]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Create New Business</h1>
              <p className="text-slate-500 text-sm">Set up a new business profile</p>
            </div>
          </div>
          <p className="text-slate-500 text-sm italic mb-8 pl-[60px]">
            This takes about 60 seconds. We use these details to set up your dashboards, VAT, and benchmarks for venues like yours.
          </p>

          <div className="space-y-7">

            {/* Business Name */}
            <div>
              <Label className="text-slate-400 mb-2 block">Business Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="e.g., The Corner Café"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            {/* Venue type */}
            <div>
              <Label className="text-slate-400 mb-3 block">What kind of venue is this? *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {BUSINESS_TYPES.map((bt) => {
                  const Icon = bt.icon;
                  const isSelected = formData.industry_group === bt.type;
                  return (
                    <button
                      key={bt.type}
                      onClick={() => handleIndustryChange(bt.type)}
                      className={`p-4 rounded-xl border transition-all text-left ${
                        isSelected
                          ? 'bg-gradient-to-br from-[#7B3BFF]/10 to-[#A855F7]/10 border-[#7B3BFF]/50'
                          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-[#C084FC]' : 'text-slate-400'}`} />
                      <p className={`font-medium text-sm ${isSelected ? 'text-white' : 'text-slate-300'}`}>{bt.title}</p>
                      <p className="text-xs text-slate-500">{bt.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Number of venues */}
            <div>
              <Label className="text-slate-400 mb-3 block">How many venues do you operate?</Label>
              <div className="grid grid-cols-3 gap-3">
                {VENUE_COUNT_OPTIONS.map((opt) => {
                  const isSelected = formData.venue_count === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => update({ venue_count: opt.value })}
                      className={`p-4 rounded-xl border transition-all text-center ${
                        isSelected
                          ? 'bg-gradient-to-br from-[#7B3BFF]/10 to-[#A855F7]/10 border-[#7B3BFF]/50'
                          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <p className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>{opt.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{opt.sub}</p>
                    </button>
                  );
                })}
              </div>
              {isLargeGroup && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-[#C084FC] mt-3 bg-[#7B3BFF]/10 border border-[#7B3BFF]/20 rounded-lg px-4 py-3"
                >
                  Running a larger group? Let's talk about your needs directly —{' '}
                  <a href="mailto:chris@setra.app" className="underline hover:text-white transition-colors">chris@setra.app</a>
                </motion.p>
              )}
            </div>

            {/* Country + Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400 mb-2 block">Country *</Label>
                <Select value={formData.country} onValueChange={handleCountryChange}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 max-h-64">
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.value} value={c.value} className="text-white hover:bg-slate-700">
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-400 mb-2 block">Currency</Label>
                <Select value={formData.currency} onValueChange={(v) => update({ currency: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value} className="text-white hover:bg-slate-700">
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Address */}
            <div>
              <Label className="text-slate-400 mb-2 block">Address (Optional)</Label>
              <Input
                value={formData.address}
                onChange={(e) => update({ address: e.target.value })}
                placeholder="123 Main Street, Nicosia"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            {/* Tax & VAT section */}
            <div className="border border-white/[0.06] rounded-xl p-5 space-y-5">
              <p className="text-sm font-semibold text-white">Tax & VAT setup</p>

              {/* VAT registered */}
              <div>
                <Label className="text-slate-400 mb-2 block flex items-center gap-1.5">
                  VAT registered?
                  <span
                    className="relative cursor-pointer"
                    onClick={() => setShowNotSureTooltip(v => !v)}
                  >
                    <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
                    {showNotSureTooltip && (
                      <span className="absolute left-5 top-0 w-64 text-xs text-slate-300 bg-[#1E1E35] border border-white/10 rounded-lg p-3 z-10 shadow-xl">
                        Not sure? We can help you check this with your local tax authority later. Choose "Not sure" to skip for now.
                      </span>
                    )}
                  </span>
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'yes',      label: 'Yes' },
                    { value: 'no',       label: 'No' },
                    { value: 'not_sure', label: 'Not sure' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => update({ vat_registered: opt.value })}
                      className={`py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        formData.vat_registered === opt.value
                          ? 'bg-[#7B3BFF]/20 border-[#7B3BFF]/50 text-white'
                          : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* VAT number — only when yes */}
              {formData.vat_registered === 'yes' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <Label className="text-slate-400 mb-2 block">VAT Number</Label>
                  <Input
                    value={formData.vat_number}
                    onChange={(e) => update({ vat_number: e.target.value })}
                    placeholder="e.g., CY12345678L"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </motion.div>
              )}

              {/* Standard VAT + Corp tax rates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-400 mb-2 block text-xs">Standard VAT rate (%)</Label>
                  <Input
                    type="number"
                    value={formData.vat_rate}
                    onChange={(e) => update({ vat_rate: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-400 mb-2 block text-xs">Corporate tax rate (%)</Label>
                  <Input
                    type="number"
                    value={formData.corp_tax_rate}
                    onChange={(e) => update({ corp_tax_rate: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>

              {/* Reduced rates */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-slate-400 text-xs">Reduced rates apply?</Label>
                  <div className="flex gap-2">
                    {[
                      { v: true, l: 'Yes' },
                      { v: false, l: 'No' },
                    ].map(opt => (
                      <button
                        key={String(opt.v)}
                        onClick={() => update({ reduced_rates_apply: opt.v, reduced_rates: opt.v ? formData.reduced_rates : [] })}
                        className={`px-3 py-1 rounded-lg border text-xs font-medium transition-all ${
                          formData.reduced_rates_apply === opt.v
                            ? 'bg-[#7B3BFF]/20 border-[#7B3BFF]/50 text-white'
                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.reduced_rates_apply && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 mt-3">
                    {formData.reduced_rates.map((r, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={r.rate}
                          onChange={(e) => updateReducedRate(i, 'rate', e.target.value)}
                          placeholder="Rate %"
                          className="bg-slate-800 border-slate-700 text-white w-24 flex-shrink-0"
                        />
                        <Input
                          value={r.label}
                          onChange={(e) => updateReducedRate(i, 'label', e.target.value)}
                          placeholder="e.g., food, accommodation"
                          className="bg-slate-800 border-slate-700 text-white flex-1"
                        />
                        <button onClick={() => removeReducedRate(i)} className="text-slate-500 hover:text-rose-400 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addReducedRate}
                      className="flex items-center gap-1.5 text-xs text-[#A855F7] hover:text-[#C084FC] transition-colors mt-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add reduced rate
                    </button>
                  </motion.div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/50 rounded-lg text-rose-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <Button
                onClick={handleCreate}
                disabled={!canSubmit || loading}
                className="w-full py-6"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                Create Business
              </Button>
              <p className="text-center text-xs text-slate-600 mt-3 italic">
                Next: connect your POS and accounting (optional, takes 2 minutes)
              </p>
            </div>

          </div>
        </Card>
      </motion.div>
    </div>
  );
}