import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

const PRESETS = [
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'This Quarter', value: 'this_quarter' },
  { label: 'Last Quarter', value: 'last_quarter' },
  { label: 'This Year', value: 'this_year' },
  { label: 'Last 6 Months', value: 'last_6_months' },
  { label: 'Last 12 Months', value: 'last_12_months' },
  { label: 'Custom Range', value: 'custom' }
];

export default function ReportDatePicker({ dateRange, onDateRangeChange, periodType, onPeriodTypeChange }) {
  const handlePresetChange = (preset) => {
    const now = new Date();
    let start, end;
    
    switch (preset) {
      case 'this_month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        onPeriodTypeChange('monthly');
        break;
      case 'last_month':
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        onPeriodTypeChange('monthly');
        break;
      case 'this_quarter':
        start = startOfQuarter(now);
        end = endOfQuarter(now);
        onPeriodTypeChange('quarterly');
        break;
      case 'last_quarter':
        start = startOfQuarter(subMonths(now, 3));
        end = endOfQuarter(subMonths(now, 3));
        onPeriodTypeChange('quarterly');
        break;
      case 'this_year':
        start = startOfYear(now);
        end = endOfYear(now);
        onPeriodTypeChange('annual');
        break;
      case 'last_6_months':
        start = startOfMonth(subMonths(now, 5));
        end = endOfMonth(now);
        onPeriodTypeChange('custom');
        break;
      case 'last_12_months':
        start = startOfMonth(subMonths(now, 11));
        end = endOfMonth(now);
        onPeriodTypeChange('custom');
        break;
      case 'custom':
        onPeriodTypeChange('custom');
        return;
      default:
        return;
    }
    
    onDateRangeChange({ from: start, to: end });
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Select onValueChange={handlePresetChange} defaultValue="this_month">
        <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700">
          {PRESETS.map((preset) => (
            <SelectItem key={preset.value} value={preset.value} className="text-white hover:bg-slate-700">
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? format(dateRange.from, 'MMM d, yyyy') : 'Start date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
            <Calendar
              mode="single"
              selected={dateRange?.from}
              onSelect={(date) => onDateRangeChange({ ...dateRange, from: date })}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        
        <span className="text-slate-500">to</span>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.to ? format(dateRange.to, 'MMM d, yyyy') : 'End date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
            <Calendar
              mode="single"
              selected={dateRange?.to}
              onSelect={(date) => onDateRangeChange({ ...dateRange, to: date })}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}