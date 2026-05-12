import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FileText, Download, AlertCircle, Send, CheckCircle2, Loader2 } from 'lucide-react';

function SendToAccountantButton({ label, onSend }) {
  const [email, setEmail] = useState('');
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email) return;
    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: `Setra Export: ${label}`,
        body: `Your client has shared a ${label} export via Setra. Please log in to Setra to download the file.\n\nThis was sent on behalf of your client.`,
      });
      setSent(true);
      setTimeout(() => { setSent(false); setOpen(false); setEmail(''); }, 2500);
    } catch (_) {}
    setSending(false);
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5 text-xs">
        <Send className="w-3.5 h-3.5" /> Send to accountant
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="email"
        placeholder="accountant@firm.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="bg-[#0B0B12] border-white/10 text-white text-xs h-8 w-48"
        autoFocus
      />
      <Button size="sm" onClick={handleSend} disabled={sending || !email} className="h-8 text-xs gap-1">
        {sent ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />Sent!</>
          : sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <><Send className="w-3 h-3" />Send</>}
      </Button>
      <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white text-xs transition-colors">✕</button>
    </div>
  );
}

export default function ExportsTab({ businessId, business }) {
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
            <div>
              <h3 className="font-semibold text-amber-300 mb-1">Limited Company Notice</h3>
              <p className="text-sm text-amber-400/80">
                Setra produces audit-ready supporting documents. Statutory audited financial statements and official filings require licensed auditor sign-off.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* VAT Period Export */}
        <Card className="bg-[#151528]/80 border-white/5 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">VAT Period Export</h3>
              <p className="text-sm text-slate-500">Summary by rate + supporting documents</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button size="sm" className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700">
              <Download className="w-3.5 h-3.5" /> Download CSV
            </Button>
            <SendToAccountantButton label="VAT Period Export" />
          </div>
        </Card>

        {/* Annual Audit Pack */}
        <Card className="bg-[#151528]/80 border-white/5 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Annual Audit Pack</h3>
              <p className="text-sm text-slate-500">Full ledger, trial balance, P&L, VAT summaries</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Includes: cover page · general journal · trial balance · P&L · VAT period summaries · bank reconciliation status · open items
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="gap-1.5 text-xs bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-90">
              <Download className="w-3.5 h-3.5" /> Generate Audit Pack
            </Button>
            <SendToAccountantButton label="Annual Audit Pack" />
          </div>
        </Card>
      </div>

      {/* P&L Export */}
      <Card className="bg-[#151528]/80 border-white/5 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7B3BFF]/15 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#C084FC]" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Profit & Loss Statement</h3>
              <p className="text-slate-500 text-xs">Monthly or annual P&L with expense breakdown</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" /> Download CSV
            </Button>
            <SendToAccountantButton label="P&L Statement" />
          </div>
        </div>
      </Card>

      {/* Previous Audit Packs */}
      <div>
        <h3 className="text-base font-semibold text-white mb-3">Generated Audit Packs</h3>
        {auditPacks.length === 0 ? (
          <Card className="bg-[#151528]/80 border-white/5 p-8 text-center">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No audit packs generated yet.</p>
            <p className="text-slate-600 text-xs mt-1">Generate your first one above — it becomes the deliverable your accountant works from.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {auditPacks.map((pack, idx) => (
              <motion.div key={pack.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card className="bg-[#151528]/80 border-white/5 p-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <FileText className="w-7 h-7 text-slate-400" />
                      <div>
                        <h4 className="font-medium text-white text-sm">Year {pack.year} Audit Pack</h4>
                        <p className="text-xs text-slate-500">Generated: {new Date(pack.created_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={pack.status === 'ready' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}>
                        {pack.status === 'ready' ? <><CheckCircle2 className="w-3 h-3 mr-1" />Ready</> : pack.status}
                      </Badge>
                      {pack.pack_url && (
                        <Button variant="outline" size="sm" onClick={() => window.open(pack.pack_url, '_blank')} className="gap-1.5 text-xs">
                          <Download className="w-3.5 h-3.5" /> Download
                        </Button>
                      )}
                      <SendToAccountantButton label={`Year ${pack.year} Audit Pack`} />
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