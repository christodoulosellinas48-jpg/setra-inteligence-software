import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function BusinessTable({ businesses }) {
  const navigate = useNavigate();

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Business Unit Details</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Business</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Type</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Revenue</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Profit</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Margin</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Health</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((business, idx) => (
              <motion.tr
                key={business.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="border-b border-white/5 hover:bg-white/5"
              >
                <td className="py-3 px-4 text-white font-medium">{business.name}</td>
                <td className="py-3 px-4 text-slate-400">{business.type}</td>
                <td className="py-3 px-4 text-right text-cyan-400">€{business.revenue.toLocaleString()}</td>
                <td className={`py-3 px-4 text-right ${business.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  €{business.profit.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right text-slate-300">{business.margin.toFixed(1)}%</td>
                <td className="py-3 px-4 text-center">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    business.status === 'healthy' ? 'bg-emerald-500/20 text-emerald-400' :
                    business.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-rose-500/20 text-rose-400'
                  }`}>
                    {business.healthScore.toFixed(0)}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/Dashboard')}
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    View
                  </Button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}