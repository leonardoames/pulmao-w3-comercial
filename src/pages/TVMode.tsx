import { useState, useEffect } from 'react';
import { useDashboardStats, useCloserRankings, DateFilter } from '@/hooks/useDashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Trophy, TrendingUp, Target, Phone, Settings, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';

export default function TVModePage() {
  const [filter] = useState<DateFilter>('month');
  const [metaSemanal, setMetaSemanal] = useState<number>(100000);
  const [showSettings, setShowSettings] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { theme, setTheme } = useTheme();

  const { data: stats, refetch: refetchStats } = useDashboardStats(filter);
  const { data: rankings, refetch: refetchRankings } = useCloserRankings(filter);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchStats();
      refetchRankings();
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [refetchStats, refetchRankings]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const progressoMeta = metaSemanal > 0 ? ((stats?.volumeVendas || 0) / metaSemanal) * 100 : 0;

  return (
    <div className="tv-mode min-h-screen bg-background p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-primary">Pulmão</span> W3
          </h1>
          <p className="text-muted-foreground">Dashboard ao Vivo</p>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-5 w-5" />
          </Button>
          <Link to="/">
            <Button variant="outline" size="icon">
              <X className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="mb-8 p-4 rounded-lg bg-card border">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Meta Semanal:</label>
            <Input
              type="number"
              value={metaSemanal}
              onChange={(e) => setMetaSemanal(Number(e.target.value) || 0)}
              className="w-40"
            />
          </div>
        </div>
      )}

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="tv-stat-card">
          <p className="tv-stat-label mb-2">Volume de Vendas</p>
          <p className="tv-stat-value text-primary">
            {formatCurrency(stats?.volumeVendas || 0)}
          </p>
          <p className="text-lg text-muted-foreground mt-2">
            {stats?.totalVendas || 0} vendas
          </p>
        </div>

        <div className="tv-stat-card">
          <p className="tv-stat-label mb-2">Calls Realizadas</p>
          <p className="tv-stat-value text-success">
            {stats?.callsRealizadas || 0}
          </p>
          <p className="text-lg text-muted-foreground mt-2">
            {stats?.callsAgendadas || 0} agendadas
          </p>
        </div>

        <div className="tv-stat-card">
          <p className="tv-stat-label mb-2">Taxa de Conversão</p>
          <p className="tv-stat-value">
            {(stats?.taxaConversao || 0).toFixed(1)}%
          </p>
        </div>

        <div className="tv-stat-card">
          <p className="tv-stat-label mb-2">% No-Show</p>
          <p className={cn(
            "tv-stat-value",
            (stats?.percentNoShow || 0) > 20 ? "text-destructive" : "text-success"
          )}>
            {(stats?.percentNoShow || 0).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Meta Progress */}
      <div className="mb-8 p-6 rounded-2xl bg-card border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xl font-medium text-muted-foreground">Progresso da Meta Semanal</p>
            <p className="text-3xl font-bold">
              {formatCurrency(stats?.volumeVendas || 0)} / {formatCurrency(metaSemanal)}
            </p>
          </div>
          <p className="text-5xl font-bold text-primary">
            {progressoMeta.toFixed(0)}%
          </p>
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000",
              progressoMeta >= 100 ? "bg-success" : "bg-primary"
            )}
            style={{ width: `${Math.min(progressoMeta, 100)}%` }}
          />
        </div>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Top Closer do Dia */}
        <div className="p-6 rounded-2xl bg-primary/10 border-2 border-primary/30">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="h-8 w-8 text-primary" />
            <p className="text-xl font-medium">Top do Dia</p>
          </div>
          <p className="text-4xl font-bold mb-2">
            {rankings?.topCloserDia?.nome || '-'}
          </p>
          {rankings?.topCloserDia && (
            <p className="text-2xl text-primary font-medium">
              {formatCurrency(rankings.topCloserDia.volume)}
            </p>
          )}
        </div>

        {/* Top Closer da Semana */}
        <div className="p-6 rounded-2xl bg-primary/10 border-2 border-primary/30">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="h-8 w-8 text-primary" />
            <p className="text-xl font-medium">Top da Semana</p>
          </div>
          <p className="text-4xl font-bold mb-2">
            {rankings?.topCloserSemana?.nome || '-'}
          </p>
          {rankings?.topCloserSemana && (
            <p className="text-2xl text-primary font-medium">
              {formatCurrency(rankings.topCloserSemana.volume)}
            </p>
          )}
        </div>

        {/* Top Conversão */}
        <div className="p-6 rounded-2xl bg-success/10 border-2 border-success/30">
          <div className="flex items-center gap-3 mb-4">
            <Target className="h-8 w-8 text-success" />
            <p className="text-xl font-medium">Top Conversão</p>
          </div>
          <p className="text-4xl font-bold mb-2">
            {rankings?.topConversao?.nome || '-'}
          </p>
          {rankings?.topConversao && (
            <p className="text-2xl text-success font-medium">
              {rankings.topConversao.taxaConversao.toFixed(1)}%
            </p>
          )}
        </div>

        {/* Menor No-Show */}
        <div className="p-6 rounded-2xl bg-info/10 border-2 border-info/30">
          <div className="flex items-center gap-3 mb-4">
            <Phone className="h-8 w-8 text-info" />
            <p className="text-xl font-medium">Menor No-Show</p>
          </div>
          <p className="text-4xl font-bold mb-2">
            {rankings?.menorNoShow?.nome || '-'}
          </p>
          {rankings?.menorNoShow && (
            <p className="text-2xl text-info font-medium">
              {rankings.menorNoShow.percentNoShow.toFixed(1)}%
            </p>
          )}
        </div>
      </div>

      {/* Full Ranking */}
      {rankings?.rankingGeral && rankings.rankingGeral.length > 0 && (
        <div className="mt-8 p-6 rounded-2xl bg-card border">
          <h3 className="text-2xl font-bold mb-6">Ranking Geral</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rankings.rankingGeral.slice(0, 6).map((closer, index) => (
              <div
                key={closer.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-muted/50"
              >
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl',
                  index === 0 && 'bg-primary text-primary-foreground',
                  index === 1 && 'medal-silver',
                  index === 2 && 'medal-bronze',
                  index > 2 && 'bg-muted text-muted-foreground'
                )}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-xl font-bold">{closer.nome}</p>
                  <p className="text-muted-foreground">
                    {closer.vendas} vendas • {closer.taxaConversao.toFixed(0)}% conv.
                  </p>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(closer.volume)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
