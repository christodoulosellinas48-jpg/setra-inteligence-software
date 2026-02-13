import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function ExportButtons({ data, calculations, dateRange, businessName, businessType }) {
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  const generateCSV = () => {
    setExportingCsv(true);
    
    const rows = [
      ['Ellinas THE SETTING - Financial Report'],
      ['Business Name', businessName || 'N/A'],
      ['Business Type', businessType || 'N/A'],
      ['Report Period', `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`],
      ['Generated', format(new Date(), 'MMM d, yyyy HH:mm')],
      [''],
      ['INCOME & EXPENSES'],
      ['Category', 'Amount (€)'],
      ['Monthly Revenue', data.monthly_revenue || 0],
      ['Food & Beverage Purchases', data.purchases_food_bev || 0],
      ['Staff Costs', data.staff_costs || 0],
      ['Rent / Fixed Costs', data.rent_fixed_costs || 0],
      ['Utilities', data.utilities || 0],
      ['Other Operating Expenses', data.other_operating || 0],
      ['Total Expenses', (data.purchases_food_bev || 0) + (data.staff_costs || 0) + (data.rent_fixed_costs || 0) + (data.utilities || 0) + (data.other_operating || 0)],
      ['Net Profit', calculations.netProfit],
      [''],
      ['KEY RATIOS'],
      ['Metric', 'Value', 'Status'],
      ['Profit Margin (%)', calculations.profitMargin.toFixed(1), calculations.profitMarginStatus],
      ['Food Cost Ratio (%)', calculations.foodCostRatio.toFixed(1), calculations.foodCostStatus],
      ['Staff Cost Ratio (%)', calculations.staffCostRatio.toFixed(1), calculations.staffCostStatus],
      ['Fixed Cost Load (%)', calculations.fixedCostRatio.toFixed(1), calculations.fixedCostStatus],
      ['Break-even Revenue (€)', calculations.breakEvenRevenue.toFixed(0), ''],
      ['Overall Health Score', calculations.healthScore, calculations.overallStatus]
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `financial-report-${format(dateRange.from, 'yyyy-MM-dd')}.csv`;
    link.click();
    
    setExportingCsv(false);
  };

  const generatePDF = () => {
    setExportingPdf(true);
    
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Financial Report</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; }
          .header { border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #10b981; margin: 0; font-size: 28px; }
          .header p { color: #64748b; margin: 5px 0; }
          .meta { display: flex; gap: 40px; margin-bottom: 30px; }
          .meta-item { }
          .meta-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
          .meta-value { font-size: 16px; font-weight: 600; color: #1e293b; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 14px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          th { background: #f8fafc; font-weight: 600; color: #475569; }
          .amount { text-align: right; font-family: 'Courier New', monospace; }
          .profit { background: #d1fae5; color: #065f46; font-weight: 600; }
          .loss { background: #fee2e2; color: #991b1b; font-weight: 600; }
          .status-healthy { color: #10b981; }
          .status-warning { color: #f59e0b; }
          .status-risk { color: #ef4444; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Ellinas THE SETTING</h1>
          <p>Financial Intelligence Report</p>
        </div>
        
        <div class="meta">
          <div class="meta-item">
            <div class="meta-label">Business</div>
            <div class="meta-value">${businessName || 'N/A'}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Type</div>
            <div class="meta-value">${businessType || 'N/A'}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Period</div>
            <div class="meta-value">${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Income & Expenses</div>
          <table>
            <tr><th>Category</th><th class="amount">Amount</th></tr>
            <tr><td>Monthly Revenue</td><td class="amount">€${(data.monthly_revenue || 0).toLocaleString()}</td></tr>
            <tr><td>Food & Beverage Purchases</td><td class="amount">€${(data.purchases_food_bev || 0).toLocaleString()}</td></tr>
            <tr><td>Staff Costs</td><td class="amount">€${(data.staff_costs || 0).toLocaleString()}</td></tr>
            <tr><td>Rent / Fixed Costs</td><td class="amount">€${(data.rent_fixed_costs || 0).toLocaleString()}</td></tr>
            <tr><td>Utilities</td><td class="amount">€${(data.utilities || 0).toLocaleString()}</td></tr>
            <tr><td>Other Operating</td><td class="amount">€${(data.other_operating || 0).toLocaleString()}</td></tr>
            <tr style="font-weight: 600; background: #f8fafc;"><td>Total Expenses</td><td class="amount">€${((data.purchases_food_bev || 0) + (data.staff_costs || 0) + (data.rent_fixed_costs || 0) + (data.utilities || 0) + (data.other_operating || 0)).toLocaleString()}</td></tr>
            <tr class="${calculations.netProfit >= 0 ? 'profit' : 'loss'}"><td>Net Profit</td><td class="amount">€${calculations.netProfit.toLocaleString()}</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Key Financial Ratios</div>
          <table>
            <tr><th>Metric</th><th class="amount">Value</th><th>Status</th></tr>
            <tr><td>Profit Margin</td><td class="amount">${calculations.profitMargin.toFixed(1)}%</td><td class="status-${calculations.profitMarginStatus}">${calculations.profitMarginStatus.toUpperCase()}</td></tr>
            <tr><td>Food Cost Ratio</td><td class="amount">${calculations.foodCostRatio.toFixed(1)}%</td><td class="status-${calculations.foodCostStatus}">${calculations.foodCostStatus.toUpperCase()}</td></tr>
            <tr><td>Staff Cost Ratio</td><td class="amount">${calculations.staffCostRatio.toFixed(1)}%</td><td class="status-${calculations.staffCostStatus}">${calculations.staffCostStatus.toUpperCase()}</td></tr>
            <tr><td>Fixed Cost Load</td><td class="amount">${calculations.fixedCostRatio.toFixed(1)}%</td><td class="status-${calculations.fixedCostStatus}">${calculations.fixedCostStatus.toUpperCase()}</td></tr>
            <tr><td>Break-even Revenue</td><td class="amount">€${calculations.breakEvenRevenue.toLocaleString()}</td><td>-</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Overall Health Assessment</div>
          <p style="font-size: 18px;">
            <strong>Health Score:</strong> ${calculations.healthScore}/100 
            <span class="status-${calculations.overallStatus}" style="margin-left: 10px;">(${calculations.overallStatus.toUpperCase()})</span>
          </p>
        </div>

        <div class="footer">
          Generated by Ellinas THE SETTING on ${format(new Date(), 'MMMM d, yyyy \'at\' HH:mm')}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      setExportingPdf(false);
    };
  };

  return (
    <div className="flex items-center gap-3">
      <Button 
        onClick={generatePDF}
        disabled={exportingPdf}
        className="bg-rose-600 hover:bg-rose-700 text-white"
      >
        {exportingPdf ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <FileText className="w-4 h-4 mr-2" />
        )}
        Export PDF
      </Button>
      <Button 
        onClick={generateCSV}
        disabled={exportingCsv}
        variant="outline"
        className="border-slate-700 text-slate-300 hover:bg-slate-800"
      >
        {exportingCsv ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4 mr-2" />
        )}
        Export CSV
      </Button>
    </div>
  );
}