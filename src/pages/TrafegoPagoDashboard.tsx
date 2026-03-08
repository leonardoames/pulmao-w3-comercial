import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionLabel } from '@/components/dashboard/SectionLabel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTrafegoPagoClientes, useTrafegoPagoAllRegistros, TrafegoPagoCliente, TrafegoPagoRegistro } from '@/hooks/useTrafegoPago';
import { useClosers } from '@/hooks/useProfiles';
import { MonthYearSelector } from '@/components/MonthYearSelector';
import { DollarSign, TrendingUp, TrendingDown, Users, BarChart3, AlertTriangle, Trophy, Zap } from 'lucide-react';
import { format, subMonths } from 'date-fns';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const STATUS_COLORS: Record<string, string> = {
  Ativo: '#22C55E', Pausado: '#FBBF24', Cancelado: '#888888', Trial: '#0EA5E9',
};

export default function TrafegoPagoDashboard() {
  const [mesAno, setMesAno] = useState(format(new Date(), 'yyyy-MM'));
  const mesAnterior = format(subMonths(new Date(mesAno + '-01'), 1), 'yyyy-MM');

  const { data: clientes } = useTrafegoPagoClientes();
  const { data: regsAtual } = useTrafegoPagoAllRegistros(mesAno);
  const { data: regsAnterior } = useTrafegoPagoAllRegistros(mesAnterior);
  const { data: closers } = useClosers();

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

  const clientesNovosMes = clientes?.filter(c => c.data_entrada?.startsWith(mesAno)) || [];
  const mrrNovo = clientesNovosMes.reduce((s, c) => s + Number(c.valor_mrr), 0);

  const clientesCancelados = clientes?.filter(c =>
    (c.status === 'Cancelado' || c.status === 'Pausado') && c.atualizado_em?.startsWith(mesAno)
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
    regsAtual?.forEach(r => {
      const c = clienteMap[r.cliente_id];
      const gId = c?.gestor_user_id || 'sem-gestor';
      if (!map[gId]) map[gId] = { clientes: 0, investimento: 0, receita: 0 };
      map[gId].investimento += Number(r.investimento_gerenciado);
      map[gId].receita += Number(r.valor_pago);
    });
    clientes?.forEach(c => {
      const gId = c.gestor_user_id || 'sem-gestor';
      if (!map[gId]) map[gId] = { clientes: 0, investimento: 0, receita: 0 };
    });
    // Count unique clients per gestor
    const clientesByGestor: Record<string, Set<string>> = {};
    regsAtual?.forEach(r => {
      const c = clienteMap[r.cliente_id];
      const gId = c?.gestor_user_id || 'sem-gestor';
      if (!clientesByGestor[gId]) clientesByGestor[gId] = new Set();
      clientesByGestor[gId].add(r.cliente_id);
    });
    return Object.entries(map).map(([id, data]) => ({
      id,
      nome: gestorMap[id] || 'Sem gestor',
      clientes: clientesByGestor[id]?.size || 0,
      ...data,
    })).sort((a, b) => b.receita - a.receita);
  }, [regsAtual, clienteMap, gestorMap, clientes]);

  // Alertas
  const alertas = useMemo(() => {
    if (!regsAtual) return [];
    return regsAtual
      .filter(r => r.status_pagamento === 'Pendente' || r.status_pagamento === 'Atrasado')
      .map(r => ({ ...r, cliente: clienteMap[r.cliente_id] }));
  }, [regsAtual, clienteMap]);

  // Chart - last 12 months
  const chartData = useMemo(() => {
    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      months.push(format(subMonths(new Date(), i), 'yyyy-MM'));
    }
    return months.map(m => ({ month: m.slice(5), mrr: 0, investido: 0 }));
    // Would need all registros across months for real chart; placeholder
  }, []);

  return (
    <AppLayout>
      <PageHeader title="Dashboard — Tráfego Pago" description="Métricas de gestão de tráfego pago">
        <Input type="month" value={mesAno} onChange={e => setMesAno(e.target.value)} className="w-[180px]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)' }} />
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
