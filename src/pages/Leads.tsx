import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Link2 } from 'lucide-react';
import { useLeads, useCreateLead, useUpdateLead, useAutoVincularLeads, LeadW3, LeadStatus } from '@/hooks/useLeads';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_OPTIONS: LeadStatus[] = [
  'Em Andamento', 'Finalizado', 'Cancelado', 'Congelado',
  'Renovação', 'Reembolsado', 'Sem Retorno', 'Não informado',
];

const STATUS_COLORS: Record<LeadStatus, string> = {
  'Em Andamento': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Finalizado':   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Cancelado':    'bg-red-500/20 text-red-400 border-red-500/30',
  'Congelado':    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Renovação':    'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Reembolsado':  'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Sem Retorno':  'bg-gray-500/20 text-gray-400 border-gray-500/30',
  'Não informado':'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const EMPTY_FORM = {
  codigo: '', nome_negocio: '', nome_mentorado: '', nicho: '', email: '',
  data_entrada: '', vigencia_meses: '', tempo_real_meses: '',
  status: 'Em Andamento' as LeadStatus,
  valor_total: '', valor_pago: '', saldo_devedor: '', forma_pagamento: '',
  faturamento_inicial: '', ticket_medio: '', nps: '', motivo_saida: '',
  is_cliente_educacao: false, is_cliente_trafego: false, is_cliente_marketplace: false,
};

function fmtCurrency(value?: number | null) {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function Leads() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterNicho, setFilterNicho] = useState('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<LeadW3 | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { data: leads = [], isLoading } = useLeads({ status: filterStatus, nicho: filterNicho, search });
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const autoVincular = useAutoVincularLeads();

  const nichos = useMemo(() => {
    const set = new Set(leads.map((l) => l.nicho).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [leads]);

  function handleNew() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setSheetOpen(true);
  }

  function handleEdit(lead: LeadW3) {
    setEditing(lead);
    setForm({
      codigo: lead.codigo,
      nome_negocio: lead.nome_negocio,
      nome_mentorado: lead.nome_mentorado ?? '',
      nicho: lead.nicho ?? '',
      email: lead.email ?? '',
      data_entrada: lead.data_entrada ?? '',
      vigencia_meses: lead.vigencia_meses?.toString() ?? '',
      tempo_real_meses: lead.tempo_real_meses?.toString() ?? '',
      status: (lead.status as LeadStatus) ?? 'Em Andamento',
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
    setSheetOpen(true);
  }

  async function handleSave() {
    const payload = {
      codigo: form.codigo,
      nome_negocio: form.nome_negocio,
      nome_mentorado: form.nome_mentorado || null,
      nicho: form.nicho || null,
      email: form.email || null,
      data_entrada: form.data_entrada || null,
      vigencia_meses: form.vigencia_meses ? parseInt(form.vigencia_meses) : null,
      tempo_real_meses: form.tempo_real_meses ? parseInt(form.tempo_real_meses) : null,
      status: form.status,
      valor_total: form.valor_total ? parseFloat(form.valor_total) : null,
      valor_pago: form.valor_pago ? parseFloat(form.valor_pago) : null,
      saldo_devedor: form.saldo_devedor ? parseFloat(form.saldo_devedor) : null,
      forma_pagamento: form.forma_pagamento || null,
      faturamento_inicial: form.faturamento_inicial ? parseFloat(form.faturamento_inicial) : null,
      ticket_medio: form.ticket_medio ? parseFloat(form.ticket_medio) : null,
      nps: form.nps || null,
      motivo_saida: form.motivo_saida || null,
      is_cliente_educacao: form.is_cliente_educacao,
      is_cliente_trafego: form.is_cliente_trafego,
      is_cliente_marketplace: form.is_cliente_marketplace,
      venda_id: null,
    };
    if (editing) {
      await updateLead.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createLead.mutateAsync(payload);
    }
    setSheetOpen(false);
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#0d0d0d] p-6">
        <PageHeader
          title="Base Leads W3"
          description="Gestão de leads e mentorados"
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="gap-2 border-white/10"
                onClick={() => autoVincular.mutate()}
                disabled={autoVincular.isPending}
              >
                <Link2 className="h-4 w-4" />
                Auto Vincular
              </Button>
              <Button onClick={handleNew} className="gap-2 bg-orange-500 hover:bg-orange-600">
                <Plus className="h-4 w-4" />
                Novo Lead
              </Button>
            </div>
          }
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mt-6 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Buscar por nome, mentorado ou email..."
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterNicho} onValueChange={setFilterNicho}>
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Nicho" />
            </SelectTrigger>
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
                <TableHead className="text-white/50">Nicho</TableHead>
                <TableHead className="text-white/50">Email</TableHead>
                <TableHead className="text-white/50">Status</TableHead>
                <TableHead className="text-right text-white/50">Valor Total</TableHead>
                <TableHead className="text-white/50">Entrada</TableHead>
                <TableHead className="text-white/50">Vínculos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-white/40 py-12">Carregando...</TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-white/40 py-12">Nenhum lead encontrado.</TableCell>
                </TableRow>
              ) : leads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="border-white/10 hover:bg-white/5 cursor-pointer"
                  onClick={() => handleEdit(lead)}
                >
                  <TableCell className="text-white/70 font-mono text-xs">{lead.codigo}</TableCell>
                  <TableCell className="text-white font-medium">{lead.nome_negocio}</TableCell>
                  <TableCell className="text-white/70">{lead.nome_mentorado ?? '—'}</TableCell>
                  <TableCell className="text-white/70">{lead.nicho ?? '—'}</TableCell>
                  <TableCell className="text-white/70 text-sm">{lead.email ?? '—'}</TableCell>
                  <TableCell>
                    {lead.status ? (
                      <Badge className={`border text-xs ${STATUS_COLORS[lead.status as LeadStatus] ?? 'bg-gray-500/20 text-gray-400'}`}>
                        {lead.status}
                      </Badge>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-right text-white/70">{fmtCurrency(lead.valor_total)}</TableCell>
                  <TableCell className="text-white/70 text-sm">
                    {lead.data_entrada
                      ? format(new Date(lead.data_entrada + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {lead.is_cliente_educacao && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">Educação</span>
                      )}
                      {lead.is_cliente_trafego && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Tráfego</span>
                      )}
                      {lead.is_cliente_marketplace && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">Marketplace</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="bg-[#1a1a1a] border-white/10 w-[520px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-white">{editing ? 'Editar Lead' : 'Novo Lead'}</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-white/70">Código *</Label>
                  <Input className="bg-white/5 border-white/10 text-white" value={form.codigo}
                    onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/70">Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as LeadStatus }))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-white/70">Nome do Negócio *</Label>
                <Input className="bg-white/5 border-white/10 text-white" value={form.nome_negocio}
                  onChange={(e) => setForm((f) => ({ ...f, nome_negocio: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-white/70">Nome do Mentorado</Label>
                  <Input className="bg-white/5 border-white/10 text-white" value={form.nome_mentorado}
                    onChange={(e) => setForm((f) => ({ ...f, nome_mentorado: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/70">Nicho</Label>
                  <Input className="bg-white/5 border-white/10 text-white" value={form.nicho}
                    onChange={(e) => setForm((f) => ({ ...f, nicho: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-white/70">Email</Label>
                  <Input className="bg-white/5 border-white/10 text-white" type="email" value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/70">Data de Entrada</Label>
                  <Input className="bg-white/5 border-white/10 text-white" type="date" value={form.data_entrada}
                    onChange={(e) => setForm((f) => ({ ...f, data_entrada: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-white/70">Vigência (meses)</Label>
                  <Input className="bg-white/5 border-white/10 text-white" type="number" value={form.vigencia_meses}
                    onChange={(e) => setForm((f) => ({ ...f, vigencia_meses: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/70">Tempo Real (meses)</Label>
                  <Input className="bg-white/5 border-white/10 text-white" type="number" value={form.tempo_real_meses}
                    onChange={(e) => setForm((f) => ({ ...f, tempo_real_meses: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-white/70">Valor Total</Label>
                  <Input className="bg-white/5 border-white/10 text-white" type="number" value={form.valor_total}
                    onChange={(e) => setForm((f) => ({ ...f, valor_total: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/70">Valor Pago</Label>
                  <Input className="bg-white/5 border-white/10 text-white" type="number" value={form.valor_pago}
                    onChange={(e) => setForm((f) => ({ ...f, valor_pago: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/70">Saldo Devedor</Label>
                  <Input className="bg-white/5 border-white/10 text-white" type="number" value={form.saldo_devedor}
                    onChange={(e) => setForm((f) => ({ ...f, saldo_devedor: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-white/70">Forma de Pagamento</Label>
                  <Input className="bg-white/5 border-white/10 text-white" value={form.forma_pagamento}
                    onChange={(e) => setForm((f) => ({ ...f, forma_pagamento: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/70">NPS</Label>
                  <Input className="bg-white/5 border-white/10 text-white" value={form.nps}
                    onChange={(e) => setForm((f) => ({ ...f, nps: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-white/70">Faturamento Inicial</Label>
                  <Input className="bg-white/5 border-white/10 text-white" type="number" value={form.faturamento_inicial}
                    onChange={(e) => setForm((f) => ({ ...f, faturamento_inicial: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/70">Ticket Médio</Label>
                  <Input className="bg-white/5 border-white/10 text-white" type="number" value={form.ticket_medio}
                    onChange={(e) => setForm((f) => ({ ...f, ticket_medio: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-white/70">Motivo de Saída</Label>
                <Input className="bg-white/5 border-white/10 text-white" value={form.motivo_saida}
                  onChange={(e) => setForm((f) => ({ ...f, motivo_saida: e.target.value }))} />
              </div>
              <div className="space-y-2 pt-2 border-t border-white/10">
                <Label className="text-white/70">Vínculos</Label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_cliente_educacao}
                      onChange={(e) => setForm((f) => ({ ...f, is_cliente_educacao: e.target.checked }))}
                      className="accent-orange-500" />
                    <span className="text-sm text-orange-400">Educação</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_cliente_trafego}
                      onChange={(e) => setForm((f) => ({ ...f, is_cliente_trafego: e.target.checked }))}
                      className="accent-blue-500" />
                    <span className="text-sm text-blue-400">Tráfego</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_cliente_marketplace}
                      onChange={(e) => setForm((f) => ({ ...f, is_cliente_marketplace: e.target.checked }))}
                      className="accent-purple-500" />
                    <span className="text-sm text-purple-400">Marketplace</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1 border-white/10" onClick={() => setSheetOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  onClick={handleSave}
                  disabled={createLead.isPending || updateLead.isPending}
                >
                  {editing ? 'Salvar' : 'Criar Lead'}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}
