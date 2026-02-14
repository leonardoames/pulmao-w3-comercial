import { useState, useMemo, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useConteudos, useCreateConteudo, useUpdateConteudo } from '@/hooks/useConteudos';
import { useProfiles } from '@/hooks/useProfiles';
import { useAuth } from '@/hooks/useAuth';
import { KanbanBoard } from '@/components/conteudos/KanbanBoard';
import { CalendarView } from '@/components/conteudos/CalendarView';
import { ConteudoSidePanel } from '@/components/conteudos/ConteudoSidePanel';
import { ConteudoFilterBar, ConteudoFilters } from '@/components/conteudos/ConteudoFilterBar';
import { ConteudoMarketing, ConteudoStatus } from '@/types/conteudo';
import { Plus, LayoutGrid, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { format, isWithinInterval } from 'date-fns';

const emptyFilters: ConteudoFilters = {
  responsaveis: [],
  tipos: [],
  plataformas: [],
  statuses: [],
};

export default function MarketingConteudos() {
  const [view, setView] = useState<'kanban' | 'calendar'>('kanban');
  const [selectedConteudo, setSelectedConteudo] = useState<ConteudoMarketing | null>(null);
  const [filters, setFilters] = useState<ConteudoFilters>(emptyFilters);

  const { user } = useAuth();
  const { data: conteudos = [], isLoading } = useConteudos();
  const { data: profiles = [] } = useProfiles();
  const createConteudo = useCreateConteudo();
  const updateConteudo = useUpdateConteudo();

  // Apply filters
  const filtered = useMemo(() => {
    return conteudos.filter((c) => {
      if (filters.responsaveis.length > 0 && (!c.responsavel_user_id || !filters.responsaveis.includes(c.responsavel_user_id)))
        return false;
      if (filters.tipos.length > 0 && !c.tipo_conteudo.some((t) => filters.tipos.includes(t)))
        return false;
      if (filters.plataformas.length > 0 && !c.onde_postar.some((o) => filters.plataformas.includes(o)))
        return false;
      if (filters.statuses.length > 0 && !filters.statuses.includes(c.status))
        return false;
      if (filters.dateRange && c.data_publicacao) {
        const pub = new Date(c.data_publicacao + 'T12:00:00');
        if (!isWithinInterval(pub, { start: filters.dateRange.from, end: filters.dateRange.to }))
          return false;
      }
      if (filters.dateRange && !c.data_publicacao) return false;
      return true;
    });
  }, [conteudos, filters]);

  const handleUpdate = useCallback(
    (id: string, updates: Partial<ConteudoMarketing>) => {
      updateConteudo.mutate({ id, ...updates } as any, {
        onSuccess: () => {
          // Update local selected if open
          if (selectedConteudo?.id === id) {
            setSelectedConteudo((prev) => (prev ? { ...prev, ...updates } : null));
          }
        },
        onError: (err: any) => toast.error(err.message || 'Erro ao atualizar'),
      });
    },
    [updateConteudo, selectedConteudo]
  );

  const handleStatusChange = useCallback(
    (id: string, status: ConteudoStatus) => {
      handleUpdate(id, { status });
    },
    [handleUpdate]
  );

  const handleDateChange = useCallback(
    (id: string, newDate: string) => {
      handleUpdate(id, { data_publicacao: newDate });
    },
    [handleUpdate]
  );

  const handleAddNew = useCallback(
    (status: ConteudoStatus = 'Ideia') => {
      if (!user) return;
      createConteudo.mutate(
        { titulo: '', status, criado_por: user.id },
        {
          onSuccess: (data) => {
            if (data) setSelectedConteudo(data);
            toast.success('Conteúdo criado');
          },
          onError: (err: any) => toast.error(err.message || 'Erro ao criar'),
        }
      );
    },
    [user, createConteudo]
  );

  return (
    <AppLayout>
      <PageHeader title="Controle de Conteúdos" description="Gerencie a produção de conteúdos do marketing.">
        <div className="flex items-center gap-3">
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList>
              <TabsTrigger value="kanban" className="gap-1.5">
                <LayoutGrid className="h-3.5 w-3.5" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Calendário
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => handleAddNew('Ideia')} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Novo Conteúdo
          </Button>
        </div>
      </PageHeader>

      {/* Filters */}
      <div className="mb-4">
        <ConteudoFilterBar
          filters={filters}
          profiles={profiles}
          onChange={setFilters}
          onClear={() => setFilters(emptyFilters)}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : view === 'kanban' ? (
        <KanbanBoard
          conteudos={filtered}
          profiles={profiles}
          onCardClick={setSelectedConteudo}
          onStatusChange={handleStatusChange}
          onAddNew={handleAddNew}
        />
      ) : (
        <CalendarView
          conteudos={filtered}
          profiles={profiles}
          onCardClick={setSelectedConteudo}
          onDateChange={handleDateChange}
        />
      )}

      {/* Side Panel */}
      {selectedConteudo && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setSelectedConteudo(null)} />
          <ConteudoSidePanel
            conteudo={selectedConteudo}
            profiles={profiles}
            onClose={() => setSelectedConteudo(null)}
            onUpdate={handleUpdate}
          />
        </>
      )}
    </AppLayout>
  );
}
