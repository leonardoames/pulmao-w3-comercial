import { useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useState } from 'react';
import { ConteudoMarketing, CONTEUDO_STATUS_LIST, CONTEUDO_STATUS_LABELS, CONTEUDO_STATUS_DOT_COLORS, ConteudoStatus } from '@/types/conteudo';
import { Profile } from '@/types/crm';
import { KanbanCard } from './KanbanCard';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KanbanBoardProps {
  conteudos: ConteudoMarketing[];
  profiles: Profile[];
  onCardClick: (c: ConteudoMarketing) => void;
  onStatusChange: (id: string, status: ConteudoStatus) => void;
  onAddNew: (status: ConteudoStatus) => void;
}

function DroppableColumn({
  status,
  children,
  count,
  onAddNew,
}: {
  status: ConteudoStatus;
  children: React.ReactNode;
  count: number;
  onAddNew: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col min-w-[260px] w-[260px] bg-muted/40 rounded-xl border border-border',
        isOver && 'ring-2 ring-primary/50'
      )}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className={cn('w-2.5 h-2.5 rounded-full', CONTEUDO_STATUS_DOT_COLORS[status])} />
          <span className="text-xs font-semibold uppercase tracking-wide">
            {CONTEUDO_STATUS_LABELS[status]}
          </span>
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5">{count}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onAddNew}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-260px)]">
        {children}
      </div>
    </div>
  );
}

export function KanbanBoard({ conteudos, profiles, onCardClick, onStatusChange, onAddNew }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const grouped = useMemo(() => {
    const map: Record<ConteudoStatus, ConteudoMarketing[]> = {} as any;
    CONTEUDO_STATUS_LIST.forEach((s) => (map[s] = []));
    conteudos.forEach((c) => {
      if (map[c.status]) map[c.status].push(c);
    });
    return map;
  }, [conteudos]);

  const activeCard = activeId ? conteudos.find((c) => c.id === activeId) : null;

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const overId = over.id as string;
    // over.id is the status column
    if (CONTEUDO_STATUS_LIST.includes(overId as ConteudoStatus)) {
      const card = conteudos.find((c) => c.id === active.id);
      if (card && card.status !== overId) {
        onStatusChange(card.id, overId as ConteudoStatus);
      }
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {CONTEUDO_STATUS_LIST.map((status) => (
          <DroppableColumn key={status} status={status} count={grouped[status].length} onAddNew={() => onAddNew(status)}>
            {grouped[status].map((c) => (
              <DraggableCard key={c.id} conteudo={c} profiles={profiles} onClick={() => onCardClick(c)} />
            ))}
          </DroppableColumn>
        ))}
      </div>
      <DragOverlay>
        {activeCard && <KanbanCard conteudo={activeCard} profiles={profiles} onClick={() => {}} />}
      </DragOverlay>
    </DndContext>
  );
}

// Separate draggable wrapper
import { useDraggable } from '@dnd-kit/core';

function DraggableCard({
  conteudo,
  profiles,
  onClick,
}: {
  conteudo: ConteudoMarketing;
  profiles: Profile[];
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: conteudo.id,
  });
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, opacity: isDragging ? 0.5 : 1 }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard conteudo={conteudo} profiles={profiles} onClick={onClick} />
    </div>
  );
}
