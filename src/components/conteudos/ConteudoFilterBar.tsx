import { ConteudoStatus, CONTEUDO_STATUS_LABELS, CONTEUDO_STATUS_LIST, TIPO_CONTEUDO_OPTIONS, ONDE_POSTAR_OPTIONS } from '@/types/conteudo';
import { Profile } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface ConteudoFilters {
  responsaveis: string[];
  tipos: string[];
  plataformas: string[];
  statuses: ConteudoStatus[];
  dateRange?: { from: Date; to: Date };
}

interface ConteudoFilterBarProps {
  filters: ConteudoFilters;
  profiles: Profile[];
  onChange: (filters: ConteudoFilters) => void;
  onClear: () => void;
}

function MultiSelectPopover({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn('gap-1.5', selected.length > 0 && 'border-primary text-primary')}>
          {label}
          {selected.length > 0 && (
            <span className="bg-primary text-primary-foreground rounded-full text-[10px] px-1.5 py-0.5 leading-none">
              {selected.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-2" align="start">
        <div className="space-y-1 max-h-[240px] overflow-y-auto">
          {options.map((o) => (
            <label key={o.value} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-xs">
              <Checkbox checked={selected.includes(o.value)} onCheckedChange={() => onToggle(o.value)} />
              {o.label}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ConteudoFilterBar({ filters, profiles, onChange, onClear }: ConteudoFilterBarProps) {
  const toggleItem = (key: keyof Pick<ConteudoFilters, 'responsaveis' | 'tipos' | 'plataformas' | 'statuses'>, value: string) => {
    const arr = filters[key] as string[];
    const newArr = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
    onChange({ ...filters, [key]: newArr });
  };

  const hasFilters = filters.responsaveis.length > 0 || filters.tipos.length > 0 || filters.plataformas.length > 0 || filters.statuses.length > 0 || !!filters.dateRange;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Filter className="h-4 w-4 text-muted-foreground" />

      <MultiSelectPopover
        label="Responsável"
        options={profiles.map((p) => ({ value: p.id, label: p.nome }))}
        selected={filters.responsaveis}
        onToggle={(v) => toggleItem('responsaveis', v)}
      />

      <MultiSelectPopover
        label="Tipo"
        options={TIPO_CONTEUDO_OPTIONS.map((t) => ({ value: t, label: t }))}
        selected={filters.tipos}
        onToggle={(v) => toggleItem('tipos', v)}
      />

      <MultiSelectPopover
        label="Onde postar"
        options={ONDE_POSTAR_OPTIONS.map((o) => ({ value: o, label: o }))}
        selected={filters.plataformas}
        onToggle={(v) => toggleItem('plataformas', v)}
      />

      <MultiSelectPopover
        label="Status"
        options={CONTEUDO_STATUS_LIST.map((s) => ({ value: s, label: CONTEUDO_STATUS_LABELS[s] }))}
        selected={filters.statuses}
        onToggle={(v) => toggleItem('statuses', v as ConteudoStatus)}
      />

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn('gap-1.5', filters.dateRange && 'border-primary text-primary')}>
            <CalendarIcon className="h-3.5 w-3.5" />
            {filters.dateRange
              ? `${format(filters.dateRange.from, 'dd/MM')} - ${format(filters.dateRange.to, 'dd/MM')}`
              : 'Data publicação'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={filters.dateRange ? { from: filters.dateRange.from, to: filters.dateRange.to } : undefined}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                onChange({ ...filters, dateRange: { from: range.from, to: range.to } });
              } else if (!range?.from && !range?.to) {
                onChange({ ...filters, dateRange: undefined });
              }
            }}
            locale={ptBR}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} className="gap-1 text-muted-foreground">
          <X className="h-3.5 w-3.5" />
          Limpar
        </Button>
      )}
    </div>
  );
}
