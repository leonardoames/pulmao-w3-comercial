import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateFilter, DateRange } from '@/hooks/useDashboard';
import { cn } from '@/lib/utils';

interface TVDateFilterProps {
  filter: DateFilter;
  onFilterChange: (filter: DateFilter) => void;
  customRange?: DateRange;
  onCustomRangeChange?: (range: DateRange) => void;
}

const filterLabels: Record<DateFilter, string> = {
  today: 'Hoje',
  yesterday: 'Ontem',
  '7days': '7 dias',
  month: 'Este mês',
  '30days': '30 dias',
  custom: 'Personalizado',
};

export function TVDateFilter({
  filter,
  onFilterChange,
  customRange,
  onCustomRangeChange,
}: TVDateFilterProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(customRange?.start);
  const [endDate, setEndDate] = useState<Date | undefined>(customRange?.end);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleApplyCustom = () => {
    if (startDate && endDate && onCustomRangeChange) {
      onCustomRangeChange({ start: startDate, end: endDate });
      onFilterChange('custom');
      setPopoverOpen(false);
    }
  };

  const filters: DateFilter[] = ['today', 'yesterday', '7days', 'month', '30days', 'custom'];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((f) => (
        f === 'custom' ? (
          <Popover key={f} open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={filter === 'custom' ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'gap-2',
                  filter === 'custom' && 'bg-primary text-primary-foreground'
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                {filter === 'custom' && customRange
                  ? `${format(customRange.start, 'dd/MM')} - ${format(customRange.end, 'dd/MM')}`
                  : filterLabels[f]}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Data Inicial</p>
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      locale={ptBR}
                      disabled={(date) => date > new Date()}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Data Final</p>
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      locale={ptBR}
                      disabled={(date) => date > new Date() || (startDate ? date < startDate : false)}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleApplyCustom} 
                  className="w-full"
                  disabled={!startDate || !endDate}
                >
                  Aplicar
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange(f)}
            className={cn(
              filter === f && 'bg-primary text-primary-foreground'
            )}
          >
            {filterLabels[f]}
          </Button>
        )
      ))}
    </div>
  );
}
