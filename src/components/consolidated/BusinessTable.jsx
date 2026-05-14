import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Download, Layers } from 'lucide-react';
import AddToGroupModal from './AddToGroupModal';

function fmtEur(val) {
  if (val === null || val === undefined) return '—';
  return '€' + Math.round(val).toLocaleString('en-EU');
}

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
  return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-[#C084FC]" /> : <ArrowDown className="w-3 h-3 text-[#C084FC]" />;
}

export default function BusinessTable({ businesses, onViewBusiness, userEmail, groups = [], onGroupSaved }) {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('profit');
  const [sortDir, setSortDir] = useState('desc');
  const [groupModalBusiness, setGroupModalBusiness] = useState(null);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  const filtered = useMemo(() => {
    let rows = businesses.filter(b =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.type.toLowerCase().includes(search.toLowerCase())
    );
    rows = [...rows].sort((a, b) => {
      const av = a[sortCol] ?? -Infinity;
      const bv = b[sortCol] ?? -Infinity;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return rows;
  }, [businesses, search, sortCol, sortDir]);

  const handleExportCSV = () => {
    const headers = ['Business', 'Type', 'Revenue', 'Net Profit', 'Margin %', 'Health Score'];
    const rows = businesses.map(b => [
      b.name,
      b.type,
      b.revenue ?? 0,
      b.profit !== null ? Math.round(b.profit) : '',
      b.margin !== null ? b.margin.toFixed(1) : '',
      b.healthScore !== null ? b.healthScore : ''
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'portfolio.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="text-lg font-semibold text-white">Business Unit Details</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search venues..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-44 h-9 text-sm bg-[#151528]/80 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 text-xs h-9">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Business</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Type</th>
              <th
                className="text-right py-3 px-4 text-sm font-medium text-slate-400 cursor-pointer hover:text-white select-none"
                onClick={() => handleSort('revenue')}
              >
                <span className="inline-flex items-center gap-1 justify-end">
                  Revenue <SortIcon col="revenue" sortCol={sortCol} sortDir={sortDir} />
                </span>
              </th>
              <th
                className="text-right py-3 px-4 text-sm font-medium text-slate-400 cursor-pointer hover:text-white select-none"
                onClick={() => handleSort('profit')}
              >
                <span className="inline-flex items-center gap-1 justify-end">
                  Net Profit <SortIcon col="profit" sortCol={sortCol} sortDir={sortDir} />
                </span>
              </th>
              <th
                className="text-right py-3 px-4 text-sm font-medium text-slate-400 cursor-pointer hover:text-white select-none"
                onClick={() => handleSort('margin')}
              >
                <span className="inline-flex items-center gap-1 justify-end">
                  Margin <SortIcon col="margin" sortCol={sortCol} sortDir={sortDir} />
                </span>
              </th>
              <th
                className="text-center py-3 px-4 text-sm font-medium text-slate-400 cursor-pointer hover:text-white select-none"
                onClick={() => handleSort('healthScore')}
              >
                <span className="inline-flex items-center gap-1 justify-center">
                  Health <SortIcon col="healthScore" sortCol={sortCol} sortDir={sortDir} />
                </span>
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((business, idx) => (
              <motion.tr
                key={business.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="py-3 px-4 text-white font-medium">{business.name}</td>
                <td className="py-3 px-4 text-slate-400 text-sm">{business.type}</td>
                <td className="py-3 px-4 text-right text-cyan-400 font-mono text-sm">{fmtEur(business.revenue)}</td>
                <td className={`py-3 px-4 text-right font-mono text-sm ${
                  business.profit === null ? 'text-slate-500' :
                  business.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {fmtEur(business.profit)}
                </td>
                <td className="py-3 px-4 text-right text-slate-300 text-sm font-mono">
                  {business.revenue ? `${business.margin !== null ? business.margin.toFixed(1) : '0.0'}%` : '—'}
                </td>
                <td className="py-3 px-4 text-center">
                  {business.healthScore !== null && business.revenue > 0 ? (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      business.status === 'healthy' ? 'bg-emerald-500/20 text-emerald-400' :
                      business.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-rose-500/20 text-rose-400'
                    }`}>
                      {business.healthScore}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs text-slate-600 bg-white/5">
                      Setup needed
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setGroupModalBusiness(business)}
                      className="text-violet-400 hover:text-white text-xs gap-1"
                      title={business.groupName ? `Group: ${business.groupName}` : 'Add to group'}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      {business.groupName ? business.groupName : 'Group'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewBusiness(business)}
                      className="text-[#C084FC] hover:text-white text-xs"
                    >
                      View →
                    </Button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 text-sm">No venues match your search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {groupModalBusiness && (
        <AddToGroupModal
          business={groupModalBusiness}
          userEmail={userEmail}
          open={!!groupModalBusiness}
          onClose={() => setGroupModalBusiness(null)}
          onSaved={onGroupSaved}
        />
      )}
    </Card>
  );
}