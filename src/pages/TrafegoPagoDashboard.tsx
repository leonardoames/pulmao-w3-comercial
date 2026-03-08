import { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionLabel } from '@/components/dashboard/SectionLabel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTrafegoPagoClientes, useTrafegoPagoRegistrosByMonths, TrafegoPagoCliente } from '@/hooks/useTrafegoPago';
import { useClosers } from '@/hooks/useProfiles';
import { DateFilterBar, DateFilter, DateRange, getDateRange, getMonthsInRange } from '@/components/DateFilterBar';
import { DollarSign, TrendingUp, TrendingDown, Users, BarChart3, AlertTriangle, Trophy, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const STATUS_COLORS: Record<string, string> = {
  Ativo: '#22C55E', Pausado: '#FBBF24', Cancelado: '#888888', Trial: '#0EA5E9',
};

export default function TrafegoPagoDashboard() {
  const [filter, setFilter] = useState<DateFilter>('month');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date>(new Date());

  const dateRange = useMemo(() => getDateRange(filter, customRange), [filter, customRange]);
  const months = useMemo(() => getMonthsInRange(dateRange), [dateRange]);

  const { data: clientes } = useTrafegoPagoClientes();
  const { data: regsAtual, dataUpdatedAt } = useTrafegoPagoRegistrosByMonths(months);
  const { data: closers } = useClosers();

  useEffect(() => {
    if (dataUpdatedAt) setLastUpdatedAt(new Date(dataUpdatedAt));
  }, [dataUpdatedAt]);

  const gestorMap = useMemo(() => {
    const m: Record<string, string> = {};
    closers?.forEach(c => { m[c.id] = c.nome; });
    return m;
  }, [closers]);

  const clienteMap = useMemo(() => {
    const m: Record<string, TrafegoPagoCliente> = {};
    clientes?.forEach(c => { m[c.id] = c; });
    return m;
  }, [clientes]);

  // KPIs
  const clientesAtivos = clientes?.filter(c => c.status === 'Ativo') || [];
  const mrrTotal = regsAtual?.reduce((s, r) => {
    const c = clienteMap[r.cliente_id];
    return c?.status === 'Ativo' ? s + Number(r.valor_pago) : s;
  }, 0) ?? 0;

  const primaryMonth = months[months.length - 1] || format(new Date(), 'yyyy-MM');
  const clientesNovosMes = clientes?.filter(c => c.data_entrada?.startsWith(primaryMonth)) || [];
  const mrrNovo = clientesNovosMes.reduce((s, c) => s + Number(c.valor_mrr), 0);

  const clientesCancelados = clientes?.filter(c =>
    (c.status === 'Cancelado' || c.status === 'Pausado') && c.atualizado_em?.startsWith(primaryMonth)
  ) || [];
  const churn = clientesCancelados.reduce((s, c) => s + Number(c.valor_mrr), 0);
  const mrrLiquido = mrrTotal + mrrNovo - churn;

  const totalInvestido = regsAtual?.reduce((s, r) => s + Number(r.investimento_gerenciado), 0) ?? 0;
  const totalRecebido = regsAtual?.reduce((s, r) => s + Number(r.valor_pago), 0) ?? 0;
  const ticketMedio = clientesAtivos.length > 0 ? mrrTotal / clientesAtivos.length : 0;

  // Top clientes
  const topClientes = useMemo(() => {
    if (!regsAtual) return [];
    return [...regsAtual]
      .sort((a, b) => Number(b.valor_pago) - Number(a.valor_pago))
      .slice(0, 5)
      .map(r => ({
        ...r,
        cliente: clienteMap[r.cliente_id],
      }));
  }, [regsAtual, clienteMap]);

  // Performance por gestor
  const gestorPerf = useMemo(() => {
    const map: Record<string, { clientes: number; investimento: number; receita: number }> = {};
    const clientesByGestor: Record<string, Set<string>> = {};
    regsAtual?.forEach(r => {
      const c = clienteMap[r.cliente_id];
      const gId = c?.gestor_user_id || 'sem-gestor';
      if (!map[gId]) map[gId] = { clientes: 0, investimento: 0, receita: 0 };
      map[gId].investimento += Number(r.investimento_gerenciado);
      map[gId].receita += Number(r.valor_pago);
      if (!clientesByGestor[gId]) clientesByGestor[gId] = new Set();
      clientesByGestor[gId].add(r.cliente_id);
    });
    return Object.entries(map).map(([id, data]) => ({
      id,
      nome: gestorMap[id] || 'Sem gestor',
      clientes: clientesByGestor[id]?.size || 0,
      ...data,
    })).sort((a, b) => b.receita - a.receita);
  }, [regsAtual, clienteMap, gestorMap]);

  // Alertas
  const alertas = useMemo(() => {
    if (!regsAtual) return [];
    return regsAtual
      .filter(r => r.status_pagamento === 'Pendente' || r.status_pagamento === 'Atrasado')
      .map(r => ({ ...r, cliente: clienteMap[r.cliente_id] }));
  }, [regsAtual, clienteMap]);

  // Timestamp
  const minutesSinceUpdate = Math.floor((Date.now() - lastUpdatedAt.getTime()) / 60000);
  const timestampColor = minutesSinceUpdate < 5 ? '#22C55E' : minutesSinceUpdate <= 15 ? '#FBBF24' : '#888888';
  const timestampPulse = minutesSinceUpdate < 5;

  return (
    <AppLayout>
      <PageHeader title="Dashboard — Tráfego Pago" description="Métricas de gestão de tráfego pago">
        <DateFilterBar
          filter={filter}
          onFilterChange={setFilter}
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
        />
        <div className="flex items-center gap-2 shrink-0">
          <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '14px' }}>|</span>
          <div
            className="flex items-center gap-1.5"
            style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}
          >
            <span
              className={cn('inline-block w-2 h-2 rounded-full', timestampPulse && 'animate-pulse')}
              style={{ background: timestampColor }}
            />
            Atualizado às {format(lastUpdatedAt, 'HH:mm')}
          </div>
        </div>
      </PageHeader>

      <SectionLabel title="Receita Recorrente" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="MRR Total" value={formatCurrency(mrrTotal)} icon={<DollarSign className="h-5 w-5" />} variant="primary" />
        <StatCard title="MRR Novo" value={formatCurrency(mrrNovo)} subtitle={`${clientesNovosMes.length} novos clientes`} icon={<TrendingUp className="h-5 w-5" />} variant="success" />
        <StatCard title="Churn do Mês" value={formatCurrency(churn)} subtitle={`${clientesCancelados.length} cancelados/pausados`} icon={<TrendingDown className="h-5 w-5" />} variant="destructive" />
        <StatCard title="MRR Líquido" value={formatCurrency(mrrLiquido)} icon={<Zap className="h-5 w-5" />} variant="primary" />
      </div>

      <SectionLabel title="Volume e Performance" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Clientes Ativos" value={clientesAtivos.length} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Total Investido" value={formatCurrency(totalInvestido)} icon={<BarChart3 className="h-5 w-5" />} />
        <StatCard title="Total Recebido" value={formatCurrency(totalRecebido)} icon={<DollarSign className="h-5 w-5" />} variant="success" />
        <StatCard title="Ticket Médio" value={formatCurrency(ticketMedio)} icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Top Clientes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4" style={{ color: '#F97316' }} />
              Top Clientes por Valor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topClientes.length > 0 ? (
              <div className="space-y-3">
                {topClientes.map((t, i) => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground">{i + 1}</div>
                      <div>
                        <p className="font-medium text-sm">{t.cliente?.nome_ecommerce || '—'}</p>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{gestorMap[t.cliente?.gestor_user_id || ''] || '—'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold" style={{ color: '#F97316' }}>{formatCurrency(Number(t.valor_pago))}</p>
                      <Badge variant="outline" style={{ fontSize: '10px', borderColor: STATUS_COLORS[t.cliente?.status || 'Ativo'], color: STATUS_COLORS[t.cliente?.status || 'Ativo'] }}>
                        {t.cliente?.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum registro no período</p>
            )}
          </CardContent>
        </Card>

        {/* Performance por Gestor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" style={{ color: '#8B5CF6' }} />
              Performance por Gestor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gestor</TableHead>
                  <TableHead className="text-right">Clientes</TableHead>
                  <TableHead className="text-right">Investimento</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gestorPerf.map(g => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.nome}</TableCell>
                    <TableCell className="text-right">{g.clientes}</TableCell>
                    <TableCell className="text-right" style={{ color: 'rgba(255,255,255,0.5)' }}>{formatCurrency(g.investimento)}</TableCell>
                    <TableCell className="text-right font-semibold" style={{ color: '#F97316' }}>{formatCurrency(g.receita)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <>
          <SectionLabel title="Alertas" />
          <Card className="mb-8">
            <CardContent className="p-0">
              <div className="space-y-0">
                {alertas.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-4" style={{
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: a.status_pagamento === 'Atrasado' ? 'rgba(239,68,68,0.05)' : 'rgba(251,191,36,0.05)',
                  }}>
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4" style={{ color: a.status_pagamento === 'Atrasado' ? '#EF4444' : '#FBBF24' }} />
                      <div>
                        <p className="font-medium text-sm">{a.cliente?.nome_ecommerce || '—'}</p>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                          {formatCurrency(Number(a.valor_pago))} — {a.status_pagamento}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" style={{
                      borderColor: a.status_pagamento === 'Atrasado' ? '#EF4444' : '#FBBF24',
                      color: a.status_pagamento === 'Atrasado' ? '#EF4444' : '#FBBF24',
                    }}>
                      {a.status_pagamento}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </AppLayout>
  );
}
