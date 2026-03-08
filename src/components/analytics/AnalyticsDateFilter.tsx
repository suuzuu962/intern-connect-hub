import { useState } from 'react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear } from 'date-fns';
import { CalendarIcon, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface AnalyticsDateFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  lastUpdated?: Date | null;
}

const PRESETS = [
  { label: '7D', getDates: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: '30D', getDates: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: '90D', getDates: () => ({ from: subDays(new Date(), 90), to: new Date() }) },
  { label: 'This Month', getDates: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: 'This Year', getDates: () => ({ from: startOfYear(new Date()), to: new Date() }) },
  { label: 'All Time', getDates: () => ({ from: undefined, to: undefined }) },
];

export const AnalyticsDateFilter = ({ dateRange, onDateRangeChange, lastUpdated }: AnalyticsDateFilterProps) => {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const activePreset = PRESETS.find(p => {
    const d = p.getDates();
    if (!d.from && !dateRange.from) return true;
    if (!d.from || !dateRange.from) return false;
    return format(d.from, 'yyyy-MM-dd') === format(dateRange.from, 'yyyy-MM-dd');
  });

  const displayLabel = dateRange.from
    ? `${format(dateRange.from, 'MMM d')} – ${dateRange.to ? format(dateRange.to, 'MMM d, yyyy') : 'Now'}`
    : 'All Time';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Preset buttons */}
      <div className="flex items-center gap-1 flex-wrap">
        {PRESETS.map(preset => (
          <Button
            key={preset.label}
            variant={activePreset?.label === preset.label ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs px-2.5"
            onClick={() => onDateRangeChange(preset.getDates())}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Custom date picker */}
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn('h-7 text-xs gap-1.5', dateRange.from && 'text-foreground')}>
            <CalendarIcon className="h-3 w-3" />
            {displayLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={{ from: dateRange.from, to: dateRange.to }}
            onSelect={(range) => {
              onDateRangeChange({ from: range?.from, to: range?.to });
              if (range?.from && range?.to) setCalendarOpen(false);
            }}
            numberOfMonths={2}
            disabled={(date) => date > new Date()}
            initialFocus
            className={cn('p-3 pointer-events-auto')}
          />
        </PopoverContent>
      </Popover>

      {/* Live indicator */}
      {lastUpdated && (
        <Badge variant="outline" className="h-7 text-xs gap-1.5 font-normal text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </Badge>
      )}
    </div>
  );
};
