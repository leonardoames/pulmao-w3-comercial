import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLeads, useCreateLead } from '@/hooks/useLeads';
import { useClosers, useSDRs } from '@/hooks/useProfiles';
import { useAuth } from '@/hooks/useAuth';
import { LeadStatusFunil, LeadOrigem, ORIGEM_LABELS, STATUS_FUNIL_LABELS } from '@/types/crm';
import { Plus, Search, LayoutGrid, List, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const FUNIL_ORDER: LeadStatusFunil[] = ['Novo', 'ContatoFeito', 'CallAgendada', 'CallRealizada', 'NoShow', 'Perdido', 'Ganho'];

export default function LeadsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [origemFilter, setOrigemFilter] = useState<string>('all');
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { data: leads, isLoading } = useLeads();
  const { data: closers } = useClosers();
  const { data: sdrs } = useSDRs();
  const createLead = useCreateLead();
  const { canEdit } = useAuth();

  const filteredLeads = leads?.filter(lead => {
    const matchesSearch = 
      lead.nome_pessoa.toLowerCase().includes(search.toLowerCase()) ||
      lead.nome_empresa.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status_funil === statusFilter;
    const matchesOrigem = origemFilter === 'all' || lead.origem === origemFilter;
    
    return matchesSearch && matchesStatus && matchesOrigem;
  });

  const handleCreateLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    await createLead.mutateAsync({
      nome_pessoa: formData.get('nome_pessoa') as string,
      telefone: formData.get('telefone') as string,
      email: formData.get('email') as string,
      instagram: formData.get('instagram') as string || undefined,
      nome_empresa: formData.get('nome_empresa') as string,
      cnpj: formData.get('cnpj') as string || undefined,
      cidade: formData.get('cidade') as string || undefined,
      estado: formData.get('estado') as string || undefined,
      origem: formData.get('origem') as LeadOrigem,
      closer_responsavel_user_id: formData.get('closer_id') as string || undefined,
      sdr_responsavel_user_id: formData.get('sdr_id') as string || undefined,
      observacoes: formData.get('observacoes') as string || undefined,
    });
    
    setDialogOpen(false);
  };

  return (
    <AppLayout>
      <PageHeader title="Leads" description="Gerencie todos os leads do comercial">
        {canEdit() && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Lead</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateLead} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome_pessoa">Nome da Pessoa *</Label>
                    <Input id="nome_pessoa" name="nome_pessoa" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nome_empresa">Nome da Empresa *</Label>
                    <Input id="nome_empresa" name="nome_empresa" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input id="telefone" name="telefone" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input id="instagram" name="instagram" placeholder="@usuario" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input id="cnpj" name="cnpj" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input id="cidade" name="cidade" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Input id="estado" name="estado" placeholder="SP" maxLength={2} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="origem">Origem *</Label>
                    <Select name="origem" required defaultValue="Formulario">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ORIGEM_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="closer_id">Closer</Label>
                    <Select name="closer_id">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {closers?.map(closer => (
                          <SelectItem key={closer.id} value={closer.id}>{closer.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sdr_id">SDR</Label>
                    <Select name="sdr_id">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sdrs?.map(sdr => (
                          <SelectItem key={sdr.id} value={sdr.id}>{sdr.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea id="observacoes" name="observacoes" rows={3} />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createLead.isPending}>
                    {createLead.isPending ? 'Salvando...' : 'Salvar Lead'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(STATUS_FUNIL_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={origemFilter} onValueChange={setOrigemFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as origens</SelectItem>
            {Object.entries(ORIGEM_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <Button
            variant={view === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('table')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('kanban')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Closer</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredLeads?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum lead encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads?.map(lead => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{lead.nome_pessoa}</p>
                          <p className="text-sm text-muted-foreground">{lead.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{lead.nome_empresa}</TableCell>
                      <TableCell>
                        <span className="text-sm">{ORIGEM_LABELS[lead.origem]}</span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={lead.status_funil} type="funil" />
                      </TableCell>
                      <TableCell>
                        {(lead.closer_responsavel as any)?.nome || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(lead.criado_em), 'dd/MM/yy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Link to={`/leads/${lead.id}`}>
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {FUNIL_ORDER.map(status => {
            const statusLeads = filteredLeads?.filter(l => l.status_funil === status) || [];
            return (
              <div key={status} className="kanban-column">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-sm">{STATUS_FUNIL_LABELS[status]}</h3>
                  <span className="text-xs bg-background px-2 py-1 rounded-full">
                    {statusLeads.length}
                  </span>
                </div>
                <div className="space-y-2 flex-1">
                  {statusLeads.map(lead => (
                    <Link key={lead.id} to={`/leads/${lead.id}`}>
                      <div className="kanban-card">
                        <p className="font-medium text-sm">{lead.nome_pessoa}</p>
                        <p className="text-xs text-muted-foreground mt-1">{lead.nome_empresa}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-muted-foreground">
                            {ORIGEM_LABELS[lead.origem]}
                          </span>
                          {(lead.closer_responsavel as any)?.nome && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">
                              {(lead.closer_responsavel as any).nome.split(' ')[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
