import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatCard } from '@/components/ui/stat-card';
import { Users, UserPlus, Briefcase, DollarSign, AlertTriangle, Search, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { useRHColaboradores, useCreateColaborador, useImportClosers } from '@/hooks/useRH';
import { useClosers } from '@/hooks/useProfiles';
import { useCurrentUserRole } from '@/hooks/useUserRoles';
import { SETOR_LABELS, STATUS_COLABORADOR_LABELS, STATUS_COLABORADOR_COLORS, TIPO_CONTRATO_LABELS, type SetorRH, type TipoContrato, type StatusColaborador } from '@/types/rh';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RHColaboradores() {
  const navigate = useNavigate();
  const { data: colaboradores = [], isLoading } = useRHColaboradores();
  const { data: allClosers = [] } = useClosers();
  const { data: userRole } = useCurrentUserRole();
  const createColaborador = useCreateColaborador();
  const importClosers = useImportClosers();

  const isAdmin = userRole?.role === 'MASTER' || userRole?.role === 'DIRETORIA' || userRole?.role === 'GESTOR_COMERCIAL';

  const [search, setSearch] = useState('');
  const [filterSetor, setFilterSetor] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterContrato, setFilterContrato] = useState<string>('all');
  const [showNew, setShowNew] = useState(false);
  const [showImportReview, setShowImportReview] = useState(false);
  const [selectedClosers, setSelectedClosers] = useState<string[]>([]);
  const [showSyncButton, setShowSyncButton] = useState(false);

  // New colaborador form
  const [form, setForm] = useState({
    nome: '', email: '', cargo: '', setor: 'outro' as SetorRH,
    data_entrada: '', tipo_contrato: 'clt' as TipoContrato, salario: '',
    status: 'ativo' as StatusColaborador, observacoes: '',
  });

  // Closers already imported
  const importedCloserIds = useMemo(
    () => new Set(colaboradores.filter(c => c.closer_id).map(c => c.closer_id)),
    [colaboradores]
  );

  // Closers not yet imported
  const newCloserProfiles = useMemo(
    () => allClosers.filter(p => !importedCloserIds.has(p.id)),
    [allClosers, importedCloserIds]
  );

  const alreadyImportedCount = useMemo(
    () => allClosers.filter(p => importedCloserIds.has(p.id)).length,
    [allClosers, importedCloserIds]
  );

  const showImportBanner = !isLoading && isAdmin && newCloserProfiles.length > 0;

  const filteredColabs = useMemo(() => {
    return colaboradores.filter(c => {
      if (search && !c.nome.toLowerCase().includes(search.toLowerCase()) && !c.cargo.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterSetor !== 'all' && c.setor !== filterSetor) return false;
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (filterContrato !== 'all' && c.tipo_contrato !== filterContrato) return false;
      return true;
    });
  }, [colaboradores, search, filterSetor, filterStatus, filterContrato]);

  const stats = useMemo(() => {
    const ativos = colaboradores.filter(c => c.status === 'ativo').length;
    const feriasAfastados = colaboradores.filter(c => c.status === 'ferias' || c.status === 'afastado').length;
    const folha = isAdmin ? colaboradores.reduce((s, c) => s + (c.salario || 0), 0) : null;
    return { ativos, feriasAfastados, folha };
  }, [colaboradores, isAdmin]);

  const handleImportAll = () => {
    importClosers.mutate(newCloserProfiles.map(p => ({ id: p.id, nome: p.nome })));
  };

  const handleImportSelected = () => {
    const selected = newCloserProfiles.filter(p => selectedClosers.includes(p.id));
    if (selected.length > 0) {
      importClosers.mutate(selected.map(p => ({ id: p.id, nome: p.nome })));
    }
    setShowImportReview(false);
  };

  const handleCreate = () => {
    createColaborador.mutate({
      nome: form.nome,
      email: form.email || null,
      cargo: form.cargo,
      setor: form.setor,
      data_entrada: form.data_entrada || null,
      tipo_contrato: form.tipo_contrato,
      salario: form.salario ? parseFloat(form.salario) : null,
      status: form.status,
      observacoes: form.observacoes || null,
    } as any, {
      onSuccess: () => {
        setShowNew(false);
        setForm({ nome: '', email: '', cargo: '', setor: 'outro', data_entrada: '', tipo_contrato: 'clt', salario: '', status: 'ativo', observacoes: '' });
      },
    });
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <PageHeader title="Colaboradores" description="Gestão de colaboradores da W3">
          {isAdmin && <Button onClick={() => setShowNew(true)} className="bg-primary hover:bg-primary/90"><UserPlus className="h-4 w-4 mr-2" />Novo Colaborador</Button>}
        </PageHeader>

        {/* Import Banner */}
        {showImportBanner && (
          <div className="rounded-xl p-4 flex items-center justify-between gap-4" style={{ background: 'hsla(24, 94%, 53%, 0.1)', border: '1px solid hsla(24, 94%, 53%, 0.2)' }}>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{closerProfiles.length} closers encontrados no sistema. Importar automaticamente como colaboradores?</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setSelectedClosers(closerProfiles.map(p => p.id)); setShowImportReview(true); }}>Revisar antes</Button>
              <Button size="sm" onClick={handleImportAll} disabled={importClosers.isPending} className="bg-primary hover:bg-primary/90">Importar todos</Button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Ativos" value={stats.ativos} icon={<Users className="h-5 w-5" />} />
          <StatCard title="Férias / Afastados" value={stats.feriasAfastados} icon={<Briefcase className="h-5 w-5" />} />
          <StatCard title="Sem Avaliação Recente" value="—" icon={<AlertTriangle className="h-5 w-5" />} />
          <StatCard title="Folha Salarial" value={stats.folha !== null ? `R$ ${stats.folha.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'} icon={<DollarSign className="h-5 w-5" />} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou cargo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterSetor} onValueChange={setFilterSetor}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Setor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Setores</SelectItem>
              {Object.entries(SETOR_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(STATUS_COLABORADOR_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterContrato} onValueChange={setFilterContrato}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Contrato" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(TIPO_CONTRATO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredColabs.map(c => (
            <div key={c.id} className="rounded-xl p-5 transition-all duration-150 cursor-pointer group" style={{ background: 'hsl(0, 0%, 9%)', border: '1px solid hsla(0, 0%, 100%, 0.07)' }}
              onClick={() => navigate(`/rh/colaboradores/${c.id}`)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'hsla(24, 94%, 53%, 0.2)'; e.currentTarget.style.boxShadow = '0 0 0 1px hsla(24, 94%, 53%, 0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'hsla(0, 0%, 100%, 0.07)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={c.foto_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">{c.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ borderColor: 'hsl(0, 0%, 9%)', background: STATUS_COLABORADOR_COLORS[c.status as keyof typeof STATUS_COLABORADOR_COLORS] || '#6B7280' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold truncate">{c.nome}</p>
                  <p className="text-xs" style={{ color: 'hsla(0, 0%, 100%, 0.5)' }}>{c.cargo} · {SETOR_LABELS[c.setor as keyof typeof SETOR_LABELS] || c.setor}</p>
                  {c.data_entrada && <p className="text-[11px] mt-1" style={{ color: 'hsla(0, 0%, 100%, 0.3)' }}>desde {format(new Date(c.data_entrada + 'T12:00:00'), "dd/MMM/yyyy", { locale: ptBR })}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                {c.closer_id && <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'hsla(24, 94%, 53%, 0.1)', color: 'hsl(24, 94%, 53%)' }}>🔗 Comercial</span>}
                <span className="text-xs text-primary ml-auto opacity-0 group-hover:opacity-100 transition-opacity">Ver perfil →</span>
              </div>
            </div>
          ))}
        </div>
        {!isLoading && filteredColabs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Nenhum colaborador encontrado.</div>
        )}
      </div>

      {/* New Colaborador Sheet */}
      <Sheet open={showNew} onOpenChange={setShowNew}>
        <SheetContent className="w-full sm:max-w-[520px] overflow-y-auto">
          <SheetHeader><SheetTitle>Novo Colaborador</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-4">
            <div><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><Label>Cargo</Label><Input value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Setor</Label>
                <Select value={form.setor} onValueChange={v => setForm(f => ({ ...f, setor: v as SetorRH }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(SETOR_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo Contrato</Label>
                <Select value={form.tipo_contrato} onValueChange={v => setForm(f => ({ ...f, tipo_contrato: v as TipoContrato }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(TIPO_CONTRATO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Data de Entrada</Label><Input type="date" value={form.data_entrada} onChange={e => setForm(f => ({ ...f, data_entrada: e.target.value }))} /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as StatusColaborador }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(STATUS_COLABORADOR_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {isAdmin && <div><Label>Salário</Label><Input type="number" value={form.salario} onChange={e => setForm(f => ({ ...f, salario: e.target.value }))} placeholder="R$ 0,00" /></div>}
            <div><Label>Observações</Label><Input value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
            <div className="flex gap-2 pt-4">
              <Button variant="ghost" onClick={() => setShowNew(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleCreate} disabled={!form.nome || createColaborador.isPending} className="flex-1 bg-primary hover:bg-primary/90">Salvar</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Import Review Dialog */}
      <Dialog open={showImportReview} onOpenChange={setShowImportReview}>
        <DialogContent>
          <DialogHeader><DialogTitle>Revisar Closers para Importar</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {closerProfiles.map(p => (
              <label key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                <Checkbox checked={selectedClosers.includes(p.id)} onCheckedChange={checked => {
                  setSelectedClosers(prev => checked ? [...prev, p.id] : prev.filter(id => id !== p.id));
                }} />
                <span className="text-sm">{p.nome}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowImportReview(false)}>Cancelar</Button>
            <Button onClick={handleImportSelected} disabled={selectedClosers.length === 0 || importClosers.isPending} className="bg-primary hover:bg-primary/90">Importar selecionados ({selectedClosers.length})</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
