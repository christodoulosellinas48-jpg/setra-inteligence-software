import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Sparkles, CheckCircle2, AlertCircle, Trash2, Loader2, ImageIcon } from 'lucide-react';

const CATEGORIES = ['appetizer', 'main', 'dessert', 'beverage', 'side', 'other'];

export default function MenuImportModal({ open, onClose, onImport, businessId }) {
  const [step, setStep] = useState(1); // 1=upload, 2=review, 3=done
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [extractedItems, setExtractedItems] = useState([]);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
      setUploading(false);
      await extractMenu(file_url);
    } catch (e) {
      setError('Upload failed. Please try again.');
      setUploading(false);
    }
  };

  const extractMenu = async (url) => {
    setExtracting(true);
    setStep(2);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a menu extraction assistant. Look at this menu image and extract all menu items you can see.
For each item extract: name, price (as a number, remove currency symbols), and category (one of: appetizer, main, dessert, beverage, side, other).
If you cannot read the price clearly, set it to 0.
Return ONLY valid JSON — no markdown, no explanation.`,
        file_urls: [url],
        response_json_schema: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  selling_price: { type: 'number' },
                  category: { type: 'string' }
                }
              }
            }
          }
        }
      });
      const items = (result?.items || []).map((item, idx) => ({
        ...item,
        _id: idx,
        selected: true,
        category: CATEGORIES.includes(item.category) ? item.category : 'main',
        selling_price: item.selling_price || 0
      }));
      setExtractedItems(items);
    } catch (e) {
      setError('AI extraction failed. Please try again or add items manually.');
    }
    setExtracting(false);
  };

  const handleImport = async () => {
    const toImport = extractedItems.filter(i => i.selected && i.name?.trim());
    await onImport(toImport);
    setStep(3);
  };

  const handleClose = () => {
    setStep(1);
    setImageUrl(null);
    setExtractedItems([]);
    setError(null);
    onClose();
  };

  const updateItem = (id, field, value) => {
    setExtractedItems(prev => prev.map(i => i._id === id ? { ...i, [field]: value } : i));
  };

  const selectedCount = extractedItems.filter(i => i.selected).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0F0F1E] border-white/10 max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C084FC]" />
            Import Menu from Photo
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 pt-2">
            <p className="text-slate-400 text-sm">
              Take a photo of your menu (paper, chalkboard, or PDF screenshot) and Setra will extract all items automatically.
            </p>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-white/10 rounded-xl p-10 text-center cursor-pointer hover:border-[#7B3BFF]/40 hover:bg-[#7B3BFF]/5 transition-colors"
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-[#7B3BFF] animate-spin" />
                  <p className="text-slate-400 text-sm">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#7B3BFF]/10 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-[#C084FC]" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Upload menu photo</p>
                    <p className="text-slate-500 text-sm mt-1">PNG, JPG, PDF — any format</p>
                  </div>
                  <Button size="sm" variant="outline" className="mt-1">
                    <Upload className="w-3.5 h-3.5 mr-1.5" /> Choose file
                  </Button>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
            {error && (
              <div className="flex items-center gap-2 text-rose-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <>
            {extracting ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-14 h-14 rounded-full bg-[#7B3BFF]/10 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-[#C084FC] animate-pulse" />
                </div>
                <p className="text-white font-medium">Extracting menu items...</p>
                <p className="text-slate-500 text-sm">AI is reading your menu</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between -mt-1 mb-2">
                  <p className="text-slate-400 text-sm">
                    Found <span className="text-white font-medium">{extractedItems.length} items</span>. Deselect any you don't want to import.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setExtractedItems(p => p.map(i => ({ ...i, selected: true })))} className="text-xs text-[#C084FC] hover:underline">All</button>
                    <button onClick={() => setExtractedItems(p => p.map(i => ({ ...i, selected: false })))} className="text-xs text-slate-500 hover:underline">None</button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {error && (
                    <div className="flex items-center gap-2 text-rose-400 text-sm p-3 bg-rose-500/10 rounded-lg">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                    </div>
                  )}
                  {extractedItems.length === 0 && !error && (
                    <div className="text-center py-8 text-slate-500 text-sm">No items were extracted. Try a clearer photo.</div>
                  )}
                  {extractedItems.map(item => (
                    <div key={item._id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${item.selected ? 'bg-[#151528]/80 border-white/8' : 'bg-[#0B0B12]/40 border-white/4 opacity-50'}`}>
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={e => updateItem(item._id, 'selected', e.target.checked)}
                        className="w-4 h-4 accent-[#7B3BFF] flex-shrink-0"
                      />
                      <Input
                        value={item.name}
                        onChange={e => updateItem(item._id, 'name', e.target.value)}
                        className="flex-1 bg-[#0B0B12] border-white/10 text-white h-8 text-sm"
                      />
                      <div className="w-20 flex items-center">
                        <span className="text-slate-500 text-sm mr-1">€</span>
                        <Input
                          type="number"
                          value={item.selling_price}
                          onChange={e => updateItem(item._id, 'selling_price', parseFloat(e.target.value) || 0)}
                          className="bg-[#0B0B12] border-white/10 text-white h-8 text-sm"
                        />
                      </div>
                      <Select value={item.category} onValueChange={v => updateItem(item._id, 'category', v)}>
                        <SelectTrigger className="w-28 bg-[#0B0B12] border-white/10 text-white h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-[#151528] border-white/10">
                          {CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-white text-xs capitalize">{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <button onClick={() => setExtractedItems(p => p.filter(i => i._id !== item._id))} className="text-slate-600 hover:text-rose-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-white/5 flex gap-2 justify-between items-center">
                  <Button variant="outline" size="sm" onClick={() => { setStep(1); setImageUrl(null); setExtractedItems([]); }}>
                    ← Re-upload
                  </Button>
                  <Button onClick={handleImport} disabled={selectedCount === 0}>
                    Import {selectedCount > 0 ? `${selectedCount} items` : ''}
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        {step === 3 && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 gap-4">
            <CheckCircle2 className="w-14 h-14 text-emerald-400" />
            <p className="text-white font-medium text-lg">Menu imported successfully</p>
            <p className="text-slate-400 text-sm text-center">
              {selectedCount} items added. Now link ingredients to calculate food cost.
            </p>
            <Button onClick={handleClose} className="mt-2">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}