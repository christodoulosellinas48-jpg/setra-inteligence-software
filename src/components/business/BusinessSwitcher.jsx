import React from 'react';
import { useBusiness } from './BusinessContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Building2, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BusinessSwitcher({ compact = false }) {
  const { businesses, groups, currentBusiness, selectedGroupId, switchBusiness, selectGroup } = useBusiness();
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

  // The current value shown in the trigger
  const currentValue = selectedGroupId
    ? `group:${selectedGroupId}`
    : currentBusiness?.id;

  const handleChange = (value) => {
    if (value.startsWith('group:')) {
      const groupId = value.replace('group:', '');
      selectGroup(groupId);
    } else {
      const business = businesses.find(b => b.id === value);
      if (business) switchBusiness(business);
    }
  };

  const selectedGroupName = selectedGroupId
    ? groups.find(g => g.id === selectedGroupId)?.name
    : null;

  return (
    <div className="flex items-center gap-2">
      {selectedGroupId ? (
        <Layers className="w-4 h-4 text-[#C084FC]" />
      ) : (
        <Building2 className="w-4 h-4 text-slate-400" />
      )}
      <Select value={currentValue} onValueChange={handleChange}>
        <SelectTrigger className={`bg-slate-800 border-slate-700 text-white ${compact ? 'w-40' : 'w-56'}`}>
          <SelectValue placeholder="Select business">
            {selectedGroupName || currentBusiness?.name || 'Select...'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700">
          {/* Groups section */}
          {groups.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3 h-3" /> Groups
              </div>
              {groups.map((group) => (
                <SelectItem
                  key={`group:${group.id}`}
                  value={`group:${group.id}`}
                  className="text-[#C084FC] hover:bg-slate-700"
                >
                  {group.name}
                </SelectItem>
              ))}
              <div className="h-px bg-slate-700 my-1" />
            </>
          )}

          {/* Individual businesses */}
          <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3 h-3" /> Venues
          </div>
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