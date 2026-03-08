import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { InlineEditCell } from '@/components/ui/inline-edit-cell';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useClosers } from '@/hooks/useProfiles';
import {
  useMarketplaceClientes,
  useMarketplaceRegistros,
  useUpsertMarketplaceCliente,
  useUpsertMarketplaceRegistro,
  MarketplaceCliente,
  FaixaPercentual,
  calcularValorVariavel,
  useMarketplaceAllRegistros,
} from '@/hooks/useMarketplaces';

const STATUS_COLORS: Record<string, string> = { Ativo: '#22C55E', Pausado: '#FBBF24', Cancelado: '#888888', Trial: '#0EA5E9' };
const MARKETPLACES = ['Mercado Livre', 'Shopee', 'Shein'];
const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function MarketplaceClientes() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGestor, setFilterGestor] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<MarketplaceCliente | null>(null);
  const [activeTab, setActiveTab] = useState('dados');

  const [form, setForm] = useState({
    nome_ecommerce: '', site: '', nicho: '', faturamento_ao_entrar: '',
    data_entrada: format(new Date(), 'yyyy-MM-dd'), dia_cobranca: '1',
    gestor_user_id: '', marketplaces: [] as string[],
    status: 'Ativo' as MarketplaceCliente['status'],
    modelo_cobranca: 'percentual_faixas' as MarketplaceCliente['modelo_cobranca'],
    valor_fixo: '', faixas: [{ de: 0, ate: 100000, percentual: 5 }] as (FaixaPercentual & { ate: number | null })[],
    observacoes: '',
  });

  const [regForm, setRegForm] = useState({
    mes_ano: format(new Date(), 'yyyy-MM'),
    faturamento_informado: '',
    status_pagamento: 'Pendente' as 'Pago' | 'Pendente' | 'Atrasado',
    observacao: '',
  });

  const { data: clientes } = useMarketplaceClientes({ search, status: filterStatus, gestor: filterGestor });
  const { data: registros } = useMarketplaceRegistros(editingCliente?.id);
  const { data: closers } = useClosers();
  const mesAtual = format(new Date(), 'yyyy-MM');
  const { data: allRegsAtual } = useMarketplaceAllRegistros(mesAtual);
  const upsertCliente = useUpsertMarketplaceCliente();
  const upsertRegistro = useUpsertMarketplaceRegistro();

  const gestorMap = useMemo(() => {
    const m: Record<string, string> = {};
    closers?.forEach(c => { m[c.id] = c.nome; });
    return m;
  }, [closers]);

  const openNew = () => {
    setEditingCliente(null);
    setForm({
      nome_ecommerce: '', site: '', nicho: '', faturamento_ao_entrar: '',
      data_entrada: format(new Date(), 'yyyy-MM-dd'), dia_cobranca: '1',
      gestor_user_id: '', marketplaces: [], status: 'Ativo',
      modelo_cobranca: 'percentual_faixas', valor_fixo: '',
      faixas: [{ de: 0, ate: 100000, percentual: 5 }], observacoes: '',
    });
    setActiveTab('dados');
    setDrawerOpen(true);
  };

  const openEdit = (c: MarketplaceCliente) => {
    setEditingCliente(c);
    setForm({
      nome_ecommerce: c.nome_ecommerce, site: c.site || '', nicho: c.nicho || '',
      faturamento_ao_entrar: String(c.faturamento_ao_entrar || ''),
      data_entrada: c.data_entrada, dia_cobranca: String(c.dia_cobranca),
      gestor_user_id: c.gestor_user_id || '', marketplaces: c.marketplaces || [],
      status: c.status, modelo_cobranca: c.modelo_cobranca,
      valor_fixo: String(c.valor_fixo || ''),
      faixas: (c.faixas_percentual?.length > 0 ? c.faixas_percentual : [{ de: 0, ate: 100000, percentual: 5 }]) as any,
      observacoes: c.observacoes || '',
    });
    setActiveTab('dados');
    setDrawerOpen(true);
  };

  const handleSaveCliente = () => {
    if (!form.nome_ecommerce.trim()) { toast.error('Nome obrigatório'); return; }
    const payload: any = {
      nome_ecommerce: form.nome_ecommerce.trim(), site: form.site, nicho: form.nicho,
      faturamento_ao_entrar: parseFloat(form.faturamento_ao_entrar.replace(/\./g, '').replace(',', '.')) || 0,
      data_entrada: form.data_entrada, dia_cobranca: parseInt(form.dia_cobranca) || 1,
      gestor_user_id: form.gestor_user_id || null, marketplaces: form.marketplaces,
      status: form.status, modelo_cobranca: form.modelo_cobranca,
      valor_fixo: parseFloat(form.valor_fixo.replace(/\./g, '').replace(',', '.')) || 0,
      faixas_percentual: form.modelo_cobranca !== 'somente_fixo' ? form.faixas : [],
      observacoes: form.observacoes,
    };
    if (editingCliente) payload.id = editingCliente.id;
    upsertCliente.mutate(payload, {
      onSuccess: () => { toast.success(editingCliente ? 'Atualizado!' : 'Criado!'); if (!editingCliente) setDrawerOpen(false); },
      onError: (err: any) => toast.error(err.message || 'Erro'),
    });
  };

  const handleSaveRegistro = () => {
    if (!editingCliente) return;
    const fat = parseFloat(regForm.faturamento_informado.replace(/\./g, '').replace(',', '.')) || 0;
    const fixo = editingCliente.modelo_cobranca !== 'percentual_faixas' ? Number(editingCliente.valor_fixo) : 0;
    const { percentual, valor: variavel } = editingCliente.modelo_cobranca !== 'somente_fixo'
      ? calcularValorVariavel(fat, editingCliente.faixas_percentual || [])
      : { percentual: 0, valor: 0 };
    const total = fixo + variavel;

    upsertRegistro.mutate({
      cliente_id: editingCliente.id, mes_ano: regForm.mes_ano,
      faturamento_informado: fat, fixo_cobrado: fixo,
      percentual_aplicado: percentual, valor_variavel: variavel,
      total_a_receber: total, status_pagamento: regForm.status_pagamento,
      observacao: regForm.observacao,
    }, {
      onSuccess: () => {
        toast.success('Registro salvo!');
        setRegForm({ mes_ano: format(new Date(), 'yyyy-MM'), faturamento_informado: '', status_pagamento: 'Pendente', observacao: '' });
      },
      onError: (err: any) => toast.error(err.message || 'Erro'),
    });
  };

  const toggleMarketplace = (m: string) => {
    setForm(p => ({
      ...p,
      marketplaces: p.marketplaces.includes(m) ? p.marketplaces.filter(x => x !== m) : [...p.marketplaces, m],
    }));
  };

  const addFaixa = () => {
    setForm(p => ({
      ...p,
      faixas: [...p.faixas, { de: p.faixas.length > 0 ? (p.faixas[p.faixas.length - 1].ate || 0) : 0, ate: null, percentual: 3 }],
    }));
  };

  const updateFaixa = (idx: number, field: string, val: string) => {
    setForm(p => {
      const faixas = [...p.faixas];
      (faixas[idx] as any)[field] = field === 'percentual' ? parseFloat(val) || 0 : val === '' ? null : parseFloat(val) || 0;
      return { ...p, faixas };
    });
  };

  const removeFaixa = (idx: number) => {
    setForm(p => ({ ...p, faixas: p.faixas.filter((_, i) => i !== idx) }));
  };

  // Receita esperada calculation
  const receitaEsperada = useMemo(() => {
    const map: Record<string, number> = {};
    allRegsAtual?.forEach(r => { map[r.cliente_id] = Number(r.total_a_receber); });
    return map;
  }, [allRegsAtual]);

  const totals = useMemo(() => {
    if (!registros) return { fat: 0, recebido: 0 };
    return {
      fat: registros.reduce((s, r) => s + Number(r.faturamento_informado), 0),
      recebido: registros.reduce((s, r) => s + Number(r.total_a_receber), 0),
    };
  }, [registros]);

  return (
    <AppLayout>
      <PageHeader title="Clientes — Marketplaces" description="Gestão de clientes de marketplaces">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-[200px]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)' }} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[130px]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Ativo">Ativo</SelectItem>
            <SelectItem value="Pausado">Pausado</SelectItem>
            <SelectItem value="Cancelado">Cancelado</SelectItem>
            <SelectItem value="Trial">Trial</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Novo Cliente</Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-commerce</TableHead>
                <TableHead>Nicho</TableHead>
                <TableHead>Marketplaces</TableHead>
                <TableHead>Data Entrada</TableHead>
                <TableHead>Gestor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Receita Esperada</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes?.map(c => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/30" onClick={() => openEdit(c)}>
                  <TableCell className="font-medium">{c.nome_ecommerce}</TableCell>
                  <TableCell style={{ color: 'rgba(255,255,255,0.5)' }}>{c.nicho || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {c.marketplaces?.map(m => (
                        <Badge key={m} variant="outline" style={{ fontSize: '10px' }}>{m}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell style={{ color: 'rgba(255,255,255,0.5)' }}>{format(new Date(c.data_entrada + 'T12:00:00'), 'dd/MM/yyyy')}</TableCell>
                  <TableCell style={{ color: 'rgba(255,255,255,0.5)' }}>{gestorMap[c.gestor_user_id || ''] || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" style={{ borderColor: STATUS_COLORS[c.status], color: STATUS_COLORS[c.status] }}>{c.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold" style={{ color: '#F97316' }}>
                    {receitaEsperada[c.id] != null ? formatCurrency(receitaEsperada[c.id]) : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); openEdit(c); }}><Edit className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!clientes || clientes.length === 0) && (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Nenhum cliente encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="sm:max-w-[640px] overflow-y-auto">
          <SheetHeader><SheetTitle>{editingCliente ? 'Editar Cliente' : 'Novo Cliente'}</SheetTitle></SheetHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="w-full">
              <TabsTrigger value="dados" className="flex-1">Dados</TabsTrigger>
              {editingCliente && <TabsTrigger value="historico" className="flex-1">Histórico Mensal</TabsTrigger>}
            </TabsList>

            <TabsContent value="dados" className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label>Nome do E-commerce *</Label>
                <Input value={form.nome_ecommerce} onChange={e => setForm(p => ({ ...p, nome_ecommerce: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Site</Label><Input value={form.site} onChange={e => setForm(p => ({ ...p, site: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>Nicho</Label><Input value={form.nicho} onChange={e => setForm(p => ({ ...p, nicho: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Faturamento ao Entrar (R$)</Label><Input value={form.faturamento_ao_entrar} onChange={e => setForm(p => ({ ...p, faturamento_ao_entrar: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>Data de Entrada</Label><Input type="date" value={form.data_entrada} onChange={e => setForm(p => ({ ...p, data_entrada: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Dia de Cobrança</Label><Input type="number" min={1} max={31} value={form.dia_cobranca} onChange={e => setForm(p => ({ ...p, dia_cobranca: e.target.value }))} /></div>
                <div className="space-y-1.5">
                  <Label>Gestor</Label>
                  <Select value={form.gestor_user_id} onValueChange={v => setForm(p => ({ ...p, gestor_user_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>{closers?.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Marketplaces</Label>
                  <div className="flex gap-2 flex-wrap">
                    {MARKETPLACES.map(m => (
                      <Button key={m} variant={form.marketplaces.includes(m) ? 'default' : 'outline'} size="sm" onClick={() => toggleMarketplace(m)}>{m}</Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Pausado">Pausado</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem><SelectItem value="Trial">Trial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Modelo de Cobrança */}
              <div className="space-y-3 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Label className="font-semibold">Modelo de Cobrança</Label>
                <div className="flex gap-2">
                  {[
                    { value: 'percentual_faixas', label: 'Percentual por Faixas' },
                    { value: 'fixo_percentual', label: 'Fixo + Percentual' },
                    { value: 'somente_fixo', label: 'Somente Fixo' },
                  ].map(opt => (
                    <Button key={opt.value} variant={form.modelo_cobranca === opt.value ? 'default' : 'outline'} size="sm"
                      onClick={() => setForm(p => ({ ...p, modelo_cobranca: opt.value as any }))}>
                      {opt.label}
                    </Button>
                  ))}
                </div>

                {form.modelo_cobranca !== 'percentual_faixas' && (
                  <div className="space-y-1.5">
                    <Label>Valor Fixo Mensal (R$)</Label>
                    <Input value={form.valor_fixo} onChange={e => setForm(p => ({ ...p, valor_fixo: e.target.value }))} />
                  </div>
                )}

                {form.modelo_cobranca !== 'somente_fixo' && (
                  <div className="space-y-2">
                    <Label>Faixas de Percentual</Label>
                    {form.faixas.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input className="w-24" placeholder="De R$" type="number" value={f.de} onChange={e => updateFaixa(i, 'de', e.target.value)} />
                        <span style={{ color: 'rgba(255,255,255,0.3)' }}>→</span>
                        <Input className="w-24" placeholder="Até R$" type="number" value={f.ate ?? ''} onChange={e => updateFaixa(i, 'ate', e.target.value)} />
                        <Input className="w-16" type="number" step="0.5" value={f.percentual} onChange={e => updateFaixa(i, 'percentual', e.target.value)} />
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>%</span>
                        {form.faixas.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => removeFaixa(i)}><Trash2 className="h-3 w-3" /></Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addFaixa}><Plus className="h-3 w-3 mr-1" /> Adicionar Faixa</Button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Observações Internas</Label>
                <Textarea value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} rows={3} />
              </div>
              <Button onClick={handleSaveCliente} disabled={upsertCliente.isPending} className="w-full">
                {editingCliente ? 'Salvar Alterações' : 'Criar Cliente'}
              </Button>
            </TabsContent>

            {editingCliente && (
              <TabsContent value="historico" className="mt-4 space-y-4">
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-sm">+ Registrar Mês</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-xs">Mês/Ano</Label><Input type="month" value={regForm.mes_ano} onChange={e => setRegForm(p => ({ ...p, mes_ano: e.target.value }))} /></div>
                      <div className="space-y-1">
                        <Label className="text-xs">Status Pagamento</Label>
                        <Select value={regForm.status_pagamento} onValueChange={v => setRegForm(p => ({ ...p, status_pagamento: v as any }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pago">Pago</SelectItem><SelectItem value="Pendente">Pendente</SelectItem><SelectItem value="Atrasado">Atrasado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Faturamento Informado (R$)</Label>
                      <Input value={regForm.faturamento_informado} onChange={e => setRegForm(p => ({ ...p, faturamento_informado: e.target.value }))} />
                    </div>
                    <div className="space-y-1"><Label className="text-xs">Observação</Label><Input value={regForm.observacao} onChange={e => setRegForm(p => ({ ...p, observacao: e.target.value }))} /></div>
                    <Button size="sm" onClick={handleSaveRegistro} disabled={upsertRegistro.isPending} className="w-full">Salvar Registro</Button>
                  </CardContent>
                </Card>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês/Ano</TableHead>
                      <TableHead className="text-right">Faturamento</TableHead>
                      <TableHead className="text-right">Fixo</TableHead>
                      <TableHead className="text-right">% Aplic.</TableHead>
                      <TableHead className="text-right">Variável</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registros?.map(r => (
                      <TableRow key={r.id}>
                        <TableCell>{r.mes_ano}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(r.faturamento_informado))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(r.fixo_cobrado))}</TableCell>
                        <TableCell className="text-right">{Number(r.percentual_aplicado).toFixed(1)}%</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(r.valor_variavel))}</TableCell>
                        <TableCell className="text-right font-semibold" style={{ color: '#F97316' }}>{formatCurrency(Number(r.total_a_receber))}</TableCell>
                        <TableCell>
                          <Badge variant="outline" style={{
                            borderColor: r.status_pagamento === 'Pago' ? '#22C55E' : r.status_pagamento === 'Atrasado' ? '#EF4444' : '#FBBF24',
                            color: r.status_pagamento === 'Pago' ? '#22C55E' : r.status_pagamento === 'Atrasado' ? '#EF4444' : '#FBBF24',
                          }}>{r.status_pagamento}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!registros || registros.length === 0) && (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum registro</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>

                {registros && registros.length > 0 && (
                  <div className="flex gap-4 pt-2" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                    <span>Total Faturamento: <strong>{formatCurrency(totals.fat)}</strong></span>
                    <span>Total Recebido: <strong style={{ color: '#F97316' }}>{formatCurrency(totals.recebido)}</strong></span>
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
