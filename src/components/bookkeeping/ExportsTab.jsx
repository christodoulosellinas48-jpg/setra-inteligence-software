import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, AlertCircle } from 'lucide-react';

export default function ExportsTab({ businessId, business }) {
  // Fetch audit packs
  const { data: auditPacks = [] } = useQuery({
    queryKey: ['auditPacks', businessId],
    queryFn: () => base44.entities.AuditPack.filter({ business_id: businessId }, '-created_date')
  });

  return (
    <div className="space-y-6">
      {/* Ltd Compliance Notice */}
      {business.entity_type === 'ltd' && (
        <Card className="bg-amber-500/10 border-amber-500/30 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-300 mb-1">Limited Company Notice</h3>
              <p className="text-sm text-amber-400/80">
                This app produces audit packs and supporting documents. Statutory audited financial statements 
                and official filings require licensed auditor sign-off.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-900/50 border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">VAT Period Export</h3>
              <p className="text-sm text-slate-500">Summary by rate + documents</p>
            </div>
          </div>
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Export VAT Period
          </Button>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Annual Audit Pack</h3>
              <p className="text-sm text-slate-500">Full ledger + trial balance</p>
            </div>
          </div>
          <Button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg shadow-cyan-500/25">
            <Download className="w-4 h-4 mr-2" />
            Generate Audit Pack
          </Button>
        </Card>
      </div>

      {/* Previous Audit Packs */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Generated Audit Packs</h3>
        
        {auditPacks.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-800 p-8 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No audit packs generated yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {auditPacks.map((pack, idx) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="bg-slate-900/50 border-slate-800 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-slate-400" />
                      <div>
                        <h4 className="font-medium text-white">Year {pack.year} Audit Pack</h4>
                        <p className="text-sm text-slate-500">
                          Generated: {new Date(pack.created_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={pack.status === 'ready' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}>
                        {pack.status}
                      </Badge>
                      {pack.pack_url && (
                        <Button 
                          variant="outline" 
                          onClick={() => window.open(pack.pack_url, '_blank')}
                          className="border-slate-700"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
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