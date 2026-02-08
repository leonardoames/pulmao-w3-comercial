import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDashboardStats, useCloserRanking, DateFilter, useFunilStats } from '@/hooks/useDashboard';
import { useLeads } from '@/hooks/useLeads';
import { useCalls } from '@/hooks/useCalls';
import { useVendas } from '@/hooks/useVendas';
import { useClosers } from '@/hooks/useProfiles';
import { STATUS_FUNIL_LABELS } from '@/types/crm';
import { cn } from '@/lib/utils';

const filterOptions: { value: DateFilter; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7days', label: '7 dias' },
  { value: 'month', label: 'Este mês' },
];

export default function PerformancePage() {
  const [filter, setFilter] = useState<DateFilter>('month');
  const { data: stats } = useDashboardStats(filter);
  const { data: ranking } = useCloserRanking(filter);
  const { data: funilStats } = useFunilStats();
  const { data: closers } = useClosers();
  const { data: leads } = useLeads();
  const { data: calls } = useCalls();
  const { data: vendas } = useVendas();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calcular performance por closer
  const closerPerformance = closers?.map(closer => {
    const closerLeads = leads?.filter(l => l.closer_responsavel_user_id === closer.id).length || 0;
    const closerCalls = calls?.filter(c => c.closer_user_id === closer.id && c.status === 'Realizada').length || 0;
    const closerVendas = vendas?.filter(v => v.closer_user_id === closer.id) || [];
    const closerFaturamento = closerVendas.reduce((sum, v) => sum + Number(v.valor_total), 0);
    const ticketMedio = closerVendas.length > 0 ? closerFaturamento / closerVendas.length : 0;
    const taxaConversao = closerCalls > 0 ? (closerVendas.length / closerCalls) * 100 : 0;

    return {
      id: closer.id,
      nome: closer.nome,
      leads: closerLeads,
      callsRealizadas: closerCalls,
      vendas: closerVendas.length,
      faturamento: closerFaturamento,
      ticketMedio,
      taxaConversao,
    };
  }).sort((a, b) => b.faturamento - a.faturamento);

  return (
    <AppLayout>
      <PageHeader
        title="Performance Comercial"
        description="Métricas detalhadas do time comercial"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Funil de Vendas */}
        <Card>
          <CardHeader>
            <CardTitle>Funil de Vendas (Geral)</CardTitle>
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
                        <span className="font-medium">{count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
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
              <p className="text-muted-foreground text-center py-8">Carregando...</p>
            )}
          </CardContent>
        </Card>

        {/* Métricas Gerais */}
        <Card>
          <CardHeader>
            <CardTitle>Métricas do Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-primary">{(stats?.taxaConversao ?? 0).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Vendas / Calls realizadas</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Taxa de No-Show</p>
                <p className="text-2xl font-bold text-destructive">{(stats?.taxaNoShow ?? 0).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">No-show / Total de calls</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">{formatCurrency(stats?.ticketMedio ?? 0)}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Faturamento</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(stats?.faturamento ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Performance por Closer */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Closer</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Closer</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Calls Realizadas</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Taxa Conversão</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-right">Ticket Médio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {closerPerformance?.map((closer, index) => (
                <TableRow key={closer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                        index === 0 && 'bg-yellow-400 text-yellow-900',
                        index === 1 && 'bg-gray-300 text-gray-700',
                        index === 2 && 'bg-amber-600 text-amber-100',
                        index > 2 && 'bg-muted text-muted-foreground'
                      )}>
                        {index + 1}
                      </div>
                      <span className="font-medium">{closer.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{closer.leads}</TableCell>
                  <TableCell className="text-right">{closer.callsRealizadas}</TableCell>
                  <TableCell className="text-right">{closer.vendas}</TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      closer.taxaConversao >= 30 && 'text-success',
                      closer.taxaConversao < 30 && closer.taxaConversao >= 15 && 'text-warning',
                      closer.taxaConversao < 15 && 'text-destructive'
                    )}>
                      {closer.taxaConversao.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold text-success">
                    {formatCurrency(closer.faturamento)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(closer.ticketMedio)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
