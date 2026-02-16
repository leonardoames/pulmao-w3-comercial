import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useContentDailyLogs } from '@/hooks/useContentTracking';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { BarChart3, Users, Calendar, Film, Target, Youtube } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type PeriodFilter = '7d' | '30d' | 'month';

export default function ConteudoDashboard() {
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const today = new Date();

  const { startDate, endDate } = useMemo(() => {
    switch (period) {
      case '7d':
        return { startDate: format(subDays(today, 6), 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') };
      case '30d':
        return { startDate: format(subDays(today, 29), 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') };
      case 'month':
      default:
        return { startDate: format(startOfMonth(today), 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') };
    }
  }, [period]);

  const { data: logs = [] } = useContentDailyLogs(startDate, endDate);

  const stats = useMemo(() => {
    const totalPosts = logs.reduce((s, l) => s + l.posts_published_count, 0);
    const totalFollowers = logs.reduce((s, l) => s + l.followers_gained, 0);
    const totalScheduled = logs.reduce((s, l) => s + l.posts_scheduled_count, 0);
    const totalStories = logs.reduce((s, l) => s + l.stories_done_count, 0);
    const totalYoutube = logs.reduce((s, l) => s + l.youtube_videos_published_count, 0);
    const daysInPeriod = logs.length || 1;
    const avgPostsPerDay = totalPosts / daysInPeriod;
    const metaPercent = (avgPostsPerDay / 6) * 100;

    return { totalPosts, totalFollowers, totalScheduled, totalStories, totalYoutube, avgPostsPerDay, metaPercent };
  }, [logs]);

  const chartData = useMemo(() => {
    return [...logs].reverse().map(l => ({
      date: format(new Date(l.date + 'T12:00:00'), 'dd/MM', { locale: ptBR }),
      seguidores: l.followers_gained,
      posts: l.posts_published_count,
      stories: l.stories_done_count,
    }));
  }, [logs]);

  const chartConfig = {
    seguidores: { label: 'Seguidores', color: 'hsl(var(--primary))' },
    posts: { label: 'Publicações', color: 'hsl(var(--primary))' },
    stories: { label: 'Stories', color: 'hsl(var(--warning))' },
  };

  const filterButtons: { value: PeriodFilter; label: string }[] = [
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' },
    { value: 'month', label: 'Mês' },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <PageHeader title="Dashboard de Conteúdo" description="Visão geral do desempenho de conteúdo" />
          <div className="flex gap-1 bg-card rounded-lg p-1">
            {filterButtons.map(f => (
              <Button
                key={f.value}
                variant={period === f.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPeriod(f.value)}
                className={cn(period === f.value && 'bg-primary text-primary-foreground')}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Publicações no mês" value={stats.totalPosts} icon={<BarChart3 className="h-5 w-5" />} />
          <StatCard title="Seguidores ganhos" value={stats.totalFollowers} icon={<Users className="h-5 w-5" />} />
          <StatCard title="Publicações agendadas" value={stats.totalScheduled} icon={<Calendar className="h-5 w-5" />} />
          <StatCard title="Stories realizados" value={stats.totalStories} icon={<Film className="h-5 w-5" />} />
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Meta de publicações</p>
              </div>
              <p className="text-2xl font-bold">6/dia</p>
              <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                <p>Média/dia: {stats.avgPostsPerDay.toFixed(1)}</p>
                <p>{stats.metaPercent.toFixed(0)}% da meta</p>
              </div>
            </CardContent>
          </Card>
          <StatCard title="Vídeos no YouTube" value={stats.totalYoutube} icon={<Youtube className="h-5 w-5" />} />
        </div>

        {/* Growth Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Crescimento de Seguidores</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                Nenhum dado registrado no período
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="seguidores" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Posts & Stories Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Publicações por dia</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
              ) : (
                <ChartContainer config={chartConfig} className="h-48 w-full">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="posts" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Stories por dia</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
              ) : (
                <ChartContainer config={chartConfig} className="h-48 w-full">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="stories" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
