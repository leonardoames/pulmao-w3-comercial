import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLead, useUpdateLead } from '@/hooks/useLeads';
import { useCreateCall, useUpdateCall } from '@/hooks/useCalls';
import { useCreateVenda, useUpdateVenda } from '@/hooks/useVendas';
import { useClosers } from '@/hooks/useProfiles';
import { useAuth } from '@/hooks/useAuth';
import { ORIGEM_LABELS, CALL_STATUS_LABELS, FORMA_PAGAMENTO_LABELS, VENDA_STATUS_LABELS, CallPlataforma, CallStatus, VendaFormaPagamento, VendaStatus } from '@/types/crm';
import { ArrowLeft, Phone, DollarSign, Calendar, Building, Mail, User, Instagram, MapPin, Clock, Plus, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: lead, isLoading } = useLead(id!);
  const { data: closers } = useClosers();
  const { canEdit, profile } = useAuth();
  const updateLead = useUpdateLead();
  const createCall = useCreateCall();
  const updateCall = useUpdateCall();
  const createVenda = useCreateVenda();
  const updateVenda = useUpdateVenda();

  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [vendaDialogOpen, setVendaDialogOpen] = useState(false);
  const [perdidoDialogOpen, setPerdidoDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </AppLayout>
    );
  }

  if (!lead) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Lead não encontrado</p>
        </div>
      </AppLayout>
    );
  }

  const handleCreateCall = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    await createCall.mutateAsync({
      lead_id: lead.id,
      data_hora: formData.get('data_hora') as string,
      plataforma: formData.get('plataforma') as CallPlataforma,
      link_reuniao: formData.get('link_reuniao') as string || undefined,
      closer_user_id: formData.get('closer_id') as string,
      observacoes: formData.get('observacoes') as string || undefined,
    });
    
    setCallDialogOpen(false);
  };

  const handleCreateVenda = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    await createVenda.mutateAsync({
      lead_id: lead.id,
      closer_user_id: profile?.id || '',
      data_fechamento: formData.get('data_fechamento') as string,
      plano_nome: formData.get('plano_nome') as string,
      valor_total: parseFloat(formData.get('valor_total') as string),
      entrada_valor: parseFloat(formData.get('entrada_valor') as string) || 0,
      forma_pagamento: formData.get('forma_pagamento') as VendaFormaPagamento,
      detalhes_pagamento: formData.get('detalhes_pagamento') as string || undefined,
      data_inicio: formData.get('data_inicio') as string,
      data_fim: formData.get('data_fim') as string,
      observacoes: formData.get('observacoes') as string || undefined,
    });
    
    setVendaDialogOpen(false);
  };

  const handleMarcarPerdido = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    await updateLead.mutateAsync({
      id: lead.id,
      status_funil: 'Perdido',
      motivo_perda: formData.get('motivo_perda') as string,
    });
    
    setPerdidoDialogOpen(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/leads')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Leads
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{lead.nome_pessoa}</h1>
            <StatusBadge status={lead.status_funil} type="funil" />
          </div>
          <p className="text-muted-foreground">{lead.nome_empresa}</p>
        </div>
        <div className="flex gap-2">
          {canEdit() && lead.status_funil !== 'Perdido' && lead.status_funil !== 'Ganho' && (
            <>
              <Dialog open={perdidoDialogOpen} onOpenChange={setPerdidoDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Marcar Perdido</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Marcar Lead como Perdido</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleMarcarPerdido} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="motivo_perda">Motivo da perda *</Label>
                      <Textarea id="motivo_perda" name="motivo_perda" required rows={3} />
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={() => setPerdidoDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" variant="destructive">
                        Confirmar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              
              {!lead.venda && (
                <Dialog open={vendaDialogOpen} onOpenChange={setVendaDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Registrar Venda
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Registrar Venda</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateVenda} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="plano_nome">Nome do Plano *</Label>
                          <Input id="plano_nome" name="plano_nome" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="data_fechamento">Data Fechamento *</Label>
                          <Input id="data_fechamento" name="data_fechamento" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="valor_total">Valor Total *</Label>
                          <Input id="valor_total" name="valor_total" type="number" step="0.01" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="entrada_valor">Entrada</Label>
                          <Input id="entrada_valor" name="entrada_valor" type="number" step="0.01" defaultValue="0" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="forma_pagamento">Forma de Pagamento *</Label>
                          <Select name="forma_pagamento" required defaultValue="Pix">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(FORMA_PAGAMENTO_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="detalhes_pagamento">Detalhes do Pagamento</Label>
                        <Input id="detalhes_pagamento" name="detalhes_pagamento" placeholder="Ex: 4k entrada + 10x 2k boleto" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="data_inicio">Data Início *</Label>
                          <Input id="data_inicio" name="data_inicio" type="date" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="data_fim">Data Fim *</Label>
                          <Input id="data_fim" name="data_fim" type="date" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="venda_observacoes">Observações</Label>
                        <Textarea id="venda_observacoes" name="observacoes" rows={2} />
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setVendaDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={createVenda.isPending}>
                          {createVenda.isPending ? 'Salvando...' : 'Registrar Venda'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações do Lead */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Lead</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{lead.nome_pessoa}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Empresa</p>
                    <p className="font-medium">{lead.nome_empresa}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">E-mail</p>
                    <p className="font-medium">{lead.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{lead.telefone}</p>
                  </div>
                </div>
                {lead.instagram && (
                  <div className="flex items-center gap-3">
                    <Instagram className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Instagram</p>
                      <p className="font-medium">{lead.instagram}</p>
                    </div>
                  </div>
                )}
                {(lead.cidade || lead.estado) && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Localização</p>
                      <p className="font-medium">{[lead.cidade, lead.estado].filter(Boolean).join(' - ')}</p>
                    </div>
                  </div>
                )}
              </div>
              {lead.observacoes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Observações</p>
                  <p className="text-sm">{lead.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calls */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Calls</CardTitle>
              {canEdit() && (
                <Dialog open={callDialogOpen} onOpenChange={setCallDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Call
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Agendar Nova Call</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateCall} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="data_hora">Data e Hora *</Label>
                          <Input id="data_hora" name="data_hora" type="datetime-local" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="plataforma">Plataforma *</Label>
                          <Select name="plataforma" required defaultValue="GoogleMeet">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GoogleMeet">Google Meet</SelectItem>
                              <SelectItem value="Zoom">Zoom</SelectItem>
                              <SelectItem value="Outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="link_reuniao">Link da Reunião</Label>
                        <Input id="link_reuniao" name="link_reuniao" placeholder="https://..." />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="closer_id">Closer *</Label>
                        <Select name="closer_id" required defaultValue={profile?.id}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {closers?.map(closer => (
                              <SelectItem key={closer.id} value={closer.id}>{closer.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="call_observacoes">Observações</Label>
                        <Textarea id="call_observacoes" name="observacoes" rows={2} />
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setCallDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={createCall.isPending}>
                          {createCall.isPending ? 'Salvando...' : 'Agendar Call'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {lead.calls && lead.calls.length > 0 ? (
                <div className="space-y-3">
                  {lead.calls.map(call => (
                    <div key={call.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-background">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {format(new Date(call.data_hora), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {call.plataforma} • {(call as any).closer?.nome}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={call.status} type="call" />
                        {canEdit() && call.status === 'Agendada' && (
                          <Select
                            value={call.status}
                            onValueChange={(value) => updateCall.mutate({ id: call.id, status: value as CallStatus })}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(CALL_STATUS_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma call registrada
                </p>
              )}
            </CardContent>
          </Card>

          {/* Venda */}
          {lead.venda && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-success" />
                  Venda Registrada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Plano</p>
                    <p className="font-medium">{lead.venda.plano_nome}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="font-bold text-success text-lg">{formatCurrency(lead.venda.valor_total)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Entrada</p>
                    <p className="font-medium">{formatCurrency(lead.venda.entrada_valor)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                    <p className="font-medium">{FORMA_PAGAMENTO_LABELS[lead.venda.forma_pagamento]}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Período</p>
                    <p className="font-medium">
                      {format(new Date(lead.venda.data_inicio), 'dd/MM/yy')} - {format(new Date(lead.venda.data_fim), 'dd/MM/yy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <StatusBadge status={lead.venda.status} type="venda" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Closer</p>
                    <p className="font-medium">{(lead.venda as any).closer?.nome}</p>
                  </div>
                </div>
                {lead.venda.detalhes_pagamento && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Detalhes do Pagamento</p>
                    <p className="text-sm">{lead.venda.detalhes_pagamento}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Origem</p>
                <p className="font-medium">{ORIGEM_LABELS[lead.origem]}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Closer Responsável</p>
                <p className="font-medium">{(lead.closer_responsavel as any)?.nome || '-'}</p>
              </div>
              {(lead.sdr_responsavel as any)?.nome && (
                <div>
                  <p className="text-sm text-muted-foreground">SDR</p>
                  <p className="font-medium">{(lead.sdr_responsavel as any).nome}</p>
                </div>
              )}
              {lead.cnpj && (
                <div>
                  <p className="text-sm text-muted-foreground">CNPJ</p>
                  <p className="font-medium">{lead.cnpj}</p>
                </div>
              )}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Criado em</p>
                <p className="font-medium">
                  {format(new Date(lead.criado_em), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Linha do Tempo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Linha do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm font-medium">Lead criado</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(lead.criado_em), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                {lead.calls?.map(call => (
                  <div key={call.id} className="flex gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-warning" />
                    <div>
                      <p className="text-sm font-medium">Call {CALL_STATUS_LABELS[call.status].toLowerCase()}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(call.data_hora), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
                {lead.venda && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-success" />
                    <div>
                      <p className="text-sm font-medium">Venda fechada</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(lead.venda.data_fechamento), "dd/MM/yy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
