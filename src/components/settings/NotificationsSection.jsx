import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Loader2, Check, Smartphone } from 'lucide-react';

const ALERT_ROWS = [
  { key: 'vat_deadline',      label: 'VAT deadline reminders' },
  { key: 'payroll_deadline',  label: 'Payroll deadline reminders' },
  { key: 'price_spike',       label: 'Price spike alerts (supplier costs)' },
  { key: 'low_stock',         label: 'Low stock alerts' },
  { key: 'missing_recipe',    label: 'Missing recipe alerts' },
  { key: 'margin_alert',      label: 'Margin alerts (dishes below threshold)' },
  { key: 'weekly_digest',     label: 'Weekly business digest' },
  { key: 'monthly_summary',   label: 'Monthly business summary' },
];

const DEFAULT_PREFS = Object.fromEntries(
  ALERT_ROWS.map(r => [r.key, {
    in_app: true,
    email: r.key === 'weekly_digest',
  }])
);

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const HOURS = [
  { value: 7, label: '7:00 AM' },
  { value: 8, label: '8:00 AM' },
  { value: 9, label: '9:00 AM' },
  { value: 10, label: '10:00 AM' },
  { value: 18, label: '6:00 PM' },
  { value: 19, label: '7:00 PM' },
];

export default function NotificationsSection({ user, businessId }) {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [digestDay, setDigestDay] = useState('Monday');
  const [digestHour, setDigestHour] = useState(9);
  const [recordId, setRecordId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user?.id || !businessId) return;
    base44.entities.NotificationPreference.filter({ user_id: user.id, business_id: businessId })
      .then(rows => {
        if (rows.length > 0) {
          const r = rows[0];
          setRecordId(r.id);
          if (r.prefs_json) {
            try { setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(r.prefs_json) }); } catch {}
          }
          if (r.digest_day) setDigestDay(r.digest_day);
          if (r.digest_hour != null) setDigestHour(r.digest_hour);
        }
      })
      .catch(() => {});
  }, [user?.id, businessId]);

  const toggle = (key, channel) => {
    setPrefs(p => ({ ...p, [key]: { ...p[key], [channel]: !p[key][channel] } }));
  };

  const handleSave = async () => {
    if (!user?.id || !businessId) return;
    setSaving(true);
    const data = { user_id: user.id, business_id: businessId, prefs_json: JSON.stringify(prefs), digest_day: digestDay, digest_hour: digestHour };
    if (recordId) {
      await base44.entities.NotificationPreference.update(recordId, data);
    } else {
      const r = await base44.entities.NotificationPreference.create(data);
      setRecordId(r.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Toggle table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.07] bg-white/[0.02]">
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Alert type</th>
              <th className="text-center px-4 py-3 text-slate-400 font-medium w-20">In-app</th>
              <th className="text-center px-4 py-3 text-slate-400 font-medium w-20">Email</th>
              <th className="text-center px-4 py-3 text-slate-400 font-medium w-24">
                <span className="flex items-center justify-center gap-1">
                  <Smartphone className="w-3 h-3" /> Push
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {ALERT_ROWS.map((row, i) => (
              <tr key={row.key} className={`border-b border-white/[0.04] ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                <td className="px-4 py-3 text-white">{row.label}</td>
                <td className="px-4 py-3 text-center">
                  <Switch checked={prefs[row.key]?.in_app ?? true} onCheckedChange={() => toggle(row.key, 'in_app')} />
                </td>
                <td className="px-4 py-3 text-center">
                  <Switch checked={prefs[row.key]?.email ?? false} onCheckedChange={() => toggle(row.key, 'email')} />
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="relative inline-block group">
                    <Switch checked={false} disabled className="opacity-30 cursor-not-allowed" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 bg-[#1A1A30] border border-white/10 text-slate-300 text-xs rounded-lg px-2 py-1 whitespace-nowrap">
                      Mobile app coming soon
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Digest delivery time */}
      <div className="p-4 bg-white/[0.03] rounded-xl space-y-3">
        <p className="text-sm font-medium text-white">Digest delivery time</p>
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={digestDay} onValueChange={setDigestDay}>
            <SelectTrigger className="bg-[#0B0B12] border-white/10 text-white w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A30] border-white/10">
              {DAYS.map(d => <SelectItem key={d} value={d} className="text-white">{d}s</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-slate-500 text-sm">at</span>
          <Select value={String(digestHour)} onValueChange={v => setDigestHour(Number(v))}>
            <SelectTrigger className="bg-[#0B0B12] border-white/10 text-white w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A30] border-white/10">
              {HOURS.map(h => <SelectItem key={h.value} value={String(h.value)} className="text-white">{h.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="bg-[#7B3BFF] hover:bg-[#6d2ff7]">
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : saved ? <Check className="w-4 h-4 mr-2" /> : null}
        {saved ? 'Saved!' : 'Save preferences'}
      </Button>
    </div>
  );
}