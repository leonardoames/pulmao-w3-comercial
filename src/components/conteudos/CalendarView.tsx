import { useMemo, useState } from 'react';
import { ConteudoMarketing, CONTEUDO_STATUS_DOT_COLORS, CONTEUDO_STATUS_LABELS, ConteudoStatus } from '@/types/conteudo';
import { Profile } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, addMonths, subMonths,
  getDay, isSameMonth, isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';

interface CalendarViewProps {
  conteudos: ConteudoMarketing[];
  profiles: Profile[];
  onCardClick: (c: ConteudoMarketing) => void;
  onDateChange: (id: string, newDate: string) => void;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function CalendarView({ conteudos, profiles, onCardClick, onDateChange }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const allDays = eachDayOfInterval({ start, end });

    // Pad start with previous month days
    const startDow = getDay(start);
    const paddedStart: (Date | null)[] = Array.from({ length: startDow }, () => null);
    return [...paddedStart, ...allDays];
  }, [currentMonth]);

  const conteudosByDate = useMemo(() => {
    const map: Record<string, ConteudoMarketing[]> = {};
    conteudos.forEach((c) => {
      if (c.data_publicacao) {
        const key = c.data_publicacao;
        if (!map[key]) map[key] = [];
        map[key].push(c);
      }
    });
    return map;
  }, [conteudos]);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const newDate = over.id as string;
    if (newDate && newDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      onDateChange(active.id as string, newDate);
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="min-h-[100px]" />;
            const dateStr = format(day, 'yyyy-MM-dd');
            const items = conteudosByDate[dateStr] || [];
            return (
              <DroppableDay
                key={dateStr}
                dateStr={dateStr}
                day={day}
                currentMonth={currentMonth}
                items={items}
                onCardClick={onCardClick}
              />
            );
          })}
        </div>
      </div>
    </DndContext>
  );
}

function DroppableDay({
  dateStr,
  day,
  currentMonth,
  items,
  onCardClick,
}: {
  dateStr: string;
  day: Date;
  currentMonth: Date;
  items: ConteudoMarketing[];
  onCardClick: (c: ConteudoMarketing) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dateStr });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[100px] border border-border rounded-lg p-1',
        !isSameMonth(day, currentMonth) && 'opacity-40',
        isToday(day) && 'border-primary',
        isOver && 'bg-primary/5'
      )}
    >
      <div className={cn('text-xs font-medium mb-1 px-1', isToday(day) && 'text-primary')}>
        {format(day, 'd')}
      </div>
      <div className="space-y-1">
        {items.map((c) => (
          <DraggableCalendarCard key={c.id} conteudo={c} onClick={() => onCardClick(c)} />
        ))}
      </div>
    </div>
  );
}

function DraggableCalendarCard({
  conteudo,
  onClick,
}: {
  conteudo: ConteudoMarketing;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: conteudo.id,
  });
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, opacity: isDragging ? 0.4 : 1 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-card border border-border cursor-pointer hover:shadow-sm truncate"
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', CONTEUDO_STATUS_DOT_COLORS[conteudo.status])} />
      <span className="truncate">{conteudo.titulo || 'Sem título'}</span>
    </div>
  );
}
