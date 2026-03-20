import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BusinessProvider, useBusiness } from '@/components/business/BusinessContext';
import { Building2, TrendingUp, FileText, Calendar, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORY_COLORS = {
  food_beverage: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  utilities: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  fixed_costs: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  staff_costs: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  operating_expenses: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  other: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
};

function VendorsContent() {
  const { currentBusiness } = useBusiness();
  const currencySymbol = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr', AUD: '$', CAD: '$' }[currentBusiness?.currency] || '€';

  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: ['suppliers', currentBusiness?.id],
    queryFn: () => base44.entities.Supplier.filter({ business_id: currentBusiness.id }, '-total_spend'),
    enabled: !!currentBusiness
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['allExpenses', currentBusiness?.id],
    queryFn: () => base44.entities.ExpenseDocument.filter({ business_id: currentBusiness.id }, '-invoice_date', 100),
    enabled: !!currentBusiness
  });

  // Aggregate expense stats per supplier name for suppliers without records
  const expenseBySupplier = useMemo(() => {
    const map = {};
    for (const exp of expenses) {
      const key = exp.supplier_name?.toLowerCase().trim();
      if (!key) continue;
      if (!map[key]) map[key] = { name: exp.supplier_name, total: 0, count: 0, category: exp.expense_category, lastDate: '' };
      map[key].total += exp.invoice_total || 0;
      map[key].count += 1;
      if (!map[key].lastDate || exp.invoice_date > map[key].lastDate) map[key].lastDate = exp.invoice_date;
    }
    return map;
  }, [expenses]);

  const totalSpend = suppliers.reduce((s, v) => s + (v.total_spend || 0), 0);
  const topCategory = useMemo(() => {
    const catMap = {};
    suppliers.forEach(s => { catMap[s.category] = (catMap[s.category] || 0) + (s.total_spend || 0); });
    return Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  }, [suppliers]);

  if (!currentBusiness) return (
    <div className="p-8 text-center text-slate-400">No business selected.</div>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Vendors & Suppliers</h1>
        <p className="text-slate-400 text-sm mt-1">Track supplier relationships and spending</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#151528]/80 border-white/5 p-4">
          <p className="text-slate-400 text-sm">Total Suppliers</p>
          <p className="text-3xl font-bold text-white mt-1">{suppliers.length}</p>
        </Card>
        <Card className="bg-[#151528]/80 border-white/5 p-4">
          <p className="text-slate-400 text-sm">Total Spend</p>
          <p className="text-3xl font-bold text-white mt-1">{currencySymbol}{totalSpend.toLocaleString()}</p>
        </Card>
        <Card className="bg-[#151528]/80 border-white/5 p-4">
          <p className="text-slate-400 text-sm">Top Category</p>
          <p className="text-xl font-bold text-white mt-1 capitalize">{topCategory?.replace(/_/g, ' ') || '—'}</p>
        </Card>
      </div>

      {/* Supplier List */}
      {loadingSuppliers ? (
        <div className="text-center text-slate-400 py-12">Loading suppliers...</div>
      ) : suppliers.length === 0 ? (
        <Card className="bg-[#151528]/80 border-white/5 p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg font-medium">No suppliers yet</p>
          <p className="text-slate-500 text-sm mt-2">Upload invoices to automatically populate your supplier directory</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((supplier, idx) => {
            const expStats = expenseBySupplier[supplier.name?.toLowerCase().trim()];
            return (
              <motion.div
                key={supplier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="bg-[#151528]/80 border-white/5 hover:border-[#7B3BFF]/30 transition-all duration-200 h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#7B3BFF]/15 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-[#A855F7]" />
                        </div>
                        <CardTitle className="text-white text-base leading-tight">{supplier.name}</CardTitle>
                      </div>
                      <Badge className={`text-xs border ${CATEGORY_COLORS[supplier.category] || CATEGORY_COLORS.other} flex-shrink-0`}>
                        {supplier.category?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-slate-500 text-xs flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Total Spend</p>
                        <p className="text-white font-bold mt-0.5">{currencySymbol}{(supplier.total_spend || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-slate-500 text-xs flex items-center gap-1"><FileText className="w-3 h-3" /> Invoices</p>
                        <p className="text-white font-bold mt-0.5">{supplier.invoice_count || 0}</p>
                      </div>
                    </div>
                    {supplier.last_order_date && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        Last order: {supplier.last_order_date}
                      </div>
                    )}
                    {supplier.contact_email && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        {supplier.contact_email}
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        {supplier.phone}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Vendors() {
  return (
    <BusinessProvider>
      <VendorsContent />
    </BusinessProvider>
  );
}