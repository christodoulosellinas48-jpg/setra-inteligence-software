import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, HelpCircle } from 'lucide-react';

const BUSINESS_TYPES = [
  { value: 'coffee_shop', label: 'Café' },
  { value: 'bar', label: 'Bar' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'food_to_go', label: 'Food to Go' },
  { value: 'hotels', label: 'Hotel F&B' },
  { value: 'catering_events', label: 'Catering' },
  { value: 'other', label: 'Other' },
];

const VENUE_OPTIONS = [
  { value: '1', label: 'Just 1 venue' },
  { value: '2-5', label: '2–5 venues' },
  { value: '6+', label: '6+ venues' },
];

export default function StepBusinessDetails({ onNext, onSkip }) {
  const [form, setForm] = useState({
    name: '',
    industry_group: '',
    venues: '1',
    vat_registered: false,
    vat_rate: 19,
    currency: 'EUR',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const canContinue = form.name.trim() && form.industry_group;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-lg mx-auto w-full"
    >
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">Tell us about your business</h2>
      <p className="text-slate-400 text-sm text-center mb-8">You can change any of this later in Settings.</p>

      <div className="space-y-5">
        {/* Business name */}
        <div>
          <Label className="text-slate-300 text-sm mb-1.5 block">Business name</Label>
          <Input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. The Blue Door Café"
            className="bg-[#151528] border-[#2A2A3A] text-white placeholder:text-slate-600 focus:border-[#7B3BFF]"
          />
        </div>

        {/* Business type */}
        <div>
          <Label className="text-slate-300 text-sm mb-1.5 block">What type of venue?</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {BUSINESS_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => set('industry_group', t.value)}
                className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all duration-150 ${
                  form.industry_group === t.value
                    ? 'bg-[#7B3BFF]/20 border-[#7B3BFF] text-white'
                    : 'bg-[#151528] border-[#2A2A3A] text-slate-400 hover:border-[#7B3BFF]/40'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Number of venues */}
        <div>
          <Label className="text-slate-300 text-sm mb-1.5 block">How many venues?</Label>
          <div className="flex gap-2">
            {VENUE_OPTIONS.map(v => (
              <button
                key={v.value}
                onClick={() => set('venues', v.value)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all duration-150 ${
                  form.venues === v.value
                    ? 'bg-[#7B3BFF]/20 border-[#7B3BFF] text-white'
                    : 'bg-[#151528] border-[#2A2A3A] text-slate-400 hover:border-[#7B3BFF]/40'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Currency */}
        <div>
          <Label className="text-slate-300 text-sm mb-1.5 block">Currency</Label>
          <div className="flex gap-2">
            {['EUR', 'USD', 'GBP'].map(c => (
              <button
                key={c}
                onClick={() => set('currency', c)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all duration-150 ${
                  form.currency === c
                    ? 'bg-[#7B3BFF]/20 border-[#7B3BFF] text-white'
                    : 'bg-[#151528] border-[#2A2A3A] text-slate-400 hover:border-[#7B3BFF]/40'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* VAT */}
        <div className="flex items-center justify-between bg-[#151528] border border-[#2A2A3A] rounded-xl p-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 text-sm">VAT registered?</span>
            <span className="group relative cursor-pointer">
              <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
              <span className="absolute left-5 top-0 bg-[#2A2A3A] text-xs text-slate-300 p-2 rounded-lg w-48 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                Needed for VAT period management and compliance reports.
              </span>
            </span>
          </div>
          <div className="flex gap-2">
            {['Yes', 'No'].map(opt => (
              <button
                key={opt}
                onClick={() => set('vat_registered', opt === 'Yes')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 ${
                  (opt === 'Yes') === form.vat_registered
                    ? 'bg-[#7B3BFF]/20 border-[#7B3BFF] text-white'
                    : 'bg-transparent border-[#2A2A3A] text-slate-500 hover:border-[#7B3BFF]/40'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {form.vat_registered && (
          <div>
            <Label className="text-slate-300 text-sm mb-1.5 block">VAT rate (%)</Label>
            <Input
              type="number"
              value={form.vat_rate}
              onChange={e => set('vat_rate', Number(e.target.value))}
              className="bg-[#151528] border-[#2A2A3A] text-white focus:border-[#7B3BFF] w-32"
            />
            <p className="text-xs text-slate-600 mt-1">Cyprus standard rate: 19%</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-8">
        <Button onClick={() => onNext(form)} disabled={!canContinue} className="flex-1 py-5">
          Next
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
        <Button variant="ghost" onClick={onSkip} className="text-slate-500 hover:text-slate-300">
          Skip for now
        </Button>
      </div>
    </motion.div>
  );
}