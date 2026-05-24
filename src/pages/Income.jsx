import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useBusiness } from '@/components/business/BusinessContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Plus, RefreshCw, Calendar, Edit2, Trash2, UploadCloud } from 'lucide-react';
import { motion } from 'framer-motion';
import SaveSnapshotModal from '@/components/reports/SaveSnapshotModal';
import MassUploadSnapshotsModal from '@/components/reports/MassUploadSnapshotsModal';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Income() {
  const { currentBusiness, user, loading: businessLoading } = useBusiness();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showMassUpload, setShowMassUpload] = useState(false);
  const [editSnapshot, setEditSnapshot] = useState(null);

  const { data: snapshots = [], refetch, isLoading } = useQuery({
    queryKey: ['financialSnapshots', currentBusiness?.id],
    queryFn: () => base44.entities.FinancialSnapshot.filter(
      { business_id: currentBusiness.id },
      '-period_start',
      60
    ),
    enabled: !!currentBusiness,
    staleTime: 2 * 60 * 1000,
  });

  const handleDelete = async (id) => {
    if (!confirm('Delete this income snapshot?')) return;
    await base44.entities.FinancialSnapshot.delete(id);
    refetch();
  };

  const handleEdit = (snapshot) => {
    setEditSnapshot(snapshot);
    setShowModal(true);
  };

  const handleSaved = () => {
    refetch();
    queryClient.invalidateQueries(['financialSnapshots', currentBusiness?.id]);
    setEditSnapshot(null);
  };

  const totalRevenue = snapshots.reduce((s, sn) => s + (sn.monthly_revenue || 0), 0);
  const avgRevenue = snapshots.length > 0 ? totalRevenue / snapshots.length : 0;
  const bestMonth = snapshots.length > 0
    ? snapshots.reduce((a, b) => (a.monthly_revenue || 0) > (b.monthly_revenue || 0) ? a : b)
    : null;

  if (businessLoading || !currentBusiness) {
    return (
      <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#7B3BFF] animate-spin" />
      </div>
    );
  }

  const formatPeriod = (start) => {
    if (!start) return '—';
    const d = new Date(start);
    return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  };

  return (
    <div className="min-h-screen bg-[#0B0B12]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-[#C084FC]" />
              Income
            </h1>
            <p className="text-slate-500 text-sm mt-1">{currentBusiness.name} · Monthly revenue snapshots</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowMassUpload(true)}>
              <UploadCloud className="w-4 h-4 mr-2" />
              Mass Upload
            </Button>
            <Button onClick={() => { setEditSnapshot(null); setShowModal(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Income Record
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        {snapshots.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-[#151528]/80 border-white/5 p-5">
              <p className="text-xs text-slate-500 mb-1">Total Revenue Recorded</p>
              <p className="text-2xl font-bold text-emerald-400">€{totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1">{snapshots.length} months</p>
            </Card>
            <Card className="bg-[#151528]/80 border-white/5 p-5">
              <p className="text-xs text-slate-500 mb-1">Monthly Average</p>
              <p className="text-2xl font-bold text-white">€{Math.round(avgRevenue).toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1">across all recorded months</p>
            </Card>
            <Card className="bg-[#151528]/80 border-white/5 p-5">
              <p className="text-xs text-slate-500 mb-1">Best Month</p>
              <p className="text-2xl font-bold text-[#C084FC]">€{(bestMonth?.monthly_revenue || 0).toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1">{bestMonth ? formatPeriod(bestMonth.period_start) : '—'}</p>
            </Card>
          </div>
        )}

        {/* Snapshots table */}
        <Card className="bg-[#151528]/80 border-white/5 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Income Records</h3>
            <Badge className="bg-[#7B3BFF]/15 text-[#C084FC] border-[#7B3BFF]/20 border text-xs">
              {snapshots.length} records
            </Badge>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-6 h-6 text-[#7B3BFF] animate-spin" />
            </div>
          ) : snapshots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-full bg-[#7B3BFF]/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#C084FC]" />
              </div>
              <p className="text-slate-400 text-sm font-medium">No income records yet</p>
              <p className="text-slate-600 text-xs">Add a record manually or use Smart Upload with an Income Report PDF</p>
              <Button size="sm" onClick={() => setShowModal(true)} className="mt-2">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add First Record
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0B0B12]/40">
                    {['Period', 'Revenue', 'Covers', 'Avg Ticket', 'Days Open', 'Net Profit', 'Margin', ''].map(h => (
                      <th key={h} className={`py-3 px-4 text-xs text-slate-500 font-medium ${!h || h === 'Period' ? 'text-left' : 'text-right'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((sn, idx) => (
                    <motion.tr
                      key={sn.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-white/5 hover:bg-white/5 group"
                    >
                      <td className="py-3 px-4 text-slate-200 font-medium">{formatPeriod(sn.period_start)}</td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-mono font-semibold">
                        €{(sn.monthly_revenue || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 font-mono">
                        {sn.total_covers ? sn.total_covers.toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 font-mono">
                        {sn.average_ticket ? `€${sn.average_ticket.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 font-mono">
                        {sn.days_open || '—'}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono ${(sn.net_profit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {sn.net_profit !== undefined && sn.net_profit !== null ? `€${(sn.net_profit).toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400">
                        {sn.profit_margin !== undefined && sn.profit_margin !== null ? `${sn.profit_margin.toFixed(1)}%` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(sn)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(sn.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <MassUploadSnapshotsModal
        open={showMassUpload}
        onClose={() => setShowMassUpload(false)}
        business={currentBusiness}
        userEmail={user?.email}
        onSaved={() => { refetch(); queryClient.invalidateQueries(['financialSnapshots', currentBusiness?.id]); }}
      />

      <SaveSnapshotModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditSnapshot(null); }}
        business={currentBusiness}
        userEmail={user?.email}
        onSaved={handleSaved}
        prefillSnapshot={editSnapshot}
      />
    </div>
  );
}