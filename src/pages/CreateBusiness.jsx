import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Wine, Users, Coffee, PartyPopper, Cake, Store, ShoppingBag, Hotel, UtensilsCrossed, ArrowRight, ArrowLeft, Building2, Loader2 } from 'lucide-react';

const BUSINESS_TYPES = [
  { type: 'bar', icon: Wine, title: 'Bar', description: 'Pubs, cocktail bars, nightlife' },
  { type: 'canteen', icon: Users, title: 'Canteen', description: 'Staff cafeterias, institutional dining' },
  { type: 'coffee_shop', icon: Coffee, title: 'Coffee Shop', description: 'Coffee houses, espresso bars' },
  { type: 'catering_events', icon: PartyPopper, title: 'Catering/Events', description: 'Event catering, banquets' },
  { type: 'confectionery', icon: Cake, title: 'Confectionery', description: 'Sweet shops, chocolatiers' },
  { type: 'deli_cava', icon: Store, title: 'Deli/Cava', description: 'Delicatessens, casual eateries' },
  { type: 'food_to_go', icon: ShoppingBag, title: 'Food To Go', description: 'Takeaway, quick service' },
  { type: 'hotels', icon: Hotel, title: 'Hotels', description: 'Hotel dining, room service' },
  { type: 'restaurant', icon: UtensilsCrossed, title: 'Restaurant', description: 'Full-service dining' }
];

const CURRENCIES = [
  { value: 'EUR', label: '€ Euro (EUR)' },
  { value: 'USD', label: '$ US Dollar (USD)' },
  { value: 'GBP', label: '£ British Pound (GBP)' },
  { value: 'CHF', label: 'Fr Swiss Franc (CHF)' },
  { value: 'AUD', label: '$ Australian Dollar (AUD)' },
  { value: 'CAD', label: '$ Canadian Dollar (CAD)' }
];

export default function CreateBusiness() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    industry_group: '',
    currency: 'EUR',
    address: ''
  });

  const handleCreate = async () => {
    if (!formData.name || !formData.industry_group) return;
    
    try {
      setLoading(true);
      setError('');

      // Check authentication first
      const isAuthenticated = await base44.auth.isAuthenticated();
      if (!isAuthenticated) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }

      const user = await base44.auth.me();
      
      const business = await base44.entities.Business.create({
        ...formData,
        owner_email: user.email,
        monthly_revenue: 0,
        rent_fixed_costs: 0,
        staff_costs: 0,
        purchases_food_bev: 0,
        utilities: 0,
        other_operating: 0
      });

      // Create owner membership record
      await base44.entities.BusinessMember.create({
        business_id: business.id,
        user_email: user.email,
        role: 'owner',
        invited_by: user.email,
        invitation_status: 'accepted',
        invited_at: new Date().toISOString(),
        accepted_at: new Date().toISOString()
      });

      localStorage.setItem('currentBusinessId', business.id);
      navigate(createPageUrl('Dashboard'));
    } catch (err) {
      console.error('Error creating business:', err);
      setError(err.message || 'Failed to create business. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-w-2xl w-full"
      >
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="bg-slate-900/50 border-slate-800 p-8 rounded-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Create New Business</h1>
              <p className="text-slate-500">Set up a new business profile</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="text-slate-400 mb-2 block">Business Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., The Corner Café"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-400 mb-3 block">Industry Group *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {BUSINESS_TYPES.map((bt) => {
                  const Icon = bt.icon;
                  const isSelected = formData.industry_group === bt.type;
                  return (
                    <button
                      key={bt.type}
                      onClick={() => setFormData({ ...formData, industry_group: bt.type })}
                      className={`p-4 rounded-xl border transition-all text-left ${
                        isSelected
                          ? 'bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/50'
                          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                      }`}
                      >
                      <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <p className={`font-medium text-sm ${isSelected ? 'text-white' : 'text-slate-300'}`}>{bt.title}</p>
                      <p className="text-xs text-slate-500">{bt.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400 mb-2 block">Currency</Label>
                <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
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
              <div>
                <Label className="text-slate-400 mb-2 block">Address (Optional)</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main Street"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/50 rounded-lg text-rose-400 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleCreate}
              disabled={!formData.name || !formData.industry_group || loading}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white py-6 shadow-lg shadow-cyan-500/25"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              Create Business
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}