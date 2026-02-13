import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Upload, FileText, Loader2 } from 'lucide-react';
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

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setUploading(true);
    
    const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
    setDocumentUrl(file_url);
    setUploading(false);
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
                ) : file ? (
                  <motion.div
                    key="uploaded"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center"
                  >
                    <FileText className="w-10 h-10 text-emerald-400 mb-3" />
                    <p className="text-white font-medium">{file.name}</p>
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