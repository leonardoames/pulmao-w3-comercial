import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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
import { Users, UserPlus, Briefcase, DollarSign, AlertTriangle, Search, LinkIcon, RefreshCw, UserCheck, UserX, GitMerge } from 'lucide-react';
import { useRHColaboradores, useCreateColaborador, useImportClosers, useRHSetoresConfig } from '@/hooks/useRH';
import { useClosers, useProfiles } from '@/hooks/useProfiles';
import { useCurrentUserRole } from '@/hooks/useUserRoles';
import { SETOR_LABELS, STATUS_COLABORADOR_LABELS, STATUS_COLABORADOR_COLORS, TIPO_CONTRATO_LABELS, type SetorRH, type TipoContrato, type StatusColaborador } from '@/types/rh';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MERGE_FIELDS = [
  { key: 'nome', label: 'Nome' }, { key: 'email', label: 'Email' },
  { key: 'cargo', label: 'Cargo' }, { key: 'setor', label: 'Setor' },
  { key: 'cpf_cnpj', label: 'CPF/CNPJ' }, { key: 'telefone', label: 'Telefone' },
  { key: 'status', label: 'Status' }, { key: 'tipo_contrato', label: 'Contrato' },
  { key: 'data_entrada', label: 'Entrada' }, { key: 'salario', label: 'Salário' },
  { key: 'ote_comissao', label: 'OTE' }, { key: 'aniversario', label: 'Aniversário' },
  { key: 'chave_pix', label: 'Pix' }, { key: 'observacoes', label: 'Obs.' },
];

export default function RHColaboradores() {
  const navigate = useNavigate();
  const { data: colaboradores = [], isLoading, error } = useRHColaboradores();
  const { data: allClosers = [] } = useClosers();
  const { data: allProfiles = [] } = useProfiles();
  const { data: userRole } = useCurrentUserRole();
  const createColaborador = useCreateColaborador();
  const importClosers = useImportClosers();

  const isAdmin = userRole?.role === 'MASTER' || userRole?.role === 'DIRETORIA' || userRole?.role === 'GESTOR_COMERCIAL';
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [showMerge, setShowMerge] = useState(false);
  const [mergeStep, setMergeStep] = useState<1 | 2>(1);
  const [mergeAId, setMergeAId] = useState('');
  const [mergeBId, setMergeBId] = useState('');
  const [mergeSearchA, setMergeSearchA] = useState('');
  const [mergeSearchB, setMergeSearchB] = useState('');
  const [mergeChoices, setMergeChoices] = useState<Record<string, 'a' | 'b'>>({});
  const [merging, setMerging] = useState(false);
  const [quickMergeId, setQuickMergeId] = useState<string | null>(null);
  const [quickMergeSearch, setQuickMergeSearch] = useState('');
  const [filterSetor, setFilterSetor] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterContrato, setFilterContrato] = useState<string>('all');
  const [showNew, setShowNew] = useState(false);
  const [showImportReview, setShowImportReview] = useState(false);
  const [selectedClosers, setSelectedClosers] = useState<string[]>([]);

  // New colaborador form
  const [form, setForm] = useState({
    nome: '', email: '', cargo: '', setor: 'outro' as SetorRH,
    data_entrada: '', tipo_contrato: 'clt' as TipoContrato, salario: '',
    status: 'ativo' as StatusColaborador, observacoes: '',
    cpf_cnpj: '', telefone: '', aniversario: '', chave_pix: '', ote_comissao: '',
    centro_custo: [] as string[],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.nome.trim()) errors.nome = 'Nome é obrigatório.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'E-mail inválido.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const { data: setoresConfig = [] } = useRHSetoresConfig();

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

  const normalizeName = (name: string) =>
    name.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');

  const possibleDuplicates = useMemo(() => {
    const result: Record<string, { colab: typeof colaboradores[0]; reason: string }> = {};
    for (const profile of newCloserProfiles) {
      const normP = normalizeName(profile.nome);
      for (const colab of colaboradores) {
        if (colab.closer_id) continue;
        const normC = normalizeName(colab.nome);
        if (normP === normC || normP.includes(normC) || normC.includes(normP)) {
          result[profile.id] = { colab, reason: 'nome' }; break;
        }
        if (profile.email && colab.email && profile.email.toLowerCase() === colab.email.toLowerCase()) {
          result[profile.id] = { colab, reason: 'e-mail' }; break;
        }
      }
    }
    return result;
  }, [newCloserProfiles, colaboradores]);

  // Users linked to colaboradores (via user_id)
  const linkedUserIds = useMemo(
    () => new Set(colaboradores.filter(c => c.user_id).map(c => c.user_id)),
    [colaboradores]
  );

  // Profiles NOT linked to any colaborador
  const unlinkedProfiles = useMemo(
    () => allProfiles.filter(p => p.id && !linkedUserIds.has(p.id)),
    [allProfiles, linkedUserIds]
  );

  const showImportBanner = !isLoading && isAdmin && newCloserProfiles.length > 0;

  const filteredColabs = useMemo(() => {
    return colaboradores.filter(c => {
      if (search && !c.nome.toLowerCase().includes(search.toLowerCase()) && !(c.cargo || '').toLowerCase().includes(search.toLowerCase())) return false;
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
    const vinculados = colaboradores.filter(c => c.user_id).length;
    return { ativos, feriasAfastados, folha, vinculados };
  }, [colaboradores, isAdmin]);

  const handleImportAll = () => {
    if (Object.keys(possibleDuplicates).length > 0) {
      setSelectedClosers(newCloserProfiles.map(p => p.id));
      setShowImportReview(true);
      return;
    }
    importClosers.mutate(newCloserProfiles.map(p => ({ id: p.id, nome: p.nome })));
  };

  const handleImportSelected = () => {
    const selected = newCloserProfiles.filter(p => selectedClosers.includes(p.id));
    if (selected.length > 0) {
      importClosers.mutate(selected.map(p => ({ id: p.id, nome: p.nome })));
    }
    setShowImportReview(false);
  };

  const startMergeCompare = () => {
    const a = colaboradores.find(c => c.id === mergeAId)!;
    const b = colaboradores.find(c => c.id === mergeBId)!;
    const choices: Record<string, 'a' | 'b'> = {};
    MERGE_FIELDS.forEach(({ key }) => {
      if (String((a as any)[key] ?? '') !== String((b as any)[key] ?? '')) choices[key] = 'a';
    });
    setMergeChoices(choices);
    setMergeStep(2);
  };

  const handleMerge = async () => {
    const colabA = colaboradores.find(c => c.id === mergeAId)!;
    const colabB = colaboradores.find(c => c.id === mergeBId)!;
    setMerging(true);
    try {
      const merged: any = {};
      MERGE_FIELDS.forEach(({ key }) => {
        merged[key] = mergeChoices[key] === 'b' ? (colabB as any)[key] : (colabA as any)[key];
      });
      merged.closer_id = colabA.closer_id || colabB.closer_id;
      merged.user_id = colabA.user_id || colabB.user_id;
      const { error: e1 } = await supabase.from('rh_colaboradores').update(merged).eq('id', colabA.id);
      if (e1) throw e1;
      await supabase.from('rh_feedbacks').update({ colaborador_id: colabA.id } as any).eq('colaborador_id', colabB.id);
      await supabase.from('rh_avaliacoes').update({ avaliado_id: colabA.id } as any).eq('avaliado_id', colabB.id);
      const { error: e4 } = await supabase.from('rh_colaboradores').delete().eq('id', colabB.id);
      if (e4) throw e4;
      queryClient.invalidateQueries({ queryKey: ['rh-colaboradores'] });
      toast.success(`${colabB.nome} mesclado em ${colabA.nome}`);
      setShowMerge(false); setMergeStep(1); setMergeAId(''); setMergeBId(''); setMergeChoices({});
    } catch (e: any) {
      toast.error(e.message || 'Erro ao mesclar');
    } finally {
      setMerging(false);
    }
  };

  const handleCreate = () => {
    if (!validateForm()) return;
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
      cpf_cnpj: form.cpf_cnpj || null,
      telefone: form.telefone || null,
      aniversario: form.aniversario || null,
      chave_pix: form.chave_pix || null,
      ote_comissao: form.ote_comissao || null,
      centro_custo: form.centro_custo.length > 0 ? form.centro_custo : null,
    } as any, {
      onSuccess: () => {
        setShowNew(false);
        setFormErrors({});
        setForm({ nome: '', email: '', cargo: '', setor: 'outro', data_entrada: '', tipo_contrato: 'clt', salario: '', status: 'ativo', observacoes: '', cpf_cnpj: '', telefone: '', aniversario: '', chave_pix: '', ote_comissao: '', centro_custo: [] });
      },
    });
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader title="Colaboradores" description="Gestão de colaboradores da W3">
            <div className="flex gap-2">
              {isAdmin && <Button variant="outline" onClick={() => { setMergeStep(1); setShowMerge(true); }}><GitMerge className="h-4 w-4 mr-2" />Mesclar</Button>}
              {isAdmin && <Button onClick={() => setShowNew(true)} className="bg-primary hover:bg-primary/90"><UserPlus className="h-4 w-4 mr-2" />Novo Colaborador</Button>}
            </div>
          </PageHeader>
        </div>

        {/* Sync Closers Button */}
        {isAdmin && !showImportBanner && allClosers.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSelectedClosers(newCloserProfiles.map(p => p.id)); setShowImportReview(true); }}
            className="text-muted-foreground text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1.5" />
            Sincronizar closers ({allClosers.length} no sistema, {alreadyImportedCount} importados)
          </Button>
        )}

        {/* Import Banner */}
        {showImportBanner && (
          <div className="rounded-xl p-4 flex items-center justify-between gap-4" style={{ background: 'hsla(24, 94%, 53%, 0.1)', border: '1px solid hsla(24, 94%, 53%, 0.2)' }}>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">
                {allClosers.length} closers encontrados, {alreadyImportedCount} já importados, {newCloserProfiles.length} novos disponíveis
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setSelectedClosers(newCloserProfiles.map(p => p.id)); setShowImportReview(true); }}>Revisar antes</Button>
              <Button size="sm" onClick={handleImportAll} disabled={importClosers.isPending} className="bg-primary hover:bg-primary/90">Importar todos</Button>
            </div>
          </div>
        )}

        {/* Unlinked users banner */}
        {isAdmin && unlinkedProfiles.length > 0 && (
          <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: 'hsla(200, 80%, 50%, 0.08)', border: '1px solid hsla(200, 80%, 50%, 0.15)' }}>
            <UserX className="h-4 w-4 shrink-0" style={{ color: 'hsl(200, 80%, 60%)' }} />
            <span className="text-xs" style={{ color: 'hsl(200, 80%, 70%)' }}>
              <strong>{unlinkedProfiles.length}</strong> usuário{unlinkedProfiles.length !== 1 ? 's' : ''} cadastrado{unlinkedProfiles.length !== 1 ? 's' : ''} no Pulmão ainda não vinculado{unlinkedProfiles.length !== 1 ? 's' : ''} a um colaborador
            </span>
          </div>
        )}

        {/* Query error */}
        {error && (
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'hsla(0,80%,50%,0.1)', border: '1px solid hsla(0,80%,50%,0.2)', color: 'hsl(0,80%,65%)' }}>
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Erro ao carregar colaboradores</p>
              <p className="text-xs opacity-70">{(error as any).message}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Total Ativos" value={stats.ativos} icon={<Users className="h-5 w-5" />} />
          <StatCard title="Férias / Afastados" value={stats.feriasAfastados} icon={<Briefcase className="h-5 w-5" />} />
          <StatCard title="Vinculados ao Pulmão" value={stats.vinculados} icon={<UserCheck className="h-5 w-5" />} />
          <StatCard title="Usuários sem Vínculo" value={unlinkedProfiles.length} icon={<UserX className="h-5 w-5" />} />
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
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {/* Pulmão link tag */}
                {c.user_id ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'hsla(142, 71%, 45%, 0.12)', color: 'hsl(142, 71%, 55%)' }}>
                    <UserCheck className="h-3 w-3" /> Pulmão
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'hsla(0, 0%, 100%, 0.04)', color: 'hsla(0, 0%, 100%, 0.35)' }}>
                    <UserX className="h-3 w-3" /> Sem conta
                  </span>
                )}
                {c.closer_id && <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'hsla(24, 94%, 53%, 0.1)', color: 'hsl(24, 94%, 53%)' }}>🔗 Comercial</span>}
                {c.centro_custo && c.centro_custo.length > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'hsla(260, 60%, 50%, 0.1)', color: 'hsl(260, 60%, 65%)' }}>
                    {c.centro_custo.join(', ')}
                  </span>
                )}
                <div className="ml-auto flex items-center gap-1">
                  {isAdmin && (
                    <button
                      onClick={e => { e.stopPropagation(); setQuickMergeId(c.id); setQuickMergeSearch(''); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-white"
                      title="Mesclar duplicata"
                    >
                      <GitMerge className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">Ver perfil →</span>
                </div>
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
            <div>
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className={formErrors.nome ? 'border-destructive' : ''} />
              {formErrors.nome && <p className="text-xs text-destructive mt-1">{formErrors.nome}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={formErrors.email ? 'border-destructive' : ''} />
                {formErrors.email && <p className="text-xs text-destructive mt-1">{formErrors.email}</p>}
              </div>
              <div><Label>Telefone</Label><Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(00) 00000-0000" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>CPF/CNPJ</Label><Input value={form.cpf_cnpj} onChange={e => setForm(f => ({ ...f, cpf_cnpj: e.target.value }))} /></div>
              <div><Label>Cargo</Label><Input value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} /></div>
            </div>
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
            {/* Centro de Custo */}
            {setoresConfig.length > 0 && (
              <div>
                <Label>Centro de Custo</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {setoresConfig.filter(s => s.ativo).map(s => (
                    <label key={s.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer text-xs transition-all" style={{
                      background: form.centro_custo.includes(s.nome) ? `${s.cor}20` : 'hsla(0, 0%, 100%, 0.04)',
                      color: form.centro_custo.includes(s.nome) ? s.cor : 'hsla(0, 0%, 100%, 0.4)',
                      border: `1px solid ${form.centro_custo.includes(s.nome) ? `${s.cor}40` : 'transparent'}`,
                    }}>
                      <Checkbox
                        checked={form.centro_custo.includes(s.nome)}
                        onCheckedChange={() => setForm(f => ({ ...f, centro_custo: f.centro_custo.includes(s.nome) ? f.centro_custo.filter(c => c !== s.nome) : [...f.centro_custo, s.nome] }))}
                        className="h-3 w-3"
                      />
                      {s.nome}
                    </label>
                  ))}
                </div>
              </div>
            )}
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
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Aniversário</Label><Input value={form.aniversario} onChange={e => setForm(f => ({ ...f, aniversario: e.target.value }))} placeholder="DD-MMM" /></div>
              <div><Label>Chave Pix</Label><Input value={form.chave_pix} onChange={e => setForm(f => ({ ...f, chave_pix: e.target.value }))} /></div>
            </div>
            {isAdmin && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Salário</Label><Input type="number" value={form.salario} onChange={e => setForm(f => ({ ...f, salario: e.target.value }))} placeholder="R$ 0,00" /></div>
                <div><Label>OTE / Comissão</Label><Input value={form.ote_comissao} onChange={e => setForm(f => ({ ...f, ote_comissao: e.target.value }))} placeholder="Ex: R$2.500 + comissão" /></div>
              </div>
            )}
            <div><Label>Observações</Label><Input value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
            <div className="flex gap-2 pt-4">
              <Button variant="ghost" onClick={() => setShowNew(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleCreate} disabled={createColaborador.isPending} className="flex-1 bg-primary hover:bg-primary/90">Salvar</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Quick Merge Dialog — triggered from card hover button */}
      <Dialog open={!!quickMergeId} onOpenChange={open => { if (!open) { setQuickMergeId(null); setQuickMergeSearch(''); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitMerge className="h-4 w-4" />Mesclar duplicata
            </DialogTitle>
          </DialogHeader>
          {quickMergeId && (() => {
            const survivor = colaboradores.find(c => c.id === quickMergeId);
            if (!survivor) return null;
            const candidates = colaboradores.filter(c =>
              c.id !== quickMergeId &&
              (!quickMergeSearch || c.nome.toLowerCase().includes(quickMergeSearch.toLowerCase()))
            ).slice(0, 8);
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'hsla(142,71%,45%,0.1)', border: '1px solid hsla(142,71%,45%,0.2)' }}>
                  <UserCheck className="h-4 w-4 text-green-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">{survivor.nome}</p>
                    <p className="text-xs text-muted-foreground">Este registro será mantido</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Escolha o duplicado a excluir:</Label>
                  <Input
                    placeholder="Buscar por nome..."
                    value={quickMergeSearch}
                    onChange={e => setQuickMergeSearch(e.target.value)}
                    autoFocus
                  />
                  <div className="max-h-52 overflow-y-auto space-y-0.5 rounded-lg border border-white/10 p-1">
                    {candidates.length === 0 ? (
                      <p className="text-xs text-muted-foreground px-2 py-3 text-center">Nenhum resultado.</p>
                    ) : candidates.map(c => (
                      <button
                        key={c.id}
                        disabled={merging}
                        onClick={async () => {
                          setMerging(true);
                          try {
                            const merged: any = {};
                            MERGE_FIELDS.forEach(({ key }) => { merged[key] = (survivor as any)[key]; });
                            merged.closer_id = survivor.closer_id || c.closer_id;
                            merged.user_id = survivor.user_id || c.user_id;
                            const { error: e1 } = await supabase.from('rh_colaboradores').update(merged).eq('id', survivor.id);
                            if (e1) throw e1;
                            await supabase.from('rh_feedbacks').update({ colaborador_id: survivor.id } as any).eq('colaborador_id', c.id);
                            await supabase.from('rh_avaliacoes').update({ avaliado_id: survivor.id } as any).eq('avaliado_id', c.id);
                            const { error: e4 } = await supabase.from('rh_colaboradores').delete().eq('id', c.id);
                            if (e4) throw e4;
                            queryClient.invalidateQueries({ queryKey: ['rh-colaboradores'] });
                            toast.success(`${c.nome} mesclado em ${survivor.nome}`);
                            setQuickMergeId(null); setQuickMergeSearch('');
                          } catch (e: any) {
                            toast.error(e.message || 'Erro ao mesclar');
                          } finally {
                            setMerging(false);
                          }
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-lg text-sm hover:bg-destructive/15 hover:text-red-300 transition-colors flex items-center justify-between disabled:opacity-50"
                      >
                        <span>{c.nome}</span>
                        <span className="text-xs text-muted-foreground">{c.cargo} · {SETOR_LABELS[c.setor as keyof typeof SETOR_LABELS] || c.setor}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Feedbacks e avaliações do duplicado migram para o registro mantido.</p>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Merge Dialog */}
      <Dialog open={showMerge} onOpenChange={open => { setShowMerge(open); if (!open) { setMergeStep(1); setMergeAId(''); setMergeBId(''); setMergeChoices({}); } }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitMerge className="h-5 w-5" />
              {mergeStep === 1 ? 'Selecionar duplicatas' : 'Comparar e mesclar'}
            </DialogTitle>
          </DialogHeader>

          {mergeStep === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Selecione dois colaboradores. O <strong>A</strong> sobrevive (ID mantido), o <strong>B</strong> é excluído. Feedbacks e avaliações do B migram para o A.</p>
              <div className="grid grid-cols-2 gap-4">
                {/* Colab A */}
                <div className="space-y-2">
                  <Label className="text-green-400">A — Manter</Label>
                  <Input placeholder="Buscar..." value={mergeSearchA} onChange={e => setMergeSearchA(e.target.value)} />
                  <div className="max-h-48 overflow-y-auto space-y-0.5 rounded-lg border border-white/10 p-1">
                    {colaboradores.filter(c => c.id !== mergeBId && (!mergeSearchA || c.nome.toLowerCase().includes(mergeSearchA.toLowerCase()))).slice(0, 10).map(c => (
                      <button key={c.id} onClick={() => setMergeAId(c.id)}
                        className={`w-full text-left text-sm px-2 py-1.5 rounded transition-colors ${mergeAId === c.id ? 'bg-green-500/20 text-green-300' : 'hover:bg-white/5'}`}>
                        {c.nome}
                        <span className="text-[10px] text-muted-foreground ml-1">{c.cargo}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {/* Colab B */}
                <div className="space-y-2">
                  <Label className="text-destructive">B — Excluir</Label>
                  <Input placeholder="Buscar..." value={mergeSearchB} onChange={e => setMergeSearchB(e.target.value)} />
                  <div className="max-h-48 overflow-y-auto space-y-0.5 rounded-lg border border-white/10 p-1">
                    {colaboradores.filter(c => c.id !== mergeAId && (!mergeSearchB || c.nome.toLowerCase().includes(mergeSearchB.toLowerCase()))).slice(0, 10).map(c => (
                      <button key={c.id} onClick={() => setMergeBId(c.id)}
                        className={`w-full text-left text-sm px-2 py-1.5 rounded transition-colors ${mergeBId === c.id ? 'bg-destructive/20 text-red-300' : 'hover:bg-white/5'}`}>
                        {c.nome}
                        <span className="text-[10px] text-muted-foreground ml-1">{c.cargo}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setShowMerge(false)}>Cancelar</Button>
                <Button onClick={startMergeCompare} disabled={!mergeAId || !mergeBId || mergeAId === mergeBId} className="bg-primary hover:bg-primary/90">
                  Comparar campos →
                </Button>
              </DialogFooter>
            </div>
          )}

          {mergeStep === 2 && (() => {
            const colabA = colaboradores.find(c => c.id === mergeAId)!;
            const colabB = colaboradores.find(c => c.id === mergeBId)!;
            if (!colabA || !colabB) return null;
            const diffFields = MERGE_FIELDS.filter(({ key }) => String((colabA as any)[key] ?? '') !== String((colabB as any)[key] ?? '') && ((colabA as any)[key] || (colabB as any)[key]));
            const sameFields = MERGE_FIELDS.filter(({ key }) => String((colabA as any)[key] ?? '') === String((colabB as any)[key] ?? '') && (colabA as any)[key]);
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-3 text-[11px] font-semibold text-muted-foreground px-2">
                  <span>Campo</span>
                  <span className="text-green-400">A — {colabA.nome}</span>
                  <span className="text-red-400">B — {colabB.nome}</span>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {diffFields.map(({ key, label }) => (
                    <div key={key} className="grid grid-cols-3 items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: 'hsla(0,0%,100%,0.03)' }}>
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <button onClick={() => setMergeChoices(c => ({ ...c, [key]: 'a' }))}
                        className={`text-left text-xs px-2 py-1 rounded transition-colors truncate ${mergeChoices[key] !== 'b' ? 'bg-green-500/20 text-green-300 ring-1 ring-green-500/40' : 'text-muted-foreground hover:bg-white/5'}`}>
                        {String((colabA as any)[key] ?? '—')}
                      </button>
                      <button onClick={() => setMergeChoices(c => ({ ...c, [key]: 'b' }))}
                        className={`text-left text-xs px-2 py-1 rounded transition-colors truncate ${mergeChoices[key] === 'b' ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/40' : 'text-muted-foreground hover:bg-white/5'}`}>
                        {String((colabB as any)[key] ?? '—')}
                      </button>
                    </div>
                  ))}
                  {sameFields.length > 0 && (
                    <div className="px-2 pt-2 pb-1 text-[11px] text-muted-foreground">Campos iguais (mantidos): {sameFields.map(f => f.label).join(', ')}</div>
                  )}
                  <div className="px-2 py-1.5 rounded-lg text-xs" style={{ background: 'hsla(200,80%,50%,0.08)', color: 'hsl(200,80%,65%)' }}>
                    Vínculos auto-mesclados: closer_id={String(colabA.closer_id || colabB.closer_id || '—')}, user_id={String(colabA.user_id || colabB.user_id || '—')}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setMergeStep(1)}>← Voltar</Button>
                  <Button onClick={handleMerge} disabled={merging} className="bg-destructive hover:bg-destructive/90">
                    {merging ? 'Mesclando...' : `Mesclar (excluir ${colabB.nome})`}
                  </Button>
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Import Review Dialog */}
      <Dialog open={showImportReview} onOpenChange={setShowImportReview}>
        <DialogContent>
          <DialogHeader><DialogTitle>Revisar Closers</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {Object.keys(possibleDuplicates).length > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: 'hsla(38,92%,50%,0.1)', border: '1px solid hsla(38,92%,50%,0.2)', color: 'hsl(38,92%,60%)' }}>
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span><strong>{Object.keys(possibleDuplicates).length}</strong> possível{Object.keys(possibleDuplicates).length !== 1 ? 'is duplicatas detectadas' : ' duplicata detectada'}. Desmarque antes de importar.</span>
              </div>
            )}
            {/* Already imported (grayed out) */}
            {allClosers.filter(p => importedCloserIds.has(p.id)).map(p => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg opacity-50">
                <Checkbox checked disabled />
                <span className="text-sm">{p.nome}</span>
                <span className="text-[10px] ml-auto px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>Já importado</span>
              </div>
            ))}
            {/* New closers */}
            {newCloserProfiles.map(p => (
              <label key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                <Checkbox checked={selectedClosers.includes(p.id)} onCheckedChange={checked => {
                  setSelectedClosers(prev => checked ? [...prev, p.id] : prev.filter(id => id !== p.id));
                }} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm">{p.nome}</span>
                  {possibleDuplicates[p.id] && (
                    <p className="text-[11px]" style={{ color: 'hsl(38,92%,60%)' }}>
                      ⚠ Duplicata por {possibleDuplicates[p.id].reason}: "{possibleDuplicates[p.id].colab.nome}"
                    </p>
                  )}
                </div>
                <span className="text-[10px] shrink-0 px-2 py-0.5 rounded-full" style={{ background: 'rgba(249,115,22,0.15)', color: '#F97316' }}>Novo</span>
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
