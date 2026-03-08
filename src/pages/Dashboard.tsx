import { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDashboardStats, useCloserRankings, useNoShowByCloser, DateFilter, DateRange, getDateRange } from '@/hooks/useDashboard';
import { useClosers } from '@/hooks/useProfiles';
import { Phone, TrendingUp, Target, Trophy, AlertCircle, ShoppingCart, Ban, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { useCanAccessAdminPanel } from '@/hooks/useUserRoles';
import { usePermissionChecks } from '@/hooks/useRolePermissions';
import { RevenueCard } from '@/components/dashboard/RevenueCard';
import { SectionLabel } from '@/components/dashboard/SectionLabel';
import { OrigemLeadCard } from '@/components/dashboard/OrigemLeadCard';
import { Venda } from '@/types/crm';
import { useOteRealized, useOteTeamStats } from '@/hooks/useOteGoals';

const filterOptions: { value: DateFilter; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: '7days', label: '7 dias' },
  { value: 'month', label: 'Este mês' },
  { value: '30days', label: '30 dias' },
  { value: 'custom', label: 'Custom' },
];

function useTvMetaMensal() {
  return useQuery({
    queryKey: ['tv-settings', 'meta_mensal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tv_settings')
        .select('value')
        .eq('key', 'meta_mensal')
        .maybeSingle();
      if (error) throw error;
      return data ? Number(data.value) : 100000;
    },
  });
}

function getMetaColor(actual: number, expected: number): string {
  const ratio = expected > 0 ? actual / expected : 1;
  if (ratio >= 1) return '#22C55E';
  if (ratio >= 0.6) return '#FBBF24';
  return '#EF4444';
}

export default function DashboardPage() {
  const [filter, setFilter] = useState<DateFilter>('month');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [tempRange, setTempRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedCloser, setSelectedCloser] = useState<string>('all');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date>(new Date());

  const queryClient = useQueryClient();
  const canShare = useCanAccessAdminPanel();
  const { canView: canViewSection } = usePermissionChecks();
  const { data: closers } = useClosers();
  const { data: stats, isLoading, dataUpdatedAt } = useDashboardStats(filter, customRange, selectedCloser);
  const { data: rankings } = useCloserRankings(filter, customRange, selectedCloser);
  const { data: noShowByCloser } = useNoShowByCloser(filter, customRange);
  const { data: metaMensal } = useTvMetaMensal();

  // OTE data
  const monthRef = format(new Date(), 'yyyy-MM');
  const closerId = selectedCloser === 'all' ? undefined : selectedCloser;
  const { data: oteData } = useOteRealized(monthRef, closerId);
  const { data: teamStats } = useOteTeamStats(monthRef);

  // Update timestamp tracking
  useEffect(() => {
    if (dataUpdatedAt) {
      setLastUpdatedAt(new Date(dataUpdatedAt));
    }
  }, [dataUpdatedAt]);

  // Vendas for OrigemLeadCard
  const dateRange = useMemo(() => getDateRange(filter, customRange), [filter, customRange]);
  const { data: vendasOrigem } = useQuery({
    queryKey: ['vendas-origem', filter, customRange?.start?.toISOString(), customRange?.end?.toISOString(), selectedCloser],
    queryFn: async () => {
      let q = supabase
        .from('vendas')
        .select('id, valor_total, origem_lead, status')
        .gte('data_fechamento', dateRange.start.toISOString().split('T')[0])
        .lte('data_fechamento', dateRange.end.toISOString().split('T')[0])
        .neq('status', 'Reembolsado');
      if (selectedCloser && selectedCloser !== 'all') q = q.eq('closer_user_id', selectedCloser);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Venda[];
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatCurrencyShort = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleFilterChange = (newFilter: DateFilter) => {
    setFilter(newFilter);
    if (newFilter === 'custom') {
      setCalendarOpen(true);
    }
  };

  const handleApplyCustomRange = () => {
    if (tempRange.from && tempRange.to) {
      setCustomRange({ start: tempRange.from, end: tempRange.to });
      setCalendarOpen(false);
    }
  };

  const displayRange = filter === 'custom' && customRange 
    ? `${format(customRange.start, 'dd/MM')} - ${format(customRange.end, 'dd/MM')}`
    : null;

  // Timestamp
  const minutesSinceUpdate = Math.floor((Date.now() - lastUpdatedAt.getTime()) / 60000);
  const timestampColor = minutesSinceUpdate < 5 ? '#22C55E' : minutesSinceUpdate <= 15 ? '#FBBF24' : '#888888';
  const timestampPulse = minutesSinceUpdate < 5;

  const handleManualRefresh = () => {
    queryClient.invalidateQueries();
    setLastUpdatedAt(new Date());
  };

  // OTE display data
  const oteDisplayData = selectedCloser !== 'all' && oteData?.[0] ? {
    target: oteData[0].oteTarget,
    realized: oteData[0].oteRealized,
    percentAchieved: oteData[0].percentAchieved,
    badge: oteData[0].badge,
    label: oteData[0].closerNome,
  } : {
    target: teamStats?.totalTarget || 0,
    realized: teamStats?.totalRealized || 0,
    percentAchieved: teamStats?.percentAchieved || 0,
    badge: teamStats?.badge || null,
    label: 'Time',
  };

  // Date proportional expected
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const expectedProportion = currentDay / daysInMonth;
  const expectedPercent = expectedProportion * 100;

  // Meta Mensal calculations
  const metaMensalValue = metaMensal ?? 100000;
  const volumeVendas = stats?.volumeVendas ?? 0;
  const metaMensalPercent = metaMensalValue > 0 ? (volumeVendas / metaMensalValue) * 100 : 0;

  // No-show column visibility
  const showNoShowColumn = selectedCloser === 'all' && noShowByCloser && noShowByCloser.length > 0;

  // Get selected closer name for badge
  const selectedCloserName = selectedCloser !== 'all' ? closers?.find(c => c.id === selectedCloser)?.nome : null;

  return (
    <AppLayout>
      <PageHeader
        title="Dashboard Comercial"
        description="Visão geral do desempenho de vendas"
      >
        {/* Closer select with User icon */}
        <Select value={selectedCloser} onValueChange={setSelectedCloser}>
          <SelectTrigger
            className="w-[200px]"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 shrink-0" style={{ opacity: 0.5 }} />
              <SelectValue placeholder="Todos os Closers" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Closers</SelectItem>
            {closers?.map((closer) => (
              <SelectItem key={closer.id} value={closer.id}>
                {closer.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date filter pills */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
          {filterOptions.map((option) => {
            const isActive = filter === option.value;
            if (option.value === 'custom') {
              return (
                <Popover key="custom" open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => handleFilterChange('custom')}
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
                      {displayRange || 'Custom'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4" align="end">
                    <Calendar
                      mode="range"
                      selected={{ from: tempRange.from, to: tempRange.to }}
                      onSelect={(range) => setTempRange({ from: range?.from, to: range?.to })}
                      locale={ptBR}
                      numberOfMonths={2}
                      className="pointer-events-auto"
                    />
                    <div className="flex justify-end mt-4">
                      <Button onClick={handleApplyCustomRange} disabled={!tempRange.from || !tempRange.to}>
                        Aplicar
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              );
            }
            return (
              <Button
                key={option.value}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleFilterChange(option.value)}
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
                {option.label}
              </Button>
            );
          })}
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-2 shrink-0">
          <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '14px' }}>|</span>
          <button
            onClick={handleManualRefresh}
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}
            title="Clique para atualizar"
          >
            <span
              className={cn('inline-block w-2 h-2 rounded-full', timestampPulse && 'animate-pulse')}
              style={{ background: timestampColor }}
            />
            Atualizado às {format(lastUpdatedAt, 'HH:mm')}
          </button>
        </div>
      </PageHeader>

      {/* Closer filter badge */}
      {selectedCloserName && (
        <div className="flex items-center gap-2 -mt-3 mb-4">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
            style={{
              fontSize: '12px',
              background: 'rgba(249,115,22,0.1)',
              border: '1px solid rgba(249,115,22,0.25)',
              color: 'rgba(255,255,255,0.7)',
            }}
            onClick={() => setSelectedCloser('all')}
          >
            Filtrado: {selectedCloserName}
            <X className="h-3 w-3" style={{ opacity: 0.5 }} />
          </span>
        </div>
      )}

      {/* BLOCO 1 — Receita */}
      {canViewSection('section:dashboard:receita') && (
        <>
          <SectionLabel title="Receita" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <RevenueCard
              volumeVendas={stats?.volumeVendas ?? 0}
              totalVendas={stats?.totalVendas ?? 0}
              valorPix={stats?.valorPix ?? 0}
              valorCartao={stats?.valorCartao ?? 0}
              valorBoleto={stats?.valorBoleto ?? 0}
              caixaDoMes={stats?.caixaDoMes ?? 0}
              proporcaoCaixa={stats?.proporcaoCaixa ?? 0}
              closers={closers}
              selectedCloser={selectedCloser}
              onCloserChange={setSelectedCloser}
              expectedProportion={expectedProportion}
              expectedPercent={expectedPercent}
              currentDay={currentDay}
              daysInMonth={daysInMonth}
              metaMensalValue={metaMensalValue}
              metaMensalPercent={metaMensalPercent}
              oteTarget={oteDisplayData.target}
              oteRealized={oteDisplayData.realized}
              otePercentAchieved={oteDisplayData.percentAchieved}
              oteBadge={oteDisplayData.badge}
              oteLabel={oteDisplayData.label}
            />
            <div className="flex flex-col gap-4">
              <StatCard
                title="Ticket Médio"
                value={formatCurrency(stats?.ticketMedio ?? 0)}
                icon={<TrendingUp className="h-5 w-5" />}
                trendLabel="tendência"
              />
              <StatCard
                title="Faturamento por Call"
                value={formatCurrency(stats?.faturamentoPorCall ?? 0)}
                subtitle="Volume / Calls realizadas"
                icon={<TrendingUp className="h-5 w-5" />}
                trendLabel="tendência"
              />
            </div>
          </div>
        </>
      )}

      {/* Metas now unified inside RevenueCard */}

      {/* BLOCO 2 — Performance Comercial */}
      {canViewSection('section:dashboard:performance') && (
        <>
          <SectionLabel title="Performance Comercial" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Taxa de Conversão"
              value={`${(stats?.taxaConversao ?? 0).toFixed(1)}%`}
              subtitle="Vendas / Calls realizadas"
              icon={<Target className="h-5 w-5" />}
              variant="success"
            />
            <StatCard
              title="Vendas Realizadas"
              value={stats?.totalVendas ?? 0}
              icon={<ShoppingCart className="h-5 w-5" />}
              variant="primary"
            />
            <StatCard
              title="Calls Realizadas"
              value={stats?.callsRealizadas ?? 0}
              subtitle={`${stats?.callsAgendadas ?? 0} agendadas`}
              icon={<Phone className="h-5 w-5" />}
              variant="info"
            />
            <StatCard
              title="% No-Show Total"
              value={`${(stats?.callsAgendadas ?? 0) > 0 ? (((stats?.reagendados ?? 0) + (stats?.noShows ?? 0)) / (stats?.callsAgendadas ?? 1) * 100).toFixed(1) : '0.0'}%`}
              subtitle={`${(stats?.reagendados ?? 0) + (stats?.noShows ?? 0)} total — ${stats?.noShows ?? 0} no-shows · ${stats?.reagendados ?? 0} reagend.`}
              icon={<Ban className="h-5 w-5" />}
              variant="destructive"
            />
          </div>
        </>
      )}

      {/* Destaques */}
      {canViewSection('section:dashboard:destaques') && (
        <>
          <SectionLabel title="Destaques" />
          <div className={cn(
            'grid grid-cols-1 gap-4',
            showNoShowColumn ? 'lg:grid-cols-2' : 'lg:grid-cols-1'
          )}>
            {/* Coluna 1: Ranking de Closers */}
            <Card className={cn(!showNoShowColumn && 'lg:col-span-1')}>
              <CardHeader>
                <CardTitle>Ranking de Closers</CardTitle>
              </CardHeader>
              <CardContent>
                {rankings?.rankingGeral && rankings.rankingGeral.length > 0 ? (
                  <div className="space-y-2">
                    {rankings.rankingGeral.map((closer, index) => (
                      <div
                        key={closer.id}
                        className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                            index === 0 && 'bg-primary text-primary-foreground',
                            index === 1 && 'medal-silver',
                            index === 2 && 'medal-bronze',
                            index > 2 && 'bg-muted text-muted-foreground'
                          )}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{closer.nome}</p>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                              {closer.vendas} vendas • {closer.taxaConversao.toFixed(0)}% conv.
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold" style={{ color: '#F97316' }}>
                            {formatCurrency(closer.volume)}
                          </p>
                          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                            {closer.callsRealizadas} calls
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum dado no período selecionado
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Coluna 2: Destaques + No-Show */}
            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'rgba(249,115,22,0.1)',
                      }}
                    >
                      <Trophy className="h-4 w-4" style={{ color: '#F97316' }} />
                    </div>
                    Destaques
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className="p-4 rounded-xl"
                      style={{
                        background: 'rgba(249, 115, 22, 0.06)',
                        border: '1px solid rgba(249, 115, 22, 0.2)',
                      }}
                    >
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>Top Closer do Dia</p>
                      <p className="font-bold text-lg text-foreground">{rankings?.topCloserDia?.nome || '-'}</p>
                      {rankings?.topCloserDia && (
                        <p className="font-medium" style={{ fontSize: '13px', color: '#F97316' }}>
                          {formatCurrency(rankings.topCloserDia.volume)}
                        </p>
                      )}
                    </div>
                    <div
                      className="p-4 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>Top Closer da Semana</p>
                      <p className="font-bold text-lg text-foreground">{rankings?.topCloserSemana?.nome || '-'}</p>
                      {rankings?.topCloserSemana && (
                        <p className="font-medium" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                          {formatCurrency(rankings.topCloserSemana.volume)}
                        </p>
                      )}
                    </div>
                    <div
                      className="p-4 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>Top Conversão</p>
                      <p className="font-bold text-lg text-foreground">{rankings?.topConversao?.nome || '-'}</p>
                      {rankings?.topConversao && (
                        <p className="font-medium" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                          {rankings.topConversao.taxaConversao.toFixed(1)}%
                        </p>
                      )}
                    </div>
                    <div
                      className="p-4 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>Menor No-Show</p>
                      <p className="font-bold text-lg text-foreground">{rankings?.menorNoShow?.nome || '-'}</p>
                      {rankings?.menorNoShow && (
                        <p className="font-medium" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                          {rankings.menorNoShow.percentNoShow.toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {showNoShowColumn && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'rgba(239,68,68,0.1)',
                        }}
                      >
                        <AlertCircle className="h-4 w-4" style={{ color: '#EF4444' }} />
                      </div>
                      No-Show por Closer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3">
                      {noShowByCloser!.map((closer) => (
                        <div
                          key={closer.id}
                          className="flex items-center justify-between p-4 rounded-xl"
                          style={{ background: 'rgba(255,255,255,0.04)' }}
                        >
                          <div>
                            <p className="font-medium text-foreground">{closer.nome}</p>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                              {closer.noShow} no-shows de {closer.callsAgendadas} agendadas
                            </p>
                          </div>
                          <span
                            className="text-lg font-bold px-3 py-1 rounded-full"
                            style={{
                              background: closer.percentNoShow > 30
                                ? 'rgba(239, 68, 68, 0.12)'
                                : closer.percentNoShow > 15
                                ? 'rgba(251, 191, 36, 0.12)'
                                : 'rgba(34, 197, 94, 0.12)',
                              color: closer.percentNoShow > 30
                                ? '#EF4444'
                                : closer.percentNoShow > 15
                                ? '#FBBF24'
                                : '#22C55E',
                            }}
                          >
                            {closer.percentNoShow.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {/* Origem dos Leads */}
      {canViewSection('section:dashboard:receita') && vendasOrigem && vendasOrigem.length > 0 && (
        <div className="mb-6 mt-6">
          <OrigemLeadCard vendas={vendasOrigem} />
        </div>
      )}
    </AppLayout>
  );
}
