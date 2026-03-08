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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Search, CalendarIcon, Edit, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useClosers } from '@/hooks/useProfiles';
import {
  useTrafegoPagoClientes,
  useTrafegoPagoRegistros,
  useUpsertTrafegoPagoCliente,
  useUpsertTrafegoPagoRegistro,
  TrafegoPagoCliente,
  TrafegoPagoRegistro,
  useTrafegoPagoAllRegistros,
} from '@/hooks/useTrafegoPago';

const STATUS_COLORS: Record<string, string> = {
  Ativo: '#22C55E',
  Pausado: '#FBBF24',
  Cancelado: '#888888',
  Trial: '#0EA5E9',
};

const PLATAFORMAS = ['Meta Ads', 'Google Ads', 'TikTok Ads'];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function TrafegoPagoClientes() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGestor, setFilterGestor] = useState('all');
  const [filterPlataforma, setFilterPlataforma] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<TrafegoPagoCliente | null>(null);
  const [activeTab, setActiveTab] = useState('dados');

  // Form state
  const [form, setForm] = useState({
    nome_ecommerce: '',
    site: '',
    nicho: '',
    faturamento_ao_entrar: '',
    data_entrada: format(new Date(), 'yyyy-MM-dd'),
    dia_cobranca: '1',
    gestor_user_id: '',
    plataformas: [] as string[],
    status: 'Ativo' as TrafegoPagoCliente['status'],
    tabela_precos: '',
    observacoes: '',
    valor_mrr: '',
  });

  // Registro form
  const [regForm, setRegForm] = useState({
    mes_ano: format(new Date(), 'yyyy-MM'),
    investimento_gerenciado: '',
    valor_pago: '',
    status_pagamento: 'Pendente' as TrafegoPagoRegistro['status_pagamento'],
    roas_entregue: '',
    observacao: '',
  });

  const { data: clientes, isLoading } = useTrafegoPagoClientes({ search, status: filterStatus, gestor: filterGestor, plataforma: filterPlataforma });
  const { data: registros } = useTrafegoPagoRegistros(editingCliente?.id);
  const { data: closers } = useClosers();
  const mesAtual = format(new Date(), 'yyyy-MM');
  const { data: allRegsAtual } = useTrafegoPagoAllRegistros(mesAtual);
  const upsertCliente = useUpsertTrafegoPagoCliente();
  const upsertRegistro = useUpsertTrafegoPagoRegistro();

  const gestorMap = useMemo(() => {
    const map: Record<string, string> = {};
    closers?.forEach(c => { map[c.id] = c.nome; });
    return map;
  }, [closers]);

  const pagamentoAlertMap = useMemo(() => {
    const map: Record<string, string> = {};
    allRegsAtual?.forEach(r => {
      if (r.status_pagamento === 'Pendente' || r.status_pagamento === 'Atrasado') {
        map[r.cliente_id] = r.status_pagamento;
      }
    });
    return map;
  }, [allRegsAtual]);

  const openNew = () => {
    setEditingCliente(null);
    setForm({
      nome_ecommerce: '', site: '', nicho: '', faturamento_ao_entrar: '',
      data_entrada: format(new Date(), 'yyyy-MM-dd'), dia_cobranca: '1',
      gestor_user_id: '', plataformas: [], status: 'Ativo',
      tabela_precos: '', observacoes: '', valor_mrr: '',
    });
    setActiveTab('dados');
    setDrawerOpen(true);
  };

  const openEdit = (c: TrafegoPagoCliente) => {
    setEditingCliente(c);
    setForm({
      nome_ecommerce: c.nome_ecommerce,
      site: c.site || '',
      nicho: c.nicho || '',
      faturamento_ao_entrar: String(c.faturamento_ao_entrar || ''),
      data_entrada: c.data_entrada,
      dia_cobranca: String(c.dia_cobranca),
      gestor_user_id: c.gestor_user_id || '',
      plataformas: c.plataformas || [],
      status: c.status,
      tabela_precos: c.tabela_precos || '',
      observacoes: c.observacoes || '',
      valor_mrr: String(c.valor_mrr || ''),
    });
    setActiveTab('dados');
    setDrawerOpen(true);
  };

  const handleSaveCliente = () => {
    if (!form.nome_ecommerce.trim()) {
      toast.error('Nome do e-commerce é obrigatório');
      return;
    }
    const payload: any = {
      nome_ecommerce: form.nome_ecommerce.trim(),
      site: form.site,
      nicho: form.nicho,
      faturamento_ao_entrar: parseFloat(form.faturamento_ao_entrar.replace(/\./g, '').replace(',', '.')) || 0,
      data_entrada: form.data_entrada,
      dia_cobranca: parseInt(form.dia_cobranca) || 1,
      gestor_user_id: form.gestor_user_id || null,
      plataformas: form.plataformas,
      status: form.status,
      tabela_precos: form.tabela_precos,
      observacoes: form.observacoes,
      valor_mrr: parseFloat(form.valor_mrr.replace(/\./g, '').replace(',', '.')) || 0,
    };
    if (editingCliente) payload.id = editingCliente.id;

    upsertCliente.mutate(payload, {
      onSuccess: () => {
        toast.success(editingCliente ? 'Cliente atualizado!' : 'Cliente criado!');
        if (!editingCliente) setDrawerOpen(false);
      },
      onError: (err: any) => toast.error(err.message || 'Erro ao salvar'),
    });
  };

  const handleSaveRegistro = () => {
    if (!editingCliente) return;
    upsertRegistro.mutate({
      cliente_id: editingCliente.id,
      mes_ano: regForm.mes_ano,
      investimento_gerenciado: parseFloat(regForm.investimento_gerenciado.replace(/\./g, '').replace(',', '.')) || 0,
      valor_pago: parseFloat(regForm.valor_pago.replace(/\./g, '').replace(',', '.')) || 0,
      status_pagamento: regForm.status_pagamento,
      roas_entregue: regForm.roas_entregue ? parseFloat(regForm.roas_entregue.replace(',', '.')) : null,
      observacao: regForm.observacao,
    }, {
      onSuccess: () => {
        toast.success('Registro salvo!');
        setRegForm({ mes_ano: format(new Date(), 'yyyy-MM'), investimento_gerenciado: '', valor_pago: '', status_pagamento: 'Pendente', roas_entregue: '', observacao: '' });
      },
      onError: (err: any) => toast.error(err.message || 'Erro'),
    });
  };

  const togglePlataforma = (p: string) => {
    setForm(prev => ({
      ...prev,
      plataformas: prev.plataformas.includes(p) ? prev.plataformas.filter(x => x !== p) : [...prev.plataformas, p],
    }));
  };

  const totals = useMemo(() => {
    if (!registros) return { investido: 0, recebido: 0, avgRoas: 0 };
    const investido = registros.reduce((s, r) => s + Number(r.investimento_gerenciado), 0);
    const recebido = registros.reduce((s, r) => s + Number(r.valor_pago), 0);
    const roasVals = registros.filter(r => r.roas_entregue != null);
    const avgRoas = roasVals.length > 0 ? roasVals.reduce((s, r) => s + Number(r.roas_entregue), 0) / roasVals.length : 0;
    return { investido, recebido, avgRoas };
  }, [registros]);

  return (
    <AppLayout>
      <PageHeader title="Clientes — Tráfego Pago" description="Gestão de clientes de tráfego pago">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 w-[200px]"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)' }}
          />
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
        <Select value={filterGestor} onValueChange={setFilterGestor}>
          <SelectTrigger className="w-[160px]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <SelectValue placeholder="Gestor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Gestores</SelectItem>
            {closers?.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Cliente
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-commerce</TableHead>
                <TableHead>Nicho</TableHead>
                <TableHead>Data Entrada</TableHead>
                <TableHead>Gestor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor MRR</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes?.map(c => {
                const alert = pagamentoAlertMap[c.id];
                return (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/30" onClick={() => openEdit(c)}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {c.nome_ecommerce}
                        {alert && (
                          <AlertTriangle className="h-4 w-4" style={{ color: alert === 'Atrasado' ? '#EF4444' : '#FBBF24' }} />
                        )}
                      </div>
                    </TableCell>
                    <TableCell style={{ color: 'rgba(255,255,255,0.5)' }}>{c.nicho || '—'}</TableCell>
                    <TableCell style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {format(new Date(c.data_entrada + 'T12:00:00'), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell style={{ color: 'rgba(255,255,255,0.5)' }}>{gestorMap[c.gestor_user_id || ''] || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" style={{ borderColor: STATUS_COLORS[c.status], color: STATUS_COLORS[c.status] }}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold" style={{ color: '#F97316' }}>
                      {formatCurrency(Number(c.valor_mrr))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); openEdit(c); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!clientes || clientes.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingCliente ? 'Editar Cliente' : 'Novo Cliente'}</SheetTitle>
          </SheetHeader>

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
                <div className="space-y-1.5">
                  <Label>Site</Label>
                  <Input value={form.site} onChange={e => setForm(p => ({ ...p, site: e.target.value }))} placeholder="https://" />
                </div>
                <div className="space-y-1.5">
                  <Label>Nicho</Label>
                  <Input value={form.nicho} onChange={e => setForm(p => ({ ...p, nicho: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Faturamento ao Entrar (R$)</Label>
                  <Input value={form.faturamento_ao_entrar} onChange={e => setForm(p => ({ ...p, faturamento_ao_entrar: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Valor MRR (R$)</Label>
                  <Input value={form.valor_mrr} onChange={e => setForm(p => ({ ...p, valor_mrr: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Data de Entrada</Label>
                  <Input type="date" value={form.data_entrada} onChange={e => setForm(p => ({ ...p, data_entrada: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Dia de Cobrança</Label>
                  <Input type="number" min={1} max={31} value={form.dia_cobranca} onChange={e => setForm(p => ({ ...p, dia_cobranca: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Gestor Responsável</Label>
                  <Select value={form.gestor_user_id} onValueChange={v => setForm(p => ({ ...p, gestor_user_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {closers?.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Pausado">Pausado</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                      <SelectItem value="Trial">Trial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Plataformas Gerenciadas</Label>
                <div className="flex gap-2">
                  {PLATAFORMAS.map(p => (
                    <Button key={p} variant={form.plataformas.includes(p) ? 'default' : 'outline'} size="sm" onClick={() => togglePlataforma(p)}>
                      {p}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Tabela de Preços / Negociação</Label>
                <Textarea value={form.tabela_precos} onChange={e => setForm(p => ({ ...p, tabela_precos: e.target.value }))} rows={3} placeholder="Ex: R$1.500 fixo + 10% sobre resultado" />
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
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">+ Registrar Mês</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Mês/Ano</Label>
                        <Input type="month" value={regForm.mes_ano} onChange={e => setRegForm(p => ({ ...p, mes_ano: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Status Pagamento</Label>
                        <Select value={regForm.status_pagamento} onValueChange={v => setRegForm(p => ({ ...p, status_pagamento: v as any }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pago">Pago</SelectItem>
                            <SelectItem value="Pendente">Pendente</SelectItem>
                            <SelectItem value="Atrasado">Atrasado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Investimento Gerenciado (R$)</Label>
                        <Input value={regForm.investimento_gerenciado} onChange={e => setRegForm(p => ({ ...p, investimento_gerenciado: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Valor Pago (R$)</Label>
                        <Input value={regForm.valor_pago} onChange={e => setRegForm(p => ({ ...p, valor_pago: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">ROAS Entregue</Label>
                        <Input value={regForm.roas_entregue} onChange={e => setRegForm(p => ({ ...p, roas_entregue: e.target.value }))} placeholder="Opcional" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Observação</Label>
                        <Input value={regForm.observacao} onChange={e => setRegForm(p => ({ ...p, observacao: e.target.value }))} />
                      </div>
                    </div>
                    <Button size="sm" onClick={handleSaveRegistro} disabled={upsertRegistro.isPending} className="w-full">
                      Salvar Registro
                    </Button>
                  </CardContent>
                </Card>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês/Ano</TableHead>
                      <TableHead className="text-right">Investimento</TableHead>
                      <TableHead className="text-right">Valor Pago</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">ROAS</TableHead>
                      <TableHead>Obs.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registros?.map(r => (
                      <TableRow key={r.id}>
                        <TableCell>{r.mes_ano}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(r.investimento_gerenciado))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(r.valor_pago))}</TableCell>
                        <TableCell>
                          <Badge variant="outline" style={{
                            borderColor: r.status_pagamento === 'Pago' ? '#22C55E' : r.status_pagamento === 'Atrasado' ? '#EF4444' : '#FBBF24',
                            color: r.status_pagamento === 'Pago' ? '#22C55E' : r.status_pagamento === 'Atrasado' ? '#EF4444' : '#FBBF24',
                          }}>
                            {r.status_pagamento}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{r.roas_entregue != null ? `${Number(r.roas_entregue).toFixed(2)}x` : '—'}</TableCell>
                        <TableCell style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{r.observacao || '—'}</TableCell>
                      </TableRow>
                    ))}
                    {(!registros || registros.length === 0) && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum registro</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>

                {registros && registros.length > 0 && (
                  <div className="flex gap-4 pt-2" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                    <span>Total Investido: <strong style={{ color: '#F97316' }}>{formatCurrency(totals.investido)}</strong></span>
                    <span>Total Recebido: <strong style={{ color: '#22C55E' }}>{formatCurrency(totals.recebido)}</strong></span>
                    {totals.avgRoas > 0 && <span>Média ROAS: <strong>{totals.avgRoas.toFixed(2)}x</strong></span>}
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
