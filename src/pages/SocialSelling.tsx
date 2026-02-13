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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useSocialSellingEntry, useSocialSellingEntries, useUpsertSocialSelling, SOCIAL_SELLING_GOALS } from '@/hooks/useSocialSelling';
import { useClosers } from '@/hooks/useProfiles';
import { useAuth } from '@/hooks/useAuth';
import { useCanEditAnyFechamento } from '@/hooks/useUserRoles';
import { DateFilter, getDateRange, DateRange } from '@/hooks/useDashboard';
import { CalendarIcon, Save, MessageCircle, Link2, CalendarCheck } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';

const DATE_FILTERS: { value: DateFilter; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: '7days', label: '7 dias' },
  { value: 'month', label: 'Este mês' },
  { value: '30days', label: '30 dias' },
  { value: 'custom', label: 'Personalizado' },
];

export default function SocialSellingPage() {
  const { profile } = useAuth();
  const { data: closers } = useClosers();
  const canSelectCloser = useCanEditAnyFechamento();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedCloserId, setSelectedCloserId] = useState<string>(profile?.id || '');

  // Filters
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [customRange, setCustomRange] = useState<DateRange>();
  const [customStartOpen, setCustomStartOpen] = useState(false);
  const [customEndOpen, setCustomEndOpen] = useState(false);

  useEffect(() => {
    if (canSelectCloser && closers && closers.length > 0) {
      const isValid = closers.some(c => c.id === selectedCloserId);
      if (!isValid) setSelectedCloserId(closers[0].id);
    } else if (!canSelectCloser && profile?.id && !selectedCloserId) {
      setSelectedCloserId(profile.id);
    }
  }, [profile?.id, selectedCloserId, canSelectCloser, closers]);

  const activeCloserId = selectedCloserId || profile?.id || '';
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const { data: entry, isLoading } = useSocialSellingEntry(activeCloserId, dateStr);

  const filterRange = useMemo(() => getDateRange(dateFilter, customRange), [dateFilter, customRange]);
  const { data: entries } = useSocialSellingEntries({
    closer_id: activeCloserId,
    startDate: filterRange.start,
    endDate: filterRange.end,
  });

  const upsertMutation = useUpsertSocialSelling();

  // Form state
  const [conversas, setConversas] = useState(0);
  const [convites, setConvites] = useState(0);
  const [agendamentos, setAgendamentos] = useState(0);
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (entry) {
      setConversas(entry.conversas_iniciadas);
      setConvites(entry.convites_enviados);
      setAgendamentos(entry.agendamentos);
      setObservacoes(entry.observacoes || '');
    } else {
      setConversas(0);
      setConvites(0);
      setAgendamentos(0);
      setObservacoes('');
    }
  }, [entry, dateStr]);

  const handleSave = async () => {
    if (!activeCloserId) return;
    await upsertMutation.mutateAsync({
      data: dateStr,
      closer_user_id: activeCloserId,
      conversas_iniciadas: Math.max(0, Math.floor(conversas)),
      convites_enviados: Math.max(0, Math.floor(convites)),
      agendamentos: Math.max(0, Math.floor(agendamentos)),
      observacoes: observacoes.trim() || undefined,
    });
  };

  // Stats
  const daysInPeriod = Math.max(1, differenceInCalendarDays(filterRange.end, filterRange.start) + 1);
  const totalConversas = entries?.reduce((s, e) => s + e.conversas_iniciadas, 0) || 0;
  const totalConvites = entries?.reduce((s, e) => s + e.convites_enviados, 0) || 0;
  const totalAgendamentos = entries?.reduce((s, e) => s + e.agendamentos, 0) || 0;
  const metaConversas = daysInPeriod * SOCIAL_SELLING_GOALS.conversas_iniciadas;
  const metaConvites = daysInPeriod * SOCIAL_SELLING_GOALS.convites_enviados;
  const metaAgendamentos = daysInPeriod * SOCIAL_SELLING_GOALS.agendamentos;

  // Chart data
  const chartData = useMemo(() => {
    if (!entries) return [];
    return [...entries]
      .sort((a, b) => a.data.localeCompare(b.data))
      .map(e => ({
        data: format(new Date(e.data + 'T12:00:00'), 'dd/MM'),
        Conversas: e.conversas_iniciadas,
        Convites: e.convites_enviados,
        Agendamentos: e.agendamentos,
      }));
  }, [entries]);

  const pct = (val: number, meta: number) => Math.min(100, meta > 0 ? (val / meta) * 100 : 0);

  return (
    <AppLayout>
      <PageHeader
        title="Social Selling"
        description="Registre e acompanhe suas métricas diárias de social selling"
      >
        {canSelectCloser && closers && closers.length > 0 && (
          <Select value={selectedCloserId} onValueChange={setSelectedCloserId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione o closer" />
            </SelectTrigger>
            <SelectContent>
              {closers.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </PageHeader>

      {/* Date Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {DATE_FILTERS.map(f => (
          <Button
            key={f.value}
            variant={dateFilter === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
        {dateFilter === 'custom' && (
          <div className="flex items-center gap-2">
            <Popover open={customStartOpen} onOpenChange={setCustomStartOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {customRange?.start ? format(customRange.start, 'dd/MM/yy') : 'Início'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={customRange?.start} onSelect={d => { if (d) { setCustomRange(prev => ({ start: d, end: prev?.end || d })); setCustomStartOpen(false); } }} locale={ptBR} /></PopoverContent>
            </Popover>
            <span className="text-muted-foreground">—</span>
            <Popover open={customEndOpen} onOpenChange={setCustomEndOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {customRange?.end ? format(customRange.end, 'dd/MM/yy') : 'Fim'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={customRange?.end} onSelect={d => { if (d) { setCustomRange(prev => ({ start: prev?.start || d, end: d })); setCustomEndOpen(false); } }} locale={ptBR} /></PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Form + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Registro do Dia</span>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar mode="single" selected={selectedDate} onSelect={d => { if (d) { setSelectedDate(d); setCalendarOpen(false); } }} locale={ptBR} disabled={d => d > new Date()} />
                </PopoverContent>
              </Popover>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Carregando...</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="conversas" className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> Conversas</Label>
                    <Input id="conversas" type="number" min="0" value={conversas} onChange={e => setConversas(Number(e.target.value) || 0)} />
                    <p className="text-xs text-muted-foreground">Meta: {SOCIAL_SELLING_GOALS.conversas_iniciadas}/dia</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="convites" className="flex items-center gap-1"><Link2 className="h-3.5 w-3.5" /> Convites</Label>
                    <Input id="convites" type="number" min="0" value={convites} onChange={e => setConvites(Number(e.target.value) || 0)} />
                    <p className="text-xs text-muted-foreground">Meta: {SOCIAL_SELLING_GOALS.convites_enviados}/dia</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agendamentos" className="flex items-center gap-1"><CalendarCheck className="h-3.5 w-3.5" /> Agendamentos</Label>
                    <Input id="agendamentos" type="number" min="0" value={agendamentos} onChange={e => setAgendamentos(Number(e.target.value) || 0)} />
                    <p className="text-xs text-muted-foreground">Meta: {SOCIAL_SELLING_GOALS.agendamentos}/dia</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="obs-ss">Observações</Label>
                  <Textarea id="obs-ss" value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={2} placeholder="Alguma observação..." />
                </div>
                <Button onClick={handleSave} className="w-full gap-2" disabled={upsertMutation.isPending}>
                  <Save className="h-4 w-4" /> Salvar
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Período</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <SummaryRow icon={<MessageCircle className="h-4 w-4 text-primary" />} label="Conversas Iniciadas" value={totalConversas} meta={metaConversas} pct={pct(totalConversas, metaConversas)} />
            <SummaryRow icon={<Link2 className="h-4 w-4 text-chart-2" />} label="Convites Enviados" value={totalConvites} meta={metaConvites} pct={pct(totalConvites, metaConvites)} />
            <SummaryRow icon={<CalendarCheck className="h-4 w-4 text-chart-3" />} label="Agendamentos" value={totalAgendamentos} meta={metaAgendamentos} pct={pct(totalAgendamentos, metaAgendamentos)} />
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Evolução</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="data" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                  <ReferenceLine y={SOCIAL_SELLING_GOALS.conversas_iniciadas} stroke="hsl(var(--primary))" strokeDasharray="4 4" label={{ value: 'Meta Conversas', position: 'insideTopRight', fontSize: 10 }} />
                  <ReferenceLine y={SOCIAL_SELLING_GOALS.convites_enviados} stroke="hsl(var(--chart-2))" strokeDasharray="4 4" label={{ value: 'Meta Convites', position: 'insideTopRight', fontSize: 10 }} />
                  <ReferenceLine y={SOCIAL_SELLING_GOALS.agendamentos} stroke="hsl(var(--chart-3))" strokeDasharray="4 4" label={{ value: 'Meta Agend.', position: 'insideTopRight', fontSize: 10 }} />
                  <Line type="monotone" dataKey="Conversas" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Convites" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Agendamentos" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead className="text-center">Conversas</TableHead>
                <TableHead className="text-center">Convites</TableHead>
                <TableHead className="text-center">Agendamentos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!entries?.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum registro encontrado</TableCell>
                </TableRow>
              ) : (
                entries.map(e => (
                  <TableRow
                    key={e.id}
                    className={cn('cursor-pointer hover:bg-muted/50', e.data === dateStr && 'bg-primary/10')}
                    onClick={() => setSelectedDate(new Date(e.data + 'T12:00:00'))}
                  >
                    <TableCell className="font-medium">{format(new Date(e.data + 'T12:00:00'), 'dd/MM')}</TableCell>
                    <TableCell className="text-center">{e.conversas_iniciadas}</TableCell>
                    <TableCell className="text-center">{e.convites_enviados}</TableCell>
                    <TableCell className="text-center">{e.agendamentos}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}

function SummaryRow({ icon, label, value, meta, pct: pctValue }: { icon: React.ReactNode; label: string; value: number; meta: number; pct: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm text-muted-foreground">{value} / {meta}</span>
      </div>
      <Progress value={pctValue} className="h-2" />
      <p className="text-xs text-muted-foreground text-right">{pctValue.toFixed(0)}%</p>
    </div>
  );
}
