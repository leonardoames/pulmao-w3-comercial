import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, Link2, Users, TrendingUp, BarChart3, CheckCircle2 } from 'lucide-react';
import {
  useLeads, useCreateLead, useUpdateLead, useAutoVincularLeads,
  useCreateLeadProduto, useUpdateLeadProduto,
  LeadW3, LeadProduto, StatusEducacao, ProdutoTipo, ProdutoStatus,
} from '@/hooks/useLeads';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_OPTIONS: StatusEducacao[] = [
  'Em Andamento', 'Finalizado', 'Cancelado', 'Congelado',
  'Renovação', 'Reembolsado', 'Sem Retorno', 'Não informado',
];

const STATUS_COLORS: Record<StatusEducacao, string> = {
  'Em Andamento': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Finalizado':   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Cancelado':    'bg-red-500/20 text-red-400 border-red-500/30',
  'Congelado':    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Renovação':    'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Reembolsado':  'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Sem Retorno':  'bg-gray-500/20 text-gray-400 border-gray-500/30',
  'Não informado':'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const PRODUTOS_ORDER: ProdutoTipo[] = ['educacao', 'trafego', 'marketplace', 'pagamentos'];

const PRODUTO_LABELS: Record<ProdutoTipo, string> = {
  educacao: 'Educação', trafego: 'Tráfego', marketplace: 'Marketplace', pagamentos: 'Pagamentos',
};

const PRODUTO_STYLES: Record<ProdutoTipo, { ativo: string; inativo: string; color: string }> = {
  educacao:    { ativo: 'bg-orange-500/20 text-orange-400 border-orange-500/30',  inativo: 'bg-white/5 text-white/25 border-white/10', color: 'text-orange-400' },
  trafego:     { ativo: 'bg-blue-500/20 text-blue-400 border-blue-500/30',        inativo: 'bg-white/5 text-white/25 border-white/10', color: 'text-blue-400' },
  marketplace: { ativo: 'bg-purple-500/20 text-purple-400 border-purple-500/30',  inativo: 'bg-white/5 text-white/25 border-white/10', color: 'text-purple-400' },
  pagamentos:  { ativo: 'bg-green-500/20 text-green-400 border-green-500/30',     inativo: 'bg-white/5 text-white/25 border-white/10', color: 'text-green-400' },
};

const PRODUTO_STATUS_OPTIONS: ProdutoStatus[] = ['ativo', 'finalizado', 'cancelado', 'congelado', 'nunca_contratou'];
const PRODUTO_STATUS_LABELS: Record<ProdutoStatus, string> = {
  ativo: 'Ativo', finalizado: 'Finalizado', cancelado: 'Cancelado',
  congelado: 'Congelado', nunca_contratou: 'Nunca contratou',
};

const EMPTY_FORM = {
  codigo: '', nome_negocio: '', nome_mentorado: '', nicho: '', email: '', cnpj: '',
  data_entrada: '', vigencia_meses: '', tempo_real_meses: '',
  status_educacao: 'Em Andamento' as StatusEducacao,
  valor_total: '', valor_pago: '', saldo_devedor: '', forma_pagamento: '',
  faturamento_inicial: '', ticket_medio: '', nps: '', motivo_saida: '',
  is_cliente_educacao: false, is_cliente_trafego: false, is_cliente_marketplace: false,
};

function fmtCurrency(value?: number | null) {
  if (value == null || value === 0) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getLeadLTV(lead: LeadW3): number {
  return (lead.produtos ?? []).reduce((sum, p) => sum + (p.valor_total ?? 0), 0);
}

export default function Leads() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterNicho, setFilterNicho] = useState('all');
  const [selectedLead, setSelectedLead] = useState<LeadW3 | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ ...EMPTY_FORM });
  const [resumeForm, setResumeForm] = useState<typeof EMPTY_FORM | null>(null);
  const [productForms, setProductForms] = useState<Record<string, Partial<LeadProduto>>>({});

  const { data: leads = [], isLoading, isError } = useLeads({ status: filterStatus, nicho: filterNicho, search });
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const autoVincular = useAutoVincularLeads();
  const createProduto = useCreateLeadProduto();
  const updateProduto = useUpdateLeadProduto();

  const nichos = useMemo(() => {
    const set = new Set(leads.map((l) => l.nicho).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [leads]);

  const stats = useMemo(() => {
    if (!leads.length) return { total: 0, crossSell: 0, crossSellPct: 0, ltvMedio: 0, ativos: { educacao: 0, trafego: 0, marketplace: 0, pagamentos: 0 } };
    const total = leads.length;
    const withTwoPlus = leads.filter(l => (l.produtos ?? []).filter(p => p.status === 'ativo').length >= 2).length;
    const ltvMedio = leads.map(getLeadLTV).reduce((s, v) => s + v, 0) / total;
    const ativos = {
      educacao:    leads.filter(l => l.produtos?.some(p => p.produto === 'educacao'    && p.status === 'ativo')).length,
      trafego:     leads.filter(l => l.produtos?.some(p => p.produto === 'trafego'     && p.status === 'ativo')).length,
      marketplace: leads.filter(l => l.produtos?.some(p => p.produto === 'marketplace' && p.status === 'ativo')).length,
      pagamentos:  leads.filter(l => l.produtos?.some(p => p.produto === 'pagamentos'  && p.status === 'ativo')).length,
    };
    return { total, crossSell: withTwoPlus, crossSellPct: Math.round((withTwoPlus / total) * 100), ltvMedio, ativos };
  }, [leads]);

  function handleOpenLead(lead: LeadW3) {
    setSelectedLead(lead);
    setResumeForm({
      codigo: lead.codigo,
      nome_negocio: lead.nome_negocio,
      nome_mentorado: lead.nome_mentorado ?? '',
      nicho: lead.nicho ?? '',
      email: lead.email ?? '',
      cnpj: lead.cnpj ?? '',
      data_entrada: lead.data_entrada ?? '',
      vigencia_meses: lead.vigencia_meses?.toString() ?? '',
      tempo_real_meses: lead.tempo_real_meses?.toString() ?? '',
      status_educacao: lead.status_educacao ?? 'Em Andamento',
      valor_total: lead.valor_total?.toString() ?? '',
      valor_pago: lead.valor_pago?.toString() ?? '',
      saldo_devedor: lead.saldo_devedor?.toString() ?? '',
      forma_pagamento: lead.forma_pagamento ?? '',
      faturamento_inicial: lead.faturamento_inicial?.toString() ?? '',
      ticket_medio: lead.ticket_medio?.toString() ?? '',
      nps: lead.nps ?? '',
      motivo_saida: lead.motivo_saida ?? '',
      is_cliente_educacao: lead.is_cliente_educacao,
      is_cliente_trafego: lead.is_cliente_trafego,
      is_cliente_marketplace: lead.is_cliente_marketplace,
    });
    const pf: Record<string, Partial<LeadProduto>> = {};
    for (const tipo of PRODUTOS_ORDER) {
      const existing = lead.produtos?.find(p => p.produto === tipo);
      pf[tipo] = existing ? { ...existing } : { lead_id: lead.id, produto: tipo, status: 'nunca_contratou' };
    }
    setProductForms(pf);
  }

  async function handleSaveResumo() {
    if (!selectedLead || !resumeForm) return;
    await updateLead.mutateAsync({
      id: selectedLead.id,
      codigo: resumeForm.codigo,
      nome_negocio: resumeForm.nome_negocio,
      nome_mentorado: resumeForm.nome_mentorado || null,
      nicho: resumeForm.nicho || null,
      email: resumeForm.email || null,
      cnpj: resumeForm.cnpj || null,
      data_entrada: resumeForm.data_entrada || null,
      vigencia_meses: resumeForm.vigencia_meses ? parseInt(resumeForm.vigencia_meses) : null,
      tempo_real_meses: resumeForm.tempo_real_meses ? parseInt(resumeForm.tempo_real_meses) : null,
      status_educacao: resumeForm.status_educacao,
      valor_total: resumeForm.valor_total ? parseFloat(resumeForm.valor_total) : null,
      valor_pago: resumeForm.valor_pago ? parseFloat(resumeForm.valor_pago) : null,
      saldo_devedor: resumeForm.saldo_devedor ? parseFloat(resumeForm.saldo_devedor) : null,
      forma_pagamento: resumeForm.forma_pagamento || null,
      faturamento_inicial: resumeForm.faturamento_inicial ? parseFloat(resumeForm.faturamento_inicial) : null,
      ticket_medio: resumeForm.ticket_medio ? parseFloat(resumeForm.ticket_medio) : null,
      nps: resumeForm.nps || null,
      motivo_saida: resumeForm.motivo_saida || null,
      is_cliente_educacao: resumeForm.is_cliente_educacao,
      is_cliente_trafego: resumeForm.is_cliente_trafego,
      is_cliente_marketplace: resumeForm.is_cliente_marketplace,
    });
  }

  async function handleSaveProduto(tipo: ProdutoTipo) {
    if (!selectedLead) return;
    const pf = productForms[tipo];
    const existing = selectedLead.produtos?.find(p => p.produto === tipo);
    if (existing) {
      await updateProduto.mutateAsync({ id: existing.id, ...pf });
    } else if (pf?.status !== 'nunca_contratou') {
      await createProduto.mutateAsync({
        lead_id: selectedLead.id,
        produto: tipo,
        status: pf?.status ?? 'ativo',
        valor_total: pf?.valor_total ?? null,
        valor_pago: pf?.valor_pago ?? null,
        saldo_devedor: pf?.saldo_devedor ?? null,
        data_inicio: pf?.data_inicio ?? null,
        data_fim: pf?.data_fim ?? null,
        observacoes: pf?.observacoes ?? null,
      });
    }
  }

  async function handleCreate() {
    await createLead.mutateAsync({
      codigo: createForm.codigo,
      nome_negocio: createForm.nome_negocio,
      nome_mentorado: createForm.nome_mentorado || null,
      nicho: createForm.nicho || null,
      email: createForm.email || null,
      cnpj: createForm.cnpj || null,
      data_entrada: createForm.data_entrada || null,
      vigencia_meses: createForm.vigencia_meses ? parseInt(createForm.vigencia_meses) : null,
      tempo_real_meses: createForm.tempo_real_meses ? parseInt(createForm.tempo_real_meses) : null,
      status_educacao: createForm.status_educacao,
      valor_total: createForm.valor_total ? parseFloat(createForm.valor_total) : null,
      valor_pago: createForm.valor_pago ? parseFloat(createForm.valor_pago) : null,
      saldo_devedor: createForm.saldo_devedor ? parseFloat(createForm.saldo_devedor) : null,
      forma_pagamento: createForm.forma_pagamento || null,
      faturamento_inicial: createForm.faturamento_inicial ? parseFloat(createForm.faturamento_inicial) : null,
      ticket_medio: createForm.ticket_medio ? parseFloat(createForm.ticket_medio) : null,
      nps: createForm.nps || null,
      motivo_saida: createForm.motivo_saida || null,
      is_cliente_educacao: createForm.is_cliente_educacao,
      is_cliente_trafego: createForm.is_cliente_trafego,
      is_cliente_marketplace: createForm.is_cliente_marketplace,
      venda_id: null,
    });
    setCreateOpen(false);
    setCreateForm({ ...EMPTY_FORM });
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <PageHeader title="Base Leads W3" description="Gestão de leads e mentorados">
          <Button variant="outline" className="gap-2 border-white/10"
            onClick={() => autoVincular.mutate()} disabled={autoVincular.isPending}>
            <Link2 className="h-4 w-4" /> Auto Vincular
          </Button>
          <Button onClick={() => { setCreateForm({ ...EMPTY_FORM }); setCreateOpen(true); }}
            className="gap-2 bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4" /> Novo Lead
          </Button>
        </PageHeader>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-white/50 font-normal uppercase tracking-wide flex items-center gap-2">
                <Users className="h-3.5 w-3.5" /> Total de Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{stats.total.toLocaleString('pt-BR')}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-white/50 font-normal uppercase tracking-wide flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5" /> Cross-sell (2+ produtos)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{stats.crossSellPct}%</p>
              <p className="text-xs text-white/40 mt-1">{stats.crossSell} leads</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-white/50 font-normal uppercase tracking-wide flex items-center gap-2">
                <BarChart3 className="h-3.5 w-3.5" /> LTV Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{fmtCurrency(stats.ltvMedio)}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-white/50 font-normal uppercase tracking-wide flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> Ativos por Produto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1">
                {PRODUTOS_ORDER.map((tipo) => (
                  <div key={tipo} className="flex justify-between text-xs">
                    <span className={PRODUTO_STYLES[tipo].color}>{PRODUTO_LABELS[tipo]}</span>
                    <span className="text-white font-medium">{stats.ativos[tipo]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input placeholder="Buscar por nome, email, CNPJ..."
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterNicho} onValueChange={setFilterNicho}>
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white"><SelectValue placeholder="Nicho" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os nichos</SelectItem>
              {nichos.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/50">Código</TableHead>
                <TableHead className="text-white/50">Nome do Negócio</TableHead>
                <TableHead className="text-white/50">Mentorado</TableHead>
                <TableHead className="text-white/50">CNPJ</TableHead>
                <TableHead className="text-white/50">Nicho</TableHead>
                <TableHead className="text-white/50">Status Edu.</TableHead>
                <TableHead className="text-right text-white/50">LTV</TableHead>
                <TableHead className="text-white/50">Entrada</TableHead>
                <TableHead className="text-white/50">Produtos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center text-white/40 py-12">Carregando...</TableCell></TableRow>
              ) : isError ? (
                <TableRow><TableCell colSpan={9} className="text-center text-yellow-400/70 py-12">
                  Aguardando sincronização do banco de dados
                </TableCell></TableRow>
              ) : leads.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-white/40 py-12">Nenhum lead encontrado.</TableCell></TableRow>
              ) : leads.map((lead) => (
                <TableRow key={lead.id} className="border-white/10 hover:bg-white/5 cursor-pointer"
                  onClick={() => handleOpenLead(lead)}>
                  <TableCell className="text-white/70 font-mono text-xs">{lead.codigo}</TableCell>
                  <TableCell className="text-white font-medium">{lead.nome_negocio}</TableCell>
                  <TableCell className="text-white/70">{lead.nome_mentorado ?? '—'}</TableCell>
                  <TableCell className="text-white/50 font-mono text-xs">{lead.cnpj ?? '—'}</TableCell>
                  <TableCell className="text-white/70">{lead.nicho ?? '—'}</TableCell>
                  <TableCell>
                    {lead.status_educacao ? (
                      <Badge className={`border text-xs ${STATUS_COLORS[lead.status_educacao] ?? 'bg-gray-500/20 text-gray-400'}`}>
                        {lead.status_educacao}
                      </Badge>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-right text-white/70">
                    {fmtCurrency(getLeadLTV(lead) || lead.valor_total)}
                  </TableCell>
                  <TableCell className="text-white/70 text-sm">
                    {lead.data_entrada ? format(new Date(lead.data_entrada + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR }) : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {PRODUTOS_ORDER.map((tipo) => {
                        const p = lead.produtos?.find(pr => pr.produto === tipo);
                        if (!p) return null;
                        const isAtivo = p.status === 'ativo';
                        return (
                          <span key={tipo} className={`text-xs px-1.5 py-0.5 rounded border ${isAtivo ? PRODUTO_STYLES[tipo].ativo : PRODUTO_STYLES[tipo].inativo}`}>
                            {PRODUTO_LABELS[tipo].slice(0, 3)}{isAtivo ? ' ✓' : ''}
                          </span>
                        );
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Lead Detail Drawer */}
        <Sheet open={!!selectedLead} onOpenChange={(open) => { if (!open) setSelectedLead(null); }}>
          <SheetContent className="bg-[#1a1a1a] border-white/10 w-[640px] sm:max-w-[640px] overflow-y-auto">
            {selectedLead && resumeForm && (
              <>
                <SheetHeader className="mb-4">
                  <SheetTitle className="text-white">{selectedLead.nome_negocio}</SheetTitle>
                  <p className="text-xs text-white/40 font-mono">{selectedLead.codigo}</p>
                </SheetHeader>
                <Tabs defaultValue="resumo">
                  <TabsList className="bg-white/10 mb-4 w-full">
                    <TabsTrigger value="resumo" className="flex-1">Resumo</TabsTrigger>
                    <TabsTrigger value="produtos" className="flex-1">Produtos</TabsTrigger>
                    <TabsTrigger value="historico" className="flex-1">Histórico</TabsTrigger>
                  </TabsList>

                  {/* TAB RESUMO */}
                  <TabsContent value="resumo" className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                      <div>
                        <p className="text-xs text-white/40 mb-1">LTV Total</p>
                        <p className="text-base font-bold text-orange-400">{fmtCurrency(getLeadLTV(selectedLead) || selectedLead.valor_total)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/40 mb-1">Produtos Ativos</p>
                        <p className="text-base font-bold text-white">{selectedLead.produtos?.filter(p => p.status === 'ativo').length ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/40 mb-1">Nicho</p>
                        <p className="text-sm font-medium text-white/80 truncate">{selectedLead.nicho ?? '—'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-white/70 text-xs">Código</Label>
                        <Input className="bg-white/5 border-white/10 text-white h-8 text-sm" value={resumeForm.codigo}
                          onChange={(e) => setResumeForm(f => f ? { ...f, codigo: e.target.value } : f)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-white/70 text-xs">Status Educação</Label>
                        <Select value={resumeForm.status_educacao}
                          onValueChange={(v) => setResumeForm(f => f ? { ...f, status_educacao: v as StatusEducacao } : f)}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-white/70 text-xs">Nome do Negócio</Label>
                      <Input className="bg-white/5 border-white/10 text-white h-8 text-sm" value={resumeForm.nome_negocio}
                        onChange={(e) => setResumeForm(f => f ? { ...f, nome_negocio: e.target.value } : f)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-white/70 text-xs">Mentorado</Label>
                        <Input className="bg-white/5 border-white/10 text-white h-8 text-sm" value={resumeForm.nome_mentorado}
                          onChange={(e) => setResumeForm(f => f ? { ...f, nome_mentorado: e.target.value } : f)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-white/70 text-xs">Nicho</Label>
                        <Input className="bg-white/5 border-white/10 text-white h-8 text-sm" value={resumeForm.nicho}
                          onChange={(e) => setResumeForm(f => f ? { ...f, nicho: e.target.value } : f)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-white/70 text-xs">Email</Label>
                        <Input className="bg-white/5 border-white/10 text-white h-8 text-sm" type="email" value={resumeForm.email}
                          onChange={(e) => setResumeForm(f => f ? { ...f, email: e.target.value } : f)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-white/70 text-xs">CNPJ</Label>
                        <Input className="bg-white/5 border-white/10 text-white h-8 text-sm font-mono" value={resumeForm.cnpj}
                          onChange={(e) => setResumeForm(f => f ? { ...f, cnpj: e.target.value } : f)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-white/70 text-xs">Data de Entrada</Label>
                        <Input className="bg-white/5 border-white/10 text-white h-8 text-sm" type="date" value={resumeForm.data_entrada}
                          onChange={(e) => setResumeForm(f => f ? { ...f, data_entrada: e.target.value } : f)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-white/70 text-xs">Forma de Pagamento</Label>
                        <Input className="bg-white/5 border-white/10 text-white h-8 text-sm" value={resumeForm.forma_pagamento}
                          onChange={(e) => setResumeForm(f => f ? { ...f, forma_pagamento: e.target.value } : f)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-white/70 text-xs">Vigência (m)</Label>
                        <Input className="bg-white/5 border-white/10 text-white h-8 text-sm" type="number" value={resumeForm.vigencia_meses}
                          onChange={(e) => setResumeForm(f => f ? { ...f, vigencia_meses: e.target.value } : f)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-white/70 text-xs">Tempo Real (m)</Label>
                        <Input className="bg-white/5 border-white/10 text-white h-8 text-sm" type="number" value={resumeForm.tempo_real_meses}
                          onChange={(e) => setResumeForm(f => f ? { ...f, tempo_real_meses: e.target.value } : f)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-white/70 text-xs">NPS</Label>
                        <Input className="bg-white/5 border-white/10 text-white h-8 text-sm" value={resumeForm.nps}
                          onChange={(e) => setResumeForm(f => f ? { ...f, nps: e.target.value } : f)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-white/70 text-xs">Valor Total</Label>
                        <Input className="bg-white/5 border-white/10 text-white h-8 text-sm" type="number" value={resumeForm.valor_total}
                          onChange={(e) => setResumeForm(f => f ? { ...f, valor_total: e.target.value } : f)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-white/70 text-xs">Valor Pago</Label>
                        <Input className="bg-white/5 border-white/10 text-white h-8 text-sm" type="number" value={resumeForm.valor_pago}
                          onChange={(e) => setResumeForm(f => f ? { ...f, valor_pago: e.target.value } : f)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-white/70 text-xs">Saldo Devedor</Label>
                        <Input className="bg-white/5 border-white/10 text-white h-8 text-sm" type="number" value={resumeForm.saldo_devedor}
                          onChange={(e) => setResumeForm(f => f ? { ...f, saldo_devedor: e.target.value } : f)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-white/70 text-xs">Faturamento Inicial</Label>
                        <Input className="bg-white/5 border-white/10 text-white h-8 text-sm" type="number" value={resumeForm.faturamento_inicial}
                          onChange={(e) => setResumeForm(f => f ? { ...f, faturamento_inicial: e.target.value } : f)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-white/70 text-xs">Ticket Médio</Label>
                        <Input className="bg-white/5 border-white/10 text-white h-8 text-sm" type="number" value={resumeForm.ticket_medio}
                          onChange={(e) => setResumeForm(f => f ? { ...f, ticket_medio: e.target.value } : f)} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-white/70 text-xs">Motivo de Saída</Label>
                      <Input className="bg-white/5 border-white/10 text-white h-8 text-sm" value={resumeForm.motivo_saida}
                        onChange={(e) => setResumeForm(f => f ? { ...f, motivo_saida: e.target.value } : f)} />
                    </div>
                    <div className="flex gap-2 pt-3">
                      <Button variant="outline" className="flex-1 border-white/10 h-8 text-sm" onClick={() => setSelectedLead(null)}>Fechar</Button>
                      <Button className="flex-1 bg-orange-500 hover:bg-orange-600 h-8 text-sm"
                        onClick={handleSaveResumo} disabled={updateLead.isPending}>Salvar</Button>
                    </div>
                  </TabsContent>

                  {/* TAB PRODUTOS */}
                  <TabsContent value="produtos" className="space-y-3">
                    {PRODUTOS_ORDER.map((tipo) => {
                      const pf = productForms[tipo] ?? {};
                      const existing = selectedLead.produtos?.find(p => p.produto === tipo);
                      const isAtivo = pf.status === 'ativo';
                      return (
                        <div key={tipo} className={`rounded-lg border p-4 space-y-3 transition-colors ${isAtivo ? 'border-white/20 bg-white/5' : 'border-white/8 bg-white/[0.02]'}`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-semibold ${isAtivo ? PRODUTO_STYLES[tipo].color : 'text-white/40'}`}>
                              {PRODUTO_LABELS[tipo]}
                            </span>
                            <Select value={pf.status ?? 'nunca_contratou'}
                              onValueChange={(v) => setProductForms(pfs => ({ ...pfs, [tipo]: { ...pf, status: v as ProdutoStatus } }))}>
                              <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {PRODUTO_STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{PRODUTO_STATUS_LABELS[s]}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          {pf.status !== 'nunca_contratou' && (
                            <>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-white/50 text-xs">Valor Total</Label>
                                  <Input className="bg-white/5 border-white/10 text-white h-7 text-xs" type="number"
                                    value={pf.valor_total?.toString() ?? ''}
                                    onChange={(e) => setProductForms(pfs => ({ ...pfs, [tipo]: { ...pf, valor_total: parseFloat(e.target.value) || undefined } }))} />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-white/50 text-xs">Valor Pago</Label>
                                  <Input className="bg-white/5 border-white/10 text-white h-7 text-xs" type="number"
                                    value={pf.valor_pago?.toString() ?? ''}
                                    onChange={(e) => setProductForms(pfs => ({ ...pfs, [tipo]: { ...pf, valor_pago: parseFloat(e.target.value) || undefined } }))} />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-white/50 text-xs">Saldo Devedor</Label>
                                  <Input className="bg-white/5 border-white/10 text-white h-7 text-xs" type="number"
                                    value={pf.saldo_devedor?.toString() ?? ''}
                                    onChange={(e) => setProductForms(pfs => ({ ...pfs, [tipo]: { ...pf, saldo_devedor: parseFloat(e.target.value) || undefined } }))} />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-white/50 text-xs">Data Início</Label>
                                  <Input className="bg-white/5 border-white/10 text-white h-7 text-xs" type="date"
                                    value={pf.data_inicio ?? ''}
                                    onChange={(e) => setProductForms(pfs => ({ ...pfs, [tipo]: { ...pf, data_inicio: e.target.value } }))} />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-white/50 text-xs">Data Fim</Label>
                                  <Input className="bg-white/5 border-white/10 text-white h-7 text-xs" type="date"
                                    value={pf.data_fim ?? ''}
                                    onChange={(e) => setProductForms(pfs => ({ ...pfs, [tipo]: { ...pf, data_fim: e.target.value } }))} />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-white/50 text-xs">Observações</Label>
                                <Input className="bg-white/5 border-white/10 text-white h-7 text-xs"
                                  value={pf.observacoes ?? ''}
                                  onChange={(e) => setProductForms(pfs => ({ ...pfs, [tipo]: { ...pf, observacoes: e.target.value } }))} />
                              </div>
                            </>
                          )}
                          <Button size="sm" variant="outline"
                            className="w-full border-white/10 text-white/70 hover:text-white h-7 text-xs"
                            onClick={() => handleSaveProduto(tipo)}
                            disabled={createProduto.isPending || updateProduto.isPending}>
                            {existing ? 'Salvar alterações' : pf.status === 'nunca_contratou' ? 'Sem contrato' : 'Registrar produto'}
                          </Button>
                        </div>
                      );
                    })}
                  </TabsContent>

                  {/* TAB HISTÓRICO */}
                  <TabsContent value="historico">
                    <p className="text-xs text-white/40 uppercase tracking-wide font-semibold mb-4">Timeline</p>
                    <div className="relative pl-5 border-l border-white/10 space-y-5">
                      {selectedLead.produtos
                        ?.filter(p => p.status !== 'nunca_contratou')
                        .sort((a, b) => (a.data_inicio ?? '').localeCompare(b.data_inicio ?? ''))
                        .map((p) => (
                          <div key={p.id} className="relative">
                            <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white/20 bg-background" />
                            <p className="text-xs text-white/40">
                              {p.data_inicio ? format(new Date(p.data_inicio + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR }) : 'Data desconhecida'}
                            </p>
                            <p className="text-sm text-white/80">
                              Produto <span className={PRODUTO_STYLES[p.produto as ProdutoTipo].color}>{PRODUTO_LABELS[p.produto as ProdutoTipo]}</span>
                              {' '}— {PRODUTO_STATUS_LABELS[p.status as ProdutoStatus]}
                            </p>
                            {p.valor_total ? <p className="text-xs text-white/40">{fmtCurrency(p.valor_total)}</p> : null}
                          </div>
                        ))}
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-orange-500/50 bg-orange-500/20" />
                        <p className="text-xs text-white/40">
                          {format(new Date(selectedLead.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                        <p className="text-sm text-white/80">Lead cadastrado na base</p>
                        {selectedLead.data_entrada && (
                          <p className="text-xs text-white/40">
                            Entrada em {format(new Date(selectedLead.data_entrada + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Create Sheet */}
        <Sheet open={createOpen} onOpenChange={setCreateOpen}>
          <SheetContent className="bg-[#1a1a1a] border-white/10 w-[520px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-white">Novo Lead</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-white/70">Código *</Label>
                  <Input className="bg-white/5 border-white/10 text-white" value={createForm.codigo}
                    onChange={(e) => setCreateForm(f => ({ ...f, codigo: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/70">Status Educação</Label>
                  <Select value={createForm.status_educacao}
                    onValueChange={(v) => setCreateForm(f => ({ ...f, status_educacao: v as StatusEducacao }))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-white/70">Nome do Negócio *</Label>
                <Input className="bg-white/5 border-white/10 text-white" value={createForm.nome_negocio}
                  onChange={(e) => setCreateForm(f => ({ ...f, nome_negocio: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-white/70">Mentorado</Label>
                  <Input className="bg-white/5 border-white/10 text-white" value={createForm.nome_mentorado}
                    onChange={(e) => setCreateForm(f => ({ ...f, nome_mentorado: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/70">Nicho</Label>
                  <Input className="bg-white/5 border-white/10 text-white" value={createForm.nicho}
                    onChange={(e) => setCreateForm(f => ({ ...f, nicho: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-white/70">Email</Label>
                  <Input className="bg-white/5 border-white/10 text-white" type="email" value={createForm.email}
                    onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/70">CNPJ</Label>
                  <Input className="bg-white/5 border-white/10 text-white font-mono" value={createForm.cnpj}
                    onChange={(e) => setCreateForm(f => ({ ...f, cnpj: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-white/70">Data de Entrada</Label>
                  <Input className="bg-white/5 border-white/10 text-white" type="date" value={createForm.data_entrada}
                    onChange={(e) => setCreateForm(f => ({ ...f, data_entrada: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/70">Forma de Pagamento</Label>
                  <Input className="bg-white/5 border-white/10 text-white" value={createForm.forma_pagamento}
                    onChange={(e) => setCreateForm(f => ({ ...f, forma_pagamento: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-white/70">Valor Total</Label>
                  <Input className="bg-white/5 border-white/10 text-white" type="number" value={createForm.valor_total}
                    onChange={(e) => setCreateForm(f => ({ ...f, valor_total: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/70">Valor Pago</Label>
                  <Input className="bg-white/5 border-white/10 text-white" type="number" value={createForm.valor_pago}
                    onChange={(e) => setCreateForm(f => ({ ...f, valor_pago: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/70">Saldo Devedor</Label>
                  <Input className="bg-white/5 border-white/10 text-white" type="number" value={createForm.saldo_devedor}
                    onChange={(e) => setCreateForm(f => ({ ...f, saldo_devedor: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-white/70">Motivo de Saída</Label>
                <Input className="bg-white/5 border-white/10 text-white" value={createForm.motivo_saida}
                  onChange={(e) => setCreateForm(f => ({ ...f, motivo_saida: e.target.value }))} />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1 border-white/10" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                <Button className="flex-1 bg-orange-500 hover:bg-orange-600"
                  onClick={handleCreate} disabled={createLead.isPending}>Criar Lead</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}
