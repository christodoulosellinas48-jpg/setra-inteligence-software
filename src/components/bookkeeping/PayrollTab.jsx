import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, ExternalLink, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PayrollTab({ businessId }) {
  const navigate = useNavigate();

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts-readonly', businessId],
    queryFn: () => base44.entities.EmployeeContract.filter({ business_id: businessId }),
    enabled: !!businessId,
  });

  const active = contracts.filter(c => c.status === 'active');
  const totalSalaries = active.filter(c => c.contract_type === 'monthly').reduce((s, c) => s + (c.monthly_salary || 0), 0);
  const totalCost = Math.round(totalSalaries * 1.127);

  return (
    <div className="space-y-5">
      {/* Accountant Note */}
      <div className="flex items-start gap-3 p-4 bg-[#7B3BFF]/8 border border-[#7B3BFF]/20 rounded-xl text-sm">
        <Users className="w-4 h-4 text-[#C084FC] mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-slate-300 font-medium">Payroll — read-only accountant view</p>
          <p className="text-slate-500 text-xs mt-0.5">
            This shows payroll data for bookkeeping reference. To manage employees or run payroll, use the dedicated Payroll page.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => navigate('/Payroll')} className="gap-1.5 text-xs flex-shrink-0">
          Open Payroll <ExternalLink className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="flex justify-center py-10"><RefreshCw className="w-5 h-5 text-[#7B3BFF] animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Card className="p-4 bg-[#151528]/80 border-white/5">
              <p className="text-slate-500 text-xs mb-1">Active employees</p>
              <p className="text-2xl font-bold text-white">{active.length}</p>
            </Card>
            <Card className="p-4 bg-[#151528]/80 border-white/5">
              <p className="text-slate-500 text-xs mb-1">Gross salaries/mo</p>
              <p className="text-2xl font-bold text-white">€{totalSalaries.toLocaleString()}</p>
            </Card>
            <Card className="p-4 bg-[#151528]/80 border-white/5">
              <p className="text-slate-500 text-xs mb-1">Est. total employer cost</p>
              <p className="text-2xl font-bold text-amber-400">€{totalCost.toLocaleString()}</p>
            </Card>
          </div>

          {active.length > 0 && (
            <Card className="bg-[#151528]/80 border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#0B0B12]/40">
                      {['Employee', 'Role', 'Type', 'Gross/mo', 'Est. employer cost'].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {active.map(c => (
                      <tr key={c.id} className="border-b border-white/5">
                        <td className="px-4 py-2.5 text-white font-medium">{c.employee_name}</td>
                        <td className="px-4 py-2.5 text-slate-400 capitalize">{c.role}</td>
                        <td className="px-4 py-2.5">
                          <Badge className="bg-[#7B3BFF]/15 text-[#C084FC] border-[#7B3BFF]/20 text-xs capitalize">{c.contract_type}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-white font-mono">
                          {c.contract_type === 'monthly' ? `€${(c.monthly_salary || 0).toLocaleString()}` : `€${c.hourly_rate}/hr`}
                        </td>
                        <td className="px-4 py-2.5 text-amber-400 font-mono">
                          {c.contract_type === 'monthly' ? `€${Math.round((c.monthly_salary || 0) * 1.127).toLocaleString()}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}