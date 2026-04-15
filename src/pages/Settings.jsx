import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Settings as SettingsIcon, Building2, Users, Trash2, Loader2, LogOut, FileSpreadsheet } from 'lucide-react';
import { useBusiness } from '@/components/business/BusinessContext';
import TeamManagement from '@/components/business/TeamManagement';

const CURRENCIES = [
  { value: 'EUR', label: '€ Euro (EUR)' },
  { value: 'USD', label: '$ US Dollar (USD)' },
  { value: 'GBP', label: '£ British Pound (GBP)' },
  { value: 'CHF', label: 'Fr Swiss Franc (CHF)' },
  { value: 'AUD', label: '$ Australian Dollar (AUD)' },
  { value: 'CAD', label: '$ Canadian Dollar (CAD)' }
];

function SettingsContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentBusiness, user, refreshBusinesses, isOwner } = useBusiness();
  const [saving, setSaving] = useState(false);
  const [businessForm, setBusinessForm] = useState({
    name: currentBusiness?.name || '',
    currency: currentBusiness?.currency || 'EUR',
    address: currentBusiness?.address || '',
    vat_registered: currentBusiness?.vat_registered || false,
    vat_number: currentBusiness?.vat_number || '',
    vat_quarter_group: currentBusiness?.vat_quarter_group || ''
  });

  const updateBusiness = useMutation({
    mutationFn: (data) => base44.entities.Business.update(currentBusiness.id, data),
    onSuccess: () => {
      refreshBusinesses();
      setSaving(false);
    }
  });

  const handleSave = async () => {
    setSaving(true);
    await updateBusiness.mutateAsync({
      ...currentBusiness,
      ...businessForm,
      industry_group: currentBusiness.industry_group || currentBusiness.business_type
    });
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleDeleteBusiness = async () => {
    if (!confirm(`Are you sure you want to delete "${currentBusiness.name}"? This action cannot be undone.`)) return;
    
    // Delete all related data
    const expenses = await base44.entities.ExpenseDocument.filter({ business_id: currentBusiness.id });
    const budgets = await base44.entities.Budget.filter({ business_id: currentBusiness.id });
    const snapshots = await base44.entities.FinancialSnapshot.filter({ business_id: currentBusiness.id });
    const members = await base44.entities.BusinessMember.filter({ business_id: currentBusiness.id });

    for (const e of expenses) await base44.entities.ExpenseDocument.delete(e.id);
    for (const b of budgets) await base44.entities.Budget.delete(b.id);
    for (const s of snapshots) await base44.entities.FinancialSnapshot.delete(s.id);
    for (const m of members) await base44.entities.BusinessMember.delete(m.id);
    
    try {
      await base44.entities.Business.delete(currentBusiness.id);
    } catch (e) {
      // Business may have already been deleted — proceed with cleanup
    }
    localStorage.removeItem('currentBusinessId');
    await refreshBusinesses();
    navigate(createPageUrl('Dashboard'));
  };

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      <header className="border-b border-white/5 backdrop-blur-2xl sticky top-0 z-40 bg-[#0B0B12]/95 shadow-[0_4px_30px_rgba(123,59,255,0.1)]">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate(createPageUrl('Dashboard'))}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <SettingsIcon className="w-6 h-6 text-[#C084FC]" />
                Settings
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Account Info */}
        <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Your Account</h3>
              <p className="text-sm text-slate-500">Logged in as {user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
            <div>
              <p className="text-white font-medium">{user?.full_name || 'User'}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="border-slate-700 text-slate-300">
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </div>
        </Card>

        {/* Business Settings */}
        {currentBusiness && (
          <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#C084FC]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Business Settings</h3>
                <p className="text-sm text-slate-500">{currentBusiness.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-slate-400 mb-2 block">Business Name</Label>
                <Input
                  value={businessForm.name}
                  onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  disabled={!isOwner()}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-400 mb-2 block">Currency</Label>
                  <Select 
                    value={businessForm.currency} 
                    onValueChange={(v) => setBusinessForm({ ...businessForm, currency: v })}
                    disabled={!isOwner()}
                  >
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
                  <Label className="text-slate-400 mb-2 block">Address</Label>
                  <Input
                    value={businessForm.address}
                    onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    disabled={!isOwner()}
                  />
                </div>
              </div>

              {isOwner() && (
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* VAT Settings */}
        {currentBusiness && isOwner() && (
          <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">VAT Settings</h3>
                <p className="text-sm text-slate-500">Configure VAT registration for this business</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
                <div>
                  <p className="text-white font-medium">VAT Registered</p>
                  <p className="text-sm text-slate-500">Enable VAT tracking and reporting features</p>
                </div>
                <Switch
                  checked={businessForm.vat_registered}
                  onCheckedChange={(v) => setBusinessForm({ ...businessForm, vat_registered: v })}
                />
              </div>
              {businessForm.vat_registered && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400 mb-2 block">VAT Number</Label>
                    <Input
                      value={businessForm.vat_number}
                      onChange={(e) => setBusinessForm({ ...businessForm, vat_number: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="e.g. CY12345678X"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400 mb-2 block">VAT Quarter Group</Label>
                    <Select value={businessForm.vat_quarter_group} onValueChange={(v) => setBusinessForm({ ...businessForm, vat_quarter_group: v })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="A" className="text-white">Group A (Jan/Apr/Jul/Oct)</SelectItem>
                        <SelectItem value="B" className="text-white">Group B (Feb/May/Aug/Nov)</SelectItem>
                        <SelectItem value="C" className="text-white">Group C (Mar/Jun/Sep/Dec)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save VAT Settings
              </Button>
            </div>
          </Card>
        )}

        {/* Team Management */}
        {currentBusiness && <TeamManagement />}

        {/* Danger Zone */}
        {currentBusiness && isOwner() && (
          <Card className="bg-rose-500/5 border-rose-500/30 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-rose-400 mb-4">Danger Zone</h3>
            <p className="text-slate-400 text-sm mb-4">
              Deleting this business will permanently remove all its data including invoices, budgets, and reports.
            </p>
            <Button 
              variant="outline" 
              onClick={handleDeleteBusiness}
              className="border-rose-500/50 text-rose-400 hover:bg-rose-500/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Business
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}

export default function Settings() {
  return <SettingsContent />;
}