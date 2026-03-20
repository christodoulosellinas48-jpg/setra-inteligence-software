import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ToastConnectModal({ open, onOpenChange, businessId, onConnected }) {
  const [restaurantGuid, setRestaurantGuid] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { success, message }

  const handleConnect = async () => {
    if (!restaurantGuid.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('toastPosSync', {
        action: 'connect',
        business_id: businessId,
        restaurant_guid: restaurantGuid.trim()
      });
      setResult({ success: true, message: res.data?.message || 'Connected!' });
      onConnected?.();
    } catch (err) {
      setResult({ success: false, message: err?.response?.data?.error || err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#151528] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Connect Toast POS</DialogTitle>
          <DialogDescription className="text-slate-400">
            Enter your Toast Restaurant GUID to establish a secure connection. You can find this in your Toast dashboard under Restaurants.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="text-slate-300">Restaurant GUID</Label>
            <Input
              placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={restaurantGuid}
              onChange={(e) => setRestaurantGuid(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white"
            />
            <p className="text-xs text-slate-500">
              Found in Toast Web → Restaurants → select your location → copy the GUID from the URL.
            </p>
          </div>

          {result && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${result.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {result.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {result.message}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleConnect} disabled={loading || !restaurantGuid.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loading ? 'Connecting…' : 'Connect'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}