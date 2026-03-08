import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type DateFilter = 'today' | 'yesterday' | '7days' | 'month' | '30days' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

const filterOptions: { value: DateFilter; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: '7days', label: '7 dias' },
  { value: 'month', label: 'Este mês' },
  { value: '30days', label: '30 dias' },
  { value: 'custom', label: 'Custom' },
];

interface DateFilterBarProps {
  filter: DateFilter;
  onFilterChange: (filter: DateFilter) => void;
  customRange?: DateRange;
  onCustomRangeChange: (range: DateRange) => void;
}

export function DateFilterBar({ filter, onFilterChange, customRange, onCustomRangeChange }: DateFilterBarProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [tempRange, setTempRange] = useState<{ from?: Date; to?: Date }>({});

  const handleFilterChange = (newFilter: DateFilter) => {
    onFilterChange(newFilter);
    if (newFilter === 'custom') {
      setCalendarOpen(true);
    }
  };

  const handleApplyCustomRange = () => {
    if (tempRange.from && tempRange.to) {
      onCustomRangeChange({ start: tempRange.from, end: tempRange.to });
      setCalendarOpen(false);
    }
  };

  const displayRange = filter === 'custom' && customRange
    ? `${format(customRange.start, 'dd/MM')} - ${format(customRange.end, 'dd/MM')}`
    : null;

  return (
    <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
      {filterOptions.map((option) => {
        const isActive = filter === option.value;
        if (option.value === 'custom') {
          return (
            <Popover key="custom" open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleFilterChange('custom')}
                  className="min-w-[70px]"
                  style={
                    isActive
                      ? { background: '#F97316', color: '#000000', fontWeight: 600, fontSize: '13px', borderRadius: '8px' }
                      : {
                          background: 'transparent',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '8px',
                          fontSize: '13px',
                          color: 'rgba(255,255,255,0.6)',
                        }
                  }
                >
                  {displayRange || 'Custom'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4" align="end">
                <Calendar
                  mode="range"
                  selected={{ from: tempRange.from, to: tempRange.to }}
                  onSelect={(range) => setTempRange({ from: range?.from, to: range?.to })}
                  locale={ptBR}
                  numberOfMonths={2}
                  className="pointer-events-auto"
                />
                <div className="flex justify-end mt-4">
                  <Button onClick={handleApplyCustomRange} disabled={!tempRange.from || !tempRange.to}>
                    Aplicar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          );
        }
        return (
          <Button
            key={option.value}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleFilterChange(option.value)}
            className="min-w-[70px]"
            style={
              isActive
                ? { background: '#F97316', color: '#000000', fontWeight: 600, fontSize: '13px', borderRadius: '8px' }
                : {
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.6)',
                  }
            }
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
