import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useContentDailyLogs } from '@/hooks/useContentTracking';
import { RESPONSIBLE_OPTIONS } from '@/types/content';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, subDays, startOfMonth, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type PeriodFilter = '7d' | '30d' | 'month';

const POSTS_PER_DAY = 6;
const STORIES_PER_DAY = 10;

export default function ConteudoDashboard() {
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all');
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

  const { data: logs = [] } = useContentDailyLogs(
    startDate,
    endDate,
    responsibleFilter !== 'all' ? responsibleFilter : undefined
  );

  const daysInPeriod = useMemo(() => {
    return differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;
  }, [startDate, endDate]);

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => a.date.localeCompare(b.date));
  }, [logs]);

  const stats = useMemo(() => {
    const totalPosts = logs.reduce((s, l) => s + l.posts_published_count, 0);
    const totalStories = logs.reduce((s, l) => s + l.stories_done_count, 0);
    const totalScheduled = logs.reduce((s, l) => s + l.posts_scheduled_count, 0);

    const postsMeta = daysInPeriod * POSTS_PER_DAY;
    const storiesMeta = daysInPeriod * STORIES_PER_DAY;
    const postsPercent = postsMeta > 0 ? (totalPosts / postsMeta) * 100 : 0;
    const storiesPercent = storiesMeta > 0 ? (totalStories / storiesMeta) * 100 : 0;

    const first = sortedLogs[0];
    const last = sortedLogs[sortedLogs.length - 1];
    const followersLeoGained = first && last ? last.followers_leo - first.followers_leo : 0;
    const followersW3Gained = first && last ? last.followers_w3 - first.followers_w3 : 0;

    return { totalPosts, totalStories, totalScheduled, postsMeta, storiesMeta, postsPercent, storiesPercent, followersLeoGained, followersW3Gained };
  }, [logs, daysInPeriod, sortedLogs]);

  const chartData = useMemo(() => {
    return sortedLogs.map(l => ({
      date: format(new Date(l.date + 'T12:00:00'), 'dd/MM', { locale: ptBR }),
      posts: l.posts_published_count,
      stories: l.stories_done_count,
      leo: l.followers_leo,
      w3: l.followers_w3,
    }));
  }, [sortedLogs]);

  const barChartConfig = {
    posts: { label: 'Posts', color: 'hsl(var(--primary))' },
    stories: { label: 'Stories', color: 'hsl(var(--warning))' },
  };

  const lineChartConfig = {
    leo: { label: '@leo', color: 'hsl(var(--primary))' },
    w3: { label: '@w3', color: 'hsl(var(--warning))' },
  };

  const filterButtons: { value: PeriodFilter; label: string }[] = [
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' },
    { value: 'month', label: 'Mês' },
  ];

  const tableLogs = useMemo(() => {
    return [...logs].sort((a, b) => b.date.localeCompare(a.date));
  }, [logs]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
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

        {/* Row 1 – KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Posts publicados */}
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Posts publicados</p>
              <p className="text-3xl font-bold mt-1">{stats.totalPosts}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Meta: {stats.postsMeta} · <span className={cn(stats.postsPercent >= 100 ? 'text-success' : 'text-primary')}>{stats.postsPercent.toFixed(0)}%</span>
              </p>
            </CardContent>
          </Card>

          {/* Stories */}
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stories realizados</p>
              <p className="text-3xl font-bold mt-1">{stats.totalStories}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Meta: {stats.storiesMeta} · <span className={cn(stats.storiesPercent >= 100 ? 'text-success' : 'text-primary')}>{stats.storiesPercent.toFixed(0)}%</span>
              </p>
            </CardContent>
          </Card>

          {/* Agendados */}
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Posts agendados</p>
              <p className="text-3xl font-bold mt-1">{stats.totalScheduled}</p>
            </CardContent>
          </Card>

          {/* Seguidores ganhos */}
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Seguidores ganhos</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md bg-muted/30 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground">@leo</p>
                  <p className="text-lg font-bold">
                    {stats.followersLeoGained >= 0 ? '+' : ''}{stats.followersLeoGained.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="rounded-md bg-muted/30 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground">@w3</p>
                  <p className="text-lg font-bold">
                    {stats.followersW3Gained >= 0 ? '+' : ''}{stats.followersW3Gained.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 2 – Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Posts e Stories por dia</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
              ) : (
                <ChartContainer config={barChartConfig} className="h-48 w-full">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="posts" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="stories" fill="hsl(var(--warning))" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Crescimento de seguidores</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
              ) : (
                <ChartContainer config={lineChartConfig} className="h-48 w-full">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="leo" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="w3" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 3 – Summary Table */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Histórico do período</CardTitle>
            <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {RESPONSIBLE_OPTIONS.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {tableLogs.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Nenhum registro no período</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Data</TableHead>
                      <TableHead className="text-xs text-center">Posts</TableHead>
                      <TableHead className="text-xs text-center">Agendados</TableHead>
                      <TableHead className="text-xs text-center">Stories</TableHead>
                      <TableHead className="text-xs text-center">YouTube</TableHead>
                      <TableHead className="text-xs text-center">Seg. Leo</TableHead>
                      <TableHead className="text-xs text-center">Seg. W3</TableHead>
                      <TableHead className="text-xs">Responsável</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableLogs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs">
                          {format(new Date(log.date + 'T12:00:00'), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-xs text-center">{log.posts_published_count}</TableCell>
                        <TableCell className="text-xs text-center">{log.posts_scheduled_count}</TableCell>
                        <TableCell className="text-xs text-center">{log.stories_done_count}</TableCell>
                        <TableCell className="text-xs text-center">{log.youtube_videos_published_count}</TableCell>
                        <TableCell className="text-xs text-center">{log.followers_leo.toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="text-xs text-center">{log.followers_w3.toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="text-xs">{log.responsible_name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
