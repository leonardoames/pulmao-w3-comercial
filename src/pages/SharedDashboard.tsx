import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, PhoneOff, DollarSign, TrendingUp, Target, Trophy, BarChart3, Users, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SharedDashboard() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['shared-dashboard', token],
    queryFn: async () => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-share-token?token=${token}`;
      const res = await fetch(url, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao carregar dashboard');
      }

      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Link inválido</h2>
            <p className="text-muted-foreground">
              {(error as Error)?.message || 'Este link de compartilhamento não é válido, foi desativado ou expirou.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = data.stats;
  const rankingGeral = data.rankingGeral || [];
  const noShowByCloser = data.noShowByCloser || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Pulmão W3</h1>
            <p className="text-sm text-muted-foreground">Dashboard Comercial — Visualização Compartilhada</p>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
            {data.periodo}
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Volume de Vendas" value={formatCurrency(stats.volumeVendas)} subtitle={`${stats.totalVendas} vendas`} icon={<DollarSign className="h-5 w-5" />} variant="primary" />
          <StatCard title="Ticket Médio" value={formatCurrency(stats.ticketMedio)} icon={<TrendingUp className="h-5 w-5" />} />
          <StatCard title="Taxa de Conversão" value={`${stats.taxaConversao.toFixed(1)}%`} subtitle="Vendas / Calls realizadas" icon={<Target className="h-5 w-5" />} variant="success" />
          <StatCard title="% No-Show" value={`${stats.percentNoShow.toFixed(1)}%`} subtitle={`${stats.noShows} no-shows`} icon={<PhoneOff className="h-5 w-5" />} variant="destructive" />
        </div>

        {/* Stats Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Valor em Pix" value={formatCurrency(stats.valorPix)} icon={<DollarSign className="h-5 w-5" />} variant="success" />
          <StatCard title="Valor em Cartão" value={formatCurrency(stats.valorCartao)} icon={<DollarSign className="h-5 w-5" />} />
          <StatCard title="Valor em Boleto" value={formatCurrency(stats.valorBoleto)} icon={<DollarSign className="h-5 w-5" />} />
          <StatCard title="Caixa do Mês" value={formatCurrency(stats.caixaDoMes)} subtitle={`${stats.proporcaoCaixa.toFixed(0)}% do volume`} icon={<BarChart3 className="h-5 w-5" />} variant="primary" />
        </div>

        {/* Stats Row 3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Calls Realizadas" value={stats.callsRealizadas} icon={<Phone className="h-5 w-5" />} variant="success" />
          <StatCard title="Faturamento por Call" value={formatCurrency(stats.faturamentoPorCall)} subtitle="Volume / Calls realizadas" icon={<TrendingUp className="h-5 w-5" />} />
          <StatCard title="Vendas Realizadas" value={stats.totalVendas} icon={<Users className="h-5 w-5" />} />
        </div>

        {/* No-show by closer */}
        {noShowByCloser.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                No-Show por Closer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {noShowByCloser.map((closer: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
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

        {/* Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Ranking de Closers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rankingGeral.length > 0 ? (
              <div className="space-y-3">
                {rankingGeral.map((closer: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
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
                      <p className="font-bold text-primary">{formatCurrency(closer.volume)}</p>
                      <p className="text-xs text-muted-foreground">{closer.callsRealizadas} calls</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhum dado no período</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
