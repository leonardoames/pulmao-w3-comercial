import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDashboardStats, useCloserRankings, DateFilter, DateRange, getDateRange } from '@/hooks/useDashboard';
import { Phone, PhoneOff, DollarSign, TrendingUp, Target, Trophy, Tv, CalendarIcon, BarChart3, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const filterOptions: { value: DateFilter; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: '7days', label: '7 dias' },
  { value: 'month', label: 'Este mês' },
  { value: '30days', label: '30 dias' },
  { value: 'custom', label: 'Personalizado' },
];

export default function DashboardPage() {
  const [filter, setFilter] = useState<DateFilter>('month');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [tempRange, setTempRange] = useState<{ from?: Date; to?: Date }>({});

  const { data: stats, isLoading } = useDashboardStats(filter, customRange);
  const { data: rankings } = useCloserRankings(filter, customRange);

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
        <div className="flex items-center gap-3">
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
          <Link to="/tv">
            <Button variant="outline" className="gap-2">
              <Tv className="h-4 w-4" />
              Modo TV
            </Button>
          </Link>
        </div>
      </PageHeader>

      {/* Stats Cards - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Volume de Vendas"
          value={formatCurrency(stats?.volumeVendas ?? 0)}
          subtitle={`${stats?.totalVendas ?? 0} vendas`}
          icon={<DollarSign className="h-5 w-5" />}
          variant="primary"
        />
        <StatCard
          title="Ticket Médio"
          value={formatCurrency(stats?.ticketMedio ?? 0)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Calls Realizadas"
          value={stats?.callsRealizadas ?? 0}
          subtitle={`${stats?.callsAgendadas ?? 0} agendadas`}
          icon={<Phone className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="% No-Show"
          value={`${(stats?.percentNoShow ?? 0).toFixed(1)}%`}
          subtitle={`${stats?.noShows ?? 0} no-shows`}
          icon={<PhoneOff className="h-5 w-5" />}
          variant="destructive"
        />
      </div>

      {/* Stats Cards - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Taxa de Conversão"
          value={`${(stats?.taxaConversao ?? 0).toFixed(1)}%`}
          subtitle="Vendas / Calls realizadas"
          icon={<Target className="h-5 w-5" />}
          variant="primary"
        />
        <StatCard
          title="Faturamento por Call"
          value={formatCurrency(stats?.faturamentoPorCall ?? 0)}
          subtitle="Volume / Calls realizadas"
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <StatCard
          title="Vendas Realizadas"
          value={stats?.totalVendas ?? 0}
          icon={<Users className="h-5 w-5" />}
          variant="success"
        />
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Rankings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Destaques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Top Closer do Dia</p>
                <p className="font-bold text-lg">{rankings?.topCloserDia?.nome || '-'}</p>
                {rankings?.topCloserDia && (
                  <p className="text-sm text-primary font-medium">
                    {formatCurrency(rankings.topCloserDia.volume)}
                  </p>
                )}
              </div>
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Top Closer da Semana</p>
                <p className="font-bold text-lg">{rankings?.topCloserSemana?.nome || '-'}</p>
                {rankings?.topCloserSemana && (
                  <p className="text-sm text-primary font-medium">
                    {formatCurrency(rankings.topCloserSemana.volume)}
                  </p>
                )}
              </div>
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <p className="text-sm text-muted-foreground mb-1">Top Conversão</p>
                <p className="font-bold text-lg">{rankings?.topConversao?.nome || '-'}</p>
                {rankings?.topConversao && (
                  <p className="text-sm text-success font-medium">
                    {rankings.topConversao.taxaConversao.toFixed(1)}%
                  </p>
                )}
              </div>
              <div className="p-4 rounded-lg bg-info/10 border border-info/20">
                <p className="text-sm text-muted-foreground mb-1">Menor No-Show</p>
                <p className="font-bold text-lg">{rankings?.menorNoShow?.nome || '-'}</p>
                {rankings?.menorNoShow && (
                  <p className="text-sm text-info font-medium">
                    {rankings.menorNoShow.percentNoShow.toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Full Ranking */}
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
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                        index === 0 && 'bg-primary text-primary-foreground',
                        index === 1 && 'bg-gray-300 text-gray-700',
                        index === 2 && 'bg-amber-600 text-amber-100',
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
      </div>
    </AppLayout>
  );
}
