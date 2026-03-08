import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDashboardStats, useCloserRankings, useNoShowByCloser, DateFilter, DateRange } from '@/hooks/useDashboard';
import { useClosers } from '@/hooks/useProfiles';
import { Phone, PhoneOff, TrendingUp, Target, Trophy, Tv, CalendarIcon, AlertCircle, ShoppingCart, RefreshCw, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { OteDashboardCard } from '@/components/ote/OteDashboardCard';
import { ShareDashboardDialog } from '@/components/dashboard/ShareDashboardDialog';
import { useCanAccessAdminPanel } from '@/hooks/useUserRoles';
import { usePermissionChecks } from '@/hooks/useRolePermissions';
import { RevenueCard } from '@/components/dashboard/RevenueCard';
import { SectionLabel } from '@/components/dashboard/SectionLabel';

const filterOptions: { value: DateFilter; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: '7days', label: '7 dias' },
  { value: 'month', label: 'Este mês' },
  { value: '30days', label: '30 dias' },
  { value: 'custom', label: 'Personalizado' },
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

export default function DashboardPage() {
  const [filter, setFilter] = useState<DateFilter>('month');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [tempRange, setTempRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedCloser, setSelectedCloser] = useState<string>('all');

  const canShare = useCanAccessAdminPanel();
  const { canView: canViewSection } = usePermissionChecks();
  const { data: closers } = useClosers();
  const { data: stats, isLoading } = useDashboardStats(filter, customRange, selectedCloser);
  const { data: rankings } = useCloserRankings(filter, customRange, selectedCloser);
  const { data: noShowByCloser } = useNoShowByCloser(filter, customRange);
  const { data: metaMensal } = useTvMetaMensal();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
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

  return (
    <AppLayout>
      <PageHeader
        title="Dashboard Comercial"
        description="Visão geral do desempenho de vendas"
      >
        <div className="flex items-center gap-3 flex-wrap">
          {/* Closer Filter */}
          <Select value={selectedCloser} onValueChange={setSelectedCloser}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por closer" />
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

          <div className="flex gap-1 p-1 bg-muted rounded-lg flex-wrap">
            {filterOptions.map((option) => (
              <Button
                key={option.value}
                variant={filter === option.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleFilterChange(option.value)}
                className="min-w-[70px]"
              >
                {option.value === 'custom' && displayRange ? displayRange : option.label}
              </Button>
            ))}
          </div>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <Calendar
                mode="range"
                selected={{ from: tempRange.from, to: tempRange.to }}
                onSelect={(range) => setTempRange({ from: range?.from, to: range?.to })}
                locale={ptBR}
                numberOfMonths={2}
              />
              <div className="flex justify-end mt-4">
                <Button onClick={handleApplyCustomRange} disabled={!tempRange.from || !tempRange.to}>
                  Aplicar
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          {canShare && <ShareDashboardDialog />}
          <Link to="/tv">
            <Button variant="outline" className="gap-2">
              <Tv className="h-4 w-4" />
              Modo TV
            </Button>
          </Link>
        </div>
      </PageHeader>

      {/* BLOCO 1 — Receita */}
      {canViewSection('section:dashboard:receita') && (
        <>
          <SectionLabel title="Receita" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <RevenueCard
              volumeVendas={stats?.volumeVendas ?? 0}
              totalVendas={stats?.totalVendas ?? 0}
              valorPix={stats?.valorPix ?? 0}
              valorCartao={stats?.valorCartao ?? 0}
              valorBoleto={stats?.valorBoleto ?? 0}
              caixaDoMes={stats?.caixaDoMes ?? 0}
              proporcaoCaixa={stats?.proporcaoCaixa ?? 0}
            />
            <div className="flex flex-col gap-6">
              <StatCard
                title="Ticket Médio"
                value={formatCurrency(stats?.ticketMedio ?? 0)}
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <StatCard
                title="Faturamento por Call"
                value={formatCurrency(stats?.faturamentoPorCall ?? 0)}
                subtitle="Volume / Calls realizadas"
                icon={<TrendingUp className="h-5 w-5" />}
              />
            </div>
          </div>
        </>
      )}
      {canViewSection('section:dashboard:ote') && (
        <div className="mb-6">
          <OteDashboardCard
            monthRef={format(new Date(), 'yyyy-MM')}
            selectedCloser={selectedCloser}
            onCloserChange={setSelectedCloser}
          />
        </div>
      )}

      {/* Meta Mensal (TV) */}
      {canViewSection('section:dashboard:ote') && metaMensal !== undefined && (() => {
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const currentDay = now.getDate();
        const expectedPercent = (currentDay / daysInMonth) * 100;
        const actualPercent = metaMensal > 0 ? ((stats?.volumeVendas ?? 0) / metaMensal * 100) : 0;

        return (
          <div className="mb-10 p-5 rounded-xl bg-card border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Meta Mensal</p>
                <p className="text-xl font-bold">
                  {formatCurrency(stats?.volumeVendas ?? 0)} / {formatCurrency(metaMensal)}
                </p>
              </div>
              <p className="text-3xl font-bold text-primary">
                {actualPercent.toFixed(0)}%
              </p>
            </div>
            <div className="relative">
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-1000',
                    actualPercent >= 100 ? 'bg-success' : 'bg-primary'
                  )}
                  style={{ width: `${Math.min(actualPercent, 100)}%` }}
                />
              </div>
              {/* Ghost ruler - expected progress marker */}
              <div
                className="absolute top-0 h-3 w-0.5 bg-foreground/40"
                style={{ left: `${Math.min(expectedPercent, 100)}%` }}
                title={`Meta esperada: ${expectedPercent.toFixed(0)}% (dia ${currentDay}/${daysInMonth})`}
              />
              <div
                className="absolute top-4 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap"
                style={{ left: `${Math.min(expectedPercent, 100)}%` }}
              >
                Esperado: {expectedPercent.toFixed(0)}%
              </div>
            </div>
          </div>
        );
      })()}

      {/* BLOCO 2 — Performance Comercial */}
      {canViewSection('section:dashboard:performance') && (
        <>
          <SectionLabel title="Performance Comercial" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            <StatCard
              title="Taxa de Conversão"
              value={`${(stats?.taxaConversao ?? 0).toFixed(1)}%`}
              subtitle="Vendas / Calls realizadas"
              icon={<Target className="h-5 w-5" />}
              variant={(stats?.taxaConversao ?? 0) > 15 ? 'success' : undefined}
            />
            <StatCard
              title="Vendas Realizadas"
              value={stats?.totalVendas ?? 0}
              icon={<ShoppingCart className="h-5 w-5" />}
            />
            <StatCard
              title="Calls Realizadas"
              value={stats?.callsRealizadas ?? 0}
              subtitle={`${stats?.callsAgendadas ?? 0} agendadas`}
              icon={<Phone className="h-5 w-5" />}
            />
            <StatCard
              title="% Reagendado"
              value={`${(stats?.percentReagendado ?? 0).toFixed(1)}%`}
              subtitle={`${stats?.reagendados ?? 0} reagendados`}
              icon={<RefreshCw className="h-5 w-5" />}
              variant="warning"
            />
            <StatCard
              title="% No-Show"
              value={`${(stats?.percentNoShow ?? 0).toFixed(1)}%`}
              subtitle={`${stats?.noShows ?? 0} no-shows`}
              icon={<PhoneOff className="h-5 w-5" />}
              variant="destructive"
            />
            <StatCard
              title="% No-Show Total"
              value={`${(stats?.callsAgendadas ?? 0) > 0 ? (((stats?.reagendados ?? 0) + (stats?.noShows ?? 0)) / (stats?.callsAgendadas ?? 1) * 100).toFixed(1) : '0.0'}%`}
              subtitle={`${(stats?.reagendados ?? 0) + (stats?.noShows ?? 0)} total (${stats?.reagendados ?? 0} reag. + ${stats?.noShows ?? 0} no-shows)`}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna 1: Ranking de Closers */}
        <Card>
          <CardHeader>
            <CardTitle>Ranking de Closers</CardTitle>
          </CardHeader>
          <CardContent>
            {rankings?.rankingGeral && rankings.rankingGeral.length > 0 ? (
              <div className="space-y-3">
                {rankings.rankingGeral.map((closer, index) => (
                  <div
                    key={closer.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
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
                        <p className="font-medium">{closer.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {closer.vendas} vendas • {closer.taxaConversao.toFixed(0)}% conv.
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {formatCurrency(closer.volume)}
                      </p>
                      <p className="text-xs text-muted-foreground">
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
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Destaques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-primary/[0.06] border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-1">Top Closer do Dia</p>
                  <p className="font-bold text-lg">{rankings?.topCloserDia?.nome || '-'}</p>
                  {rankings?.topCloserDia && (
                    <p className="text-sm text-primary font-medium">
                      {formatCurrency(rankings.topCloserDia.volume)}
                    </p>
                  )}
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-1">Top Closer da Semana</p>
                  <p className="font-bold text-lg">{rankings?.topCloserSemana?.nome || '-'}</p>
                  {rankings?.topCloserSemana && (
                    <p className="text-sm text-muted-foreground font-medium">
                      {formatCurrency(rankings.topCloserSemana.volume)}
                    </p>
                  )}
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-1">Top Conversão</p>
                  <p className="font-bold text-lg">{rankings?.topConversao?.nome || '-'}</p>
                  {rankings?.topConversao && (
                    <p className="text-sm text-muted-foreground font-medium">
                      {rankings.topConversao.taxaConversao.toFixed(1)}%
                    </p>
                  )}
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-1">Menor No-Show</p>
                  <p className="font-bold text-lg">{rankings?.menorNoShow?.nome || '-'}</p>
                  {rankings?.menorNoShow && (
                    <p className="text-sm text-muted-foreground font-medium">
                      {rankings.menorNoShow.percentNoShow.toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedCloser === 'all' && noShowByCloser && noShowByCloser.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  No-Show por Closer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  {noShowByCloser.map((closer) => (
                    <div
                      key={closer.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30"
                    >
                      <div>
                        <p className="font-medium">{closer.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {closer.noShow} no-shows de {closer.callsAgendadas} agendadas
                        </p>
                      </div>
                      <div className={cn(
                        "text-lg font-bold px-3 py-1 rounded-full",
                        closer.percentNoShow > 30 ? "bg-destructive/20 text-destructive" :
                        closer.percentNoShow > 15 ? "bg-warning/20 text-warning" :
                        "bg-success/20 text-success"
                      )}>
                        {closer.percentNoShow.toFixed(1)}%
                      </div>
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
    </AppLayout>
  );
}
