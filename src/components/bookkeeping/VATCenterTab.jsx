import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Percent, AlertCircle, Calendar, FileText } from 'lucide-react';

export default function VATCenterTab({ businessId, business }) {
  // Fetch VAT periods
  const { data: vatPeriods = [] } = useQuery({
    queryKey: ['vatPeriods', businessId],
    queryFn: () => base44.entities.VATPeriod.filter({ business_id: businessId }, '-period_start')
  });

  if (!business.vat_registered) {
    return (
      <Card className="bg-slate-900/50 border-slate-800 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">VAT Not Registered</h2>
        <p className="text-slate-400 mb-6">
          Enable VAT registration in business settings to use VAT features.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compliance Notice */}
      <Card className="bg-blue-500/10 border-blue-500/30 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-300 mb-1">Cyprus VAT Compliance</h3>
            <p className="text-sm text-blue-400/80">
              Quarterly filing • 10th of 2nd month after period end • 6-year records retention required
            </p>
            <p className="text-xs text-blue-400/60 mt-2">
              VAT Quarter Group: {business.vat_quarter_group || 'Not set'} • 
              VAT Number: {business.vat_number || 'Not set'}
            </p>
          </div>
        </div>
      </Card>

      {/* VAT Periods */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">VAT Periods</h3>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Calendar className="w-4 h-4 mr-2" />
            Create New Period
          </Button>
        </div>

        {vatPeriods.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-800 p-8 text-center">
            <Percent className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No VAT periods created yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {vatPeriods.map((period, idx) => (
              <motion.div
                key={period.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="bg-slate-900/50 border-slate-800 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-white">
                          {new Date(period.period_start).toLocaleDateString()} - {new Date(period.period_end).toLocaleDateString()}
                        </h4>
                        <Badge className={
                          period.status === 'final' ? 'bg-slate-500/10 text-slate-400' :
                          period.status === 'review' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-green-500/10 text-green-400'
                        }>
                          {period.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">
                        Deadline: {new Date(period.filing_deadline).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">Output VAT</p>
                          <p className="font-semibold text-white">€{period.output_vat?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Input VAT</p>
                          <p className="font-semibold text-white">€{period.input_vat?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Net Payable</p>
                          <p className="font-semibold text-emerald-400">€{period.net_vat_payable?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                    </div>

                    <Button variant="outline" className="ml-4 border-slate-700">
                      <FileText className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}