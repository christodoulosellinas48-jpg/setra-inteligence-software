import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react';

function VarianceBadge({ variance, unit }) {
  if (variance === 0) return <span className="text-slate-500 text-xs">No variance</span>;
  const isNeg = variance < 0;
  return (
    <span className={`text-xs font-mono font-medium ${isNeg ? 'text-rose-400' : 'text-emerald-400'}`}>
      {isNeg ? '' : '+'}{variance.toFixed(2)} {unit}
    </span>
  );
}

export default function StockTakeModal({ open, onClose, items, businessId }) {
  const qc = useQueryClient();
  const [step, setStep] = useState(1); // 1=count, 2=review
  const [counts, setCounts] = useState({});
  const [notes, setNotes] = useState({});

  const variances = useMemo(() => {
    return items.map(item => {
      const counted = counts[item.id] !== undefined ? parseFloat(counts[item.id]) : null;
      const variance = counted !== null ? counted - item.current_stock : null;
      return { ...item, counted, variance };
    });
  }, [items, counts]);

  const topVariances = useMemo(() => {
    return variances
      .filter(v => v.variance !== null && v.variance !== 0)
      .sort((a, b) => Math.abs(b.variance * b.unit_cost) - Math.abs(a.variance * a.unit_cost))
      .slice(0, 5);
  }, [variances]);

  const totalVarianceCost = useMemo(() => {
    return variances.reduce((sum, v) => {
      if (v.variance === null) return sum;
      return sum + Math.abs(v.variance * (v.unit_cost || 0));
    }, 0);
  }, [variances]);

  const countedCount = Object.keys(counts).filter(k => counts[k] !== '').length;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = variances.filter(v => v.counted !== null);
      for (const item of updates) {
        await base44.entities.InventoryItem.update(item.id, {
          current_stock: item.counted,
          last_restocked_date: new Date().toISOString().split('T')[0]
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries(['inventory', businessId]);
      handleClose();
    }
  });

  const handleClose = () => {
    setStep(1);
    setCounts({});
    setNotes({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#151528] border-white/10 max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            Stock Take
            <Badge className="bg-[#7B3BFF]/20 text-[#C084FC] border-[#7B3BFF]/30 text-xs">
              {countedCount}/{items.length} counted
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <>
            <p className="text-slate-500 text-sm -mt-1">Enter actual counted quantities. Leave blank to skip an item.</p>
            <div className="flex-1 overflow-y-auto space-y-1 mt-3">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-3 py-1.5 text-xs text-slate-500 uppercase tracking-wide border-b border-white/5">
                <span>Item</span>
                <span className="w-24 text-right">Theoretical</span>
                <span className="w-28 text-center">Counted</span>
                <span className="w-20 text-right">Variance</span>
              </div>
              {items.map(item => {
                const counted = counts[item.id] !== undefined ? parseFloat(counts[item.id]) : null;
                const variance = counted !== null && !isNaN(counted) ? counted - item.current_stock : null;
                return (
                  <div key={item.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-3 py-3 items-center hover:bg-white/[0.02] rounded-lg">
                    <div>
                      <p className="text-white text-sm font-medium">{item.ingredient_name}</p>
                      <p className="text-slate-600 text-xs capitalize">{item.category?.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="w-24 text-right">
                      <span className="text-slate-400 text-sm font-mono">{item.current_stock} {item.unit}</span>
                    </div>
                    <div className="w-28">
                      {/* Large touch target for mobile */}
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={counts[item.id] ?? ''}
                        onChange={e => setCounts(c => ({ ...c, [item.id]: e.target.value }))}
                        placeholder="—"
                        className="w-full text-center bg-[#0B0B12] border border-white/10 rounded-lg text-white font-mono text-sm py-2 px-2 focus:border-[#7B3BFF]/60 focus:outline-none focus:ring-1 focus:ring-[#7B3BFF]/40"
                        style={{ fontSize: '16px' }} // prevents iOS zoom
                      />
                    </div>
                    <div className="w-20 text-right">
                      {variance !== null && !isNaN(variance) ? (
                        <VarianceBadge variance={variance} unit={item.unit} />
                      ) : (
                        <span className="text-slate-700 text-xs">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="pt-3 border-t border-white/5 flex gap-2 justify-end">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={() => setStep(2)} disabled={countedCount === 0}>
                Review {countedCount > 0 ? `(${countedCount} items)` : ''} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-slate-500 text-sm -mt-1">Review variances before posting to inventory.</p>

            {/* Variance Summary */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-3 bg-[#0B0B12]/60 border border-white/5 rounded-xl">
                <p className="text-slate-500 text-xs mb-1">Items counted</p>
                <p className="text-white font-bold text-xl">{countedCount}</p>
              </div>
              <div className={`p-3 border rounded-xl ${totalVarianceCost > 0 ? 'bg-rose-500/8 border-rose-500/20' : 'bg-[#0B0B12]/60 border-white/5'}`}>
                <p className="text-slate-500 text-xs mb-1">Total variance cost</p>
                <p className={`font-bold text-xl ${totalVarianceCost > 0 ? 'text-rose-400' : 'text-white'}`}>
                  €{totalVarianceCost.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Top Variances */}
            {topVariances.length > 0 && (
              <div className="mt-3">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Top variances by cost
                </p>
                <div className="space-y-2">
                  {topVariances.map(item => (
                    <div key={item.id} className="flex items-center justify-between px-3 py-2 bg-[#0B0B12]/40 rounded-lg">
                      <div>
                        <span className="text-white text-sm">{item.ingredient_name}</span>
                        <span className="text-slate-500 text-xs ml-2">
                          {item.current_stock} → {item.counted} {item.unit}
                        </span>
                      </div>
                      <div className="text-right">
                        <VarianceBadge variance={item.variance} unit={item.unit} />
                        <p className="text-slate-600 text-xs">€{Math.abs(item.variance * (item.unit_cost || 0)).toFixed(2)} impact</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {topVariances.length === 0 && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl mt-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <p className="text-emerald-300 text-sm">All counted items match theoretical stock — no variances.</p>
              </div>
            )}

            <div className="pt-3 border-t border-white/5 flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setStep(1)}>← Back</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Posting...' : 'Approve & post to inventory'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}