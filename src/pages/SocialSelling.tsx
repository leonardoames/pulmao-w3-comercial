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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSocialSellingEntry, useSocialSellingEntries, useUpsertSocialSelling, SOCIAL_SELLING_GOALS } from '@/hooks/useSocialSelling';
import { useSocialSellers } from '@/hooks/useProfiles';
import { useAuth } from '@/hooks/useAuth';
import { useCanEditAnyFechamento, useIsSocialSelling } from '@/hooks/useUserRoles';
import { DateFilter, getDateRange, DateRange } from '@/hooks/useDashboard';
import { CalendarIcon, Save, MessageCircle, Link2, CalendarCheck, Plus, FileText } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { SocialSellingKPIs } from '@/components/social-selling/SocialSellingKPIs';
import { SocialSellingFunnel } from '@/components/social-selling/SocialSellingFunnel';

const DATE_FILTERS: { value: DateFilter; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: '7days', label: '7 dias' },
  { value: 'month', label: 'Este mês' },
  { value: '30days', label: '30 dias' },
  { value: 'custom', label: 'Personalizado' },
];

function getPreviousRange(range: { start: Date; end: Date }): { start: Date; end: Date } {
  const days = differenceInDays(range.end, range.start) + 1;
  const prevEnd = new Date(range.start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - days + 1);
  return { start: prevStart, end: prevEnd };
}

export default function SocialSellingPage() {
  const { profile } = useAuth();
  const { data: socialSellers } = useSocialSellers();
  const canManage = useCanEditAnyFechamento();
  const isSocialSelling = useIsSocialSelling();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedSellerId, setSelectedSellerId] = useState<string>('__all__');
  const [dialogOpen, setDialogOpen] = useState(false);

  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [customRange, setCustomRange] = useState<DateRange>();
  const [customStartOpen, setCustomStartOpen] = useState(false);
  const [customEndOpen, setCustomEndOpen] = useState(false);

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
  const prevRange = useMemo(() => getPreviousRange(filterRange), [filterRange]);

  const { data: entries } = useSocialSellingEntries({
    closer_id: isAllSelected ? undefined : selectedSellerId,
    startDate: filterRange.start,
    endDate: filterRange.end,
  });

  const { data: prevEntries } = useSocialSellingEntries({
    closer_id: isAllSelected ? undefined : selectedSellerId,
    startDate: prevRange.start,
    endDate: prevRange.end,
  });

  const upsertMutation = useUpsertSocialSelling();

  // Form state
  const [conversas, setConversas] = useState(0);
  const [convites, setConvites] = useState(0);
  const [formularios, setFormularios] = useState(0);
  const [agendamentos, setAgendamentos] = useState(0);
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (entry) {
      setConversas(entry.conversas_iniciadas);
      setConvites(entry.convites_enviados);
      setFormularios(entry.formularios_preenchidos);
      setAgendamentos(entry.agendamentos);
      setObservacoes(entry.observacoes || '');
    } else {
      setConversas(0);
      setConvites(0);
      setFormularios(0);
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
      formularios_preenchidos: Math.max(0, Math.floor(formularios)),
      agendamentos: Math.max(0, Math.floor(agendamentos)),
      observacoes: observacoes.trim() || undefined,
    });
    setDialogOpen(false);
  };

  // Stats
  const totalConversas = entries?.reduce((s, e) => s + e.conversas_iniciadas, 0) || 0;
  const totalConvites = entries?.reduce((s, e) => s + e.convites_enviados, 0) || 0;
  const totalFormularios = entries?.reduce((s, e) => s + e.formularios_preenchidos, 0) || 0;
  const totalAgendamentos = entries?.reduce((s, e) => s + e.agendamentos, 0) || 0;

  const prevTotalConversas = prevEntries?.reduce((s, e) => s + e.conversas_iniciadas, 0) || 0;
  const prevTotalConvites = prevEntries?.reduce((s, e) => s + e.convites_enviados, 0) || 0;
  const prevTotalFormularios = prevEntries?.reduce((s, e) => s + e.formularios_preenchidos, 0) || 0;
  const prevTotalAgendamentos = prevEntries?.reduce((s, e) => s + e.agendamentos, 0) || 0;

  const showSellerFilter = canManage && socialSellers && socialSellers.length > 0;

  return (
    <AppLayout>
      <PageHeader
        title="Social Selling"
        description="Registre e acompanhe suas métricas diárias de social selling"
      >
        {showSellerFilter && (
          <Select value={selectedSellerId} onValueChange={setSelectedSellerId}>
            <SelectTrigger className="w-[220px]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)' }}>
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

        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
          {DATE_FILTERS.map(f => {
            const isActive = dateFilter === f.value;
            if (f.value === 'custom') {
              return (
                <Popover key="custom" open={customStartOpen} onOpenChange={setCustomStartOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setDateFilter('custom')}
                      className="min-w-[70px]"
                      style={
                        isActive
                          ? { background: '#F97316', color: '#000000', fontWeight: 600, fontSize: '13px', borderRadius: '8px' }
                          : {
                              background: 'transparent',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '8px',
                              fontSize: '13px',
                              color: 'rgba(255,255,255,0.6)',
                            }
                      }
                    >
                      {customRange?.start && customRange?.end
                        ? `${format(customRange.start, 'dd/MM')} - ${format(customRange.end, 'dd/MM')}`
                        : 'Custom'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4" align="end">
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Selecionar período</p>
                      <div className="flex gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Início</p>
                          <Calendar
                            mode="single"
                            selected={customRange?.start}
                            onSelect={d => { if (d) setCustomRange(prev => ({ start: d, end: prev?.end || d })); }}
                            locale={ptBR}
                            className="pointer-events-auto"
                          />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Fim</p>
                          <Calendar
                            mode="single"
                            selected={customRange?.end}
                            onSelect={d => { if (d) { setCustomRange(prev => ({ start: prev?.start || d, end: d })); setCustomStartOpen(false); } }}
                            locale={ptBR}
                            className="pointer-events-auto"
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              );
            }
            return (
              <Button
                key={f.value}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDateFilter(f.value)}
                className="min-w-[70px]"
                style={
                  isActive
                    ? { background: '#F97316', color: '#000000', fontWeight: 600, fontSize: '13px', borderRadius: '8px' }
                    : {
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: 'rgba(255,255,255,0.6)',
                      }
                }
              >
                {f.label}
              </Button>
            );
          })}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Registro do Dia</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Registro do Dia</span>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar mode="single" selected={selectedDate} onSelect={d => { if (d) { setSelectedDate(d); setCalendarOpen(false); } }} locale={ptBR} disabled={d => d > new Date()} className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </DialogTitle>
            </DialogHeader>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Carregando...</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="formularios" className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Formulários</Label>
                    <Input id="formularios" type="number" min="0" value={formularios} onChange={e => setFormularios(Number(e.target.value) || 0)} />
                    <p className="text-xs text-muted-foreground">Meta: {SOCIAL_SELLING_GOALS.formularios_preenchidos}/dia</p>
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
              </div>
            )}
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* KPIs */}
      <SocialSellingKPIs data={{
        conversas: totalConversas,
        convites: totalConvites,
        formularios: totalFormularios,
        agendamentos: totalAgendamentos,
        prevConversas: prevTotalConversas,
        prevConvites: prevTotalConvites,
        prevFormularios: prevTotalFormularios,
        prevAgendamentos: prevTotalAgendamentos,
      }} />

      {/* Funnel */}
      <SocialSellingFunnel data={{
        conversas: totalConversas,
        convites: totalConvites,
        formularios: totalFormularios,
        agendamentos: totalAgendamentos,
        prevConversas: prevTotalConversas,
        prevConvites: prevTotalConvites,
        prevFormularios: prevTotalFormularios,
        prevAgendamentos: prevTotalAgendamentos,
      }} />

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-center">Conversas Iniciadas</TableHead>
                  <TableHead className="text-center">Convites Enviados</TableHead>
                  <TableHead className="text-center">Formulários Enviados</TableHead>
                  <TableHead className="text-center">Agendamentos Gerados</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!entries?.length ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum registro encontrado</TableCell>
                  </TableRow>
                ) : (
                  entries.map(e => (
                    <TableRow
                      key={e.id}
                      className={cn('cursor-pointer hover:bg-muted/50', e.data === dateStr && 'bg-primary/10')}
                      onClick={() => { setSelectedDate(new Date(e.data + 'T12:00:00')); setDialogOpen(true); }}
                    >
                      <TableCell className="font-medium">{format(new Date(e.data + 'T12:00:00'), 'dd/MM')}</TableCell>
                      <TableCell className="text-center">{e.conversas_iniciadas}</TableCell>
                      <TableCell className="text-center">{e.convites_enviados}</TableCell>
                      <TableCell className="text-center">{e.formularios_preenchidos}</TableCell>
                      <TableCell className="text-center">{e.agendamentos}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">{e.observacoes || '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
