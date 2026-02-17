import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMeuFechamento, useFechamentos, useUpsertFechamento } from '@/hooks/useFechamentos';
import { useClosers } from '@/hooks/useProfiles';
import { useAuth } from '@/hooks/useAuth';
import { useCanEditAnyFechamento } from '@/hooks/useUserRoles';
import { CalendarIcon, Save } from 'lucide-react';
import { format, subDays, startOfWeek, startOfMonth, subMonths, endOfMonth, eachDayOfInterval, isFuture, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type PeriodFilter = 'estaSeamana' | 'esteMes' | 'ultimos30' | 'ultimoMes' | 'todo';

function computePeriodDates(filter: PeriodFilter, today: Date): { startDate: Date | undefined; endDate: Date } {
  switch (filter) {
    case 'estaSeamana':
      return { startDate: startOfWeek(today, { weekStartsOn: 1 }), endDate: today };
    case 'esteMes':
      return { startDate: startOfMonth(today), endDate: today };
    case 'ultimos30':
      return { startDate: subDays(today, 30), endDate: today };
    case 'ultimoMes': {
      const lastMonth = subMonths(today, 1);
      return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) };
    }
    case 'todo':
      return { startDate: undefined, endDate: today };
  }
}

interface DayRow {
  date: Date;
  dateStr: string;
  hasData: boolean;
  calls_realizadas: number;
  reagendado: number;
  no_show: number;
  calls_agendadas: number;
  id?: string;
}

function formatNoShow(noShow: number, agendadas: number): string {
  if (agendadas === 0) return '0';
  const pct = Math.round((noShow / agendadas) * 100);
  return `${noShow} (${pct}%)`;
}

export default function MeuFechamentoPage() {
  const { profile } = useAuth();
  const { data: closers } = useClosers();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('ultimos30');

  const canSelectCloser = useCanEditAnyFechamento();
  const [selectedCloserId, setSelectedCloserId] = useState<string>(profile?.id || '');

  // Update selectedCloserId when profile/closers/role loads
  useEffect(() => {
    if (canSelectCloser && closers && closers.length > 0) {
      const isValidCloser = closers.some(c => c.id === selectedCloserId);
      if (!isValidCloser) {
        setSelectedCloserId(closers[0].id);
      }
    } else if (!canSelectCloser && profile?.id && !selectedCloserId) {
      setSelectedCloserId(profile.id);
    }
  }, [profile?.id, selectedCloserId, canSelectCloser, closers]);

  const activeCloserId = selectedCloserId || profile?.id || '';
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const { data: fechamento, isLoading } = useMeuFechamento(activeCloserId, dateStr);

  const today = useMemo(() => new Date(), []);
  const { startDate: periodStart, endDate: periodEnd } = useMemo(
    () => computePeriodDates(periodFilter, today),
    [periodFilter, today]
  );

  const { data: meusFechamentos } = useFechamentos({
    closer_id: activeCloserId,
    startDate: periodStart,
    endDate: periodEnd,
  });

  // Build all days in period merged with data
  const allDaysRows = useMemo<DayRow[]>(() => {
    if (!periodStart) {
      // "Todo o Periodo" — just show fetched data, no gap filling
      return (meusFechamentos || []).map(f => ({
        date: new Date(f.data + 'T12:00:00'),
        dateStr: f.data,
        hasData: true,
        calls_realizadas: f.calls_realizadas,
        reagendado: f.reagendado || 0,
        no_show: f.no_show,
        calls_agendadas: f.calls_agendadas ?? (f.calls_realizadas + (f.reagendado || 0) + f.no_show),
        id: f.id,
      }));
    }

    const cappedEnd = isFuture(periodEnd) ? today : periodEnd;
    const days = eachDayOfInterval({ start: periodStart, end: cappedEnd });
    const dataMap = new Map((meusFechamentos || []).map(f => [f.data, f]));

    return days
      .map(day => {
        const key = format(day, 'yyyy-MM-dd');
        const f = dataMap.get(key);
        if (f) {
          return {
            date: day,
            dateStr: key,
            hasData: true,
            calls_realizadas: f.calls_realizadas,
            reagendado: f.reagendado || 0,
            no_show: f.no_show,
            calls_agendadas: f.calls_agendadas ?? (f.calls_realizadas + (f.reagendado || 0) + f.no_show),
            id: f.id,
          };
        }
        return {
          date: day,
          dateStr: key,
          hasData: false,
          calls_realizadas: 0,
          reagendado: 0,
          no_show: 0,
          calls_agendadas: 0,
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [meusFechamentos, periodStart, periodEnd, today]);

  // Totals
  const totals = useMemo(() => {
    const rows = allDaysRows.filter(r => r.hasData);
    const realizadas = rows.reduce((s, r) => s + r.calls_realizadas, 0);
    const reagendado = rows.reduce((s, r) => s + r.reagendado, 0);
    const noShow = rows.reduce((s, r) => s + r.no_show, 0);
    const agendadas = rows.reduce((s, r) => s + r.calls_agendadas, 0);
    return { realizadas, reagendado, noShow, agendadas };
  }, [allDaysRows]);

  const upsertFechamento = useUpsertFechamento();

  const [callsRealizadas, setCallsRealizadas] = useState<number>(0);
  const [reagendado, setReagendado] = useState<number>(0);
  const [noShow, setNoShow] = useState<number>(0);
  const [observacoes, setObservacoes] = useState<string>('');

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setCalendarOpen(false);
    }
  };

  useEffect(() => {
    if (fechamento) {
      setCallsRealizadas(fechamento.calls_realizadas);
      setReagendado(fechamento.reagendado || 0);
      setNoShow(fechamento.no_show);
      setObservacoes(fechamento.observacoes || '');
    } else {
      setCallsRealizadas(0);
      setReagendado(0);
      setNoShow(0);
      setObservacoes('');
    }
  }, [fechamento, dateStr]);

  const handleSave = async () => {
    if (!activeCloserId) return;
    const safeCallsRealizadas = Math.max(0, Math.floor(callsRealizadas));
    const safeReagendado = Math.max(0, Math.floor(reagendado));
    const safeNoShow = Math.max(0, Math.floor(noShow));
    const safeObservacoes = (observacoes || '').trim();
    if (safeCallsRealizadas > 1000 || safeReagendado > 1000 || safeNoShow > 1000) return;
    if (safeObservacoes.length > 2000) return;

    await upsertFechamento.mutateAsync({
      data: dateStr,
      closer_user_id: activeCloserId,
      calls_realizadas: safeCallsRealizadas,
      reagendado: safeReagendado,
      no_show: safeNoShow,
      observacoes: safeObservacoes || undefined,
    });
  };

  const callsAgendadas = callsRealizadas + reagendado + noShow;

  return (
    <AppLayout>
      <PageHeader
        title={canSelectCloser ? "Fechamento" : "Meu Fechamento"}
        description={canSelectCloser ? "Registre fechamentos diários dos closers" : "Registre suas calls diárias"}
      >
        {canSelectCloser && closers && closers.length > 0 && (
          <Select value={selectedCloserId} onValueChange={setSelectedCloserId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione o closer" />
            </SelectTrigger>
            <SelectContent>
              {closers.map(closer => (
                <SelectItem key={closer.id} value={closer.id}>{closer.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Fechamento do Dia</span>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateChange}
                    locale={ptBR}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Carregando...</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="calls_realizadas">Calls Realizadas</Label>
                    <Input
                      id="calls_realizadas"
                      type="number"
                      min="0"
                      value={callsRealizadas}
                      onChange={(e) => setCallsRealizadas(Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reagendado">Reagendados</Label>
                    <Input
                      id="reagendado"
                      type="number"
                      min="0"
                      value={reagendado}
                      onChange={(e) => setReagendado(Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="no_show">No-Shows</Label>
                    <Input
                      id="no_show"
                      type="number"
                      min="0"
                      value={noShow}
                      onChange={(e) => setNoShow(Number(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Calls Agendadas (calculado)</p>
                  <p className="text-2xl font-bold">{callsAgendadas}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={3}
                    placeholder="Alguma observação sobre o dia..."
                  />
                </div>

                <Button
                  onClick={handleSave}
                  className="w-full gap-2"
                  disabled={upsertFechamento.isPending}
                >
                  <Save className="h-4 w-4" />
                  Salvar Fechamento
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Histórico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between flex-wrap gap-2">
              <span>Histórico</span>
              <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="estaSeamana">Esta Semana</SelectItem>
                  <SelectItem value="esteMes">Este Mês</SelectItem>
                  <SelectItem value="ultimos30">Últimos 30 Dias</SelectItem>
                  <SelectItem value="ultimoMes">Último Mês</SelectItem>
                  <SelectItem value="todo">Todo o Período</SelectItem>
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-center">Realizadas</TableHead>
                  <TableHead className="text-center">Reagendados</TableHead>
                  <TableHead className="text-center">No-Show (%)</TableHead>
                  <TableHead className="text-center">Agendadas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allDaysRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  allDaysRows.map(row => (
                    <TableRow
                      key={row.dateStr}
                      className={cn(
                        "cursor-pointer hover:bg-muted/50",
                        row.dateStr === dateStr && "bg-primary/10"
                      )}
                      onClick={() => setSelectedDate(new Date(row.dateStr + 'T12:00:00'))}
                    >
                      <TableCell className="font-medium">
                        {format(row.date, 'dd/MM')}
                      </TableCell>
                      {row.hasData ? (
                        <>
                          <TableCell className="text-center">{row.calls_realizadas}</TableCell>
                          <TableCell className="text-center">{row.reagendado}</TableCell>
                          <TableCell className="text-center text-destructive">
                            {formatNoShow(row.no_show, row.calls_agendadas)}
                          </TableCell>
                          <TableCell className="text-center font-medium">{row.calls_agendadas}</TableCell>
                        </>
                      ) : (
                        <TableCell colSpan={4} className="text-center text-muted-foreground italic">
                          Sem informação
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
              {allDaysRows.some(r => r.hasData) && (
                <TableFooter>
                  <TableRow className="bg-muted/30 font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-center">{totals.realizadas}</TableCell>
                    <TableCell className="text-center">{totals.reagendado}</TableCell>
                    <TableCell className="text-center text-destructive">
                      {formatNoShow(totals.noShow, totals.agendadas)}
                    </TableCell>
                    <TableCell className="text-center">{totals.agendadas}</TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
