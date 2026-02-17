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
import { CalendarIcon, FileText, Film, CalendarCheck } from 'lucide-react';

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

const getAlertLabel = (percent: number): string => {
  if (percent >= 100) return ' · Meta atingida!';
  if (percent < 75) return ' · Abaixo da meta';
  return '';
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

    return { totalPosts, totalStories, totalScheduled, postsMeta, storiesMeta, postsPercent, storiesPercent };
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
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {RESPONSIBLE_OPTIONS.map(r => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
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
        </div>
      </PageHeader>

      {/* BLOCO 1 — Resultado (Gráficos) */}
      <SectionLabel title="Resultado" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Posts e Stories por dia</CardTitle>
          </CardHeader>
          <CardContent>
            {postsChartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
            ) : (
              <ChartContainer config={postsChartConfig} className="h-48 w-full">
                <LineChart data={postsChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ReferenceLine y={POSTS_PER_DAY} stroke="hsl(var(--primary))" strokeDasharray="6 3" strokeOpacity={0.5} label={{ value: `Meta Posts (${POSTS_PER_DAY})`, position: 'insideTopRight', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <ReferenceLine y={STORIES_PER_DAY} stroke="hsl(var(--warning))" strokeDasharray="6 3" strokeOpacity={0.5} label={{ value: `Meta Stories (${STORIES_PER_DAY})`, position: 'insideTopRight', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Line type="monotone" dataKey="posts" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="stories" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="agendados" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                </LineChart>
              </ChartContainer>
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
              <ChartContainer config={followersChartConfig} className="h-48 w-full">
                <LineChart data={followersChartData}>
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

      {/* BLOCO 2 — Operacional (KPIs) */}
      <SectionLabel title="Operacional" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard
          title="Posts Publicados"
          value={stats.totalPosts}
          subtitle={`Meta: ${stats.postsMeta} · ${stats.postsPercent.toFixed(0)}% atingido${getAlertLabel(stats.postsPercent)}`}
          icon={<FileText className="h-5 w-5" />}
          variant={getVariant(stats.postsPercent)}
        />
        <StatCard
          title="Stories Realizados"
          value={stats.totalStories}
          subtitle={`Meta: ${stats.storiesMeta} · ${stats.storiesPercent.toFixed(0)}% atingido${getAlertLabel(stats.storiesPercent)}`}
          icon={<Film className="h-5 w-5" />}
          variant={getVariant(stats.storiesPercent)}
        />
        <StatCard
          title="Posts Agendados"
          value={stats.totalScheduled}
          icon={<CalendarCheck className="h-5 w-5" />}
        />
      </div>

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
