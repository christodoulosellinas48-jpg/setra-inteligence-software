import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

// Cyprus 2024/2025 rates
const SI_EMPLOYEE = 0.083;
const SI_EMPLOYER = 0.083;
const GHS_EMPLOYEE = 0.0265;
const GHS_EMPLOYER = 0.029;
const COHESION_EMPLOYER = 0.02;
const TRAINING_EMPLOYER = 0.005;

function computePAYE(annualGross) {
  let tax = 0;
  const bands = [
    { up: 19500, rate: 0 },
    { up: 28000, rate: 0.20 },
    { up: 36300, rate: 0.25 },
    { up: 60000, rate: 0.30 },
    { up: Infinity, rate: 0.35 },
  ];
  let prev = 0;
  for (const band of bands) {
    if (annualGross <= prev) break;
    const taxable = Math.min(annualGross, band.up) - prev;
    tax += taxable * band.rate;
    prev = band.up;
  }
  return tax / 12; // monthly
}

export default function CyprusTaxBreakdown({ contract }) {
  const [open, setOpen] = useState(false);

  const gross = contract.contract_type === 'monthly'
    ? (contract.monthly_salary || 0)
    : 0; // hourly: would need hours

  if (gross === 0) return null;

  const siEmployee = gross * SI_EMPLOYEE;
  const ghsEmployee = gross * GHS_EMPLOYEE;
  const paye = computePAYE(gross * 12);
  const netPay = gross - siEmployee - ghsEmployee - paye;

  const siEmployer = gross * SI_EMPLOYER;
  const ghsEmployer = gross * GHS_EMPLOYER;
  const cohesion = gross * COHESION_EMPLOYER;
  const training = gross * TRAINING_EMPLOYER;
  const totalCost = gross + siEmployer + ghsEmployer + cohesion + training;

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-xs text-[#C084FC] hover:text-[#A855F7] transition-colors"
      >
        <Info className="w-3.5 h-3.5" />
        Cyprus tax breakdown (estimated)
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <Card className="mt-2 p-4 bg-[#0B0B12]/80 border-[#7B3BFF]/20 text-xs space-y-3">
          <p className="text-slate-400 font-medium">{contract.employee_name} — Monthly estimate</p>

          <div className="space-y-1">
            <div className="flex justify-between text-slate-300">
              <span>Gross salary</span>
              <span className="font-mono">€{gross.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-rose-400">
              <span>– Social Insurance (8.3%)</span>
              <span className="font-mono">–€{siEmployee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-rose-400">
              <span>– GHS/GeSY (2.65%)</span>
              <span className="font-mono">–€{ghsEmployee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-rose-400">
              <span>– PAYE (estimated)</span>
              <span className="font-mono">–€{paye.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-400 font-semibold border-t border-white/10 pt-1 mt-1">
              <span>Net pay</span>
              <span className="font-mono">€{netPay.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-white/10 pt-2 space-y-1">
            <p className="text-slate-500 uppercase tracking-wide text-[10px] mb-1">Employer costs (above gross)</p>
            <div className="flex justify-between text-amber-400/80">
              <span>+ Social Insurance (8.3%)</span>
              <span className="font-mono">€{siEmployer.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-amber-400/80">
              <span>+ GHS/GeSY (2.9%)</span>
              <span className="font-mono">€{ghsEmployer.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-amber-400/80">
              <span>+ Cohesion Fund (2%)</span>
              <span className="font-mono">€{cohesion.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-amber-400/80">
              <span>+ Industrial Training (0.5%)</span>
              <span className="font-mono">€{training.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white font-semibold border-t border-white/10 pt-1 mt-1">
              <span>Total cost to business</span>
              <span className="font-mono">€{totalCost.toFixed(2)}</span>
            </div>
          </div>

          <p className="text-slate-600 text-[10px] leading-relaxed border-t border-white/5 pt-2">
            Estimates use Cyprus 2025 rates. PAYE uses standard progressive bands; actual tax depends on marital status, dependents, and exemptions. Always verify with a licensed Cyprus payroll provider.
          </p>
        </Card>
      )}
    </div>
  );
}