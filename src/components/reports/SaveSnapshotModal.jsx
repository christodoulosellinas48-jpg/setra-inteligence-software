import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Save, Loader2, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const FIELDS = [
  { key: 'monthly_revenue',    label: 'Monthly Revenue',    placeholder: '0.00' },
  { key: 'total_covers',       label: 'Total Covers',       placeholder: '0' },
  { key: 'days_open',          label: 'Days Open',          placeholder: '0' },
  { key: 'average_ticket',     label: 'Avg Ticket (€)',     placeholder: '0.00' },
  { key: 'rent_fixed_costs',   label: 'Rent & Fixed',       placeholder: '0.00' },
  { key: 'staff_costs',        label: 'Staff Costs',        placeholder: '0.00' },
  { key: 'purchases_food_bev', label: 'Food & Beverage',    placeholder: '0.00' },
  { key: 'utilities',          label: 'Utilities',          placeholder: '0.00' },
  { key: 'other_operating',    label: 'Other Operating',    placeholder: '0.00' },
];

export default function SaveSnapshotModal({ open, onClose, business, userEmail, onSaved, prefillSnapshot = null }) {
  const currentYear = new Date().getFullYear();

  // If editing an existing snapshot, parse its period
  const initYear = prefillSnapshot?.period_start
    ? new Date(prefillSnapshot.period_start).getUTCFullYear()
    : currentYear;
  const initMonth = prefillSnapshot?.period_start
    ? new Date(prefillSnapshot.period_start).getUTCMonth()
    : new Date().getMonth();

  const [selectedYear, setSelectedYear] = useState(initYear);
  const [selectedMonth, setSelectedMonth] = useState(initMonth);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState(prefillSnapshot?.id || null);
  const [loadingExisting, setLoadingExisting] = useState(false);

  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  // Reset internal state when modal opens / prefillSnapshot changes
  useEffect(() => {
    if (!open) return;
    if (prefillSnapshot) {
      const d = new Date(prefillSnapshot.period_start);
      setSelectedYear(d.getUTCFullYear());
      setSelectedMonth(d.getUTCMonth());
      setExistingId(prefillSnapshot.id);
      const prefill = {};
      FIELDS.forEach(f => { if (prefillSnapshot[f.key] !== undefined) prefill[f.key] = prefillSnapshot[f.key]; });
      setValues(prefill);
    } else {
      setSelectedYear(currentYear);
      setSelectedMonth(new Date().getMonth());
      setExistingId(null);
      setValues({});
    }
  }, [open, prefillSnapshot]);

  // When month/year changes (and not editing a fixed snapshot), check for existing
  useEffect(() => {
    if (!open || !business || prefillSnapshot) return;
    const load = async () => {
      setLoadingExisting(true);
      const periodStart = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
      try {
        const all = await base44.entities.FinancialSnapshot.filter({ business_id: business.id }, '-period_start', 100);
        const match = all.find(s => s.period_start === periodStart);
        if (match) {
          setExistingId(match.id);
          const prefill = {};
          FIELDS.forEach(f => { if (match[f.key] !== undefined) prefill[f.key] = match[f.key]; });
          setValues(prefill);
        } else {
          setExistingId(null);
          setValues({
            monthly_revenue:    business.monthly_revenue    || '',
            rent_fixed_costs:   business.rent_fixed_costs   || '',
            staff_costs:        business.staff_costs        || '',
            purchases_food_bev: business.purchases_food_bev || '',
            utilities:          business.utilities          || '',
            other_operating:    business.other_operating    || '',
          });
        }
      } catch {
        setExistingId(null);
        setValues({});
      } finally {
        setLoadingExisting(false);
      }
    };
    load();
  }, [open, business, selectedYear, selectedMonth, prefillSnapshot]);

  const handleSave = async () => {
    if (!business) return;
    setSaving(true);
    const periodStart = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
    const periodEnd = endOfMonth(new Date(selectedYear, selectedMonth, 1)).toISOString().split('T')[0];

    const numericValues = {};
    FIELDS.forEach(f => {
      const v = parseFloat(values[f.key]);
      if (!isNaN(v)) numericValues[f.key] = v;
    });

    // Calculate net profit if we have the data
    const rev = numericValues.monthly_revenue || 0;
    const totalCosts = (numericValues.rent_fixed_costs || 0)
      + (numericValues.staff_costs || 0)
      + (numericValues.purchases_food_bev || 0)
      + (numericValues.utilities || 0)
      + (numericValues.other_operating || 0);
    const netProfit = rev - totalCosts;
    const profitMargin = rev > 0 ? (netProfit / rev) * 100 : 0;

    const payload = {
      business_id: business.id,
      period_start: periodStart,
      period_end: periodEnd,
      period_type: 'monthly',
      ...numericValues,
      net_profit: netProfit,
      profit_margin: profitMargin,
      created_by_email: userEmail || '',
    };

    if (existingId) {
      await base44.entities.FinancialSnapshot.update(existingId, payload);
    } else {
      await base44.entities.FinancialSnapshot.create(payload);
    }
    setSaving(false);
    onSaved?.();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#151528] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-xl bg-[#7B3BFF]/15 flex items-center justify-center">
            <Save className="w-4.5 h-4.5 text-[#C084FC]" style={{ width: '1.1rem', height: '1.1rem' }} />
          </div>
          <div>
            <h3 className="text-white font-semibold text-base">Save Snapshot</h3>
            <p className="text-slate-500 text-xs">{business?.name}</p>
          </div>
        </div>

        {/* Month / Year picker */}
        <div className="mb-5">
          <p className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Select Period
          </p>
          {/* Year selector */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {years.map(y => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedYear === y
                    ? 'bg-[#7B3BFF] text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
          {/* Month grid */}
          <div className="grid grid-cols-6 gap-1.5">
            {MONTHS.map((m, i) => (
              <button
                key={m}
                onClick={() => setSelectedMonth(i)}
                className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedMonth === i
                    ? 'bg-[#7B3BFF] text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            {existingId ? (
              <span className="text-amber-400">⚠ Snapshot exists for this period — saving will update it</span>
            ) : (
              <span className="text-slate-500">New snapshot for {MONTH_NAMES[selectedMonth]} {selectedYear}</span>
            )}
          </p>
        </div>

        {/* Fields */}
        {loadingExisting ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 text-[#C084FC] animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-5">
            {FIELDS.map(f => (
              <div key={f.key}>
                <label className="text-xs text-slate-400 mb-1 block">{f.label}</label>
                <Input
                  type="number"
                  placeholder={f.placeholder}
                  value={values[f.key] ?? ''}
                  onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                  className="bg-[#0F0F1E] border-white/10 text-white h-9 text-sm"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={saving || loadingExisting} className="flex-1 gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {existingId ? 'Update Snapshot' : 'Save Snapshot'}
          </Button>
        </div>
      </div>
    </div>
  );
}