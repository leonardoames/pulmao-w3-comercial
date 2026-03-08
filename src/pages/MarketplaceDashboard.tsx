import { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionLabel } from '@/components/dashboard/SectionLabel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMarketplaceClientes, useMarketplaceRegistrosByMonths } from '@/hooks/useMarketplaces';
import { useClosers } from '@/hooks/useProfiles';
import { DateFilterBar, DateFilter, DateRange, getDateRange, getMonthsInRange } from '@/components/DateFilterBar';
import { DollarSign, TrendingUp, TrendingDown, Users, BarChart3, AlertTriangle, Trophy, Percent } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const STATUS_COLORS: Record<string, string> = { Ativo: '#22C55E', Pausado: '#FBBF24', Cancelado: '#888888', Trial: '#0EA5E9' };

export default function MarketplaceDashboard() {
  const [filter, setFilter] = useState<DateFilter>('month');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date>(new Date());

  const dateRange = useMemo(() => getDateRange(filter, customRange), [filter, customRange]);
  const months = useMemo(() => getMonthsInRange(dateRange), [dateRange]);

  const { data: clientes } = useMarketplaceClientes();
  const { data: regsAtual, dataUpdatedAt } = useMarketplaceRegistrosByMonths(months);
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
    const m: Record<string, any> = {};
    clientes?.forEach(c => { m[c.id] = c; });
    return m;
  }, [clientes]);

  const primaryMonth = months[months.length - 1] || format(new Date(), 'yyyy-MM');

  const clientesAtivos = clientes?.filter(c => c.status === 'Ativo') || [];
  const mrrTotal = regsAtual?.reduce((s, r) => {
    const c = clienteMap[r.cliente_id];
    return c?.status === 'Ativo' ? s + Number(r.total_a_receber) : s;
  }, 0) ?? 0;

  const clientesNovos = clientes?.filter(c => c.data_entrada?.startsWith(primaryMonth)) || [];
  const mrrNovo = clientesNovos.reduce((s, c) => {
    const reg = regsAtual?.find(r => r.cliente_id === c.id);
    return s + (reg ? Number(reg.total_a_receber) : 0);
  }, 0);

  const clientesCancelados = clientes?.filter(c =>
    (c.status === 'Cancelado' || c.status === 'Pausado') && c.atualizado_em?.startsWith(primaryMonth)
  ) || [];
  const churn = clientesCancelados.reduce((s, c) => {
    const reg = regsAtual?.find(r => r.cliente_id === c.id);
    return s + (reg ? Number(reg.total_a_receber) : 0);
  }, 0);

  const totalFat = regsAtual?.reduce((s, r) => s + Number(r.faturamento_informado), 0) ?? 0;
  const ticketMedio = clientesAtivos.length > 0 ? mrrTotal / clientesAtivos.length : 0;
  const taxaComissao = totalFat > 0 ? (mrrTotal / totalFat) * 100 : 0;
  const alertasCount = regsAtual?.filter(r => r.status_pagamento === 'Pendente' || r.status_pagamento === 'Atrasado').length ?? 0;

  // Distribution by marketplace
  const mkpDist = useMemo(() => {
    const map: Record<string, { clientes: number; faturamento: number }> = {};
    clientes?.forEach(c => {
      if (c.status !== 'Ativo') return;
      c.marketplaces?.forEach(m => {
        if (!map[m]) map[m] = { clientes: 0, faturamento: 0 };
        map[m].clientes++;
      });
    });
    regsAtual?.forEach(r => {
      const c = clienteMap[r.cliente_id];
      c?.marketplaces?.forEach((m: string) => {
        if (map[m]) map[m].faturamento += Number(r.faturamento_informado) / (c.marketplaces?.length || 1);
      });
    });
    return Object.entries(map).sort((a, b) => b[1].faturamento - a[1].faturamento);
  }, [clientes, regsAtual, clienteMap]);

  const maxFat = mkpDist.length > 0 ? Math.max(...mkpDist.map(([, d]) => d.faturamento)) : 1;

  // Top clientes
  const topClientes = useMemo(() => {
    if (!regsAtual) return [];
    return [...regsAtual]
      .sort((a, b) => Number(b.total_a_receber) - Number(a.total_a_receber))
      .slice(0, 5)
      .map(r => ({ ...r, cliente: clienteMap[r.cliente_id] }));
  }, [regsAtual, clienteMap]);

  // Gestor perf
  const gestorPerf = useMemo(() => {
    const map: Record<string, { clientes: Set<string>; faturamento: number; receita: number }> = {};
    regsAtual?.forEach(r => {
      const c = clienteMap[r.cliente_id];
      const gId = c?.gestor_user_id || 'sem';
      if (!map[gId]) map[gId] = { clientes: new Set(), faturamento: 0, receita: 0 };
      map[gId].clientes.add(r.cliente_id);
      map[gId].faturamento += Number(r.faturamento_informado);
      map[gId].receita += Number(r.total_a_receber);
    });
    return Object.entries(map).map(([id, d]) => ({
      id, nome: gestorMap[id] || 'Sem gestor', clientes: d.clientes.size, faturamento: d.faturamento, receita: d.receita,
    })).sort((a, b) => b.receita - a.receita);
  }, [regsAtual, clienteMap, gestorMap]);

  // Alertas
  const alertas = useMemo(() => {
    if (!regsAtual) return [];
    return regsAtual
      .filter(r => r.status_pagamento === 'Pendente' || r.status_pagamento === 'Atrasado')
      .map(r => ({ ...r, cliente: clienteMap[r.cliente_id] }));
  }, [regsAtual, clienteMap]);

  // Clientes sem registro no mês
  const clientesSemRegistro = useMemo(() => {
    if (!clientes || !regsAtual) return [];
    const comRegistro = new Set(regsAtual.map(r => r.cliente_id));
    return clientesAtivos.filter(c => !comRegistro.has(c.id));
  }, [clientes, regsAtual, clientesAtivos]);

  // Timestamp
  const minutesSinceUpdate = Math.floor((Date.now() - lastUpdatedAt.getTime()) / 60000);
  const timestampColor = minutesSinceUpdate < 5 ? '#22C55E' : minutesSinceUpdate <= 15 ? '#FBBF24' : '#888888';
  const timestampPulse = minutesSinceUpdate < 5;

  return (
    <AppLayout>
      <PageHeader title="Dashboard — Marketplaces" description="Métricas de gestão de marketplaces">
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
        <StatCard title="MRR Novo" value={formatCurrency(mrrNovo)} subtitle={`${clientesNovos.length} novos`} icon={<TrendingUp className="h-5 w-5" />} variant="success" />
        <StatCard title="Churn do Mês" value={formatCurrency(churn)} icon={<TrendingDown className="h-5 w-5" />} variant="destructive" />
        <StatCard title="Clientes Ativos" value={clientesAtivos.length} icon={<Users className="h-5 w-5" />} />
      </div>

      <SectionLabel title="Volume e Performance" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Faturamento" value={formatCurrency(totalFat)} icon={<BarChart3 className="h-5 w-5" />} />
        <StatCard title="Ticket Médio" value={formatCurrency(ticketMedio)} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard title="Taxa Média Comissão" value={`${taxaComissao.toFixed(1)}%`} icon={<Percent className="h-5 w-5" />} />
        <StatCard title="Alertas Inadimplência" value={alertasCount} icon={<AlertTriangle className="h-5 w-5" />} variant={alertasCount > 0 ? 'destructive' : 'default'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Distribuição por Marketplace */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" style={{ color: '#F97316' }} /> Distribuição por Marketplace</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {mkpDist.map(([name, data]) => (
              <div key={name} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{name}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{data.clientes} clientes • {formatCurrency(data.faturamento)}</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-2 rounded-full" style={{ width: `${(data.faturamento / maxFat) * 100}%`, background: '#F97316' }} />
                </div>
              </div>
            ))}
            {mkpDist.length === 0 && <p className="text-center text-muted-foreground py-4">Sem dados</p>}
          </CardContent>
        </Card>

        {/* Top Clientes */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4" style={{ color: '#F97316' }} /> Top Clientes por Receita</CardTitle></CardHeader>
          <CardContent>
            {topClientes.length > 0 ? (
              <div className="space-y-3">
                {topClientes.map((t, i) => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground">{i + 1}</div>
                      <div>
                        <p className="font-medium text-sm">{t.cliente?.nome_ecommerce || '—'}</p>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                          {formatCurrency(Number(t.faturamento_informado))} fat. • {gestorMap[t.cliente?.gestor_user_id || ''] || '—'}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold" style={{ color: '#F97316' }}>{formatCurrency(Number(t.total_a_receber))}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum registro</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance por Gestor */}
      <Card className="mb-8">
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" style={{ color: '#8B5CF6' }} /> Performance por Gestor</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gestor</TableHead>
                <TableHead className="text-right">Clientes</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-right">Receita</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gestorPerf.map(g => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.nome}</TableCell>
                  <TableCell className="text-right">{g.clientes}</TableCell>
                  <TableCell className="text-right" style={{ color: 'rgba(255,255,255,0.5)' }}>{formatCurrency(g.faturamento)}</TableCell>
                  <TableCell className="text-right font-semibold" style={{ color: '#F97316' }}>{formatCurrency(g.receita)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Alertas */}
      {(alertas.length > 0 || clientesSemRegistro.length > 0) && (
        <>
          <SectionLabel title="Alertas" />
          <Card className="mb-8">
            <CardContent className="p-0">
              {alertas.map(a => (
                <div key={a.id} className="flex items-center justify-between p-4" style={{
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  background: a.status_pagamento === 'Atrasado' ? 'rgba(239,68,68,0.05)' : 'rgba(251,191,36,0.05)',
                }}>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4" style={{ color: a.status_pagamento === 'Atrasado' ? '#EF4444' : '#FBBF24' }} />
                    <div>
                      <p className="font-medium text-sm">{a.cliente?.nome_ecommerce || '—'}</p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{formatCurrency(Number(a.total_a_receber))} — {a.status_pagamento}</p>
                    </div>
                  </div>
                </div>
              ))}
              {clientesSemRegistro.map(c => (
                <div key={c.id} className="flex items-center justify-between p-4" style={{
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(251,191,36,0.03)',
                }}>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4" style={{ color: '#FBBF24' }} />
                    <div>
                      <p className="font-medium text-sm">{c.nome_ecommerce}</p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>Sem faturamento registrado no mês</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </AppLayout>
  );
}
