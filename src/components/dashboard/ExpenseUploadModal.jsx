import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Upload, FileText, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

const EXPENSE_CATEGORIES = [
  { value: 'food_beverage', label: 'Food & Beverage Purchases' },
  { value: 'staff_costs', label: 'Staff Costs' },
  { value: 'fixed_costs', label: 'Fixed Costs' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'operating_expenses', label: 'Operating Expenses' },
  { value: 'one_off_expenses', label: 'One-Off Expenses' }
];

export default function ExpenseUploadModal({ open, onOpenChange, onSave }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);
  const [saving, setSaving] = useState(false);
  const [documentUrl, setDocumentUrl] = useState('');
  const [formData, setFormData] = useState({
    supplier_name: '',
    invoice_total: '',
    vat_included: false,
    expense_category: '',
    invoice_date: '',
    notes: ''
  });

  const analyzeWithAI = async (fileUrl) => {
    setAnalyzing(true);
    
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this expense document (receipt/invoice) and extract the following information. Be precise with numbers and dates.
      
Return the extracted data in JSON format with these fields:
- supplier_name: The name of the vendor/supplier/merchant
- invoice_total: The total amount as a number (without currency symbols)
- vat_included: Boolean - true if VAT/tax is mentioned or included
- expense_category: One of these exact values: "food_beverage", "staff_costs", "fixed_costs", "utilities", "operating_expenses", "one_off_expenses"
- invoice_date: The date in YYYY-MM-DD format (if visible)
- notes: Any relevant notes about the expense

Category guidelines:
- food_beverage: Food supplies, beverages, ingredients, restaurant supplies
- staff_costs: Wages, salaries, contractor payments, training
- fixed_costs: Rent, insurance, subscriptions, licenses, equipment leases
- utilities: Electricity, water, gas, internet, phone
- operating_expenses: Marketing, cleaning supplies, repairs, packaging
- one_off_expenses: Equipment purchases, renovations, unusual expenses`,
      file_urls: [fileUrl],
      response_json_schema: {
        type: "object",
        properties: {
          supplier_name: { type: "string" },
          invoice_total: { type: "number" },
          vat_included: { type: "boolean" },
          expense_category: { type: "string" },
          invoice_date: { type: "string" },
          notes: { type: "string" }
        }
      }
    });

    if (result) {
      setFormData(prev => ({
        ...prev,
        supplier_name: result.supplier_name || prev.supplier_name,
        invoice_total: result.invoice_total ? String(result.invoice_total) : prev.invoice_total,
        vat_included: result.vat_included ?? prev.vat_included,
        expense_category: result.expense_category || prev.expense_category,
        invoice_date: result.invoice_date || prev.invoice_date,
        notes: result.notes || prev.notes
      }));
      setAiSuggested(true);
    }
    
    setAnalyzing(false);
  };

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setUploading(true);
    setAiSuggested(false);
    
    const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
    setDocumentUrl(file_url);
    setUploading(false);
    
    // Automatically analyze the document with AI
    await analyzeWithAI(file_url);
  };

  const handleSubmit = async () => {
    setSaving(true);
    
    await base44.entities.ExpenseDocument.create({
      ...formData,
      invoice_total: parseFloat(formData.invoice_total) || 0,
      document_url: documentUrl
    });
    
    onSave?.();
    setSaving(false);
    onOpenChange(false);
    
    // Reset form
          setFile(null);
          setDocumentUrl('');
          setAiSuggested(false);
          setFormData({
            supplier_name: '',
            invoice_total: '',
            vat_included: false,
            expense_category: '',
            invoice_date: '',
            notes: ''
          });
        };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Upload Expense Document</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* File Upload Area */}
          <div className="relative">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-slate-600 transition-colors">
              <AnimatePresence mode="wait">
                {uploading ? (
                  <motion.div
                    key="uploading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center"
                  >
                    <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
                    <p className="text-slate-400">Uploading document...</p>
                  </motion.div>
                ) : analyzing ? (
                                        <motion.div
                                          key="analyzing"
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          exit={{ opacity: 0 }}
                                          className="flex flex-col items-center"
                                        >
                                          <div className="relative">
                                            <Sparkles className="w-10 h-10 text-purple-400 mb-3 animate-pulse" />
                                          </div>
                                          <p className="text-purple-400 font-medium">AI Analyzing Document...</p>
                                          <p className="text-slate-500 text-sm mt-1">Extracting expense details</p>
                                        </motion.div>
                                      ) : file ? (
                                        <motion.div
                                          key="uploaded"
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          className="flex flex-col items-center"
                                        >
                                          {aiSuggested ? (
                                            <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-3" />
                                          ) : (
                                            <FileText className="w-10 h-10 text-emerald-400 mb-3" />
                                          )}
                                          <p className="text-white font-medium">{file.name}</p>
                                          {aiSuggested && (
                                            <p className="text-emerald-400 text-sm mt-1 flex items-center gap-1">
                                              <Sparkles className="w-3 h-3" /> AI auto-filled details
                                            </p>
                                          )}
                                          <p className="text-slate-500 text-sm mt-1">Click to replace</p>
                                        </motion.div>
                                      ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center"
                  >
                    <Upload className="w-10 h-10 text-slate-500 mb-3" />
                    <p className="text-slate-400">Drop your invoice here or click to browse</p>
                    <p className="text-slate-600 text-sm mt-1">PDF, JPG, PNG supported</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-slate-400 mb-2 block">Supplier Name</Label>
              <Input
                value={formData.supplier_name}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Enter supplier name"
              />
            </div>
            
            <div>
              <Label className="text-slate-400 mb-2 block">Invoice Total</Label>
              <Input
                type="number"
                value={formData.invoice_total}
                onChange={(e) => setFormData({ ...formData, invoice_total: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label className="text-slate-400 mb-2 block">Invoice Date</Label>
              <Input
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            
            <div className="col-span-2">
              <Label className="text-slate-400 mb-2 block">Expense Category</Label>
              <Select
                value={formData.expense_category}
                onValueChange={(value) => setFormData({ ...formData, expense_category: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value} className="text-white hover:bg-slate-700">
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-2 flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <Label className="text-slate-300">VAT Included?</Label>
              <Switch
                checked={formData.vat_included}
                onCheckedChange={(checked) => setFormData({ ...formData, vat_included: checked })}
              />
            </div>
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={!formData.supplier_name || !formData.invoice_total || !formData.expense_category || saving}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Expense'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}