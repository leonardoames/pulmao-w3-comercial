import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClosers } from '@/hooks/useProfiles';
import { useMarketingStats, useMarketingInvestimentoDia, useUpsertInvestimento } from '@/hooks/useMarketingDashboard';
import { DateFilter, DateRange } from '@/hooks/useDashboard';
import { useCanAccessAdminPanel } from '@/hooks/useUserRoles';
import {
  CalendarIcon, DollarSign, Phone, PhoneOff, Target, TrendingUp,
  ShoppingCart, BarChart3, Zap, Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const filterOptions: { value: DateFilter; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: '7days', label: '7 dias' },
  { value: 'month', label: 'Este mês' },
  { value: '30days', label: '30 dias' },
  { value: 'custom', label: 'Personalizado' },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatMetric = (value: number | null, formatter: (v: number) => string = formatCurrency) =>
  value === null ? '—' : formatter(value);

export default function MarketingDashboard() {
  const [filter, setFilter] = useState<DateFilter>('month');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [tempRange, setTempRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedCloser, setSelectedCloser] = useState<string>('all');

  // Investment form state
  const [investDate, setInvestDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [investValor, setInvestValor] = useState('');
  const [investCalendarOpen, setInvestCalendarOpen] = useState(false);

  const canManage = useCanAccessAdminPanel();
  const { data: closers } = useClosers();
  const { data: stats, isLoading } = useMarketingStats(filter, customRange, selectedCloser);
  const { data: investimentoDia } = useMarketingInvestimentoDia(investDate);
  const upsertInvestimento = useUpsertInvestimento();

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

  const handleSaveInvestimento = () => {
    const valor = parseFloat(investValor.replace(/\./g, '').replace(',', '.'));
    if (isNaN(valor) || valor < 0) {
      toast.error('Informe um valor válido');
      return;
    }
    upsertInvestimento.mutate(
      { data: investDate, valor },
      {
        onSuccess: () => toast.success('Investimento salvo!'),
        onError: (err: any) => toast.error(err.message || 'Erro ao salvar'),
      }
    );
  };

  // When investimentoDia loads, populate the field
  const displayInvestDia = investimentoDia
    ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(Number(investimentoDia.valor))
    : '';

  const displayRange = filter === 'custom' && customRange
    ? `${format(customRange.start, 'dd/MM')} - ${format(customRange.end, 'dd/MM')}`
    : null;

  return (
    <AppLayout>
      <PageHeader title="Dashboard de Marketing" description="Métricas de aquisição e performance de tráfego">
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedCloser} onValueChange={setSelectedCloser}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por closer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Closers</SelectItem>
              {closers?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
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

      {/* Investment input (gestores only) */}
      {canManage && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Registrar Investimento em Tráfego
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4 flex-wrap">
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Popover open={investCalendarOpen} onOpenChange={setInvestCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[160px] justify-start font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(new Date(investDate + 'T12:00:00'), 'dd/MM/yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={new Date(investDate + 'T12:00:00')}
                      onSelect={(d) => {
                        if (d) {
                          setInvestDate(format(d, 'yyyy-MM-dd'));
                          setInvestValor('');
                          setInvestCalendarOpen(false);
                        }
                      }}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label>Valor (R$)</Label>
                <Input
                  type="text"
                  placeholder={displayInvestDia || '0,00'}
                  value={investValor}
                  onChange={(e) => setInvestValor(e.target.value)}
                  className="w-[160px]"
                />
              </div>
              <Button onClick={handleSaveInvestimento} disabled={upsertInvestimento.isPending} className="gap-2">
                <Save className="h-4 w-4" />
                Salvar
              </Button>
              {investimentoDia && (
                <p className="text-sm text-muted-foreground">
                  Cadastrado: {formatCurrency(Number(investimentoDia.valor))}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Row 1: Investimento, Calls Agendadas, Calls Realizadas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard
          title="Investimento em Tráfego"
          value={formatMetric(stats?.investimentoTotal ?? null)}
          icon={<DollarSign className="h-5 w-5" />}
          variant="primary"
        />
        <StatCard
          title="Calls Agendadas"
          value={stats?.callsAgendadas ?? 0}
          subtitle="Realizadas + No-show"
          icon={<Phone className="h-5 w-5" />}
        />
        <StatCard
          title="Calls Realizadas"
          value={stats?.callsRealizadas ?? 0}
          icon={<Phone className="h-5 w-5" />}
          variant="success"
        />
      </div>

      {/* Row 2: CPA, Custo por Call, Volume, Qtd vendas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Custo por Agendamento"
          value={formatMetric(stats?.custoAgendamento ?? null)}
          icon={<Target className="h-5 w-5" />}
        />
        <StatCard
          title="Custo por Call Realizada"
          value={formatMetric(stats?.custoCallRealizada ?? null)}
          icon={<PhoneOff className="h-5 w-5" />}
        />
        <StatCard
          title="Volume de Vendas"
          value={formatCurrency(stats?.volumeVendas ?? 0)}
          subtitle={`${stats?.qtdVendas ?? 0} vendas`}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="primary"
        />
        <StatCard
          title="Quantidade de Vendas"
          value={stats?.qtdVendas ?? 0}
          icon={<ShoppingCart className="h-5 w-5" />}
        />
      </div>

      {/* Row 3: CAC, ROAS Global, ROAS Imediato */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="CAC"
          value={formatMetric(stats?.cac ?? null)}
          subtitle="Custo de Aquisição de Cliente"
          icon={<BarChart3 className="h-5 w-5" />}
          variant="warning"
        />
        <StatCard
          title="ROAS Global"
          value={formatMetric(stats?.roasGlobal ?? null, (v) => `${v.toFixed(2)}x`)}
          subtitle="Volume de Vendas / Investimento"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="ROAS Imediato"
          value={formatMetric(stats?.roasImediato ?? null, (v) => `${v.toFixed(2)}x`)}
          subtitle="(Pix + Cartão) / Investimento"
          icon={<Zap className="h-5 w-5" />}
          variant="primary"
        />
      </div>
    </AppLayout>
  );
}
