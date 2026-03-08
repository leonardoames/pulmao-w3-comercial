import { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { MonthYearSelector } from '@/components/MonthYearSelector';
import { HeroMRRCard } from '@/components/w3-dashboard/HeroMRRCard';
import { KPIRow } from '@/components/w3-dashboard/KPIRow';
import { RevenueChart } from '@/components/w3-dashboard/RevenueChart';
import { HealthCard } from '@/components/w3-dashboard/HealthCard';
import { GestorPerfCard, GestorRow } from '@/components/w3-dashboard/GestorPerfCard';
import { TopClientesCard, TopCliente } from '@/components/w3-dashboard/TopClientesCard';
import { AlertasCard, AlertaItem } from '@/components/w3-dashboard/AlertasCard';
import { useMarketplaceClientes, useMarketplaceAllRegistros, MarketplaceCliente } from '@/hooks/useMarketplaces';
import { useClosers } from '@/hooks/useProfiles';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { format, subMonths, parse, getDaysInMonth, getDate, differenceInMonths } from 'date-fns';
import { cn } from '@/lib/utils';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const META_KEY = 'w3_marketplace_mrr_meta';

export default function MarketplaceDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date>(new Date());
  const [mrrMeta, setMrrMeta] = useState(() => {
    const saved = localStorage.getItem(META_KEY);
    return saved ? parseFloat(saved) : 0;
  });

  const prevMonth = useMemo(() => format(subMonths(parse(selectedMonth + '-01', 'yyyy-MM-dd', new Date()), 1), 'yyyy-MM'), [selectedMonth]);

  const { data: clientes } = useMarketplaceClientes();
  const { data: allRegs, dataUpdatedAt } = useMarketplaceAllRegistros();
  const { data: closers } = useClosers();

  useEffect(() => { if (dataUpdatedAt) setLastUpdatedAt(new Date(dataUpdatedAt)); }, [dataUpdatedAt]);

  const handleMetaChange = (v: number) => {
    setMrrMeta(v);
    localStorage.setItem(META_KEY, String(v));
  };

  const gestorMap = useMemo(() => {
    const m: Record<string, string> = {};
    closers?.forEach(c => { m[c.id] = c.nome; });
    return m;
  }, [closers]);

  const clienteMap = useMemo(() => {
    const m: Record<string, MarketplaceCliente> = {};
    clientes?.forEach(c => { m[c.id] = c; });
    return m;
  }, [clientes]);

  const regsAtual = useMemo(() => allRegs?.filter(r => r.mes_ano === selectedMonth) || [], [allRegs, selectedMonth]);
  const regsPrev = useMemo(() => allRegs?.filter(r => r.mes_ano === prevMonth) || [], [allRegs, prevMonth]);

  // KPIs
  const clientesAtivos = clientes?.filter(c => c.status === 'Ativo') || [];
  const mrrTotal = regsAtual.reduce((s, r) => {
    const c = clienteMap[r.cliente_id];
    return c?.status === 'Ativo' ? s + Number(r.total_a_receber) : s;
  }, 0);

  const mrrPrev = regsPrev.reduce((s, r) => s + Number(r.total_a_receber), 0);

  const clientesNovosMes = clientes?.filter(c => c.data_entrada?.startsWith(selectedMonth)) || [];
  const mrrNovo = clientesNovosMes.reduce((s, c) => {
    const reg = regsAtual.find(r => r.cliente_id === c.id);
    return s + (reg ? Number(reg.total_a_receber) : 0);
  }, 0);

  const clientesCancelados = clientes?.filter(c =>
    (c.status === 'Cancelado' || c.status === 'Pausado') && c.atualizado_em?.startsWith(selectedMonth)
  ) || [];
  const churn = clientesCancelados.reduce((s, c) => {
    const reg = regsAtual.find(r => r.cliente_id === c.id);
    return s + (reg ? Number(reg.total_a_receber) : 0);
  }, 0);
  const mrrLiquido = mrrNovo - churn;

  const totalFat = regsAtual.reduce((s, r) => s + Number(r.faturamento_informado), 0);
  const taxaComissao = totalFat > 0 ? (mrrTotal / totalFat) * 100 : 0;
  const churnRate = mrrPrev > 0 ? (churn / mrrPrev) * 100 : 0;

  // NRR
  const nrr = useMemo(() => {
    if (mrrPrev === 0) return null;
    const prevClientIds = new Set(regsPrev.map(r => r.cliente_id));
    const currentFromExisting = regsAtual
      .filter(r => prevClientIds.has(r.cliente_id))
      .reduce((s, r) => s + Number(r.total_a_receber), 0);
    return (currentFromExisting / mrrPrev) * 100;
  }, [regsAtual, regsPrev, mrrPrev]);

  const variacao = mrrPrev > 0 ? ((mrrTotal - mrrPrev) / mrrPrev) * 100 : null;

  // Variação Novo
  const prevNovo = useMemo(() => {
    const prevNovoClientes = clientes?.filter(c => c.data_entrada?.startsWith(prevMonth)) || [];
    return prevNovoClientes.reduce((s, c) => {
      const reg = regsPrev.find(r => r.cliente_id === c.id);
      return s + (reg ? Number(reg.total_a_receber) : 0);
    }, 0);
  }, [clientes, prevMonth, regsPrev]);
  const varNovo = prevNovo > 0 ? ((mrrNovo - prevNovo) / prevNovo) * 100 : null;

  // LTV
  const ltv = useMemo(() => {
    if (!clientesAtivos.length) return null;
    const ticketMedio = mrrTotal / clientesAtivos.length;
    const now = new Date();
    const meses = clientesAtivos
      .filter(c => c.data_entrada)
      .map(c => differenceInMonths(now, new Date(c.data_entrada)));
    const avgMeses = meses.length > 0 ? meses.reduce((a, b) => a + b, 0) / meses.length : 12;
    return ticketMedio * Math.max(avgMeses, 1);
  }, [clientesAtivos, mrrTotal]);

  // Monthly data for chart
  const monthlyData = useMemo(() => {
    const map: Record<string, number> = {};
    allRegs?.forEach(r => {
      map[r.mes_ano] = (map[r.mes_ano] || 0) + Number(r.total_a_receber);
    });
    return map;
  }, [allRegs]);

  // Day info
  const baseDate = parse(selectedMonth + '-01', 'yyyy-MM-dd', new Date());
  const diasNoMes = getDaysInMonth(baseDate);
  const diaDoMes = selectedMonth === format(new Date(), 'yyyy-MM') ? getDate(new Date()) : diasNoMes;

  // Status groups
  const statusGroups = useMemo(() => {
    const groups: Record<string, { count: number; mrr: number }> = {
      Ativo: { count: 0, mrr: 0 }, Pausado: { count: 0, mrr: 0 },
      Atrasado: { count: 0, mrr: 0 }, Cancelado: { count: 0, mrr: 0 }, Trial: { count: 0, mrr: 0 },
    };
    clientes?.forEach(c => {
      if (groups[c.status]) {
        groups[c.status].count++;
        groups[c.status].mrr += Number(c.valor_fixo || 0);
      }
    });
    const atrasados = new Set(regsAtual.filter(r => r.status_pagamento === 'Atrasado').map(r => r.cliente_id));
    groups['Atrasado'] = {
      count: atrasados.size,
      mrr: Array.from(atrasados).reduce((s, id) => s + Number(clienteMap[id]?.valor_fixo || 0), 0),
    };
    return [
      { label: 'Ativo', ...groups['Ativo'], color: '#22C55E' },
      { label: 'Trial', ...groups['Trial'], color: '#0EA5E9' },
      { label: 'Pausado', ...groups['Pausado'], color: '#FBBF24' },
      { label: 'Atrasado', ...groups['Atrasado'], color: '#EF4444' },
      { label: 'Cancelado', ...groups['Cancelado'], color: '#888888' },
    ].filter(g => g.count > 0);
  }, [clientes, regsAtual, clienteMap]);

  // Top clientes
  const topClientes: TopCliente[] = useMemo(() => {
    return [...regsAtual]
      .sort((a, b) => Number(b.total_a_receber) - Number(a.total_a_receber))
      .slice(0, 5)
      .map(r => ({
        id: r.id,
        nome: clienteMap[r.cliente_id]?.nome_ecommerce || '—',
        valor: Number(r.total_a_receber),
        status: clienteMap[r.cliente_id]?.status || 'Ativo',
        gestor: gestorMap[clienteMap[r.cliente_id]?.gestor_user_id || ''] || '—',
      }));
  }, [regsAtual, clienteMap, gestorMap]);

  // Gestor performance
  const gestorPerf: GestorRow[] = useMemo(() => {
    const map: Record<string, { clientes: Set<string>; faturamento: number; receita: number }> = {};
    regsAtual.forEach(r => {
      const c = clienteMap[r.cliente_id];
      const gId = c?.gestor_user_id || 'sem-gestor';
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
  const alertas: AlertaItem[] = useMemo(() => {
    const items: AlertaItem[] = [];
    regsAtual.forEach(r => {
      if (r.status_pagamento === 'Atrasado' || r.status_pagamento === 'Pendente') {
        items.push({
          id: r.id,
          nome: clienteMap[r.cliente_id]?.nome_ecommerce || '—',
          descricao: `${formatCurrency(Number(r.total_a_receber))} — ${r.status_pagamento}`,
          tipo: r.status_pagamento === 'Atrasado' ? 'atrasado' : 'pendente',
        });
      }
    });
    const comRegistro = new Set(regsAtual.map(r => r.cliente_id));
    clientesAtivos.forEach(c => {
      if (!comRegistro.has(c.id)) {
        items.push({ id: `sem-${c.id}`, nome: c.nome_ecommerce, descricao: 'Sem faturamento registrado no mês', tipo: 'sem-registro' });
      }
    });
    return items;
  }, [regsAtual, clienteMap, clientesAtivos]);

  // Timestamp
  const minutesSinceUpdate = Math.floor((Date.now() - lastUpdatedAt.getTime()) / 60000);
  const timestampColor = minutesSinceUpdate < 5 ? '#22C55E' : minutesSinceUpdate <= 15 ? '#FBBF24' : '#888888';
  const timestampPulse = minutesSinceUpdate < 5;

  return (
    <AppLayout>
      <PageHeader title="Visão Geral — Marketplaces">
        <MonthYearSelector value={selectedMonth} onChange={setSelectedMonth} />
        <div className="flex items-center gap-2">
          <Switch id="compare-mk" checked={compareEnabled} onCheckedChange={setCompareEnabled} />
          <Label htmlFor="compare-mk" className="text-xs whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.5)' }}>Comparar</Label>
        </div>
        <div className="flex items-center gap-1.5 shrink-0" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
          <span className={cn('inline-block w-2 h-2 rounded-full', timestampPulse && 'animate-pulse')} style={{ background: timestampColor }} />
          Atualizado às {format(lastUpdatedAt, 'HH:mm')}
        </div>
      </PageHeader>

      {/* NÍVEL 1 — Hero */}
      <HeroMRRCard
        mrrTotal={mrrTotal}
        mrrMeta={mrrMeta}
        onMetaChange={handleMetaChange}
        variacao={compareEnabled ? variacao : null}
        mrrLiquido={mrrLiquido}
        nrr={nrr}
        diaDoMes={diaDoMes}
        diasNoMes={diasNoMes}
      />

      {/* NÍVEL 2 — KPIs */}
      <KPIRow items={[
        { label: 'Receita Nova no Mês', value: formatCurrency(mrrNovo), tooltip: 'Valor trazido por clientes que entraram este mês', variacao: compareEnabled ? varNovo : null, color: '#22C55E' },
        { label: 'Receita Perdida', value: formatCurrency(churn), tooltip: 'Valor de clientes que cancelaram ou pausaram este mês', color: churn > 0 ? '#EF4444' : undefined },
        { label: 'Taxa de Cancelamento', value: `${churnRate.toFixed(1)}%`, tooltip: 'Percentual da receita perdida em relação ao total do mês anterior', color: churnRate > 5 ? '#EF4444' : churnRate > 2 ? '#FBBF24' : '#22C55E' },
        { label: 'Clientes Ativos', value: String(clientesAtivos.length), tooltip: 'Número de clientes com status Ativo' },
      ]} />

      {/* Marketplace exclusive KPIs */}
      <KPIRow items={[
        { label: 'Total Faturamento Gerenciado', value: formatCurrency(totalFat), tooltip: 'Faturamento total dos clientes nos marketplaces' },
        { label: 'Taxa Média de Comissão', value: `${taxaComissao.toFixed(1)}%`, tooltip: 'Percentual médio de comissão sobre o faturamento gerenciado', color: '#F97316' },
        { label: 'Valor Médio por Cliente', value: formatCurrency(clientesAtivos.length > 0 ? mrrTotal / clientesAtivos.length : 0), tooltip: 'Quanto cada cliente paga em média por mês' },
        { label: 'Retenção de Receita', value: nrr !== null ? `${nrr.toFixed(1)}%` : '—', tooltip: 'Se seus clientes estão pagando mais, igual ou menos que no mês passado. Acima de 100% significa crescimento', color: nrr === null ? undefined : nrr > 100 ? '#22C55E' : nrr >= 90 ? '#FBBF24' : '#EF4444' },
      ]} />

      {/* NÍVEL 3 — Chart */}
      <RevenueChart monthlyData={monthlyData} meta={mrrMeta} currentMonth={selectedMonth} />

      {/* NÍVEL 4 — Detail cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="space-y-4">
          <HealthCard groups={statusGroups} ltv={ltv} />
          <GestorPerfCard rows={gestorPerf} type="marketplace" />
        </div>
        <div className="space-y-4">
          <TopClientesCard clientes={topClientes} />
          <AlertasCard alertas={alertas} />
        </div>
      </div>
    </AppLayout>
  );
}
