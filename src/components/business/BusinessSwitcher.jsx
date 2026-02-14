import React from 'react';
import { useBusiness } from './BusinessContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BusinessSwitcher({ compact = false }) {
  const { businesses, currentBusiness, switchBusiness } = useBusiness();
  const navigate = useNavigate();

  if (businesses.length === 0) {
    return (
      <Button 
        variant="outline" 
        onClick={() => navigate(createPageUrl('CreateBusiness'))}
        className="border-slate-700 text-slate-300 hover:bg-slate-800"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create Business
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="w-4 h-4 text-slate-400" />
      <Select 
        value={currentBusiness?.id} 
        onValueChange={(id) => {
          const business = businesses.find(b => b.id === id);
          if (business) switchBusiness(business);
        }}
      >
        <SelectTrigger className={`bg-slate-800 border-slate-700 text-white ${compact ? 'w-40' : 'w-56'}`}>
          <SelectValue placeholder="Select business" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700">
          {businesses.map((business) => (
            <SelectItem 
              key={business.id} 
              value={business.id} 
              className="text-white hover:bg-slate-700"
            >
              {business.name}
            </SelectItem>
          ))}
          <div className="border-t border-slate-700 mt-1 pt-1">
            <button
              onClick={() => navigate(createPageUrl('CreateBusiness'))}
              className="w-full flex items-center gap-2 px-2 py-2 text-sm text-emerald-400 hover:bg-slate-700 rounded"
            >
              <Plus className="w-4 h-4" />
              Add New Business
            </button>
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}