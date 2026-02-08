import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
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
import { VendaStatus, VENDA_STATUS_LABELS, Venda } from '@/types/crm';
import { DollarSign, TrendingUp, Users, Plus, Edit2, Check, X, Search, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
export default function VendasPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [closerFilter, setCloserFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVenda, setEditingVenda] = useState<Venda | null>(null);
  const [dataVenda, setDataVenda] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const { data: vendas, isLoading } = useVendas();
  const { data: closers } = useClosers();
  const { profile, canEdit } = useAuth();
  const createVenda = useCreateVenda();
  const updateVenda = useUpdateVenda();

  const filteredVendas = vendas?.filter(venda => {
    const matchesStatus = statusFilter === 'all' || venda.status === statusFilter;
    const matchesCloser = closerFilter === 'all' || venda.closer_user_id === closerFilter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      venda.nome_lead.toLowerCase().includes(searchLower) ||
      venda.nome_empresa.toLowerCase().includes(searchLower) ||
      (venda.closer as any)?.nome?.toLowerCase().includes(searchLower);
    return matchesStatus && matchesCloser && matchesSearch;
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
    setDialogOpen(true);
  };

  const handleOpenEdit = (venda: Venda) => {
    setEditingVenda(venda);
    setDataVenda(new Date(venda.data_fechamento + 'T12:00:00'));
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      nome_lead: formData.get('nome_lead') as string,
      nome_empresa: formData.get('nome_empresa') as string,
      duracao_contrato_meses: Number(formData.get('duracao_contrato_meses')) || 12,
      valor_pix: Number(formData.get('valor_pix')) || 0,
      valor_cartao: Number(formData.get('valor_cartao')) || 0,
      valor_boleto_parcela: Number(formData.get('valor_boleto_parcela')) || 0,
      quantidade_parcelas_boleto: Number(formData.get('quantidade_parcelas_boleto')) || 0,
      pago: formData.get('pago') === 'on',
      contrato_assinado: formData.get('contrato_assinado') === 'on',
      observacoes: formData.get('observacoes') as string || undefined,
    };

    if (!data.nome_lead || !data.nome_empresa) {
      toast.error('Preencha nome do lead e empresa');
      return;
    }

    try {
      if (editingVenda) {
        await updateVenda.mutateAsync({
          id: editingVenda.id,
          ...data,
          data_fechamento: format(dataVenda, 'yyyy-MM-dd'),
          status: formData.get('status') as VendaStatus,
        });
      } else {
        await createVenda.mutateAsync({
          ...data,
          closer_user_id: profile!.id,
          data_fechamento: format(dataVenda, 'yyyy-MM-dd'),
        });
      }
      setDialogOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
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

                <div className="flex gap-6">
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
                </div>

                {editingVenda && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={editingVenda.status}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(VENDA_STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(VENDA_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Flags</TableHead>
                {canEdit && <TableHead className="w-10"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 9 : 8} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredVendas?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 9 : 8} className="text-center py-8 text-muted-foreground">
                    Nenhuma venda encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredVendas?.map(venda => {
                  const valorBoletoTotal = venda.valor_boleto_parcela * venda.quantidade_parcelas_boleto;
                  return (
                    <TableRow key={venda.id}>
                      <TableCell className="font-medium">
                        {format(new Date(venda.data_fechamento), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{venda.nome_lead}</p>
                          <p className="text-sm text-muted-foreground">{venda.nome_empresa}</p>
                        </div>
                      </TableCell>
                      <TableCell>{venda.duracao_contrato_meses} meses</TableCell>
                      <TableCell>
                        <p className="font-bold text-primary">{formatCurrency(venda.valor_total)}</p>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-0.5">
                          {venda.valor_pix > 0 && <p>Pix: {formatCurrency(venda.valor_pix)}</p>}
                          {venda.valor_cartao > 0 && <p>Cartão: {formatCurrency(venda.valor_cartao)}</p>}
                          {valorBoletoTotal > 0 && (
                            <p>Boleto: {venda.quantidade_parcelas_boleto}x {formatCurrency(venda.valor_boleto_parcela)}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{(venda.closer as any)?.nome}</TableCell>
                      <TableCell>
                        <StatusBadge status={venda.status} type="venda" />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2" title={`Pago: ${venda.pago ? 'Sim' : 'Não'}, Assinado: ${venda.contrato_assinado ? 'Sim' : 'Não'}`}>
                          {venda.pago ? (
                            <Check className="h-4 w-4 text-success" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground" />
                          )}
                          {venda.contrato_assinado ? (
                            <Check className="h-4 w-4 text-success" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
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
