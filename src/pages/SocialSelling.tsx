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
import { StatCard } from '@/components/ui/stat-card';
import { useSocialSellingEntry, useSocialSellingEntries, useUpsertSocialSelling, SOCIAL_SELLING_GOALS } from '@/hooks/useSocialSelling';
import { useSocialSellers } from '@/hooks/useProfiles';
import { useAuth } from '@/hooks/useAuth';
import { useCanEditAnyFechamento, useIsSocialSelling } from '@/hooks/useUserRoles';
import { DateFilter, getDateRange, DateRange } from '@/hooks/useDashboard';
import { CalendarIcon, Save, MessageCircle, Link2, CalendarCheck, ArrowRightLeft, TrendingUp } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
  const { data: socialSellers } = useSocialSellers();
  const canManage = useCanEditAnyFechamento();
  const isSocialSelling = useIsSocialSelling();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedSellerId, setSelectedSellerId] = useState<string>('__all__');

  // Filters
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [customRange, setCustomRange] = useState<DateRange>();
  const [customStartOpen, setCustomStartOpen] = useState(false);
  const [customEndOpen, setCustomEndOpen] = useState(false);

  // For SOCIAL_SELLING users, always lock to their own id
  useEffect(() => {
    if (isSocialSelling && profile?.id) {
      setSelectedSellerId(profile.id);
    }
  }, [profile?.id, isSocialSelling]);

  const isAllSelected = selectedSellerId === '__all__';
  const activeSellerId = isAllSelected ? (profile?.id || '') : selectedSellerId;
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const { data: entry, isLoading } = useSocialSellingEntry(activeSellerId, dateStr);

  const filterRange = useMemo(() => getDateRange(dateFilter, customRange), [dateFilter, customRange]);

  // Entries for the selected seller (or all if __all__ for master)
  const { data: entries } = useSocialSellingEntries({
    closer_id: isAllSelected ? undefined : selectedSellerId,
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
    if (!activeSellerId) return;
    await upsertMutation.mutateAsync({
      data: dateStr,
      closer_user_id: activeSellerId,
      conversas_iniciadas: Math.max(0, Math.floor(conversas)),
      convites_enviados: Math.max(0, Math.floor(convites)),
      agendamentos: Math.max(0, Math.floor(agendamentos)),
      observacoes: observacoes.trim() || undefined,
    });
  };

  // Stats
  const totalConversas = entries?.reduce((s, e) => s + e.conversas_iniciadas, 0) || 0;
  const totalConvites = entries?.reduce((s, e) => s + e.convites_enviados, 0) || 0;
  const totalAgendamentos = entries?.reduce((s, e) => s + e.agendamentos, 0) || 0;
  const convConvitesAgend = totalConvites > 0 ? ((totalAgendamentos / totalConvites) * 100).toFixed(1) + '%' : '—';
  const convConversasAgend = totalConversas > 0 ? ((totalAgendamentos / totalConversas) * 100).toFixed(1) + '%' : '—';

  const showSellerFilter = canManage && socialSellers && socialSellers.length > 0;

  return (
    <AppLayout>
      <PageHeader
        title="Social Selling"
        description="Registre e acompanhe suas métricas diárias de social selling"
      >
        {showSellerFilter && (
          <Select value={selectedSellerId} onValueChange={setSelectedSellerId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Todos os Social Sellers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos os Social Sellers</SelectItem>
              {socialSellers.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
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

      {/* A) Dashboard do Período */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="Conversas Iniciadas"
          value={totalConversas.toLocaleString('pt-BR')}
          icon={<MessageCircle className="h-5 w-5" />}
        />
        <StatCard
          title="Convites Enviados"
          value={totalConvites.toLocaleString('pt-BR')}
          icon={<Link2 className="h-5 w-5" />}
        />
        <StatCard
          title="Agendamentos"
          value={totalAgendamentos.toLocaleString('pt-BR')}
          icon={<CalendarCheck className="h-5 w-5" />}
        />
        <StatCard
          title="Convites → Agend."
          value={convConvitesAgend}
          icon={<ArrowRightLeft className="h-5 w-5" />}
        />
        <StatCard
          title="Conversas → Agend."
          value={convConversasAgend}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* B) Registro do Dia */}
      <Card className="mb-6">
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

      {/* C) Histórico */}
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
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!entries?.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum registro encontrado</TableCell>
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
                    <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">{e.observacoes || '—'}</TableCell>
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
