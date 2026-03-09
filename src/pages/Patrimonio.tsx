import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Search, Eye, Pencil, ArrowRightLeft, Wrench, XCircle, HelpCircle, Settings } from 'lucide-react';
import {
  usePatrimonioBens, usePatrimonioAmbientes, useCreatePatrimonioBem, useUpdatePatrimonioBem,
  useRegistrarTransferencia, useRegistrarManutencao, usePatrimonioManutencoes,
  CATEGORIAS_PATRIMONIO, VIDA_UTIL_PADRAO, ESTADOS_CONSERVACAO, STATUS_BEM, MOTIVOS_BAIXA,
  calcDepreciacao, calcDepreciacaoAcumulada, PatrimonioBem,
} from '@/hooks/usePatrimonio';
import { useProfiles } from '@/hooks/useProfiles';
import { useNavigate } from 'react-router-dom';

export default function Patrimonio() {
  const { data: bens = [], isLoading } = usePatrimonioBens();
  const { data: ambientes = [] } = usePatrimonioAmbientes();
  const { data: profiles = [] } = useProfiles();
  const createBem = useCreatePatrimonioBem();
  const updateBem = useUpdatePatrimonioBem();
  const registrarTransf = useRegistrarTransferencia();
  const registrarManut = useRegistrarManutencao();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tab, setTab] = useState('bens');

  const [showDrawer, setShowDrawer] = useState(false);
  const [editBem, setEditBem] = useState<PatrimonioBem | null>(null);
  const [detailBem, setDetailBem] = useState<PatrimonioBem | null>(null);
  const [transferBem, setTransferBem] = useState<PatrimonioBem | null>(null);
  const [manutBem, setManutBem] = useState<PatrimonioBem | null>(null);
  const [baixaBem, setBaixaBem] = useState<PatrimonioBem | null>(null);

  // New bem form
  const [form, setForm] = useState<Partial<PatrimonioBem>>({
    descricao: '', categoria: 'Outros', numero_serie: '', marca_modelo: '',
    data_aquisicao: new Date().toISOString().split('T')[0], valor_compra: 0,
    fornecedor: '', nota_fiscal: '', vida_util_anos: 5, valor_residual_pct: 10,
    ambiente_id: null, responsavel_user_id: null, estado_conservacao: 'Bom',
    observacoes_manutencao: '',
  });

  const [transfForm, setTransfForm] = useState({ para_responsavel_user_id: '', para_ambiente_id: '', observacao: '' });
  const [manutForm, setManutForm] = useState({ descricao: '', data_manutencao: new Date().toISOString().split('T')[0] });
  const [baixaForm, setBaixaForm] = useState({ motivo: 'Descarte', observacao: '' });

  const profileMap = useMemo(() => {
    const m: Record<string, string> = {};
    (profiles as any[]).forEach(p => { m[p.id] = p.nome; });
    return m;
  }, [profiles]);

  const ambienteMap = useMemo(() => {
    const m: Record<string, string> = {};
    ambientes.forEach(a => { m[a.id] = a.nome; });
    return m;
  }, [ambientes]);

  const filteredBens = useMemo(() => {
    return bens.filter(b => {
      if (search && !b.descricao.toLowerCase().includes(search.toLowerCase()) && !b.tombamento.toLowerCase().includes(search.toLowerCase())) return false;
      if (catFilter !== 'all' && b.categoria !== catFilter) return false;
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      return true;
    });
  }, [bens, search, catFilter, statusFilter]);

  const fmtCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const nextTombamento = useMemo(() => {
    const usedNumbers = bens.map(b => {
      const match = b.tombamento.match(/W3-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    let next = 1;
    while (usedNumbers.includes(next)) next++;
    return `W3-${String(next).padStart(4, '0')}`;
  }, [bens]);

  const openNewBem = () => {
    setEditBem(null);
    setForm({
      descricao: '', categoria: 'Outros', numero_serie: '', marca_modelo: '',
      data_aquisicao: new Date().toISOString().split('T')[0], valor_compra: 0,
      fornecedor: '', nota_fiscal: '', vida_util_anos: 5, valor_residual_pct: 10,
      ambiente_id: null, responsavel_user_id: null, estado_conservacao: 'Bom',
      observacoes_manutencao: '', tombamento: nextTombamento,
    });
    setShowDrawer(true);
  };

  const openEditBem = (b: PatrimonioBem) => {
    setEditBem(b);
    setForm(b);
    setShowDrawer(true);
  };

  const handleSaveBem = () => {
    if (editBem) {
      updateBem.mutate({ id: editBem.id, ...form } as any, { onSuccess: () => setShowDrawer(false) });
    } else {
      createBem.mutate(form, { onSuccess: () => setShowDrawer(false) });
    }
  };

  const handleTransfer = () => {
    if (!transferBem) return;
    registrarTransf.mutate({
      bem_id: transferBem.id,
      de_responsavel_user_id: transferBem.responsavel_user_id,
      para_responsavel_user_id: transfForm.para_responsavel_user_id || null,
      de_ambiente_id: transferBem.ambiente_id,
      para_ambiente_id: transfForm.para_ambiente_id || null,
      observacao: transfForm.observacao,
    }, { onSuccess: () => { setTransferBem(null); setTransfForm({ para_responsavel_user_id: '', para_ambiente_id: '', observacao: '' }); } });
  };

  const handleManut = () => {
    if (!manutBem) return;
    registrarManut.mutate({ bem_id: manutBem.id, ...manutForm }, {
      onSuccess: () => { setManutBem(null); setManutForm({ descricao: '', data_manutencao: new Date().toISOString().split('T')[0] }); },
    });
  };

  const handleBaixa = () => {
    if (!baixaBem) return;
    updateBem.mutate({
      id: baixaBem.id,
      status: 'Baixado',
      observacoes_manutencao: `${baixaBem.observacoes_manutencao}\n[BAIXA] Motivo: ${baixaForm.motivo}. ${baixaForm.observacao}`.trim(),
    }, { onSuccess: () => { setBaixaBem(null); setBaixaForm({ motivo: 'Descarte', observacao: '' }); } });
  };

  const estadoColor = (e: string) => {
    switch (e) {
      case 'Ótimo': return { bg: 'hsla(142, 71%, 45%, 0.15)', color: 'hsl(142, 71%, 45%)' };
      case 'Bom': return { bg: 'hsla(210, 80%, 55%, 0.15)', color: 'hsl(210, 80%, 55%)' };
      case 'Regular': return { bg: 'hsla(38, 92%, 50%, 0.15)', color: 'hsl(38, 92%, 50%)' };
      case 'Ruim': return { bg: 'hsla(0, 84%, 60%, 0.15)', color: 'hsl(0, 84%, 60%)' };
      default: return { bg: 'hsla(0, 0%, 50%, 0.15)', color: 'hsl(0, 0%, 50%)' };
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'Ativo': return { bg: 'hsla(142, 71%, 45%, 0.15)', color: 'hsl(142, 71%, 45%)' };
      case 'Em manutenção': return { bg: 'hsla(38, 92%, 50%, 0.15)', color: 'hsl(38, 92%, 50%)' };
      case 'Baixado': return { bg: 'hsla(0, 0%, 50%, 0.15)', color: 'hsl(0, 0%, 50%)' };
      case 'Perdido/Furtado': return { bg: 'hsla(0, 84%, 60%, 0.15)', color: 'hsl(0, 84%, 60%)' };
      default: return { bg: 'hsla(0, 0%, 50%, 0.15)', color: 'hsl(0, 0%, 50%)' };
    }
  };

  // Depreciation report data
  const bensAtivos = bens.filter(b => b.status === 'Ativo');
  const reportData = bensAtivos.map(b => {
    const { depAcumulada, valorAtual, mesesPassados } = calcDepreciacaoAcumulada(b.valor_compra, b.valor_residual_pct, b.vida_util_anos, b.data_aquisicao);
    const vidaRestante = Math.max(0, b.vida_util_anos - mesesPassados / 12);
    return { ...b, depAcumulada, valorAtual, vidaRestante };
  });
  const totalCompra = reportData.reduce((s, b) => s + b.valor_compra, 0);
  const totalDepAcumulada = reportData.reduce((s, b) => s + b.depAcumulada, 0);
  const totalValorAtual = reportData.reduce((s, b) => s + b.valorAtual, 0);

  return (
    <AppLayout>
      <PageHeader title="Patrimônio" description="Controle de bens permanentes da empresa">
        <Button size="sm" onClick={openNewBem} className="gap-1.5"><Plus className="h-4 w-4" /> Cadastrar Bem</Button>
        <Button size="sm" variant="outline" onClick={() => navigate('/administrativo/ambientes')} className="gap-1.5">
          <Settings className="h-4 w-4" /> Ambientes
        </Button>
      </PageHeader>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="bens">Bens</TabsTrigger>
          <TabsTrigger value="depreciacao">Relatório de Depreciação</TabsTrigger>
        </TabsList>

        <TabsContent value="bens">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por descrição ou tombamento..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {CATEGORIAS_PATRIMONIO.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {STATUS_BEM.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tombamento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Ambiente</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-right">Valor Compra</TableHead>
                  <TableHead className="text-right">Valor Atual</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : filteredBens.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhum bem encontrado</TableCell></TableRow>
                ) : filteredBens.map(bem => {
                  const { valorAtual } = calcDepreciacaoAcumulada(bem.valor_compra, bem.valor_residual_pct, bem.vida_util_anos, bem.data_aquisicao);
                  const ec = estadoColor(bem.estado_conservacao);
                  const sc = statusColor(bem.status);
                  return (
                    <TableRow key={bem.id}>
                      <TableCell className="font-mono font-medium">{bem.tombamento}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{bem.descricao}</span>
                          <Badge variant="secondary" className="w-fit text-xs">{bem.categoria}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>{bem.ambiente_id ? ambienteMap[bem.ambiente_id] || '—' : '—'}</TableCell>
                      <TableCell>{bem.responsavel_user_id ? profileMap[bem.responsavel_user_id] || '—' : '—'}</TableCell>
                      <TableCell className="text-right">{fmtCurrency(bem.valor_compra)}</TableCell>
                      <TableCell className="text-right font-medium">{fmtCurrency(valorAtual)}</TableCell>
                      <TableCell><Badge style={{ background: ec.bg, color: ec.color }}>{bem.estado_conservacao}</Badge></TableCell>
                      <TableCell><Badge style={{ background: sc.bg, color: sc.color }}>{bem.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailBem(bem)}><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditBem(bem)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTransferBem(bem)}><ArrowRightLeft className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="depreciacao">
          <p className="text-sm text-muted-foreground mb-4">
            Este relatório mostra quanto seus equipamentos e móveis valem hoje, considerando o desgaste natural ao longo do tempo.
          </p>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tombamento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor Compra</TableHead>
                  <TableHead className="text-right">Dep. Anual</TableHead>
                  <TableHead className="text-right">Dep. Acumulada</TableHead>
                  <TableHead className="text-right">Valor Atual</TableHead>
                  <TableHead className="text-right">Vida Útil Restante</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono">{b.tombamento}</TableCell>
                    <TableCell>{b.descricao}</TableCell>
                    <TableCell className="text-right">{fmtCurrency(b.valor_compra)}</TableCell>
                    <TableCell className="text-right">{fmtCurrency(b.depreciacao_anual)}</TableCell>
                    <TableCell className="text-right" style={{ color: 'hsl(0, 84%, 60%)' }}>{fmtCurrency(b.depAcumulada)}</TableCell>
                    <TableCell className="text-right font-medium">{fmtCurrency(b.valorAtual)}</TableCell>
                    <TableCell className="text-right">{b.vidaRestante.toFixed(1)} anos</TableCell>
                  </TableRow>
                ))}
                {reportData.length > 0 && (
                  <TableRow className="font-semibold border-t-2">
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell className="text-right">{fmtCurrency(totalCompra)}</TableCell>
                    <TableCell />
                    <TableCell className="text-right" style={{ color: 'hsl(0, 84%, 60%)' }}>{fmtCurrency(totalDepAcumulada)}</TableCell>
                    <TableCell className="text-right">{fmtCurrency(totalValorAtual)}</TableCell>
                    <TableCell />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Modal */}
      <Dialog open={!!detailBem} onOpenChange={() => setDetailBem(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {detailBem && <BemDetail bem={detailBem} ambienteMap={ambienteMap} profileMap={profileMap} onTransfer={() => { setTransferBem(detailBem); setDetailBem(null); }} onManut={() => { setManutBem(detailBem); setDetailBem(null); }} onBaixa={() => { setBaixaBem(detailBem); setDetailBem(null); }} />}
        </DialogContent>
      </Dialog>

      {/* Drawer Cadastro/Edição */}
      <Sheet open={showDrawer} onOpenChange={setShowDrawer}>
        <SheetContent className="w-[420px] sm:w-[480px] overflow-y-auto">
          <SheetHeader><SheetTitle>{editBem ? 'Editar Bem' : 'Cadastrar Novo Bem'}</SheetTitle></SheetHeader>
          <div className="space-y-6 mt-4">
            <Section title="O que é esse bem?">
              <div>
                <div className="flex items-center gap-1">
                  <Label>Código de tombamento</Label>
                  <Tooltip><TooltipTrigger><HelpCircle className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger><TooltipContent>Código gerado automaticamente. Você pode editar, mas não é recomendado.</TooltipContent></Tooltip>
                </div>
                <Input value={form.tombamento || ''} onChange={e => setForm({ ...form, tombamento: e.target.value })} placeholder="W3-0001" className="font-mono" />
                {!editBem && <p className="text-xs text-muted-foreground mt-1">Próximo código disponível: {form.tombamento}</p>}
              </div>
              <div><Label>Descrição *</Label><Input value={form.descricao || ''} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Notebook Dell" /></div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoria || 'Outros'} onValueChange={v => setForm({ ...form, categoria: v, vida_util_anos: VIDA_UTIL_PADRAO[v] || 5 })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIAS_PATRIMONIO.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Marca/Modelo</Label><Input value={form.marca_modelo || ''} onChange={e => setForm({ ...form, marca_modelo: e.target.value })} /></div>
                <div><Label>Nº de Série / IMEI</Label><Input value={form.numero_serie || ''} onChange={e => setForm({ ...form, numero_serie: e.target.value })} /></div>
              </div>
            </Section>
            <Section title="Onde foi comprado?">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Data de compra</Label><Input type="date" value={form.data_aquisicao || ''} onChange={e => setForm({ ...form, data_aquisicao: e.target.value })} /></div>
                <div><Label>Valor pago (R$)</Label><Input type="number" step="0.01" value={form.valor_compra || 0} onChange={e => setForm({ ...form, valor_compra: +e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Fornecedor</Label><Input value={form.fornecedor || ''} onChange={e => setForm({ ...form, fornecedor: e.target.value })} /></div>
                <div><Label>Nº Nota Fiscal</Label><Input value={form.nota_fiscal || ''} onChange={e => setForm({ ...form, nota_fiscal: e.target.value })} /></div>
              </div>
            </Section>
            <Section title="Onde está e com quem?">
              <div>
                <Label>Ambiente</Label>
                <Select value={form.ambiente_id || 'none'} onValueChange={v => setForm({ ...form, ambiente_id: v === 'none' ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {ambientes.filter(a => a.ativo).map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Responsável pela guarda</Label>
                <Select value={form.responsavel_user_id || 'none'} onValueChange={v => setForm({ ...form, responsavel_user_id: v === 'none' ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {(profiles as any[]).map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado de conservação</Label>
                <Select value={form.estado_conservacao || 'Bom'} onValueChange={v => setForm({ ...form, estado_conservacao: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ESTADOS_CONSERVACAO.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </Section>
            <Section title="Vida útil (para contabilidade)">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-1">
                    <Label>Vida útil (anos)</Label>
                    <Tooltip><TooltipTrigger><HelpCircle className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger><TooltipContent>Quantos anos o bem deve durar antes de precisar ser substituído</TooltipContent></Tooltip>
                  </div>
                  <Input type="number" value={form.vida_util_anos || 5} onChange={e => setForm({ ...form, vida_util_anos: +e.target.value })} />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <Label>Valor residual (%)</Label>
                    <Tooltip><TooltipTrigger><HelpCircle className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger><TooltipContent>Valor que o bem ainda terá no fim da vida útil</TooltipContent></Tooltip>
                  </div>
                  <Input type="number" step="1" value={form.valor_residual_pct || 10} onChange={e => setForm({ ...form, valor_residual_pct: +e.target.value })} />
                </div>
              </div>
              {form.valor_compra != null && form.valor_compra > 0 && (
                <p className="text-sm text-muted-foreground">
                  Depreciação anual calculada: {fmtCurrency(calcDepreciacao(form.valor_compra, form.valor_residual_pct || 10, form.vida_util_anos || 5).depAnual)}
                </p>
              )}
            </Section>
            <Section title="Observações">
              <Textarea value={form.observacoes_manutencao || ''} onChange={e => setForm({ ...form, observacoes_manutencao: e.target.value })} placeholder="Histórico de manutenções, problemas..." rows={3} />
            </Section>
            <Button className="w-full" onClick={handleSaveBem} disabled={!form.descricao || createBem.isPending || updateBem.isPending}>
              {(createBem.isPending || updateBem.isPending) ? 'Salvando...' : editBem ? 'Salvar Alterações' : 'Cadastrar Bem'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Transfer Modal */}
      <Dialog open={!!transferBem} onOpenChange={() => setTransferBem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Transferir: {transferBem?.descricao}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Novo responsável</Label>
              <Select value={transfForm.para_responsavel_user_id} onValueChange={v => setTransfForm({ ...transfForm, para_responsavel_user_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{(profiles as any[]).map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Novo ambiente</Label>
              <Select value={transfForm.para_ambiente_id} onValueChange={v => setTransfForm({ ...transfForm, para_ambiente_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{ambientes.filter(a => a.ativo).map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Observação</Label><Textarea value={transfForm.observacao} onChange={e => setTransfForm({ ...transfForm, observacao: e.target.value })} /></div>
            <Button className="w-full" onClick={handleTransfer} disabled={registrarTransf.isPending}>
              {registrarTransf.isPending ? 'Transferindo...' : 'Confirmar Transferência'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manutenção Modal */}
      <Dialog open={!!manutBem} onOpenChange={() => setManutBem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar Manutenção: {manutBem?.descricao}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Descrição da manutenção *</Label><Textarea value={manutForm.descricao} onChange={e => setManutForm({ ...manutForm, descricao: e.target.value })} /></div>
            <div><Label>Data</Label><Input type="date" value={manutForm.data_manutencao} onChange={e => setManutForm({ ...manutForm, data_manutencao: e.target.value })} /></div>
            <Button className="w-full" onClick={handleManut} disabled={!manutForm.descricao || registrarManut.isPending}>
              {registrarManut.isPending ? 'Registrando...' : 'Registrar Manutenção'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Baixa Modal */}
      <Dialog open={!!baixaBem} onOpenChange={() => setBaixaBem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Dar Baixa: {baixaBem?.descricao}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Motivo da baixa *</Label>
              <Select value={baixaForm.motivo} onValueChange={v => setBaixaForm({ ...baixaForm, motivo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MOTIVOS_BAIXA.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Observação</Label><Textarea value={baixaForm.observacao} onChange={e => setBaixaForm({ ...baixaForm, observacao: e.target.value })} /></div>
            <Button variant="destructive" className="w-full" onClick={handleBaixa} disabled={updateBem.isPending}>
              {updateBem.isPending ? 'Processando...' : 'Confirmar Baixa'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function BemDetail({ bem, ambienteMap, profileMap, onTransfer, onManut, onBaixa }: {
  bem: PatrimonioBem; ambienteMap: Record<string, string>; profileMap: Record<string, string>;
  onTransfer: () => void; onManut: () => void; onBaixa: () => void;
}) {
  const { depAcumulada, valorAtual, mesesPassados } = calcDepreciacaoAcumulada(bem.valor_compra, bem.valor_residual_pct, bem.vida_util_anos, bem.data_aquisicao);
  const anosPassados = mesesPassados / 12;
  const vidaRestante = Math.max(0, bem.vida_util_anos - anosPassados);
  const progressPct = bem.vida_util_anos > 0 ? Math.min(100, (anosPassados / bem.vida_util_anos) * 100) : 100;
  const fmtCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const { data: manutencoes = [] } = usePatrimonioManutencoes(bem.id);

  return (
    <div className="space-y-4">
      <DialogHeader><DialogTitle>{bem.tombamento} — {bem.descricao}</DialogTitle></DialogHeader>
      {bem.foto_url && <img src={bem.foto_url} alt={bem.descricao} className="w-full h-48 object-cover rounded-lg" />}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-muted-foreground">Categoria:</span> {bem.categoria}</div>
        <div><span className="text-muted-foreground">Marca/Modelo:</span> {bem.marca_modelo || '—'}</div>
        <div><span className="text-muted-foreground">Nº Série:</span> {bem.numero_serie || '—'}</div>
        <div><span className="text-muted-foreground">Fornecedor:</span> {bem.fornecedor || '—'}</div>
        <div><span className="text-muted-foreground">Ambiente:</span> {bem.ambiente_id ? ambienteMap[bem.ambiente_id] || '—' : '—'}</div>
        <div><span className="text-muted-foreground">Responsável:</span> {bem.responsavel_user_id ? profileMap[bem.responsavel_user_id] || '—' : '—'}</div>
      </div>

      <div className="p-4 rounded-lg border space-y-3">
        <h4 className="font-semibold text-sm">Depreciação</h4>
        <Progress value={progressPct} className="h-2" />
        <p className="text-xs text-muted-foreground">
          Comprado há {anosPassados.toFixed(1)} anos | Vida útil: {bem.vida_util_anos} anos | Restam {vidaRestante.toFixed(1)} anos
        </p>
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div><span className="block text-muted-foreground text-xs">Valor compra</span><span className="font-semibold">{fmtCurrency(bem.valor_compra)}</span></div>
          <div><span className="block text-xs" style={{ color: 'hsl(0, 84%, 60%)' }}>Dep. acumulada</span><span className="font-semibold" style={{ color: 'hsl(0, 84%, 60%)' }}>{fmtCurrency(depAcumulada)}</span></div>
          <div><span className="block text-xs" style={{ color: 'hsl(142, 71%, 45%)' }}>Valor atual</span><span className="font-semibold" style={{ color: 'hsl(142, 71%, 45%)' }}>{fmtCurrency(valorAtual)}</span></div>
        </div>
      </div>

      {manutencoes.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm mb-2">Manutenções</h4>
          <div className="space-y-2">
            {manutencoes.map(m => (
              <div key={m.id} className="text-sm p-2 rounded border">
                <span className="text-muted-foreground">{new Date(m.data_manutencao).toLocaleDateString('pt-BR')}</span> — {m.descricao}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button size="sm" variant="outline" onClick={onTransfer} className="gap-1"><ArrowRightLeft className="h-3.5 w-3.5" /> Transferir</Button>
        <Button size="sm" variant="outline" onClick={onManut} className="gap-1"><Wrench className="h-3.5 w-3.5" /> Manutenção</Button>
        {bem.status === 'Ativo' && (
          <Button size="sm" variant="destructive" onClick={onBaixa} className="gap-1"><XCircle className="h-3.5 w-3.5" /> Dar Baixa</Button>
        )}
      </div>
    </div>
  );
}
