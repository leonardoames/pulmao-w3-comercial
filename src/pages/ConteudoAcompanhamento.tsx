import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useContentDailyLogs, useDeleteContentDailyLog } from '@/hooks/useContentTracking';
import { useCanAccessAdminPanel } from '@/hooks/useUserRoles';
import { ContentDailyLog, RESPONSIBLE_OPTIONS } from '@/types/content';
import { DailyLogModal } from '@/components/conteudos/DailyLogModal';
import { DailyLogViewSheet } from '@/components/conteudos/DailyLogViewSheet';
import { CalendarIcon, Plus, Eye, Pencil, Trash2, FileText } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';

type PeriodFilter = 'today' | '7d' | 'month' | 'custom';

export default function ConteudoAcompanhamento() {
  const canEdit = useCanAccessAdminPanel();
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [responsibleFilter, setResponsibleFilter] = useState('all');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [customPickerOpen, setCustomPickerOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editLog, setEditLog] = useState<ContentDailyLog | null>(null);
  const [viewLog, setViewLog] = useState<ContentDailyLog | null>(null);

  const deleteLog = useDeleteContentDailyLog();

  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    switch (period) {
      case 'today':
        const t = format(today, 'yyyy-MM-dd');
        return { startDate: t, endDate: t };
      case '7d':
        return { startDate: format(subDays(today, 6), 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') };
      case 'month':
        return { startDate: format(startOfMonth(today), 'yyyy-MM-dd'), endDate: format(endOfMonth(today), 'yyyy-MM-dd') };
      case 'custom':
        return {
          startDate: customRange?.from ? format(customRange.from, 'yyyy-MM-dd') : undefined,
          endDate: customRange?.to ? format(customRange.to, 'yyyy-MM-dd') : undefined,
        };
      default:
        return { startDate: undefined, endDate: undefined };
    }
  }, [period, customRange]);

  const { data: logs = [], isLoading } = useContentDailyLogs(
    startDate,
    endDate,
    responsibleFilter !== 'all' ? responsibleFilter : undefined,
  );

  const handleEdit = (log: ContentDailyLog) => {
    setEditLog(log);
    setModalOpen(true);
  };

  const handleNew = () => {
    setEditLog(null);
    setModalOpen(true);
  };

  const handleDelete = (log: ContentDailyLog) => {
    if (!confirm('Excluir registro de ' + format(new Date(log.date + 'T12:00:00'), 'dd/MM/yyyy') + '?')) return;
    deleteLog.mutate({ id: log.id, date: log.date }, {
      onSuccess: () => toast.success('Registro excluído'),
      onError: () => toast.error('Erro ao excluir'),
    });
  };

  const periodButtons: { key: PeriodFilter; label: string }[] = [
    { key: 'today', label: 'Hoje' },
    { key: '7d', label: '7D' },
    { key: 'month', label: 'Mês' },
    { key: 'custom', label: 'Personalizado' },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <PageHeader title="Acompanhamento Diário" description="Histórico de registros operacionais" />
          {canEdit && (
            <Button onClick={handleNew} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Novo registro
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {periodButtons.map(b => (
              <Button
                key={b.key}
                variant={period === b.key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setPeriod(b.key);
                  if (b.key === 'custom') setCustomPickerOpen(true);
                }}
                className={cn(
                  'text-xs h-8',
                  period === b.key && 'bg-primary text-primary-foreground',
                )}
              >
                {b.label}
              </Button>
            ))}
          </div>

          {period === 'custom' && (
            <Popover open={customPickerOpen} onOpenChange={setCustomPickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {customRange?.from && customRange?.to
                    ? `${format(customRange.from, 'dd/MM')} - ${format(customRange.to, 'dd/MM')}`
                    : 'Selecionar período'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={customRange}
                  onSelect={setCustomRange}
                  locale={ptBR}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          )}

          <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {RESPONSIBLE_OPTIONS.map(name => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Data</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="text-center">Publicados</TableHead>
                <TableHead className="text-center">Agendados</TableHead>
                <TableHead className="text-center">Stories</TableHead>
                <TableHead className="text-center">YouTube</TableHead>
                <TableHead className="text-center">@leo</TableHead>
                <TableHead className="text-center">@w3</TableHead>
                <TableHead className="text-center">Obs</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Nenhum registro encontrado</TableCell>
                </TableRow>
              ) : (
                logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {format(new Date(log.date + 'T12:00:00'), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>{log.responsible_name}</TableCell>
                    <TableCell className="text-center">{log.posts_published_count}</TableCell>
                    <TableCell className="text-center">{log.posts_scheduled_count}</TableCell>
                    <TableCell className="text-center">{log.stories_done_count}</TableCell>
                    <TableCell className="text-center">{log.youtube_videos_published_count}</TableCell>
                    <TableCell className="text-center">{log.followers_leo}</TableCell>
                    <TableCell className="text-center">{log.followers_w3}</TableCell>
                    <TableCell className="text-center">
                      {log.notes ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <FileText className="h-4 w-4 text-muted-foreground mx-auto" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[250px]">
                              <p className="text-xs">{log.notes.substring(0, 100)}{log.notes.length > 100 ? '...' : ''}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewLog(log)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {canEdit && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(log)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(log)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <DailyLogModal open={modalOpen} onOpenChange={setModalOpen} editLog={editLog} />
      <DailyLogViewSheet open={!!viewLog} onOpenChange={(o) => !o && setViewLog(null)} log={viewLog} />
    </AppLayout>
  );
}
