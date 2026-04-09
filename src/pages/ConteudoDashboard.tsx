import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { SectionLabel } from '@/components/dashboard/SectionLabel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useContentDailyLogs } from '@/hooks/useContentTracking';
import { RESPONSIBLE_OPTIONS } from '@/types/content';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
import { DateFilter, DateRange } from '@/hooks/useDashboard';
import { format, subDays, startOfMonth, differenceInDays, parseISO, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, FileText, Film, CalendarCheck, RefreshCw, Instagram } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useInstagramDailyMetrics, useInstagramPostInsights, useInstagramSync } from '@/hooks/useInstagram';

const POSTS_PER_DAY = 6;
const STORIES_PER_DAY = 10;

const filterOptions: { value: DateFilter; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: '7days', label: '7 dias' },
  { value: 'month', label: 'Este mês' },
  { value: '30days', label: '30 dias' },
  { value: 'custom', label: 'Personalizado' },
];

const getVariant = (percent: number): 'success' | 'warning' | 'primary' => {
  if (percent >= 100) return 'success';
  if (percent < 75) return 'warning';
  return 'primary';
};

const getPillLabel = (percent: number): string => {
  if (percent >= 100) return 'Meta atingida!';
  if (percent < 75) return 'Abaixo da meta';
  return 'Dentro da meta';
};

const getPillClass = (percent: number): string => {
  if (percent >= 100) return 'trend-pill-positive';
  if (percent < 75) return 'trend-pill-negative';
  return 'trend-pill';
};

export default function ConteudoDashboard() {
  const [filter, setFilter] = useState<DateFilter>('month');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [tempRange, setTempRange] = useState<{ from?: Date; to?: Date }>({});
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all');
  const today = new Date();

  const { startDate, endDate } = useMemo(() => {
    switch (filter) {
      case 'today':
        return { startDate: format(today, 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') };
      case 'yesterday': {
        const y = subDays(today, 1);
        return { startDate: format(y, 'yyyy-MM-dd'), endDate: format(y, 'yyyy-MM-dd') };
      }
      case '7days':
        return { startDate: format(subDays(today, 6), 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') };
      case '30days':
        return { startDate: format(subDays(today, 29), 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') };
      case 'custom':
        if (customRange) {
          return { startDate: format(customRange.start, 'yyyy-MM-dd'), endDate: format(customRange.end, 'yyyy-MM-dd') };
        }
        return { startDate: format(startOfMonth(today), 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') };
      case 'month':
      default:
        return { startDate: format(startOfMonth(today), 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') };
    }
  }, [filter, customRange]);

  const { data: logs = [] } = useContentDailyLogs(
    startDate,
    endDate,
    responsibleFilter !== 'all' ? responsibleFilter : undefined
  );

  const { data: igMetrics = [] } = useInstagramDailyMetrics(startDate, endDate);
  const { data: igPosts = [] } = useInstagramPostInsights(undefined, 20);
  const syncInstagram = useInstagramSync();

  const daysInPeriod = useMemo(() => differenceInDays(parseISO(endDate), parseISO(startDate)) + 1, [startDate, endDate]);

  const sortedLogs = useMemo(() => [...logs].sort((a, b) => a.date.localeCompare(b.date)), [logs]);

  const allDays = useMemo(() => eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) }), [startDate, endDate]);
  const logMap = useMemo(() => new Map(sortedLogs.map(l => [l.date, l])), [sortedLogs]);

  const stats = useMemo(() => {
    const totalPosts = logs.reduce((s, l) => s + l.posts_published_count, 0);
    const totalStories = logs.reduce((s, l) => s + l.stories_done_count, 0);
    const totalScheduled = logs.reduce((s, l) => s + l.posts_scheduled_count, 0);

    const postsMeta = daysInPeriod * POSTS_PER_DAY;
    const storiesMeta = daysInPeriod * STORIES_PER_DAY;
    const postsPercent = postsMeta > 0 ? (totalPosts / postsMeta) * 100 : 0;
    const storiesPercent = storiesMeta > 0 ? (totalStories / storiesMeta) * 100 : 0;

    const sortedByDate = [...logs].sort((a, b) => a.date.localeCompare(b.date));
    const firstLog = sortedByDate[0];
    const lastLog = sortedByDate[sortedByDate.length - 1];
    const totalLeoVar = firstLog && lastLog ? lastLog.followers_leo - firstLog.followers_leo : 0;
    const totalW3Var = firstLog && lastLog ? lastLog.followers_w3 - firstLog.followers_w3 : 0;

    return { totalPosts, totalStories, totalScheduled, postsMeta, storiesMeta, postsPercent, storiesPercent, totalLeoVar, totalW3Var };
  }, [logs, daysInPeriod]);

  const postsChartData = useMemo(() => {
    return allDays.map(day => {
      const key = format(day, 'yyyy-MM-dd');
      const log = logMap.get(key);
      return {
        date: format(day, 'dd/MM', { locale: ptBR }),
        posts: log?.posts_published_count ?? 0,
        stories: log?.stories_done_count ?? 0,
        agendados: log?.posts_scheduled_count ?? 0,
      };
    });
  }, [allDays, logMap]);

  const followersChartData = useMemo(() => {
    return allDays.map((day, i) => {
      const key = format(day, 'yyyy-MM-dd');
      const log = logMap.get(key);
      const prevKey = i > 0 ? format(allDays[i - 1], 'yyyy-MM-dd') : null;
      const prevLog = prevKey ? logMap.get(prevKey) : null;
      return {
        date: format(day, 'dd/MM', { locale: ptBR }),
        leo: log && prevLog ? log.followers_leo - prevLog.followers_leo : 0,
        w3: log && prevLog ? log.followers_w3 - prevLog.followers_w3 : 0,
      };
    });
  }, [allDays, logMap]);

  const avgEngagement = useMemo(() => {
    const posts = igPosts.filter(p => p.media_type !== 'STORY');
    return posts.length > 0
      ? Math.round(posts.reduce((s, p) => s + p.likes + p.comments + p.saves, 0) / posts.length)
      : 0;
  }, [igPosts]);

  const leoLatest = useMemo(() =>
    [...igMetrics]
      .filter(m => (m.instagram_accounts as any)?.account_label === 'Leo')
      .sort((a, b) => b.date.localeCompare(a.date))[0],
    [igMetrics]
  );

  const w3Latest = useMemo(() =>
    [...igMetrics]
      .filter(m => (m.instagram_accounts as any)?.account_label === 'W3')
      .sort((a, b) => b.date.localeCompare(a.date))[0],
    [igMetrics]
  );

  const postsChartConfig = {
    posts: { label: 'Posts Publicados', color: 'hsl(var(--primary))' },
    stories: { label: 'Stories', color: 'hsl(var(--warning))' },
    agendados: { label: 'Agendados', color: 'hsl(var(--secondary))' },
  };

  const followersChartConfig = {
    leo: { label: '@leo', color: 'hsl(var(--primary))' },
    w3: { label: '@w3', color: 'hsl(var(--warning))' },
  };

  const tableLogs = useMemo(() => [...logs].sort((a, b) => b.date.localeCompare(a.date)), [logs]);

  const handleFilterChange = (newFilter: DateFilter) => {
    setFilter(newFilter);
    if (newFilter === 'custom') setCalendarOpen(true);
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
      <PageHeader title="Dashboard de Conteúdo" description="Visão geral do desempenho de conteúdo">
        <Button
          variant="outline"
          size="sm"
          onClick={() => syncInstagram.mutate()}
          disabled={syncInstagram.isPending}
          className="gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', syncInstagram.isPending && 'animate-spin')} />
          {syncInstagram.isPending ? 'Sincronizando...' : 'Sincronizar Instagram'}
        </Button>
        <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
          <SelectTrigger className="w-[180px]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {RESPONSIBLE_OPTIONS.map(r => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>

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
      </PageHeader>

      {/* BLOCO 1 — Resultado (Gráficos) */}
      <SectionLabel title="Resultado" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Posts e Stories por dia</CardTitle>
          </CardHeader>
          <CardContent>
            {postsChartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
            ) : (
              <>
                <ChartContainer config={postsChartConfig} className="h-48 w-full">
                  <LineChart data={postsChartData} margin={{ left: -20, right: 10, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis width={35} className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ReferenceLine y={POSTS_PER_DAY} stroke="hsl(var(--primary))" strokeDasharray="6 3" strokeOpacity={0.5} label={{ value: `Meta Posts (${POSTS_PER_DAY})`, position: 'insideTopRight', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <ReferenceLine y={STORIES_PER_DAY} stroke="hsl(var(--warning))" strokeDasharray="6 3" strokeOpacity={0.5} label={{ value: `Meta Stories (${STORIES_PER_DAY})`, position: 'insideTopRight', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <Line type="monotone" dataKey="posts" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="stories" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="agendados" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                  </LineChart>
                </ChartContainer>
                <div className="flex items-center gap-4 mt-3 flex-wrap" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }} />
                    <span>Posts Publicados: {stats.totalPosts} no período</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(var(--warning))' }} />
                    <span>Stories: {stats.totalStories} no período</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(var(--secondary))' }} />
                    <span>Agendados: {stats.totalScheduled} no período</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Variação diária de seguidores</CardTitle>
          </CardHeader>
          <CardContent>
            {followersChartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
            ) : (
              <>
                <ChartContainer config={followersChartConfig} className="h-48 w-full">
                  <LineChart data={followersChartData} margin={{ left: -20, right: 10, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis width={35} className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="leo" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="w3" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
                <div className="flex items-center gap-4 mt-3 flex-wrap" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }} />
                    <span>@leo: {stats.totalLeoVar >= 0 ? '+' : ''}{stats.totalLeoVar} no período</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(var(--warning))' }} />
                    <span>@w3: {stats.totalW3Var >= 0 ? '+' : ''}{stats.totalW3Var} no período</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* BLOCO 2 — Operacional (KPIs) */}
      <SectionLabel title="Operacional" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card style={{ borderColor: stats.postsPercent >= 100 ? 'rgba(34,197,94,0.3)' : stats.postsPercent < 75 ? 'rgba(251,191,36,0.3)' : 'rgba(249,115,22,0.3)' }}>
          <CardContent className="p-6">
            <p className="section-label-text mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Posts Publicados</p>
            <div className="flex items-baseline gap-3 flex-wrap">
              <p style={{ fontSize: '36px', fontWeight: 700, color: '#F97316' }}>{stats.totalPosts}</p>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                / {stats.postsMeta} de meta ({stats.postsPercent.toFixed(0)}%)
              </span>
            </div>
            <div className="mt-2">
              <span className={cn('trend-pill', getPillClass(stats.postsPercent))}>
                {getPillLabel(stats.postsPercent)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card style={{ borderColor: stats.storiesPercent >= 100 ? 'rgba(34,197,94,0.3)' : stats.storiesPercent < 75 ? 'rgba(251,191,36,0.3)' : 'rgba(249,115,22,0.3)' }}>
          <CardContent className="p-6">
            <p className="section-label-text mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Stories Realizados</p>
            <div className="flex items-baseline gap-3 flex-wrap">
              <p style={{ fontSize: '36px', fontWeight: 700, color: '#F97316' }}>{stats.totalStories}</p>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                / {stats.storiesMeta} de meta ({stats.storiesPercent.toFixed(0)}%)
              </span>
            </div>
            <div className="mt-2">
              <span className={cn('trend-pill', getPillClass(stats.storiesPercent))}>
                {getPillLabel(stats.storiesPercent)}
              </span>
            </div>
          </CardContent>
        </Card>

        <StatCard
          title="Posts Agendados"
          value={stats.totalScheduled}
          icon={<CalendarCheck className="h-5 w-5" />}
        />
      </div>

      {/* BLOCO Instagram — Métricas */}
      <SectionLabel title="Instagram" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardContent className="p-6">
            <p className="section-label-text mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Seguidores @leo</p>
            <p style={{ fontSize: '36px', fontWeight: 700, color: '#F97316' }}>
              {leoLatest ? leoLatest.followers_count.toLocaleString('pt-BR') : '—'}
            </p>
            {leoLatest && (
              <p className="text-xs text-muted-foreground mt-1">
                Atualizado em {format(new Date(leoLatest.date + 'T12:00:00'), 'dd/MM')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="section-label-text mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Seguidores @w3</p>
            <p style={{ fontSize: '36px', fontWeight: 700, color: '#F97316' }}>
              {w3Latest ? w3Latest.followers_count.toLocaleString('pt-BR') : '—'}
            </p>
            {w3Latest && (
              <p className="text-xs text-muted-foreground mt-1">
                Atualizado em {format(new Date(w3Latest.date + 'T12:00:00'), 'dd/MM')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="section-label-text mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Engajamento Médio / Post</p>
            <p style={{ fontSize: '36px', fontWeight: 700, color: '#F97316' }}>
              {avgEngagement > 0 ? avgEngagement.toLocaleString('pt-BR') : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">likes + comentários + salvamentos</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader className="pb-2 flex flex-row items-center gap-2">
          <Instagram className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Posts recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {igPosts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Nenhum dado ainda. Clique em "Sincronizar Instagram" após configurar o token.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Conta</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs text-center">Likes</TableHead>
                    <TableHead className="text-xs text-center">Comentários</TableHead>
                    <TableHead className="text-xs text-center">Shares</TableHead>
                    <TableHead className="text-xs text-center">Salvamentos</TableHead>
                    <TableHead className="text-xs text-center">Alcance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {igPosts.map(post => (
                    <TableRow key={post.id}>
                      <TableCell className="text-xs">
                        @{(post.instagram_accounts as any)?.username ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-xs">{post.media_type}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {post.published_at ? format(new Date(post.published_at), 'dd/MM/yyyy') : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-center">{post.likes.toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="text-xs text-center">{post.comments.toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="text-xs text-center">{post.shares.toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="text-xs text-center">{post.saves.toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="text-xs text-center">{post.reach.toLocaleString('pt-BR')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BLOCO 3 — Histórico */}
      <SectionLabel title="Histórico" />
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Histórico do período</CardTitle>
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
    </AppLayout>
  );
}
