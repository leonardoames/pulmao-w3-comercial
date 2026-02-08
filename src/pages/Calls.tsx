import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCalls, useUpdateCall } from '@/hooks/useCalls';
import { useClosers } from '@/hooks/useProfiles';
import { useAuth } from '@/hooks/useAuth';
import { CallStatus, CALL_STATUS_LABELS } from '@/types/crm';
import { Calendar, List, Video, ExternalLink } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function CallsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [closerFilter, setCloserFilter] = useState<string>('all');
  const [view, setView] = useState<'table' | 'calendar'>('table');
  const [weekOffset, setWeekOffset] = useState(0);
  
  const { data: calls, isLoading } = useCalls();
  const { data: closers } = useClosers();
  const updateCall = useUpdateCall();
  const { canEdit } = useAuth();

  const currentDate = new Date();
  const weekStart = startOfWeek(addWeeks(currentDate, weekOffset), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(addWeeks(currentDate, weekOffset), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const filteredCalls = calls?.filter(call => {
    const matchesStatus = statusFilter === 'all' || call.status === statusFilter;
    const matchesCloser = closerFilter === 'all' || call.closer_user_id === closerFilter;
    return matchesStatus && matchesCloser;
  });

  const getStatusColor = (status: CallStatus) => {
    switch (status) {
      case 'Agendada': return 'bg-warning/20 border-warning text-warning';
      case 'Realizada': return 'bg-success/20 border-success text-success';
      case 'No-show': return 'bg-destructive/20 border-destructive text-destructive';
      case 'Remarcada': return 'bg-info/20 border-info text-info';
      case 'Cancelada': return 'bg-muted border-muted-foreground text-muted-foreground';
    }
  };

  return (
    <AppLayout>
      <PageHeader title="Calls" description="Gerencie todas as calls agendadas" />

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(CALL_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={closerFilter} onValueChange={setCloserFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Closer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os closers</SelectItem>
            {closers?.map(closer => (
              <SelectItem key={closer.id} value={closer.id}>{closer.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 p-1 bg-muted rounded-lg ml-auto">
          <Button
            variant={view === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('table')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('calendar')}
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Closer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredCalls?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma call encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCalls?.map(call => (
                    <TableRow key={call.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{(call.lead as any)?.nome_pessoa}</p>
                          <p className="text-sm text-muted-foreground">{(call.lead as any)?.nome_empresa}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(call.data_hora), "dd/MM/yy HH:mm", { locale: ptBR })}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-muted-foreground" />
                          <span>{call.plataforma}</span>
                        </div>
                      </TableCell>
                      <TableCell>{(call.closer as any)?.nome}</TableCell>
                      <TableCell>
                        {canEdit() && call.status === 'Agendada' ? (
                          <Select
                            value={call.status}
                            onValueChange={(value) => updateCall.mutate({ id: call.id, status: value as CallStatus })}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(CALL_STATUS_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <StatusBadge status={call.status} type="call" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Link to={`/leads/${call.lead_id}`}>
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-6">
              <Button variant="outline" onClick={() => setWeekOffset(prev => prev - 1)}>
                Semana anterior
              </Button>
              <h3 className="font-semibold">
                {format(weekStart, "d 'de' MMMM", { locale: ptBR })} - {format(weekEnd, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </h3>
              <Button variant="outline" onClick={() => setWeekOffset(prev => prev + 1)}>
                Próxima semana
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map(day => (
                <div key={day.toISOString()} className="min-h-[200px]">
                  <div className={cn(
                    'text-center py-2 rounded-t-lg font-medium text-sm',
                    isSameDay(day, new Date()) ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    <p>{format(day, 'EEE', { locale: ptBR })}</p>
                    <p className="text-lg">{format(day, 'd')}</p>
                  </div>
                  <div className="border border-t-0 rounded-b-lg p-2 min-h-[150px] space-y-1">
                    {filteredCalls
                      ?.filter(call => isSameDay(new Date(call.data_hora), day))
                      .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime())
                      .map(call => (
                        <Link key={call.id} to={`/leads/${call.lead_id}`}>
                          <div className={cn(
                            'p-2 rounded text-xs border cursor-pointer transition-opacity hover:opacity-80',
                            getStatusColor(call.status)
                          )}>
                            <p className="font-medium">{format(new Date(call.data_hora), 'HH:mm')}</p>
                            <p className="truncate">{(call.lead as any)?.nome_pessoa}</p>
                          </div>
                        </Link>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
}
