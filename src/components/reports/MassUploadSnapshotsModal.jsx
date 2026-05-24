import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { X, Upload, Loader2, CheckCircle, AlertCircle, Download, Table, FileText, Sparkles } from 'lucide-react';
import { endOfMonth } from 'date-fns';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MONTHS_MAP = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  january: 0, february: 1, march: 2, april: 3, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

function parseMonthYear(raw) {
  if (!raw) return null;
  const s = raw.toString().trim();
  const named = s.match(/^([a-zA-Z]+)\s+(\d{4})$/);
  if (named) {
    const m = MONTHS_MAP[named[1].toLowerCase()];
    if (m !== undefined) return { year: parseInt(named[2]), month: m };
  }
  const iso = s.match(/^(\d{4})-(\d{2})$/);
  if (iso) return { year: parseInt(iso[1]), month: parseInt(iso[2]) - 1 };
  const slash = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (slash) return { year: parseInt(slash[2]), month: parseInt(slash[1]) - 1 };
  return null;
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { rows: [], error: 'Need at least a header row and one data row.' };

  const headers = lines[0].split(/[,\t;]/).map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'));
  const HEADER_MAP = {
    period: 'period', month: 'period', date: 'period',
    revenue: 'monthly_revenue', monthly_revenue: 'monthly_revenue', sales: 'monthly_revenue',
    rent: 'rent_fixed_costs', rent_fixed_costs: 'rent_fixed_costs', fixed_costs: 'rent_fixed_costs',
    staff: 'staff_costs', staff_costs: 'staff_costs', labour: 'staff_costs', labor: 'staff_costs',
    food: 'purchases_food_bev', food_bev: 'purchases_food_bev', purchases_food_bev: 'purchases_food_bev', food_beverage: 'purchases_food_bev',
    utilities: 'utilities', util: 'utilities',
    other: 'other_operating', other_operating: 'other_operating',
    covers: 'total_covers', total_covers: 'total_covers',
    days: 'days_open', days_open: 'days_open',
    avg_ticket: 'average_ticket', average_ticket: 'average_ticket',
  };

  const colMap = headers.map(h => HEADER_MAP[h] || null);
  const periodIdx = colMap.indexOf('period');
  if (periodIdx === -1) return { rows: [], error: 'No "period" or "month" column found.' };

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(/[,\t;]/).map(c => c.trim().replace(/[€$"']/g, ''));
    const parsed = parseMonthYear(cells[periodIdx]);
    if (!parsed) continue;
    const row = { period: parsed };
    colMap.forEach((key, ci) => {
      if (!key || key === 'period') return;
      const v = parseFloat(cells[ci]);
      if (!isNaN(v)) row[key] = v;
    });
    rows.push(row);
  }
  return { rows, error: null };
}

// Convert AI-extracted rows (period as "YYYY-MM" or "Mon YYYY") into the internal row format
function normaliseAIRows(aiRows) {
  return (aiRows || []).map(r => {
    let period = null;
    if (r.period) period = parseMonthYear(r.period);
    if (!period && r.year && r.month) {
      const m = typeof r.month === 'string' ? MONTHS_MAP[r.month.toLowerCase().slice(0, 3)] : r.month - 1;
      if (m !== undefined) period = { year: parseInt(r.year), month: m };
    }
    if (!period) return null;
    return {
      period,
      monthly_revenue: r.monthly_revenue ?? r.revenue ?? r.sales ?? 0,
      rent_fixed_costs: r.rent_fixed_costs ?? r.rent ?? r.fixed_costs ?? 0,
      staff_costs: r.staff_costs ?? r.staff ?? r.labour ?? r.labor ?? 0,
      purchases_food_bev: r.purchases_food_bev ?? r.food_bev ?? r.food ?? r.food_beverage ?? 0,
      utilities: r.utilities ?? r.util ?? 0,
      other_operating: r.other_operating ?? r.other ?? 0,
      total_covers: r.total_covers ?? r.covers,
      days_open: r.days_open ?? r.days,
      average_ticket: r.average_ticket ?? r.avg_ticket,
    };
  }).filter(Boolean);
}

async function extractWithAI(fileUrl, fileName) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a financial data extractor for a hospitality business.
Extract monthly financial snapshot data from this document (file: ${fileName}).
The document may be a P&L report, income statement, management report, or summary spreadsheet.

For EACH month found, extract:
- period: "Mon YYYY" (e.g. "Jan 2025")
- monthly_revenue: total revenue / sales for that month (number)
- rent_fixed_costs: rent and fixed overhead costs (number)
- staff_costs: staff / labour / payroll costs (number)
- purchases_food_bev: food and beverage purchases / COGS (number)
- utilities: utilities costs (number)
- other_operating: other operating expenses (number)
- total_covers: number of covers / guests (number, if available)
- days_open: trading days (number, if available)
- average_ticket: average spend per cover (number, if available)

If a value is not present, omit it or set to 0.
Return a JSON array of objects, one per month. Output ONLY valid JSON, no commentary.`,
    file_urls: [fileUrl],
    response_json_schema: {
      type: 'object',
      properties: {
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              period: { type: 'string' },
              monthly_revenue: { type: 'number' },
              rent_fixed_costs: { type: 'number' },
              staff_costs: { type: 'number' },
              purchases_food_bev: { type: 'number' },
              utilities: { type: 'number' },
              other_operating: { type: 'number' },
              total_covers: { type: 'number' },
              days_open: { type: 'number' },
              average_ticket: { type: 'number' },
            },
          },
        },
      },
    },
  });
  return result?.rows || [];
}

async function saveRows(rows, business, userEmail) {
  const done = [], failed = [];
  const existing = await base44.entities.FinancialSnapshot.filter({ business_id: business.id }, '-period_start', 100);

  for (const row of rows) {
    const periodStart = new Date(row.period.year, row.period.month, 1).toISOString().split('T')[0];
    const periodEnd = endOfMonth(new Date(row.period.year, row.period.month, 1)).toISOString().split('T')[0];
    const rev = row.monthly_revenue || 0;
    const costs = (row.rent_fixed_costs || 0) + (row.staff_costs || 0) +
      (row.purchases_food_bev || 0) + (row.utilities || 0) + (row.other_operating || 0);
    const netProfit = rev - costs;
    const profitMargin = rev > 0 ? (netProfit / rev) * 100 : 0;

    const payload = {
      business_id: business.id,
      period_start: periodStart,
      period_end: periodEnd,
      period_type: 'monthly',
      monthly_revenue: rev,
      rent_fixed_costs: row.rent_fixed_costs ?? 0,
      staff_costs: row.staff_costs ?? 0,
      purchases_food_bev: row.purchases_food_bev ?? 0,
      utilities: row.utilities ?? 0,
      other_operating: row.other_operating ?? 0,
      net_profit: netProfit,
      profit_margin: profitMargin,
      ...(row.total_covers !== undefined && row.total_covers !== null && { total_covers: row.total_covers }),
      ...(row.days_open !== undefined && row.days_open !== null && { days_open: row.days_open }),
      ...(row.average_ticket !== undefined && row.average_ticket !== null && { average_ticket: row.average_ticket }),
      created_by_email: userEmail || '',
    };

    const match = existing.find(s => s.period_start === periodStart);
    try {
      if (match) await base44.entities.FinancialSnapshot.update(match.id, payload);
      else await base44.entities.FinancialSnapshot.create(payload);
      done.push(periodStart);
    } catch {
      failed.push(periodStart);
    }
  }
  return { done, failed };
}

export default function MassUploadSnapshotsModal({ open, onClose, business, userEmail, onSaved }) {
  const [text, setText] = useState('');
  const [rows, setRows] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractFileName, setExtractFileName] = useState('');
  const [results, setResults] = useState(null);
  const fileRef = useRef();

  if (!open) return null;

  const handlePaste = (raw) => {
    setText(raw);
    const { rows: parsed, error } = parseCSV(raw);
    setParseError(error);
    setRows(error ? null : parsed);
    setResults(null);
  };

  const handleFile = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = '';

    setExtracting(true);
    setRows(null);
    setParseError(null);
    setText('');

    const allRows = [];
    const fileNames = [];

    for (const file of files) {
      const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      fileNames.push(file.name);
      try {
        if (isPDF) {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          const aiRows = await extractWithAI(file_url, file.name);
          const normalised = normaliseAIRows(aiRows);
          allRows.push(...normalised);
        } else {
          const text = await file.text();
          const { rows: parsed } = parseCSV(text);
          if (parsed?.length) allRows.push(...parsed);
        }
      } catch (err) {
        console.error(`Failed to process ${file.name}:`, err);
      }
    }

    setExtracting(false);
    setExtractFileName(fileNames.join(', '));

    // Deduplicate by period (last file wins)
    const seen = new Map();
    for (const row of allRows) {
      const key = `${row.period.year}-${row.period.month}`;
      seen.set(key, row);
    }
    const merged = Array.from(seen.values());

    if (!merged.length) {
      setParseError('No monthly data found in the selected files. Try a different format or paste data manually.');
    } else {
      setRows(merged);
    }
  };

  const handleUpload = async () => {
    if (!rows?.length || !business) return;
    setUploading(true);
    const result = await saveRows(rows, business, userEmail);
    setUploading(false);
    setResults(result);
    onSaved?.();
  };

  const downloadTemplate = () => {
    const csv = 'period,revenue,rent,staff,food_bev,utilities,other,covers,days\n' +
      'Jan 2025,42000,4200,11000,13000,1200,1800,1400,26\n' +
      'Feb 2025,38000,4200,10500,11800,1200,1600,1250,24\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'snapshot_template.csv';
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#151528] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-[#7B3BFF]/15 flex items-center justify-center">
            <Table className="w-4 h-4 text-[#C084FC]" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-base">Mass Upload Snapshots</h3>
            <p className="text-slate-500 text-xs">{business?.name} · Upload multiple months at once</p>
          </div>
        </div>

        {!results ? (
          <>
            {/* Upload buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <label
                htmlFor="mass-upload-file"
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/10 hover:border-[#7B3BFF]/50 hover:bg-[#7B3BFF]/5 transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-[#7B3BFF]/10 flex items-center justify-center group-hover:bg-[#7B3BFF]/20 transition-colors">
                  <FileText className="w-4 h-4 text-[#C084FC]" />
                </div>
                <div className="text-center">
                  <p className="text-white text-xs font-medium">Upload File</p>
                  <p className="text-slate-500 text-xs">CSV, TSV, PDF</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-[#C084FC] bg-[#7B3BFF]/10 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-2.5 h-2.5" /> AI extraction for PDFs
                </div>
              </label>

              <button
                onClick={downloadTemplate}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/10 hover:border-[#7B3BFF]/50 hover:bg-[#7B3BFF]/5 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#7B3BFF]/10 flex items-center justify-center group-hover:bg-[#7B3BFF]/20 transition-colors">
                  <Download className="w-4 h-4 text-[#C084FC]" />
                </div>
                <div className="text-center">
                  <p className="text-white text-xs font-medium">Download Template</p>
                  <p className="text-slate-500 text-xs">CSV template</p>
                </div>
              </button>
            </div>

            <input id="mass-upload-file" ref={fileRef} type="file" accept=".csv,.tsv,.txt,.pdf" multiple className="hidden" onChange={handleFile} />

            {/* AI extracting state */}
            {extracting && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[#7B3BFF]/10 border border-[#7B3BFF]/20 mb-4">
                <Loader2 className="w-5 h-5 text-[#C084FC] animate-spin shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">AI is reading your documents…</p>
                  <p className="text-slate-400 text-xs mt-0.5">Processing files, this may take a moment</p>
                </div>
              </div>
            )}

            {/* Paste area */}
            {!extracting && (
              <div className="mb-1">
                <label className="text-xs text-slate-400 mb-1.5 block">Or paste data (CSV, TSV, or Excel copy-paste):</label>
                <textarea
                  className="w-full h-36 bg-[#0B0B12] border border-white/10 rounded-xl text-slate-300 text-xs p-3 font-mono resize-none focus:outline-none focus:border-[#7B3BFF]/50"
                  placeholder={"period,revenue,rent,staff,food_bev,utilities,other\nJan 2025,42000,4200,11000,13000,1200,1800\nFeb 2025,38000,4200,10500,11800,1200,1600"}
                  value={text}
                  onChange={e => handlePaste(e.target.value)}
                />
              </div>
            )}

            {parseError && (
              <p className="text-rose-400 text-xs mb-3 flex items-center gap-1.5 mt-2">
                <AlertCircle className="w-3.5 h-3.5" /> {parseError}
              </p>
            )}

            {/* Preview table */}
            {rows?.length > 0 && !extracting && (
              <div className="mb-4 mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs text-slate-400">{rows.length} months ready</p>
                  {extractFileName && (
                    <span className="text-[10px] text-[#C084FC] bg-[#7B3BFF]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> AI extracted from {extractFileName}
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full text-xs">
                    <thead className="bg-[#0B0B12]/60">
                      <tr>
                        {['Period', 'Revenue', 'Rent', 'Staff', 'F&B', 'Util', 'Other', 'Net Profit'].map(h => (
                          <th key={h} className="py-2 px-3 text-slate-500 font-medium text-right first:text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => {
                        const rev = row.monthly_revenue || 0;
                        const costs = (row.rent_fixed_costs || 0) + (row.staff_costs || 0) +
                          (row.purchases_food_bev || 0) + (row.utilities || 0) + (row.other_operating || 0);
                        const net = rev - costs;
                        return (
                          <tr key={i} className="border-t border-white/5">
                            <td className="py-2 px-3 text-slate-200">{MONTHS[row.period.month]} {row.period.year}</td>
                            <td className="py-2 px-3 text-right text-emerald-400 font-mono">€{rev.toLocaleString()}</td>
                            <td className="py-2 px-3 text-right text-slate-400 font-mono">€{(row.rent_fixed_costs || 0).toLocaleString()}</td>
                            <td className="py-2 px-3 text-right text-slate-400 font-mono">€{(row.staff_costs || 0).toLocaleString()}</td>
                            <td className="py-2 px-3 text-right text-slate-400 font-mono">€{(row.purchases_food_bev || 0).toLocaleString()}</td>
                            <td className="py-2 px-3 text-right text-slate-400 font-mono">€{(row.utilities || 0).toLocaleString()}</td>
                            <td className="py-2 px-3 text-right text-slate-400 font-mono">€{(row.other_operating || 0).toLocaleString()}</td>
                            <td className={`py-2 px-3 text-right font-mono ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>€{net.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
              <Button
                onClick={handleUpload}
                disabled={!rows?.length || uploading || extracting}
                className="flex-1 gap-2"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Saving…' : `Save ${rows?.length || 0} Snapshots`}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <p className="text-emerald-300 font-semibold">{results.done.length} snapshots saved</p>
              </div>
              {results.failed.length > 0 && (
                <p className="text-amber-400 text-sm mt-1 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> {results.failed.length} failed to save
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setText(''); setRows(null); setResults(null); setExtractFileName(''); }} className="flex-1">
                Upload More
              </Button>
              <Button onClick={onClose} className="flex-1">Done</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}