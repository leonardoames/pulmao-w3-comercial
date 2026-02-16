import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useVendas, useCreateVenda, useUpdateVenda } from '@/hooks/useVendas';
import { useClosers } from '@/hooks/useProfiles';
import { useAuth } from '@/hooks/useAuth';
import { useIsCloser, useCanEditAnyFechamento } from '@/hooks/useUserRoles';
import { Venda } from '@/types/crm';
import { DollarSign, TrendingUp, Users, Plus, Edit2, Check, X, Search, CalendarIcon, Landmark, Headphones } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function VendasPage() {
  const [closerFilter, setCloserFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVenda, setEditingVenda] = useState<Venda | null>(null);
  const [dataVenda, setDataVenda] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedCloserId, setSelectedCloserId] = useState<string>('');
  
  const { data: vendas, isLoading } = useVendas();
  const { data: closers } = useClosers();
  const { profile, canEdit } = useAuth();
  const isCloser = useIsCloser();
  const canManageClosers = useCanEditAnyFechamento();
  const createVenda = useCreateVenda();
  const updateVenda = useUpdateVenda();

  const filteredVendas = vendas?.filter(venda => {
    const matchesCloser = closerFilter === 'all' || venda.closer_user_id === closerFilter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      venda.nome_lead.toLowerCase().includes(searchLower) ||
      venda.nome_empresa.toLowerCase().includes(searchLower) ||
      (venda.closer as any)?.nome?.toLowerCase().includes(searchLower);
    return matchesCloser && matchesSearch;
  });

  const totalFaturamento = filteredVendas?.reduce((sum, v) => sum + Number(v.valor_total), 0) || 0;
  const totalVendas = filteredVendas?.length || 0;
  const ticketMedio = totalVendas > 0 ? totalFaturamento / totalVendas : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleOpenNew = () => {
    setEditingVenda(null);
    setDataVenda(new Date());
    // Se for closer, usa o próprio ID; se não, limpa para forçar seleção
    setSelectedCloserId(isCloser ? (profile?.id || '') : '');
    setDialogOpen(true);
  };

  const handleOpenEdit = (venda: Venda) => {
    setEditingVenda(venda);
    // Parse date as YYYY-MM-DD string directly to avoid timezone issues
    const [year, month, day] = venda.data_fechamento.split('-').map(Number);
    setDataVenda(new Date(year, month - 1, day));
    setSelectedCloserId(venda.closer_user_id);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Determinar o closer_user_id
    const closerUserId = isCloser ? profile!.id : selectedCloserId;
    
    if (!closerUserId) {
      toast.error('Selecione o closer responsável pela venda');
      return;
    }
    
    const nomeLead = (formData.get('nome_lead') as string || '').trim();
    const nomeEmpresa = (formData.get('nome_empresa') as string || '').trim();
    const observacoesRaw = (formData.get('observacoes') as string || '').trim();
    const duracaoContrato = Math.max(1, Math.floor(Number(formData.get('duracao_contrato_meses')) || 12));
    const valorPix = Math.max(0, Number(formData.get('valor_pix')) || 0);
    const valorCartao = Math.max(0, Number(formData.get('valor_cartao')) || 0);
    const valorBoletoParcela = Math.max(0, Number(formData.get('valor_boleto_parcela')) || 0);
    const qtdParcelas = Math.max(0, Math.floor(Number(formData.get('quantidade_parcelas_boleto')) || 0));

    if (!nomeLead || nomeLead.length > 200) {
      toast.error('Nome do lead é obrigatório e deve ter no máximo 200 caracteres');
      return;
    }
    if (!nomeEmpresa || nomeEmpresa.length > 200) {
      toast.error('Nome da empresa é obrigatório e deve ter no máximo 200 caracteres');
      return;
    }
    if (observacoesRaw.length > 2000) {
      toast.error('Observações deve ter no máximo 2000 caracteres');
      return;
    }
    if (valorPix > 100000000 || valorCartao > 100000000 || valorBoletoParcela > 100000000) {
      toast.error('Valores monetários não podem exceder R$ 100.000.000');
      return;
    }

    const data = {
      nome_lead: nomeLead,
      nome_empresa: nomeEmpresa,
      duracao_contrato_meses: duracaoContrato,
      valor_pix: valorPix,
      valor_cartao: valorCartao,
      valor_boleto_parcela: valorBoletoParcela,
      quantidade_parcelas_boleto: qtdParcelas,
      pago: formData.get('pago') === 'on',
      contrato_assinado: formData.get('contrato_assinado') === 'on',
      enviado_financeiro: formData.get('enviado_financeiro') === 'on',
      enviado_cs: formData.get('enviado_cs') === 'on',
      observacoes: observacoesRaw || undefined,
    };

    try {
      if (editingVenda) {
        await updateVenda.mutateAsync({
          id: editingVenda.id,
          ...data,
          closer_user_id: closerUserId,
          data_fechamento: format(dataVenda, 'yyyy-MM-dd'),
        });
      } else {
        await createVenda.mutateAsync({
          ...data,
          closer_user_id: closerUserId,
          data_fechamento: format(dataVenda, 'yyyy-MM-dd'),
        });
      }
      setDialogOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Get closer name for display
  const getCloserName = (closerId: string) => {
    if (isCloser && closerId === profile?.id) {
      return profile?.nome || 'Você';
    }
    return closers?.find(c => c.id === closerId)?.nome || 'Selecione...';
  };

  return (
    <AppLayout>
      <PageHeader title="Vendas" description="Contratos e faturamento">
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Venda
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingVenda ? 'Editar Venda' : 'Registrar Nova Venda'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data_venda">Data da Venda</Label>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          {format(dataVenda, "dd/MM/yyyy")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dataVenda}
                          onSelect={(date) => {
                            if (date) {
                              setDataVenda(date);
                              setCalendarOpen(false);
                            }
                          }}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {/* Campo Closer da Venda */}
                  <div className="space-y-2">
                    <Label htmlFor="closer">Closer da Venda *</Label>
                    {isCloser ? (
                      // Closer vê campo bloqueado com o próprio nome
                      <Input 
                        value={profile?.nome || ''} 
                        disabled 
                        className="bg-muted"
                      />
                    ) : (
                      // Master/Diretoria/Gestor pode selecionar qualquer closer
                      <Select value={selectedCloserId} onValueChange={setSelectedCloserId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o closer" />
                        </SelectTrigger>
                        <SelectContent>
                          {closers?.map(closer => (
                            <SelectItem key={closer.id} value={closer.id}>{closer.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duracao_contrato_meses">Duração do Contrato (meses)</Label>
                    <Input 
                      id="duracao_contrato_meses" 
                      name="duracao_contrato_meses" 
                      type="number"
                      min="1"
                      defaultValue={editingVenda?.duracao_contrato_meses ?? 12}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome_lead">Nome do Lead *</Label>
                    <Input 
                      id="nome_lead" 
                      name="nome_lead" 
                      defaultValue={editingVenda?.nome_lead}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nome_empresa">Nome da Empresa *</Label>
                    <Input 
                      id="nome_empresa" 
                      name="nome_empresa" 
                      defaultValue={editingVenda?.nome_empresa}
                      required 
                    />
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium">Valores do Contrato</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="valor_pix">Valor Pix (R$)</Label>
                      <Input 
                        id="valor_pix" 
                        name="valor_pix" 
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={editingVenda?.valor_pix ?? 0}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valor_cartao">Valor Cartão (R$)</Label>
                      <Input 
                        id="valor_cartao" 
                        name="valor_cartao" 
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={editingVenda?.valor_cartao ?? 0}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valor_boleto_parcela">Valor Parcela Boleto (R$)</Label>
                      <Input 
                        id="valor_boleto_parcela" 
                        name="valor_boleto_parcela" 
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={editingVenda?.valor_boleto_parcela ?? 0}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantidade_parcelas_boleto">Quantidade de Parcelas</Label>
                      <Input 
                        id="quantidade_parcelas_boleto" 
                        name="quantidade_parcelas_boleto" 
                        type="number"
                        min="0"
                        defaultValue={editingVenda?.quantidade_parcelas_boleto ?? 0}
                      />
                    </div>
                  </div>
                  {editingVenda && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">
                        Valor Total: <span className="font-bold text-primary">{formatCurrency(editingVenda.valor_total)}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="pago" 
                      name="pago"
                      defaultChecked={editingVenda?.pago}
                    />
                    <Label htmlFor="pago">Pago</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="contrato_assinado" 
                      name="contrato_assinado"
                      defaultChecked={editingVenda?.contrato_assinado}
                    />
                    <Label htmlFor="contrato_assinado">Contrato Assinado</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="enviado_financeiro" 
                      name="enviado_financeiro"
                      defaultChecked={editingVenda?.enviado_financeiro}
                    />
                    <Label htmlFor="enviado_financeiro">Enviado ao Financeiro</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="enviado_cs" 
                      name="enviado_cs"
                      defaultChecked={editingVenda?.enviado_cs}
                    />
                    <Label htmlFor="enviado_cs">Enviado ao CS</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea 
                    id="observacoes" 
                    name="observacoes"
                    defaultValue={editingVenda?.observacoes || ''}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createVenda.isPending || updateVenda.isPending}>
                    {editingVenda ? 'Salvar' : 'Registrar Venda'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Vendas</p>
                <p className="text-2xl font-bold">{totalVendas}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Faturamento Total</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalFaturamento)}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">{formatCurrency(ticketMedio)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar lead, empresa ou closer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={closerFilter} onValueChange={setCloserFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Closer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os closers</SelectItem>
            {closers?.map(closer => (
              <SelectItem key={closer.id} value={closer.id}>{closer.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Detalhes Pagamento</TableHead>
                <TableHead>Closer</TableHead>
                <TableHead className="w-20">Flags</TableHead>
                {canEdit && <TableHead className="w-10"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 8 : 7} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredVendas?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 8 : 7} className="text-center py-8 text-muted-foreground">
                    Nenhuma venda encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredVendas?.map(venda => {
                  const valorBoletoTotal = venda.valor_boleto_parcela * venda.quantidade_parcelas_boleto;
                  return (
                    <TableRow key={venda.id}>
                      <TableCell className="font-medium">
                        {(() => {
                          const [year, month, day] = venda.data_fechamento.split('-').map(Number);
                          return format(new Date(year, month - 1, day), 'dd/MM/yyyy');
                        })()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{venda.nome_lead}</p>
                          <p className="text-sm text-muted-foreground">{venda.nome_empresa}</p>
                        </div>
                      </TableCell>
                      <TableCell>{venda.duracao_contrato_meses} meses</TableCell>
                      <TableCell className="font-bold text-primary">
                        {formatCurrency(venda.valor_total)}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          {venda.valor_pix > 0 && <p>Pix: {formatCurrency(venda.valor_pix)}</p>}
                          {venda.valor_cartao > 0 && <p>Cartão: {formatCurrency(venda.valor_cartao)}</p>}
                          {valorBoletoTotal > 0 && (
                            <p>Boleto: {venda.quantidade_parcelas_boleto}x {formatCurrency(venda.valor_boleto_parcela)}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{(venda.closer as any)?.nome}</TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <div className="flex gap-1">
                            {venda.pago && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-success/20 text-success">
                                    <Check className="h-3 w-3" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>Pago</TooltipContent>
                              </Tooltip>
                            )}
                            {venda.contrato_assinado && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary">
                                    <Edit2 className="h-3 w-3" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>Contrato Assinado</TooltipContent>
                              </Tooltip>
                            )}
                            {venda.enviado_financeiro && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-warning/20 text-warning">
                                    <Landmark className="h-3 w-3" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>Enviado ao Financeiro</TooltipContent>
                              </Tooltip>
                            )}
                            {venda.enviado_cs && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-info/20 text-info">
                                    <Headphones className="h-3 w-3" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>Enviado ao CS</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TooltipProvider>
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleOpenEdit(venda)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
