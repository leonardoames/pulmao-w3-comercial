import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Search, ArrowDownToLine, ArrowUpFromLine, History, Package, AlertTriangle, Pencil, X } from 'lucide-react';
import { useAlmoxarifadoItens, useAlmoxarifadoMovimentacoes, useCreateAlmoxarifadoItem, useUpdateAlmoxarifadoItem, useRegistrarMovimentacao, CATEGORIAS_ALMOXARIFADO, UNIDADES_MEDIDA, SUGESTOES_ITENS, AlmoxarifadoItem } from '@/hooks/useAlmoxarifado';
import { useProfiles } from '@/hooks/useProfiles';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Almoxarifado() {
  const { data: itens = [], isLoading } = useAlmoxarifadoItens();
  const { data: movs = [] } = useAlmoxarifadoMovimentacoes();
  const { data: profiles = [] } = useProfiles();
  const createItem = useCreateAlmoxarifadoItem();
  const updateItem = useUpdateAlmoxarifadoItem();
  const registrarMov = useRegistrarMovimentacao();

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tab, setTab] = useState('itens');

  // Modals
  const [showNewItem, setShowNewItem] = useState(false);
  const [showEditItem, setShowEditItem] = useState<AlmoxarifadoItem | null>(null);
  const [showEntrada, setShowEntrada] = useState(false);
  const [showSaida, setShowSaida] = useState(false);
  const [historyItemId, setHistoryItemId] = useState<string | null>(null);

  // New item form
  const [newItem, setNewItem] = useState({ nome: '', categoria: 'Outros', unidade_medida: 'Unidade', estoque_minimo: 0, estoque_maximo: 0, fornecedor_habitual: '', observacoes: '' });

  // Mov form
  const [movForm, setMovForm] = useState({ item_id: '', quantidade: 0, valor_unitario: 0, data_movimentacao: new Date().toISOString().split('T')[0], observacao: '' });

  const profileMap = useMemo(() => {
    const m: Record<string, string> = {};
    profiles.forEach((p: any) => { m[p.id] = p.nome; });
    return m;
  }, [profiles]);

  const filteredItens = useMemo(() => {
    return itens.filter(i => {
      if (!i.ativo) return false;
      if (search && !i.nome.toLowerCase().includes(search.toLowerCase())) return false;
      if (catFilter !== 'all' && i.categoria !== catFilter) return false;
      if (statusFilter === 'abaixo' && i.quantidade_atual >= i.estoque_minimo) return false;
      if (statusFilter === 'ok' && i.quantidade_atual < i.estoque_minimo) return false;
      return true;
    });
  }, [itens, search, catFilter, statusFilter]);

  const handleCreateItem = () => {
    createItem.mutate(newItem, {
      onSuccess: () => {
        setShowNewItem(false);
        setNewItem({ nome: '', categoria: 'Outros', unidade_medida: 'Unidade', estoque_minimo: 0, estoque_maximo: 0, fornecedor_habitual: '', observacoes: '' });
      },
    });
  };

  const handleUpdateItem = () => {
    if (!showEditItem) return;
    updateItem.mutate(showEditItem, {
      onSuccess: () => setShowEditItem(null),
    });
  };

  const handleEntrada = () => {
    if (movForm.quantidade <= 0) return;
    registrarMov.mutate({ ...movForm, tipo: 'Entrada' }, {
      onSuccess: () => {
        setShowEntrada(false);
        setMovForm({ item_id: '', quantidade: 0, valor_unitario: 0, data_movimentacao: new Date().toISOString().split('T')[0], observacao: '' });
      },
    });
  };

  const handleSaida = () => {
    const item = itens.find(i => i.id === movForm.item_id);
    if (!item) return;
    if (movForm.quantidade > item.quantidade_atual) {
      return;
    }
    registrarMov.mutate({ ...movForm, tipo: 'Saida' }, {
      onSuccess: () => {
        setShowSaida(false);
        setMovForm({ item_id: '', quantidade: 0, valor_unitario: 0, data_movimentacao: new Date().toISOString().split('T')[0], observacao: '' });
      },
    });
  };

  const selectedItemForSaida = itens.find(i => i.id === movForm.item_id);
  const saidaExceedsStock = selectedItemForSaida && movForm.quantidade > selectedItemForSaida.quantidade_atual;

  const historyMovs = historyItemId ? movs.filter(m => m.item_id === historyItemId) : movs;
  const itemsAbaixoMinimo = itens.filter(i => i.ativo && i.quantidade_atual < i.estoque_minimo);

  const fmtCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <AppLayout>
      <PageHeader title="Almoxarifado" description="Controle de materiais de consumo">
        <Button size="sm" onClick={() => setShowEntrada(true)} className="gap-1.5">
          <ArrowDownToLine className="h-4 w-4" /> Registrar Entrada
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowSaida(true)} className="gap-1.5">
          <ArrowUpFromLine className="h-4 w-4" /> Registrar Saída
        </Button>
      </PageHeader>

      {itemsAbaixoMinimo.length > 0 && (
        <div className="mb-4 p-3 rounded-lg border flex items-center gap-3" style={{ borderColor: 'hsl(0, 84%, 60%)', background: 'hsla(0, 84%, 60%, 0.08)' }}>
          <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: 'hsl(0, 84%, 60%)' }} />
          <span className="text-sm">
            <strong>{itemsAbaixoMinimo.length}</strong> {itemsAbaixoMinimo.length === 1 ? 'item abaixo' : 'itens abaixo'} do estoque mínimo
          </span>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="itens">Itens</TabsTrigger>
          <TabsTrigger value="historico">Histórico de Movimentações</TabsTrigger>
        </TabsList>

        <TabsContent value="itens">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {CATEGORIAS_ALMOXARIFADO.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="abaixo">Abaixo do mínimo</SelectItem>
                <SelectItem value="ok">Estoque ok</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => setShowNewItem(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Novo Item
            </Button>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-right">Qtd. Atual</TableHead>
                  <TableHead className="text-right">Mín.</TableHead>
                  <TableHead className="text-right">Máx.</TableHead>
                  <TableHead className="text-right">Último Preço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : filteredItens.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum item encontrado</TableCell></TableRow>
                ) : filteredItens.map(item => {
                  const abaixo = item.quantidade_atual < item.estoque_minimo;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{item.nome}</span>
                          <Badge variant="secondary" className="w-fit text-xs">{item.categoria}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>{item.unidade_medida}</TableCell>
                      <TableCell className="text-right font-semibold" style={{ color: abaixo ? 'hsl(0, 84%, 60%)' : 'hsl(142, 71%, 45%)' }}>
                        {item.quantidade_atual}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{item.estoque_minimo}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{item.estoque_maximo}</TableCell>
                      <TableCell className="text-right">{fmtCurrency(item.ultimo_preco)}</TableCell>
                      <TableCell>
                        {abaixo ? (
                          <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Repor</Badge>
                        ) : (
                          <Badge style={{ background: 'hsla(142, 71%, 45%, 0.15)', color: 'hsl(142, 71%, 45%)' }}>✓ Ok</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowEditItem(item)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setHistoryItemId(item.id); setTab('historico'); }}>
                            <History className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="historico">
          <div className="flex items-center gap-3 mb-4">
            {historyItemId && (
              <Button variant="outline" size="sm" onClick={() => setHistoryItemId(null)}>
                Ver todos
              </Button>
            )}
          </div>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Valor Unit.</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyMovs.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma movimentação</TableCell></TableRow>
                ) : historyMovs.map(m => {
                  const item = itens.find(i => i.id === m.item_id);
                  return (
                    <TableRow key={m.id}>
                      <TableCell>{format(new Date(m.data_movimentacao), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <Badge style={m.tipo === 'Entrada'
                          ? { background: 'hsla(142, 71%, 45%, 0.15)', color: 'hsl(142, 71%, 45%)' }
                          : { background: 'hsla(0, 84%, 60%, 0.15)', color: 'hsl(0, 84%, 60%)' }
                        }>{m.tipo === 'Entrada' ? '↓ Entrada' : '↑ Saída'}</Badge>
                      </TableCell>
                      <TableCell>{item?.nome || '—'}</TableCell>
                      <TableCell className="text-right font-medium">{m.quantidade}</TableCell>
                      <TableCell className="text-right">{m.tipo === 'Entrada' ? fmtCurrency(m.valor_unitario) : '—'}</TableCell>
                      <TableCell>{profileMap[m.responsavel_user_id] || '—'}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">{m.observacao || '—'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal New Item */}
      <Dialog open={showNewItem} onOpenChange={setShowNewItem}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Novo Item do Almoxarifado</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do item *</Label>
              <Input value={newItem.nome} onChange={e => setNewItem({ ...newItem, nome: e.target.value })} placeholder="Ex: Papel A4" />
              {newItem.categoria && SUGESTOES_ITENS[newItem.categoria] && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {SUGESTOES_ITENS[newItem.categoria].map(s => (
                    <Badge key={s} variant="outline" className="cursor-pointer text-xs hover:bg-accent" onClick={() => setNewItem({ ...newItem, nome: s })}>
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={newItem.categoria} onValueChange={v => setNewItem({ ...newItem, categoria: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_ALMOXARIFADO.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unidade de medida</Label>
                <Select value={newItem.unidade_medida} onValueChange={v => setNewItem({ ...newItem, unidade_medida: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNIDADES_MEDIDA.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Estoque mínimo</Label><Input type="number" value={newItem.estoque_minimo} onChange={e => setNewItem({ ...newItem, estoque_minimo: +e.target.value })} /></div>
              <div><Label>Estoque máximo</Label><Input type="number" value={newItem.estoque_maximo} onChange={e => setNewItem({ ...newItem, estoque_maximo: +e.target.value })} /></div>
            </div>
            <div><Label>Fornecedor habitual</Label><Input value={newItem.fornecedor_habitual} onChange={e => setNewItem({ ...newItem, fornecedor_habitual: e.target.value })} /></div>
            <div><Label>Observações</Label><Textarea value={newItem.observacoes} onChange={e => setNewItem({ ...newItem, observacoes: e.target.value })} /></div>
            <Button className="w-full" onClick={handleCreateItem} disabled={!newItem.nome || createItem.isPending}>
              {createItem.isPending ? 'Salvando...' : 'Cadastrar Item'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Edit Item */}
      <Dialog open={!!showEditItem} onOpenChange={() => setShowEditItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar Item</DialogTitle></DialogHeader>
          {showEditItem && (
            <div className="space-y-4">
              <div><Label>Nome</Label><Input value={showEditItem.nome} onChange={e => setShowEditItem({ ...showEditItem, nome: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Categoria</Label>
                  <Select value={showEditItem.categoria} onValueChange={v => setShowEditItem({ ...showEditItem, categoria: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIAS_ALMOXARIFADO.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unidade</Label>
                  <Select value={showEditItem.unidade_medida} onValueChange={v => setShowEditItem({ ...showEditItem, unidade_medida: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{UNIDADES_MEDIDA.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Estoque mínimo</Label><Input type="number" value={showEditItem.estoque_minimo} onChange={e => setShowEditItem({ ...showEditItem, estoque_minimo: +e.target.value })} /></div>
                <div><Label>Estoque máximo</Label><Input type="number" value={showEditItem.estoque_maximo} onChange={e => setShowEditItem({ ...showEditItem, estoque_maximo: +e.target.value })} /></div>
              </div>
              <div><Label>Fornecedor</Label><Input value={showEditItem.fornecedor_habitual} onChange={e => setShowEditItem({ ...showEditItem, fornecedor_habitual: e.target.value })} /></div>
              <div><Label>Observações</Label><Textarea value={showEditItem.observacoes} onChange={e => setShowEditItem({ ...showEditItem, observacoes: e.target.value })} /></div>
              <Button className="w-full" onClick={handleUpdateItem} disabled={updateItem.isPending}>
                {updateItem.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Entrada */}
      <Dialog open={showEntrada} onOpenChange={setShowEntrada}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar Entrada de Material</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Selecionar item *</Label>
              <Select value={movForm.item_id} onValueChange={v => setMovForm({ ...movForm, item_id: v })}>
                <SelectTrigger><SelectValue placeholder="Escolha o item" /></SelectTrigger>
                <SelectContent>
                  {itens.filter(i => i.ativo).map(i => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Quantidade que chegou *</Label><Input type="number" min={1} value={movForm.quantidade} onChange={e => setMovForm({ ...movForm, quantidade: +e.target.value })} /></div>
            <div><Label>Valor pago por unidade (R$)</Label><Input type="number" step="0.01" value={movForm.valor_unitario} onChange={e => setMovForm({ ...movForm, valor_unitario: +e.target.value })} /></div>
            <div><Label>Data da compra</Label><Input type="date" value={movForm.data_movimentacao} onChange={e => setMovForm({ ...movForm, data_movimentacao: e.target.value })} /></div>
            <div><Label>Observação</Label><Textarea value={movForm.observacao} onChange={e => setMovForm({ ...movForm, observacao: e.target.value })} /></div>
            <Button className="w-full" onClick={handleEntrada} disabled={!movForm.item_id || movForm.quantidade <= 0 || registrarMov.isPending}>
              {registrarMov.isPending ? 'Registrando...' : 'Confirmar Entrada'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Saída */}
      <Dialog open={showSaida} onOpenChange={setShowSaida}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar Retirada de Material</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Selecionar item *</Label>
              <Select value={movForm.item_id} onValueChange={v => setMovForm({ ...movForm, item_id: v })}>
                <SelectTrigger><SelectValue placeholder="Escolha o item" /></SelectTrigger>
                <SelectContent>
                  {itens.filter(i => i.ativo).map(i => <SelectItem key={i.id} value={i.id}>{i.nome} ({i.quantidade_atual} em estoque)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantidade retirada *</Label>
              <Input type="number" min={1} value={movForm.quantidade} onChange={e => setMovForm({ ...movForm, quantidade: +e.target.value })} />
              {saidaExceedsStock && (
                <p className="text-sm mt-1" style={{ color: 'hsl(0, 84%, 60%)' }}>
                  Você só tem {selectedItemForSaida!.quantidade_atual} unidades em estoque
                </p>
              )}
            </div>
            <div><Label>Data</Label><Input type="date" value={movForm.data_movimentacao} onChange={e => setMovForm({ ...movForm, data_movimentacao: e.target.value })} /></div>
            <div><Label>Observação</Label><Textarea placeholder="Ex: para limpeza da sala de reunião" value={movForm.observacao} onChange={e => setMovForm({ ...movForm, observacao: e.target.value })} /></div>
            <Button className="w-full" onClick={handleSaida} disabled={!movForm.item_id || movForm.quantidade <= 0 || !!saidaExceedsStock || registrarMov.isPending}>
              {registrarMov.isPending ? 'Registrando...' : 'Confirmar Retirada'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
