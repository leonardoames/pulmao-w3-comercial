import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, subMonths, addMonths, startOfMonth, isBefore, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthYearSelectorProps {
  value: string; // 'yyyy-MM'
  onChange: (value: string) => void;
}

export function MonthYearSelector({ value, onChange }: MonthYearSelectorProps) {
  // Use parse to avoid UTC timezone issues with new Date()
  const current = parse(value + '-01', 'yyyy-MM-dd', new Date());
  const now = startOfMonth(new Date());

  const canGoNext = isBefore(startOfMonth(current), now);

  const handlePrev = () => {
    onChange(format(subMonths(current, 1), 'yyyy-MM'));
  };

  const handleNext = () => {
    if (canGoNext) {
      onChange(format(addMonths(current, 1), 'yyyy-MM'));
    }
  };

  // Format in lowercase Portuguese: "fevereiro de 2026"
  const rawLabel = format(current, "MMMM 'de' yyyy", { locale: ptBR });
  const label = rawLabel.charAt(0).toLowerCase() + rawLabel.slice(1);

  return (
    <div className="flex items-center gap-1 shrink-0">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium min-w-[160px] text-center">
        {label}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleNext}
        disabled={!canGoNext}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
