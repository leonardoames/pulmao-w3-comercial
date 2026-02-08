import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDashboardStats, useCloserRanking, DateFilter, useFunilStats } from '@/hooks/useDashboard';
import { Users, Phone, PhoneOff, DollarSign, TrendingUp, Target, Trophy, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_FUNIL_LABELS } from '@/types/crm';

const filterOptions: { value: DateFilter; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7days', label: '7 dias' },
  { value: 'month', label: 'Este mês' },
];

export default function DashboardPage() {
  const [filter, setFilter] = useState<DateFilter>('month');
  const { data: stats, isLoading } = useDashboardStats(filter);
  const { data: ranking } = useCloserRanking(filter);
  const { data: funilStats } = useFunilStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Dashboard CEO"
        description="Visão geral do desempenho comercial"
      >
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              variant={filter === option.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter(option.value)}
              className="min-w-[80px]"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Leads Novos"
          value={stats?.leadsNovos ?? 0}
          icon={<Users className="h-5 w-5" />}
          variant="primary"
        />
        <StatCard
          title="Calls Agendadas"
          value={stats?.callsAgendadas ?? 0}
          icon={<Clock className="h-5 w-5" />}
          variant="warning"
        />
        <StatCard
          title="Calls Realizadas"
          value={stats?.callsRealizadas ?? 0}
          icon={<Phone className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="No-Show"
          value={stats?.noShows ?? 0}
          subtitle={`${(stats?.taxaNoShow ?? 0).toFixed(1)}% taxa`}
          icon={<PhoneOff className="h-5 w-5" />}
          variant="destructive"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Taxa de Conversão"
          value={`${(stats?.taxaConversao ?? 0).toFixed(1)}%`}
          subtitle="Vendas / Calls realizadas"
          icon={<Target className="h-5 w-5" />}
          variant="primary"
        />
        <StatCard
          title="Faturamento Contratado"
          value={formatCurrency(stats?.faturamento ?? 0)}
          subtitle={`${stats?.totalVendas ?? 0} vendas`}
          icon={<DollarSign className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Ticket Médio"
          value={formatCurrency(stats?.ticketMedio ?? 0)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking de Closers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-warning" />
              Ranking de Closers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ranking && ranking.length > 0 ? (
              <div className="space-y-4">
                {ranking.map((closer, index) => (
                  <div
                    key={closer.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                        index === 0 && 'bg-yellow-400 text-yellow-900',
                        index === 1 && 'bg-gray-300 text-gray-700',
                        index === 2 && 'bg-amber-600 text-amber-100',
                        index > 2 && 'bg-muted text-muted-foreground'
                      )}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{closer.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {closer.vendas} {closer.vendas === 1 ? 'venda' : 'vendas'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-success">
                        {formatCurrency(closer.faturamento)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma venda no período selecionado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Funil de Vendas */}
        <Card>
          <CardHeader>
            <CardTitle>Funil de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            {funilStats ? (
              <div className="space-y-3">
                {Object.entries(funilStats).map(([status, count]) => {
                  const total = Object.values(funilStats).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{STATUS_FUNIL_LABELS[status as keyof typeof STATUS_FUNIL_LABELS]}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            status === 'Novo' && 'bg-info',
                            status === 'ContatoFeito' && 'bg-purple-500',
                            status === 'CallAgendada' && 'bg-warning',
                            status === 'CallRealizada' && 'bg-emerald-400',
                            status === 'NoShow' && 'bg-destructive',
                            status === 'Perdido' && 'bg-muted-foreground',
                            status === 'Ganho' && 'bg-success'
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Carregando...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
