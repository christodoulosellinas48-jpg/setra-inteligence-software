import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Sparkles, CheckCircle2, AlertCircle, Trash2, Loader2, ImageIcon, Building2 } from 'lucide-react';

const CATEGORIES = ['appetizer', 'main', 'dessert', 'beverage', 'side', 'other'];

// Map original section names from the PDF to the closest standard category
// but we preserve the original section name as a display label
const sectionToCategory = (sectionName) => {
  const s = (sectionName || '').toLowerCase();
  if (s.match(/dessert|sweet|pastry|cake/)) return 'dessert';
  if (s.match(/drink|beverage|cocktail|wine|beer|spirit/)) return 'beverage';
  if (s.match(/side|extra|addition/)) return 'side';
  // appetizer-ish
  if (s.match(/starter|appetizer|small|raw bar|crudo|sashimi|caviar|oyster|charcuterie|antipasti/)) return 'appetizer';
  return 'main';
};

export default function MenuImportModal({ open, onClose, onImport, businessId, businesses = [] }) {
  const [step, setStep] = useState(1); // 1=venue+upload, 2=review, 3=done
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [extractedItems, setExtractedItems] = useState([]);
  const [error, setError] = useState(null);
  const [selectedVenueId, setSelectedVenueId] = useState(businessId || '');
  const [detectedVenueName, setDetectedVenueName] = useState(null);
  const [importedCount, setImportedCount] = useState(0);
  const fileRef = useRef();

  // Pre-select the active venue
  React.useEffect(() => {
    if (businessId && !selectedVenueId) setSelectedVenueId(businessId);
  }, [businessId]);

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
        prompt: `You are a menu extraction assistant for a restaurant management platform.
Analyse this menu document carefully and extract ALL menu items.

CRITICAL RULES:
1. Preserve the EXACT section/category names from the menu (e.g. "RAW BAR", "CRUDO & SASHIMI", "CAVIAR", "HOT", "Tasting Menu"). Do NOT rename them to generic terms like "Starters" or "Mains".
2. Also detect the restaurant/brand name from the menu header or logo text (e.g. "AKTI", "Lambros", "Méli") and include it as "detected_brand".
3. For each item extract: name, price (number, no currency symbols), section_name (exact section from menu), and standard_category (one of: appetizer, main, dessert, beverage, side, other — your best guess for this item type).
4. If price is unclear, set to 0.

Return ONLY valid JSON, no markdown.`,
        file_urls: [url],
        response_json_schema: {
          type: 'object',
          properties: {
            detected_brand: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  selling_price: { type: 'number' },
                  section_name: { type: 'string' },
                  standard_category: { type: 'string' }
                }
              }
            }
          }
        }
      });

      // Try to detect the venue from the brand name
      const brand = result?.detected_brand;
      if (brand && businesses.length > 0) {
        setDetectedVenueName(brand);
        const match = businesses.find(b =>
          b.name?.toLowerCase().includes(brand.toLowerCase()) ||
          brand.toLowerCase().includes(b.name?.toLowerCase())
        );
        if (match) setSelectedVenueId(match.id);
      }

      const items = (result?.items || []).map((item, idx) => ({
        ...item,
        _id: idx,
        selected: true,
        // Preserve the original section name, fall back to standard_category
        section_name: item.section_name || '',
        category: CATEGORIES.includes(item.standard_category) ? item.standard_category : sectionToCategory(item.section_name),
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
    setImportedCount(toImport.length);
    // Pass the selected venue id so the parent can route correctly
    await onImport(toImport, selectedVenueId);
    setStep(3);
  };

  const handleClose = () => {
    setStep(1);
    setImageUrl(null);
    setExtractedItems([]);
    setError(null);
    setDetectedVenueName(null);
    setImportedCount(0);
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
            Import Menu from Photo / PDF
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 pt-2">
            <p className="text-slate-400 text-sm">
              Upload a menu photo or PDF and Setra will extract all items automatically.
            </p>

            {/* Venue selector — shown only when multiple venues exist */}
            {businesses.length > 1 && (
              <div>
                <Label className="text-slate-400 mb-1.5 block text-sm flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Which venue is this menu for?
                </Label>
                <Select value={selectedVenueId} onValueChange={setSelectedVenueId}>
                  <SelectTrigger className="w-full bg-[#151528] border-white/10 text-white text-sm">
                    <SelectValue placeholder="Select venue..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#151528] border-white/10">
                    {businesses.map(b => (
                      <SelectItem key={b.id} value={b.id} className="text-white text-sm">{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
                    <p className="text-white font-medium">Upload menu photo or PDF</p>
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
                <p className="text-slate-500 text-sm">AI is reading your menu and preserving section names</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between -mt-1 mb-1">
                  <div>
                    <p className="text-slate-400 text-sm">
                      Found <span className="text-white font-medium">{extractedItems.length} items</span>.
                    </p>
                    {detectedVenueName && (
                      <p className="text-xs text-violet-400 mt-0.5">
                        Detected brand: <strong>{detectedVenueName}</strong> — importing to <strong>{businesses.find(b => b.id === selectedVenueId)?.name || '—'}</strong>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setExtractedItems(p => p.map(i => ({ ...i, selected: true })))} className="text-xs text-[#C084FC] hover:underline">All</button>
                    <button onClick={() => setExtractedItems(p => p.map(i => ({ ...i, selected: false })))} className="text-xs text-slate-500 hover:underline">None</button>
                  </div>
                </div>

                {/* Venue override while reviewing */}
                {businesses.length > 1 && (
                  <div className="flex items-center gap-2 mb-2 p-2 bg-white/[0.03] rounded-lg">
                    <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span className="text-xs text-slate-400">Venue:</span>
                    <Select value={selectedVenueId} onValueChange={setSelectedVenueId}>
                      <SelectTrigger className="flex-1 bg-[#0B0B12] border-white/10 text-white h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#151528] border-white/10">
                        {businesses.map(b => (
                          <SelectItem key={b.id} value={b.id} className="text-white text-xs">{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

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
                      <div className="flex-1 min-w-0">
                        <Input
                          value={item.name}
                          onChange={e => updateItem(item._id, 'name', e.target.value)}
                          className="bg-[#0B0B12] border-white/10 text-white h-8 text-sm w-full"
                        />
                        {item.section_name && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{item.section_name}</p>
                        )}
                      </div>
                      <div className="w-20 flex items-center flex-shrink-0">
                        <span className="text-slate-500 text-sm mr-1">€</span>
                        <Input
                          type="number"
                          value={item.selling_price}
                          onChange={e => updateItem(item._id, 'selling_price', parseFloat(e.target.value) || 0)}
                          className="bg-[#0B0B12] border-white/10 text-white h-8 text-sm"
                        />
                      </div>
                      <Select value={item.category} onValueChange={v => updateItem(item._id, 'category', v)}>
                        <SelectTrigger className="w-28 bg-[#0B0B12] border-white/10 text-white h-8 text-xs flex-shrink-0"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-[#151528] border-white/10">
                          {CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-white text-xs capitalize">{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <button onClick={() => setExtractedItems(p => p.filter(i => i._id !== item._id))} className="text-slate-600 hover:text-rose-400 transition-colors flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-white/5 flex gap-2 justify-between items-center">
                  <Button variant="outline" size="sm" onClick={() => { setStep(1); setImageUrl(null); setExtractedItems([]); }}>
                    ← Re-upload
                  </Button>
                  <Button onClick={handleImport} disabled={selectedCount === 0 || !selectedVenueId}>
                    Import {selectedCount > 0 ? `${selectedCount} items` : ''}
                    {selectedVenueId && businesses.length > 1 && ` → ${businesses.find(b => b.id === selectedVenueId)?.name}`}
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
              {importedCount} items added to <strong className="text-white">{businesses.find(b => b.id === selectedVenueId)?.name || 'venue'}</strong>.
            </p>
            <p className="text-slate-500 text-xs text-center">Add recipes to items to calculate food cost accurately.</p>
            <Button onClick={handleClose} className="mt-2">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}