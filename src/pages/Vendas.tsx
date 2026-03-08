import { useState, useMemo } from 'react';
import { startOfMonth, endOfMonth, startOfDay, subDays, endOfDay } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useVendas, useCreateVenda, useUpdateVenda, useDeleteVenda, useRefundVenda } from '@/hooks/useVendas';
import { useClosers } from '@/hooks/useProfiles';
import { useAuth } from '@/hooks/useAuth';
import { useIsCloser, useCanEditAnyFechamento, useIsMaster } from '@/hooks/useUserRoles';
import { Venda, ORIGEM_LEAD_OPTIONS, OrigemLead } from '@/types/crm';
import { DollarSign, TrendingUp, Users, Plus, Edit2, Check, X, Search, CalendarIcon, Landmark, Headphones, Filter, RotateCcw, FileDown, Trash2, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function VendasPage() {
  type QuickFilter = 'today' | 'yesterday' | '7days' | 'month' | '30days' | 'custom';

  const [closerFilter, setCloserFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVenda, setEditingVenda] = useState<Venda | null>(null);
  const [dataVenda, setDataVenda] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedCloserId, setSelectedCloserId] = useState<string>('');
  const [origemLead, setOrigemLead] = useState<string>('');

  // Quick date filter — default to "Este mês"
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('month');

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);
  const [duracaoFilter, setDuracaoFilter] = useState<string>('all');
  const [valorFilter, setValorFilter] = useState<string>('all');
  const [flagPago, setFlagPago] = useState(false);
  const [flagContrato, setFlagContrato] = useState(false);
  const [flagFinanceiro, setFlagFinanceiro] = useState(false);
  const [flagCS, setFlagCS] = useState(false);
  const [filtroOrigem, setFiltroOrigem] = useState<string>('Todas');

  // Compute effective date range from quick filter
  const { dateFrom, dateTo } = useMemo(() => {
    const now = new Date();
    switch (quickFilter) {
      case 'today':
        return { dateFrom: startOfDay(now), dateTo: endOfDay(now) };
      case 'yesterday': {
        const y = subDays(now, 1);
        return { dateFrom: startOfDay(y), dateTo: endOfDay(y) };
      }
      case '7days':
        return { dateFrom: startOfDay(subDays(now, 6)), dateTo: endOfDay(now) };
      case 'month':
        return { dateFrom: startOfMonth(now), dateTo: endOfMonth(now) };
      case '30days':
        return { dateFrom: startOfDay(subDays(now, 29)), dateTo: endOfDay(now) };
      case 'custom':
        return { dateFrom: customDateFrom, dateTo: customDateTo };
      default:
        return { dateFrom: undefined, dateTo: undefined };
    }
  }, [quickFilter, customDateFrom, customDateTo]);
  
  const { data: vendas, isLoading } = useVendas();
  const { data: closers } = useClosers();
  const { profile, canEdit } = useAuth();
  const isCloser = useIsCloser();
  const canManageClosers = useCanEditAnyFechamento();
  const createVenda = useCreateVenda();
  const updateVenda = useUpdateVenda();
  const deleteVenda = useDeleteVenda();
  const refundVenda = useRefundVenda();
  const isMaster = useIsMaster();

  // Admin action modals
  const [deleteTarget, setDeleteTarget] = useState<Venda | null>(null);
  const [refundTarget, setRefundTarget] = useState<Venda | null>(null);
  const [refundReason, setRefundReason] = useState('');

  const hasActiveFilters = quickFilter !== 'month' || duracaoFilter !== 'all' || valorFilter !== 'all' || flagPago || flagContrato || flagFinanceiro || flagCS || !!customDateFrom || !!customDateTo || filtroOrigem !== 'Todas';

  const clearFilters = () => {
    setQuickFilter('month');
    setCustomDateFrom(undefined);
    setCustomDateTo(undefined);
    setDuracaoFilter('all');
    setValorFilter('all');
    setFlagPago(false);
    setFlagContrato(false);
    setFlagFinanceiro(false);
    setFlagCS(false);
    setFiltroOrigem('Todas');
  };

  const filteredVendas = vendas?.filter(venda => {
    const matchesCloser = closerFilter === 'all' || venda.closer_user_id === closerFilter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      venda.nome_lead.toLowerCase().includes(searchLower) ||
      venda.nome_empresa.toLowerCase().includes(searchLower) ||
      (venda.closer as any)?.nome?.toLowerCase().includes(searchLower);

    // Date range filter
    if (dateFrom) {
      const [y, m, d] = venda.data_fechamento.split('-').map(Number);
      const vendaDate = new Date(y, m - 1, d);
      if (vendaDate < dateFrom) return false;
    }
    if (dateTo) {
      const [y, m, d] = venda.data_fechamento.split('-').map(Number);
      const vendaDate = new Date(y, m - 1, d);
      if (vendaDate > dateTo) return false;
    }

    // Duration filter
    if (duracaoFilter !== 'all') {
      const dur = venda.duracao_contrato_meses;
      if (duracaoFilter === '1-3' && (dur < 1 || dur > 3)) return false;
      if (duracaoFilter === '4-6' && (dur < 4 || dur > 6)) return false;
      if (duracaoFilter === '7-12' && (dur < 7 || dur > 12)) return false;
      if (duracaoFilter === '13+' && dur < 13) return false;
    }

    // Value filter
    if (valorFilter !== 'all') {
      const val = venda.valor_total;
      if (valorFilter === '0-5000' && val > 5000) return false;
      if (valorFilter === '5000-20000' && (val < 5000 || val > 20000)) return false;
      if (valorFilter === '20000-50000' && (val < 20000 || val > 50000)) return false;
      if (valorFilter === '50000+' && val < 50000) return false;
    }

    // Flag filters
    if (flagPago && !venda.pago) return false;
    if (flagContrato && !venda.contrato_assinado) return false;
    if (flagFinanceiro && !venda.enviado_financeiro) return false;
    if (flagCS && !venda.enviado_cs) return false;

    // Origem filter
    if (filtroOrigem !== 'Todas' && venda.origem_lead !== filtroOrigem) return false;

    return matchesCloser && matchesSearch;
  });

  const activeVendas = filteredVendas?.filter(v => v.status !== 'Reembolsado') || [];
  const totalFaturamento = activeVendas.reduce((sum, v) => sum + Number(v.valor_total), 0);
  const totalVendas = activeVendas.length;
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
    setSelectedCloserId(isCloser ? (profile?.id || '') : '');
    setOrigemLead('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (venda: Venda) => {
    setEditingVenda(venda);
    const [year, month, day] = venda.data_fechamento.split('-').map(Number);
    setDataVenda(new Date(year, month - 1, day));
    setSelectedCloserId(venda.closer_user_id);
    setOrigemLead(venda.origem_lead ?? '');
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
      origem_lead: origemLead || null,
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

  const handleExportPDF = () => {
    if (!filteredVendas || filteredVendas.length === 0) {
      toast.error('Nenhuma venda para exportar');
      return;
    }

    const flag = (val: boolean) => val ? 'Sim' : 'Não';
    const formatBoleto = (parcela: number, qtd: number) => {
      if (!parcela || !qtd) return '-';
      return `${qtd}x ${formatCurrency(parcela)}`;
    };

    const rows = filteredVendas.map(v => {
      const [year, month, day] = v.data_fechamento.split('-').map(Number);
      const dataFormatted = `${String(day).padStart(2,'0')}/${String(month).padStart(2,'0')}/${year}`;
      const closerNome = (v.closer as any)?.nome || '-';
      return `<tr>
        <td>${dataFormatted}</td>
        <td>${v.nome_lead}</td>
        <td>${v.nome_empresa}</td>
        <td>${closerNome}</td>
        <td>${v.duracao_contrato_meses}m</td>
        <td class="r">${formatCurrency(v.valor_pix)}</td>
        <td class="r">${formatCurrency(v.valor_cartao)}</td>
        <td class="r">${formatBoleto(v.valor_boleto_parcela, v.quantidade_parcelas_boleto)}</td>
        <td class="r b">${formatCurrency(v.valor_total)}</td>
        <td class="c">${flag(v.pago)}</td>
        <td class="c">${flag(v.contrato_assinado)}</td>
        <td class="c">${flag(v.enviado_financeiro)}</td>
        <td class="c">${flag(v.enviado_cs)}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatório de Vendas</title>
    <style>
      @page{size:landscape}
      body{font-family:Arial,sans-serif;padding:24px;color:#222}
      h1{font-size:18px;margin-bottom:4px}
      p.sub{color:#666;font-size:12px;margin-bottom:16px}
      table{width:100%;border-collapse:collapse;font-size:11px}
      th,td{border:1px solid #ddd;padding:5px 6px;text-align:left;white-space:nowrap}
      th{background:#f5f5f5;font-weight:600}
      .r{text-align:right}
      .c{text-align:center}
      .b{font-weight:bold}
      @media print{body{padding:0}}
    </style></head><body>
    <h1>Relatório de Vendas</h1>
    <p class="sub">${totalVendas} vendas • Faturamento: ${formatCurrency(totalFaturamento)} • Ticket Médio: ${formatCurrency(ticketMedio)}</p>
    <table><thead><tr>
      <th>Data</th><th>Lead</th><th>Empresa</th><th>Closer</th><th>Duração</th>
      <th class="r">Pix</th><th class="r">Cartão</th><th class="r">Boleto</th><th class="r">Valor Total</th>
      <th class="c">Pago</th><th class="c">Contrato</th><th class="c">Financeiro</th><th class="c">CS</th>
    </tr></thead>
    <tbody>${rows}</tbody></table>
    <script>window.onload=function(){window.print()}<\/script>
    </body></html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  };

  return (
    <AppLayout>
      <PageHeader title="Vendas" description="Contratos e faturamento">
        {/* Quick date filter pills */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
          {([
            { value: 'today' as QuickFilter, label: 'Hoje' },
            { value: 'yesterday' as QuickFilter, label: 'Ontem' },
            { value: '7days' as QuickFilter, label: '7 dias' },
            { value: 'month' as QuickFilter, label: 'Este mês' },
            { value: '30days' as QuickFilter, label: '30 dias' },
          ]).map((option) => {
            const isActive = quickFilter === option.value;
            return (
              <Button
                key={option.value}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setQuickFilter(option.value)}
                className="min-w-[60px]"
                style={
                  isActive
                    ? { background: '#F97316', color: '#000000', fontWeight: 600, fontSize: '13px', borderRadius: '8px' }
                    : {
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: 'rgba(255,255,255,0.6)',
                      }
                }
              >
                {option.label}
              </Button>
            );
          })}
        </div>

        <div className="flex flex-col w-full gap-2 sm:flex-row sm:w-auto sm:items-center">
          <Button variant="outline" className="gap-2" onClick={handleExportPDF}>
            <FileDown className="h-4 w-4" />
            Exportar PDF
          </Button>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Origem do Lead</Label>
                    <Select value={origemLead} onValueChange={setOrigemLead}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a origem" />
                      </SelectTrigger>
                      <SelectContent>
                        {ORIGEM_LEAD_OPTIONS.map((opcao) => (
                          <SelectItem key={opcao} value={opcao}>{opcao}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
        </div>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total de Vendas"
          value={totalVendas}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Faturamento Total"
          value={formatCurrency(totalFaturamento)}
          icon={<DollarSign className="h-5 w-5" />}
          variant="primary"
        />
        <StatCard
          title="Ticket Médio"
          value={formatCurrency(ticketMedio)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Search + Filter Toggle */}
      <div className="flex flex-col gap-2 mb-4">
        {/* Row 1: Search (full width on mobile) */}
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar lead, empresa ou closer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {/* Row 2: Closer + Filters side by side on mobile */}
        <div className="grid grid-cols-2 gap-2 lg:flex lg:gap-4">
          <Select value={closerFilter} onValueChange={setCloserFilter}>
            <SelectTrigger className="w-full lg:w-[180px]">
              <SelectValue placeholder="Closer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os closers</SelectItem>
              {closers?.map(closer => (
                <SelectItem key={closer.id} value={closer.id}>{closer.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={showFilters ? "secondary" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2 w-full lg:w-auto"
          >
            <Filter className="h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                !
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date From */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Data de</Label>
                <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2 font-normal">
                      <CalendarIcon className="h-4 w-4" />
                      {customDateFrom ? format(customDateFrom, "dd/MM/yyyy") : "Início"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customDateFrom}
                      onSelect={(date) => { setCustomDateFrom(date || undefined); setQuickFilter('custom'); setDateFromOpen(false); }}
                      locale={ptBR}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Data até</Label>
                <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2 font-normal">
                      <CalendarIcon className="h-4 w-4" />
                      {customDateTo ? format(customDateTo, "dd/MM/yyyy") : "Fim"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customDateTo}
                      onSelect={(date) => { setCustomDateTo(date || undefined); setQuickFilter('custom'); setDateToOpen(false); }}
                      locale={ptBR}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Duração do contrato</Label>
                <Select value={duracaoFilter} onValueChange={setDuracaoFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="1-3">1–3 meses</SelectItem>
                    <SelectItem value="4-6">4–6 meses</SelectItem>
                    <SelectItem value="7-12">7–12 meses</SelectItem>
                    <SelectItem value="13+">13+ meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Value */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Faixa de valor</Label>
                <Select value={valorFilter} onValueChange={setValorFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="0-5000">Até R$ 5.000</SelectItem>
                    <SelectItem value="5000-20000">R$ 5.000 – R$ 20.000</SelectItem>
                    <SelectItem value="20000-50000">R$ 20.000 – R$ 50.000</SelectItem>
                    <SelectItem value="50000+">Acima de R$ 50.000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Flag checkboxes */}
            <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t">
              <span className="text-xs text-muted-foreground font-medium">Flags ativas:</span>
              <div className="flex items-center gap-2">
                <Checkbox id="filter_pago" checked={flagPago} onCheckedChange={(v) => setFlagPago(!!v)} />
                <Label htmlFor="filter_pago" className="text-sm">Pago</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="filter_contrato" checked={flagContrato} onCheckedChange={(v) => setFlagContrato(!!v)} />
                <Label htmlFor="filter_contrato" className="text-sm">Contrato Assinado</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="filter_financeiro" checked={flagFinanceiro} onCheckedChange={(v) => setFlagFinanceiro(!!v)} />
                <Label htmlFor="filter_financeiro" className="text-sm">Enviado Financeiro</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="filter_cs" checked={flagCS} onCheckedChange={(v) => setFlagCS(!!v)} />
                <Label htmlFor="filter_cs" className="text-sm">Enviado CS</Label>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 ml-auto">
                  <RotateCcw className="h-3 w-3" />
                  Limpar filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="relative overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Scroll fade hint */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10 lg:hidden" style={{ background: 'linear-gradient(to right, transparent, hsl(var(--card)))' }} />
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Duração</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead className="hidden md:table-cell">Detalhes Pagamento</TableHead>
                <TableHead className="hidden md:table-cell">Closer</TableHead>
                <TableHead className="w-28 hidden md:table-cell">Flags</TableHead>
                {isMaster && <TableHead className="w-20">Ações</TableHead>}
                {canEdit && <TableHead className="w-10"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredVendas?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Nenhuma venda encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredVendas?.map(venda => {
                  const valorBoletoTotal = venda.valor_boleto_parcela * venda.quantidade_parcelas_boleto;
                  const isRefunded = venda.status === 'Reembolsado';
                  return (
                    <TableRow key={venda.id} style={isRefunded ? { background: 'rgba(234,179,8,0.04)' } : undefined}>
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
                      <TableCell className="hidden md:table-cell">{venda.duracao_contrato_meses} meses</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={isRefunded ? 'line-through font-bold' : 'font-bold text-primary'} style={isRefunded ? { color: 'rgba(255,255,255,0.3)' } : undefined}>
                            {formatCurrency(venda.valor_total)}
                          </span>
                          {isRefunded && (
                            <span style={{ fontSize: '10px', background: 'rgba(234,179,8,0.15)', color: '#EAB308', borderRadius: '999px', padding: '2px 8px', letterSpacing: '0.05em', fontWeight: 600 }}>
                              REEMBOLSADO
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-xs space-y-1">
                          {venda.valor_pix > 0 && <p>Pix: {formatCurrency(venda.valor_pix)}</p>}
                          {venda.valor_cartao > 0 && <p>Cartão: {formatCurrency(venda.valor_cartao)}</p>}
                          {valorBoletoTotal > 0 && (
                            <p>Boleto: {venda.quantidade_parcelas_boleto}x {formatCurrency(venda.valor_boleto_parcela)}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{(venda.closer as any)?.nome}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <TooltipProvider>
                          <div className="flex gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${venda.pago ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground opacity-30'}`}>
                                  <Check className="h-3 w-3" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>Pagamento confirmado</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${venda.contrato_assinado ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground opacity-30'}`}>
                                  <Edit2 className="h-3 w-3" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>Contrato assinado pelo cliente</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${venda.enviado_financeiro ? 'bg-warning/20 text-warning' : 'bg-muted text-muted-foreground opacity-30'}`}>
                                  <Landmark className="h-3 w-3" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>Enviado ao setor financeiro</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${venda.enviado_cs ? 'bg-info/20 text-info' : 'bg-muted text-muted-foreground opacity-30'}`}>
                                  <Headphones className="h-3 w-3" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>Enviado ao time de Customer Success</TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </TableCell>
                      {isMaster && (
                        <TableCell>
                          <TooltipProvider>
                            <div className="flex gap-1">
                              {isRefunded ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span
                                      className="inline-flex items-center justify-center"
                                      style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)' }}
                                    >
                                      <RotateCcw className="h-4 w-4" style={{ color: '#EAB308' }} />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>Já reembolsado</TooltipContent>
                                </Tooltip>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => setRefundTarget(venda)}
                                      className="inline-flex items-center justify-center transition-colors"
                                      style={{ width: 32, height: 32, borderRadius: 6, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }}
                                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(234,179,8,0.12)'; e.currentTarget.style.borderColor = 'rgba(234,179,8,0.3)'; (e.currentTarget.querySelector('svg') as any).style.color = '#EAB308'; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget.querySelector('svg') as any).style.color = 'rgba(255,255,255,0.3)'; }}
                                    >
                                      <RotateCcw className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Marcar como reembolsado</TooltipContent>
                                </Tooltip>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => setDeleteTarget(venda)}
                                    className="inline-flex items-center justify-center transition-colors"
                                    style={{ width: 32, height: 32, borderRadius: 6, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; (e.currentTarget.querySelector('svg') as any).style.color = '#EF4444'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget.querySelector('svg') as any).style.color = 'rgba(255,255,255,0.3)'; }}
                                  >
                                    <Trash2 className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>Excluir venda</TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        </TableCell>
                      )}
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
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent style={{ background: '#1a1a1a', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: 32, maxWidth: 420 }}>
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)' }}>
              <AlertTriangle style={{ width: 40, height: 40, color: '#EF4444' }} />
            </div>
            <AlertDialogHeader className="text-center">
              <AlertDialogTitle style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', textAlign: 'center' }}>Excluir venda?</AlertDialogTitle>
              <AlertDialogDescription style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', textAlign: 'center' }}>
                Esta ação não pode ser desfeita. A venda de <strong style={{ color: '#fff' }}>{deleteTarget?.nome_lead}</strong> no valor de <strong style={{ color: '#fff' }}>{deleteTarget ? formatCurrency(deleteTarget.valor_total) : ''}</strong> será permanentemente removida.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row gap-3 w-full sm:justify-center">
              <AlertDialogCancel
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '10px 24px' }}
              >
                Cancelar
              </AlertDialogCancel>
              <Button
                onClick={async () => {
                  if (!deleteTarget) return;
                  try {
                    await deleteVenda.mutateAsync(deleteTarget.id);
                    setDeleteTarget(null);
                  } catch {}
                }}
                disabled={deleteVenda.isPending}
                style={{ background: '#EF4444', color: '#FFFFFF', fontWeight: 600, borderRadius: 8, padding: '10px 24px' }}
                className="hover:!bg-[#DC2626]"
              >
                Sim, excluir
              </Button>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refund Confirmation Modal */}
      <AlertDialog open={!!refundTarget} onOpenChange={(open) => { if (!open) { setRefundTarget(null); setRefundReason(''); } }}>
        <AlertDialogContent style={{ background: '#1a1a1a', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 16, padding: 32, maxWidth: 420 }}>
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(234,179,8,0.1)' }}>
              <RotateCcw style={{ width: 40, height: 40, color: '#EAB308' }} />
            </div>
            <AlertDialogHeader className="text-center">
              <AlertDialogTitle style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', textAlign: 'center' }}>Marcar como reembolsado?</AlertDialogTitle>
              <AlertDialogDescription style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', textAlign: 'center' }}>
                A venda de <strong style={{ color: '#fff' }}>{refundTarget?.nome_lead}</strong> no valor de <strong style={{ color: '#fff' }}>{refundTarget ? formatCurrency(refundTarget.valor_total) : ''}</strong> será marcada como reembolsada. Isso afetará os cálculos de faturamento e OTE do closer <strong style={{ color: '#fff' }}>{(refundTarget?.closer as any)?.nome || '—'}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="w-full">
              <Label htmlFor="refund_reason" style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 6, display: 'block' }}>Motivo do reembolso (opcional)</Label>
              <Textarea
                id="refund_reason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Descreva o motivo..."
                rows={3}
                style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, padding: 10 }}
              />
            </div>
            <AlertDialogFooter className="flex-row gap-3 w-full sm:justify-center">
              <AlertDialogCancel
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '10px 24px' }}
              >
                Cancelar
              </AlertDialogCancel>
              <Button
                onClick={async () => {
                  if (!refundTarget || !profile) return;
                  try {
                    await refundVenda.mutateAsync({
                      id: refundTarget.id,
                      motivo_reembolso: refundReason || undefined,
                      reembolsado_por: profile.id,
                    });
                    setRefundTarget(null);
                    setRefundReason('');
                  } catch {}
                }}
                disabled={refundVenda.isPending}
                style={{ background: '#EAB308', color: '#000000', fontWeight: 600, borderRadius: 8, padding: '10px 24px' }}
                className="hover:!bg-[#CA8A04]"
              >
                Confirmar reembolso
              </Button>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
