import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  ArrowLeft, Settings as SettingsIcon, Building2, Users, Trash2, Loader2, LogOut, FileSpreadsheet,
  UserX, Lock, Bell, Download, User, ChevronDown, AlertTriangle, Check, CreditCard, Eye, EyeOff,
  Layers, Plus, X
} from 'lucide-react';
import { useBusiness } from '@/components/business/BusinessContext';
import TeamManagement from '@/components/business/TeamManagement';

const COUNTRIES = [
  { value: 'CY', label: '🇨🇾 Cyprus', vat: 19, corporateTax: 12.5 },
  { value: 'GR', label: '🇬🇷 Greece', vat: 24, corporateTax: 22 },
  { value: 'GB', label: '🇬🇧 United Kingdom', vat: 20, corporateTax: 25 },
  { value: 'DE', label: '🇩🇪 Germany', vat: 19, corporateTax: 30 },
  { value: 'FR', label: '🇫🇷 France', vat: 20, corporateTax: 26.5 },
  { value: 'IT', label: '🇮🇹 Italy', vat: 22, corporateTax: 24 },
  { value: 'ES', label: '🇪🇸 Spain', vat: 21, corporateTax: 25 },
  { value: 'US', label: '🇺🇸 United States', vat: 0, corporateTax: 21 },
  { value: 'AU', label: '🇦🇺 Australia', vat: 10, corporateTax: 30 },
];

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
  const { currentBusiness, user, refreshBusinesses, isOwner, businesses } = useBusiness();
  const [saving, setSaving] = useState(false);
  const [deleteBusinessConfirm, setDeleteBusinessConfirm] = useState('');
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Group state
  const [groups, setGroups] = useState([]);
  const [groupMode, setGroupMode] = useState('none'); // 'none' | 'existing' | 'new'
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);
  const [groupSaved, setGroupSaved] = useState(false);

  // Load groups and pre-select current group
  useEffect(() => {
    if (!user) return;
    base44.entities.BusinessGroup.filter({ owner_email: user.email })
      .then(g => {
        setGroups(g || []);
        if (currentBusiness?.group_id) {
          const match = (g || []).find(gr => gr.id === currentBusiness.group_id);
          if (match) {
            setGroupMode('existing');
            setSelectedGroupId(currentBusiness.group_id);
          }
        }
      })
      .catch(() => {});
  }, [user, currentBusiness?.id]);

  const handleSaveGroup = async () => {
    if (!currentBusiness) return;
    setSavingGroup(true);
    try {
      let groupId = '';
      if (groupMode === 'new' && newGroupName.trim()) {
        const g = await base44.entities.BusinessGroup.create({ name: newGroupName.trim(), owner_email: user.email });
        groupId = g.id;
        setGroups(prev => [...prev, g]);
        setSelectedGroupId(g.id);
        setGroupMode('existing');
        setNewGroupName('');
      } else if (groupMode === 'existing' && selectedGroupId) {
        groupId = selectedGroupId;
      }
      await base44.entities.Business.update(currentBusiness.id, { group_id: groupId || null });
      await refreshBusinesses();
      setGroupSaved(true);
      setTimeout(() => setGroupSaved(false), 2500);
    } finally {
      setSavingGroup(false);
    }
  };

  const [businessForm, setBusinessForm] = useState({
    name: currentBusiness?.name || '',
    country: currentBusiness?.country || 'CY',
    currency: currentBusiness?.currency || 'EUR',
    address: currentBusiness?.address || '',
    vat_registered: currentBusiness?.vat_registered || false,
    vat_number: currentBusiness?.vat_number || '',
    vat_quarter_group: currentBusiness?.vat_quarter_group || 'A',
    standard_vat_rate: currentBusiness?.target_food_cost_pct || 19,
    corporate_tax_rate: currentBusiness?.corporate_tax_rate || 12.5,
  });

  const updateBusiness = useMutation({
    mutationFn: (data) => base44.entities.Business.update(currentBusiness.id, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries(['businesses']);
      const previous = queryClient.getQueryData(['businesses']);
      queryClient.setQueryData(['businesses'], (old = []) =>
        old.map(b => b.id === currentBusiness.id ? { ...b, ...data } : b)
      );
      return { previous };
    },
    onError: (_err, _data, context) => {
      if (context?.previous) queryClient.setQueryData(['businesses'], context.previous);
    },
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
    if (deleteBusinessConfirm !== currentBusiness.name) return;

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
    } catch (e) {}
    localStorage.removeItem('currentBusinessId');
    await refreshBusinesses();
    navigate('/Dashboard');
  };

  const handleDeleteAccount = async () => {
    if (deleteAccountConfirm !== 'DELETE MY ACCOUNT') return;

    setDeletingAccount(true);
    const ownedBusinesses = await base44.entities.Business.filter({ owner_email: user.email });
    for (const biz of ownedBusinesses) {
      const expenses = await base44.entities.ExpenseDocument.filter({ business_id: biz.id });
      const budgets = await base44.entities.Budget.filter({ business_id: biz.id });
      const snapshots = await base44.entities.FinancialSnapshot.filter({ business_id: biz.id });
      const members = await base44.entities.BusinessMember.filter({ business_id: biz.id });
      for (const e of expenses) await base44.entities.ExpenseDocument.delete(e.id);
      for (const b of budgets) await base44.entities.Budget.delete(b.id);
      for (const s of snapshots) await base44.entities.FinancialSnapshot.delete(s.id);
      for (const m of members) await base44.entities.BusinessMember.delete(m.id);
      await base44.entities.Business.delete(biz.id);
    }
    localStorage.clear();
    base44.auth.logout();
  };

  const selectedCountry = COUNTRIES.find(c => c.value === businessForm.country);

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      <header className="border-b border-white/5 backdrop-blur-2xl sticky top-0 z-40 bg-[#0B0B12]/95 shadow-[0_4px_30px_rgba(123,59,255,0.1)]">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/Dashboard')} className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <SettingsIcon className="w-6 h-6 text-[#C084FC]" /> Settings
                </h1>
              </div>
            </div>
            {currentBusiness && businesses && businesses.length > 1 && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>Editing:</span>
                <Badge className="bg-white/10 border-white/20 border text-slate-200">{currentBusiness.name}</Badge>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* Your Account */}
        <Card className="bg-[#151528]/80 border-white/5 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Your Account</h3>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          <div className="p-4 bg-white/[0.03] rounded-xl flex items-center justify-between">
            <div>
              <p className="text-white font-medium text-sm">{user?.full_name || 'User'}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="border-white/10 text-slate-300">
              <LogOut className="w-4 h-4 mr-2" /> Log Out
            </Button>
          </div>
        </Card>

        {/* Business Settings */}
        {currentBusiness && (
          <Card className="bg-[#151528]/80 border-white/5 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#7B3BFF]/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#C084FC]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Business Settings</h3>
                <p className="text-xs text-slate-500">Configure your venue details</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-400 mb-1.5 block text-sm">Business Name *</Label>
                  <Input
                    value={businessForm.name}
                    onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                    className="bg-[#0B0B12] border-white/10 text-white"
                    disabled={!isOwner()}
                  />
                </div>
                <div>
                  <Label className="text-slate-400 mb-1.5 block text-sm">Country *</Label>
                  <Select value={businessForm.country} onValueChange={(v) => setBusinessForm({ ...businessForm, country: v })} disabled={!isOwner()}>
                    <SelectTrigger className="bg-[#0B0B12] border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A30] border-white/10">
                      {COUNTRIES.map(c => (
                        <SelectItem key={c.value} value={c.value} className="text-white">{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-1">Auto-fills tax rates and formatting</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-400 mb-1.5 block text-sm">Currency</Label>
                  <Select value={businessForm.currency} onValueChange={(v) => setBusinessForm({ ...businessForm, currency: v })} disabled={!isOwner()}>
                    <SelectTrigger className="bg-[#0B0B12] border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A30] border-white/10">
                      {CURRENCIES.map(c => (
                        <SelectItem key={c.value} value={c.value} className="text-white">{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-400 mb-1.5 block text-sm">Address</Label>
                  <Input
                    value={businessForm.address}
                    onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                    className="bg-[#0B0B12] border-white/10 text-white"
                    disabled={!isOwner()}
                  />
                </div>
              </div>

              {isOwner() && (
                <Button onClick={handleSave} disabled={saving} className="mt-2">
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Group Assignment */}
        {currentBusiness && isOwner() && (
          <Card className="bg-[#151528]/80 border-white/5 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Business Group</h3>
                <p className="text-xs text-slate-500">Assign this venue to a group for consolidated reporting</p>
              </div>
            </div>

            {currentBusiness.group_id && (
              <div className="mb-4 p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-violet-300">
                  <Layers className="w-4 h-4" />
                  Currently in: <strong>{groups.find(g => g.id === currentBusiness.group_id)?.name || 'a group'}</strong>
                </div>
                <button
                  onClick={async () => {
                    await base44.entities.Business.update(currentBusiness.id, { group_id: null });
                    setSelectedGroupId('');
                    setGroupMode('none');
                    await refreshBusinesses();
                  }}
                  className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: 'none', l: 'No group' },
                  { v: 'existing', l: 'Existing group', hide: groups.length === 0 },
                  { v: 'new', l: 'Create new group' },
                ].filter(o => !o.hide).map(opt => (
                  <button
                    key={opt.v}
                    onClick={() => setGroupMode(opt.v)}
                    className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all text-center ${
                      groupMode === opt.v
                        ? 'bg-[#7B3BFF]/20 border-[#7B3BFF]/50 text-white'
                        : 'bg-[#0B0B12] border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>

              {groupMode === 'existing' && groups.length > 0 && (
                <div className="space-y-1.5">
                  {groups.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGroupId(g.id)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm transition-all ${
                        selectedGroupId === g.id
                          ? 'bg-[#7B3BFF]/20 border-[#7B3BFF]/50 text-white'
                          : 'bg-[#0B0B12] border-white/10 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        {g.name}
                      </span>
                      {selectedGroupId === g.id && <Check className="w-4 h-4 text-[#C084FC]" />}
                    </button>
                  ))}
                </div>
              )}

              {groupMode === 'new' && (
                <div>
                  <Label className="text-slate-400 mb-1.5 block text-sm">New group name</Label>
                  <Input
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    placeholder="e.g., Mezé Co. Group"
                    className="bg-[#0B0B12] border-white/10 text-white"
                  />
                </div>
              )}

              {groupMode !== 'none' && (
                <Button onClick={handleSaveGroup} disabled={savingGroup || (groupMode === 'existing' && !selectedGroupId) || (groupMode === 'new' && !newGroupName.trim())}>
                  {savingGroup ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : groupSaved ? <Check className="w-4 h-4 mr-2" /> : <Layers className="w-4 h-4 mr-2" />}
                  {groupSaved ? 'Saved!' : 'Save Group'}
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* VAT & Tax Settings */}
        {currentBusiness && isOwner() && (
          <Card className="bg-[#151528]/80 border-white/5 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">VAT & Tax Settings</h3>
                <p className="text-xs text-slate-500">Configure compliance for {selectedCountry?.label}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl">
                <div>
                  <p className="text-white font-medium text-sm">VAT Registered</p>
                  <p className="text-xs text-slate-500">Enable VAT tracking and filing</p>
                </div>
                <Switch checked={businessForm.vat_registered} onCheckedChange={(v) => setBusinessForm({ ...businessForm, vat_registered: v })} />
              </div>

              {businessForm.vat_registered && (
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-400 mb-1.5 block text-sm">VAT Number *</Label>
                      <Input value={businessForm.vat_number} onChange={(e) => setBusinessForm({ ...businessForm, vat_number: e.target.value })} className="bg-[#0B0B12] border-white/10 text-white text-sm" placeholder="e.g. CY12345678X" />
                    </div>
                    <div>
                      <Label className="text-slate-400 mb-1.5 block text-sm">VAT Quarter Group</Label>
                      <Select value={businessForm.vat_quarter_group} onValueChange={(v) => setBusinessForm({ ...businessForm, vat_quarter_group: v })}>
                        <SelectTrigger className="bg-[#0B0B12] border-white/10 text-white text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1A30] border-white/10">
                          <SelectItem value="A" className="text-white">Group A (Jan/Apr/Jul/Oct)</SelectItem>
                          <SelectItem value="B" className="text-white">Group B (Feb/May/Aug/Nov)</SelectItem>
                          <SelectItem value="C" className="text-white">Group C (Mar/Jun/Sep/Dec)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-400 mb-1.5 block text-sm">Standard VAT Rate</Label>
                      <div className="flex items-center gap-2">
                        <Input type="number" value={businessForm.standard_vat_rate} onChange={(e) => setBusinessForm({ ...businessForm, standard_vat_rate: parseFloat(e.target.value) })} className="bg-[#0B0B12] border-white/10 text-white text-sm" />
                        <span className="text-slate-400 text-sm">%</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-400 mb-1.5 block text-sm">Corporate Tax Rate</Label>
                      <div className="flex items-center gap-2">
                        <Input type="number" value={businessForm.corporate_tax_rate} onChange={(e) => setBusinessForm({ ...businessForm, corporate_tax_rate: parseFloat(e.target.value) })} className="bg-[#0B0B12] border-white/10 text-white text-sm" />
                        <span className="text-slate-400 text-sm">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button onClick={handleSave} disabled={saving} className="mt-2">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Tax Settings
              </Button>
            </div>
          </Card>
        )}

        {/* Billing (Placeholder) */}
        <Card className="bg-[#151528]/80 border-white/5 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Subscription</h3>
              <p className="text-xs text-slate-500">Manage your Setra plan</p>
            </div>
          </div>
          <div className="p-4 bg-white/[0.03] rounded-xl">
            <p className="text-slate-400 text-sm">Billing management coming soon. Contact hello@setra.app to manage your subscription.</p>
          </div>
        </Card>

        {/* Security (Placeholder) */}
        <Card className="bg-[#151528]/80 border-white/5 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Security</h3>
              <p className="text-xs text-slate-500">Protect your account</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-slate-400">🔐 Two-factor authentication coming soon</p>
            <p className="text-slate-400">📜 Login history and active sessions coming soon</p>
            <p className="text-slate-400">🔗 Connected providers — manage OAuth connections coming soon</p>
          </div>
        </Card>

        {/* Notifications (Placeholder) */}
        <Card className="bg-[#151528]/80 border-white/5 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              <p className="text-xs text-slate-500">Configure alerts and digests</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-slate-400">📧 Email digests, real-time alerts, and delivery preferences coming soon</p>
            <p className="text-slate-400">Get weekly summaries, margin alerts, VAT deadline reminders, and more.</p>
          </div>
        </Card>

        {/* Accountant Access (Placeholder) */}
        <Card className="bg-[#151528]/80 border-white/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Your Accountant</h3>
              <p className="text-xs text-slate-500">Invite your accountant to manage all their Setra clients in one place</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm mb-4">
            Your accountant gets read access to bookkeeping, VAT, and P&L data. They see all their Setra clients in one Accountant Portal. You pay; they don't.
          </p>
          <Button variant="outline" size="sm" className="border-white/10 text-slate-300">
            Invite your accountant
          </Button>
        </Card>

        {/* Data Export */}
        <Card className="bg-[#151528]/80 border-white/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Data Export & Privacy</h3>
              <p className="text-xs text-slate-500">Export your data anytime — GDPR Article 20</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm mb-4">
            Your data is yours. Download it any time as CSVs, PDFs, and JSON for import into other software.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="border-white/10 text-slate-300">
              <Download className="w-4 h-4 mr-2" /> Export all data
            </Button>
            <Button variant="outline" size="sm" className="border-white/10 text-slate-300">
              <Download className="w-4 h-4 mr-2" /> Export {currentBusiness?.name} only
            </Button>
          </div>
        </Card>

        {/* Team Management */}
        {currentBusiness && <TeamManagement />}

        {/* Delete Business */}
        {currentBusiness && isOwner() && (
          <Card className="bg-rose-500/5 border-rose-500/30 p-6">
            <h3 className="text-lg font-semibold text-rose-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Delete this Business
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Permanently remove <strong>{currentBusiness.name}</strong> and all its data (invoices, budgets, reports, audit history).
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-rose-500/50 text-rose-400 hover:bg-rose-500/10">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete this business
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#1A1A30] border-rose-500/30">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Delete "{currentBusiness.name}"?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    This will permanently delete all invoices, budgets, reports, and team access for this business. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-3 py-4">
                  <p className="text-sm text-slate-300">
                    Type <strong>{currentBusiness.name}</strong> to confirm:
                  </p>
                  <Input
                    value={deleteBusinessConfirm}
                    onChange={(e) => setDeleteBusinessConfirm(e.target.value)}
                    placeholder={currentBusiness.name}
                    className="bg-[#0B0B12] border-white/10 text-white"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteBusiness}
                    disabled={deleteBusinessConfirm !== currentBusiness.name}
                    className="bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
                  >
                    Delete permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Card>
        )}

        {/* Delete Account */}
        <Card className="bg-rose-500/5 border-rose-500/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <UserX className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-rose-400">Delete My Account</h3>
              <p className="text-xs text-slate-500">Permanently remove your account and all data</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm mb-4">
            This will delete your account ({user?.email}), all {businesses?.length || 1} business(es) you own, and every piece of associated data. This cannot be reversed.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="bg-rose-600 hover:bg-rose-700 text-white" disabled={deletingAccount}>
                {deletingAccount ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserX className="w-4 h-4 mr-2" />}
                Delete my account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#1A1A30] border-rose-500/30">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Delete your entire account?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  This will permanently delete your account, all {businesses?.length || 1} business(es), and all associated data. You will be logged out immediately.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-3 py-4">
                <p className="text-sm text-slate-300">
                  Type <strong>DELETE MY ACCOUNT</strong> to confirm:
                </p>
                <Input
                  value={deleteAccountConfirm}
                  onChange={(e) => setDeleteAccountConfirm(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="bg-[#0B0B12] border-white/10 text-white font-mono"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleteAccountConfirm !== 'DELETE MY ACCOUNT'}
                  className="bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
                >
                  Permanently delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Card>
      </main>
    </div>
  );
}

// Temporary Badge component for multi-venue label
function Badge({ className, children }) {
  return <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${className}`}>{children}</span>;
}

export default function Settings() {
  return <SettingsContent />;
}