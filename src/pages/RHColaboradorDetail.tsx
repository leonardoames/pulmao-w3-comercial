import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Pencil, Save, X, LinkIcon, Star, Phone, CreditCard, Calendar, Gift, UserCheck, UserX, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useRHColaborador, useUpdateColaborador, useFeedbacksByColaborador, useAvaliacoesByColaborador, useRHSetoresConfig } from '@/hooks/useRH';
import { useProfiles } from '@/hooks/useProfiles';
import { useCurrentUserRole } from '@/hooks/useUserRoles';
import { SETOR_LABELS, STATUS_COLABORADOR_LABELS, STATUS_COLABORADOR_COLORS, TIPO_CONTRATO_LABELS, TIPO_FEEDBACK_COLORS, TIPO_FEEDBACK_LABELS, type SetorRH, type TipoContrato, type StatusColaborador } from '@/types/rh';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RHColaboradorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: colab, isLoading, error } = useRHColaborador(id);
  const { data: feedbacks = [] } = useFeedbacksByColaborador(id);
  const { data: avaliacoes = [] } = useAvaliacoesByColaborador(id);
  const { data: setoresConfig = [] } = useRHSetoresConfig();
  const updateColaborador = useUpdateColaborador();
  const { data: userRole } = useCurrentUserRole();
  const isAdmin = userRole?.role === 'MASTER' || userRole?.role === 'DIRETORIA' || userRole?.role === 'GESTOR_COMERCIAL';

  const { data: profiles = [] } = useProfiles();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [linkingUser, setLinkingUser] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const toggleReveal = (key: string) =>
    setRevealed(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const renderSensitive = (displayValue: string | null, key: string) => {
    if (!isAdmin) return null;
    const shown = revealed.has(key);
    return (
      <span className="inline-flex items-center gap-1">
        <span className={shown ? '' : 'tracking-widest'}>{shown ? (displayValue || '—') : (displayValue ? '•••••••' : '—')}</span>
        {displayValue && (
          <button onClick={() => toggleReveal(key)} className="text-muted-foreground hover:text-foreground transition-colors ml-0.5">
            {shown ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </button>
        )}
      </span>
    );
  };

  if (isLoading) {
    return <AppLayout><div className="p-6 flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></AppLayout>;
  }

  if (error || !colab) {
    return (
      <AppLayout>
        <div className="p-6 space-y-4 max-w-4xl">
          <Button variant="ghost" onClick={() => navigate('/rh/colaboradores')} className="gap-2 text-muted-foreground"><ArrowLeft className="h-4 w-4" />Voltar</Button>
          <div className="rounded-xl p-5 flex items-center gap-3" style={{ background: 'hsla(0,80%,50%,0.1)', border: '1px solid hsla(0,80%,50%,0.2)', color: 'hsl(0,80%,65%)' }}>
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-medium">{error ? 'Erro ao carregar colaborador' : 'Colaborador não encontrado'}</p>
              {error && <p className="text-xs opacity-70">{(error as any).message}</p>}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const startEdit = () => {
    setForm({ ...colab });
    setFormErrors({});
    setEditing(true);
  };

  const saveEdit = () => {
    const errors: Record<string, string> = {};
    if (!form.nome?.trim()) errors.nome = 'Nome é obrigatório.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'E-mail inválido.';
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    updateColaborador.mutate({ id: colab.id, ...form }, { onSuccess: () => setEditing(false) });
  };

  const avgScore = (av: any) => {
    const scores = [av.nota_resultado, av.nota_atitude, av.nota_colaboracao, av.nota_desenvolvimento].filter(Boolean);
    return scores.length ? (scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1) : '—';
  };

  const toggleCentroCusto = (nome: string) => {
    setForm((f: any) => {
      const current = f.centro_custo || [];
      return { ...f, centro_custo: current.includes(nome) ? current.filter((c: string) => c !== nome) : [...current, nome] };
    });
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/rh/colaboradores')} className="gap-2 text-muted-foreground"><ArrowLeft className="h-4 w-4" />Voltar</Button>

        {/* Header */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={colab.foto_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">{colab.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{colab.nome}</h1>
              <div className="w-3 h-3 rounded-full" style={{ background: STATUS_COLABORADOR_COLORS[colab.status as keyof typeof STATUS_COLABORADOR_COLORS] }} />
              {colab.closer_id && <Badge variant="outline" className="text-xs gap-1"><LinkIcon className="h-3 w-3" />Closer vinculado</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{colab.cargo} · {SETOR_LABELS[colab.setor as keyof typeof SETOR_LABELS] || colab.setor}</p>
            {colab.centro_custo && colab.centro_custo.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {colab.centro_custo.map(cc => (
                  <span key={cc} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'hsla(0, 0%, 100%, 0.06)', color: 'hsla(0, 0%, 100%, 0.5)' }}>{cc}</span>
                ))}
              </div>
            )}
          </div>
          {isAdmin && !editing && <Button variant="outline" size="sm" onClick={startEdit}><Pencil className="h-4 w-4 mr-1" />Editar</Button>}
          {isAdmin && !editing && colab.status === 'ativo' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/40 hover:bg-destructive/10">
                  <UserX className="h-4 w-4 mr-1" />Inativar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Inativar colaborador?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {colab.nome} será marcado como inativo. O histórico de feedbacks e avaliações é preservado.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive hover:bg-destructive/90"
                    onClick={() => updateColaborador.mutate({ id: colab.id, status: 'inativo' })}>
                    Inativar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {isAdmin && !editing && colab.status === 'inativo' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-green-500 border-green-500/40 hover:bg-green-500/10">
                  <UserCheck className="h-4 w-4 mr-1" />Reativar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reativar colaborador?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {colab.nome} voltará ao status ativo.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction className="bg-green-600 hover:bg-green-700"
                    onClick={() => updateColaborador.mutate({ id: colab.id, status: 'ativo' })}>
                    Reativar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Dados Pessoais */}
        <section className="rounded-xl p-5 space-y-4" style={{ background: 'hsl(0, 0%, 9%)', border: '1px solid hsla(0, 0%, 100%, 0.07)' }}>
          <h2 className="text-lg font-semibold">Dados Pessoais</h2>
          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nome *</Label>
                  <Input value={form.nome || ''} onChange={e => setForm((f: any) => ({ ...f, nome: e.target.value }))} className={formErrors.nome ? 'border-destructive' : ''} />
                  {formErrors.nome && <p className="text-xs text-destructive mt-1">{formErrors.nome}</p>}
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={form.email || ''} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} className={formErrors.email ? 'border-destructive' : ''} />
                  {formErrors.email && <p className="text-xs text-destructive mt-1">{formErrors.email}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>CPF/CNPJ</Label><Input value={form.cpf_cnpj || ''} onChange={e => setForm((f: any) => ({ ...f, cpf_cnpj: e.target.value }))} placeholder="000.000.000-00" /></div>
                <div><Label>Telefone</Label><Input value={form.telefone || ''} onChange={e => setForm((f: any) => ({ ...f, telefone: e.target.value }))} placeholder="(00) 00000-0000" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Cargo</Label><Input value={form.cargo || ''} onChange={e => setForm((f: any) => ({ ...f, cargo: e.target.value }))} /></div>
                <div><Label>Setor</Label>
                  <Select value={form.setor} onValueChange={v => setForm((f: any) => ({ ...f, setor: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(SETOR_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              {/* Centro de Custo multi-select */}
              {setoresConfig.length > 0 && (
                <div>
                  <Label>Centro de Custo</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {setoresConfig.filter(s => s.ativo).map(s => (
                      <label key={s.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer text-xs transition-all" style={{
                        background: (form.centro_custo || []).includes(s.nome) ? `${s.cor}20` : 'hsla(0, 0%, 100%, 0.04)',
                        color: (form.centro_custo || []).includes(s.nome) ? s.cor : 'hsla(0, 0%, 100%, 0.4)',
                        border: `1px solid ${(form.centro_custo || []).includes(s.nome) ? `${s.cor}40` : 'transparent'}`,
                      }}>
                        <Checkbox
                          checked={(form.centro_custo || []).includes(s.nome)}
                          onCheckedChange={() => toggleCentroCusto(s.nome)}
                          className="h-3 w-3"
                        />
                        {s.nome}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Data Entrada</Label><Input type="date" value={form.data_entrada || ''} onChange={e => setForm((f: any) => ({ ...f, data_entrada: e.target.value }))} /></div>
                <div><Label>Data Término</Label><Input type="date" value={form.data_termino || ''} onChange={e => setForm((f: any) => ({ ...f, data_termino: e.target.value }))} /></div>
                <div><Label>Tipo Contrato</Label>
                  <Select value={form.tipo_contrato} onValueChange={v => setForm((f: any) => ({ ...f, tipo_contrato: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(TIPO_CONTRATO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm((f: any) => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(STATUS_COLABORADOR_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Aniversário</Label><Input value={form.aniversario || ''} onChange={e => setForm((f: any) => ({ ...f, aniversario: e.target.value }))} placeholder="DD-MMM" /></div>
                <div><Label>Chave Pix</Label><Input value={form.chave_pix || ''} onChange={e => setForm((f: any) => ({ ...f, chave_pix: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {isAdmin && <div><Label>Salário</Label><Input type="number" value={form.salario || ''} onChange={e => setForm((f: any) => ({ ...f, salario: e.target.value ? parseFloat(e.target.value) : null }))} /></div>}
                {isAdmin && <div><Label>OTE / Comissão</Label><Input value={form.ote_comissao || ''} onChange={e => setForm((f: any) => ({ ...f, ote_comissao: e.target.value }))} placeholder="Ex: R$2.500 + comissão" /></div>}
              </div>
              <div><Label>Observações</Label><Textarea value={form.observacoes || ''} onChange={e => setForm((f: any) => ({ ...f, observacoes: e.target.value }))} /></div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setEditing(false)}><X className="h-4 w-4 mr-1" />Cancelar</Button>
                <Button onClick={saveEdit} disabled={updateColaborador.isPending} className="bg-primary hover:bg-primary/90"><Save className="h-4 w-4 mr-1" />Salvar</Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Email:</span> <span>{colab.email || '—'}</span></div>
              <div><span className="text-muted-foreground">Cargo:</span> <span>{colab.cargo || '—'}</span></div>
              {isAdmin && <div><span className="text-muted-foreground">CPF/CNPJ:</span> {renderSensitive(colab.cpf_cnpj, 'cpf_cnpj')}</div>}
              {isAdmin && <div className="flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Telefone:</span> <span className="ml-1">{renderSensitive(colab.telefone, 'telefone')}</span></div>}
              <div><span className="text-muted-foreground">Setor:</span> <span>{SETOR_LABELS[colab.setor as keyof typeof SETOR_LABELS] || colab.setor}</span></div>
              <div><span className="text-muted-foreground">Contrato:</span> <span>{TIPO_CONTRATO_LABELS[colab.tipo_contrato as keyof typeof TIPO_CONTRATO_LABELS] || colab.tipo_contrato}</span></div>
              <div><span className="text-muted-foreground">Data Entrada:</span> <span>{colab.data_entrada ? format(new Date(colab.data_entrada + 'T12:00:00'), 'dd/MM/yyyy') : '—'}</span></div>
              <div><span className="text-muted-foreground">Data Término:</span> <span>{colab.data_termino ? format(new Date(colab.data_termino + 'T12:00:00'), 'dd/MM/yyyy') : '—'}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <span>{STATUS_COLABORADOR_LABELS[colab.status as keyof typeof STATUS_COLABORADOR_LABELS]}</span></div>
              <div className="flex items-center gap-1"><Gift className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Aniversário:</span> <span>{colab.aniversario || '—'}</span></div>
              {isAdmin && <div><span className="text-muted-foreground">Salário:</span> {renderSensitive(colab.salario ? `R$ ${colab.salario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null, 'salario')}</div>}
              {isAdmin && <div><span className="text-muted-foreground">OTE/Comissão:</span> {renderSensitive(colab.ote_comissao, 'ote_comissao')}</div>}
              {isAdmin && <div className="flex items-center gap-1"><CreditCard className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Chave Pix:</span> <span className="ml-1">{renderSensitive(colab.chave_pix, 'chave_pix')}</span></div>}
              {colab.centro_custo && colab.centro_custo.length > 0 && (
                <div className="col-span-2"><span className="text-muted-foreground">Centro de Custo:</span> <span>{colab.centro_custo.join(', ')}</span></div>
              )}
              {colab.observacoes && <div className="col-span-2"><span className="text-muted-foreground">Obs:</span> <span>{colab.observacoes}</span></div>}
            </div>
          )}
        </section>

        {/* Performance Comercial - only if closer */}
        {colab.closer_id && (
          <section className="rounded-xl p-5 space-y-3" style={{ background: 'hsl(0, 0%, 9%)', border: '1px solid hsla(0, 0%, 100%, 0.07)' }}>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Performance Comercial</h2>
              <Badge variant="outline" className="text-xs">🔗 Dados do Pulmão</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Dados sincronizados automaticamente do módulo comercial.</p>
          </section>
        )}

        {/* Conta Pulmão */}
        {isAdmin && (
          <section className="rounded-xl p-5 space-y-3" style={{ background: 'hsl(0, 0%, 9%)', border: '1px solid hsla(0, 0%, 100%, 0.07)' }}>
            <h2 className="text-lg font-semibold">Conta Pulmão</h2>
            {colab.user_id ? (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-400">Conta vinculada</span>
                  </div>
                  {(() => { const p = profiles.find(x => x.id === colab.user_id); return p ? (
                    <p className="text-sm text-muted-foreground pl-6">{p.nome} · {p.email}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground pl-6 font-mono">{colab.user_id}</p>
                  ); })()}
                </div>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/40 hover:bg-destructive/10"
                  onClick={() => updateColaborador.mutate({ id: colab.id, user_id: null })}
                  disabled={updateColaborador.isPending}>
                  <UserX className="h-4 w-4 mr-1" />Desvincular
                </Button>
              </div>
            ) : linkingUser ? (
              <div className="space-y-3">
                <Input placeholder="Buscar por nome ou email..." value={userSearch} onChange={e => setUserSearch(e.target.value)} autoFocus />
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {profiles.filter(p => {
                    const q = userSearch.toLowerCase();
                    return !q || p.nome.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
                  }).slice(0, 10).map(p => (
                    <button key={p.id} onClick={() => { updateColaborador.mutate({ id: colab.id, user_id: p.id }, { onSuccess: () => { setLinkingUser(false); setUserSearch(''); } }); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-white/5 flex items-center justify-between transition-colors"
                      disabled={updateColaborador.isPending}>
                      <span>{p.nome}</span>
                      <span className="text-xs text-muted-foreground">{p.email}</span>
                    </button>
                  ))}
                  {profiles.filter(p => { const q = userSearch.toLowerCase(); return !q || p.nome.toLowerCase().includes(q) || p.email.toLowerCase().includes(q); }).length === 0 && (
                    <p className="text-sm text-muted-foreground px-3 py-2">Nenhum usuário encontrado.</p>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setLinkingUser(false); setUserSearch(''); }}>
                  <X className="h-4 w-4 mr-1" />Cancelar
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <UserX className="h-4 w-4" />Nenhuma conta Pulmão vinculada.
                </p>
                <Button variant="outline" size="sm" onClick={() => setLinkingUser(true)}>
                  <LinkIcon className="h-4 w-4 mr-1" />Vincular conta
                </Button>
              </div>
            )}
          </section>
        )}

        {/* Feedbacks */}
        {isAdmin && (
          <section className="rounded-xl p-5 space-y-3" style={{ background: 'hsl(0, 0%, 9%)', border: '1px solid hsla(0, 0%, 100%, 0.07)' }}>
            <h2 className="text-lg font-semibold">Histórico de Feedbacks</h2>
            {feedbacks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum feedback registrado.</p>
            ) : (
              <div className="space-y-3">
                {feedbacks.map(fb => (
                  <div key={fb.id} className="rounded-lg p-3 flex gap-3" style={{ borderLeft: `3px solid ${TIPO_FEEDBACK_COLORS[fb.tipo as keyof typeof TIPO_FEEDBACK_COLORS] || '#6B7280'}`, background: 'hsla(0, 0%, 100%, 0.02)' }}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px]" style={{ borderColor: TIPO_FEEDBACK_COLORS[fb.tipo as keyof typeof TIPO_FEEDBACK_COLORS] }}>{TIPO_FEEDBACK_LABELS[fb.tipo as keyof typeof TIPO_FEEDBACK_LABELS]}</Badge>
                        <span className="text-[11px] text-muted-foreground">{format(new Date(fb.created_at), 'dd/MM/yyyy')}</span>
                      </div>
                      <p className="text-sm font-semibold">{fb.titulo}</p>
                      <p className="text-[13px] mt-1" style={{ color: 'hsla(0, 0%, 100%, 0.7)' }}>{fb.conteudo}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Avaliações */}
        <section className="rounded-xl p-5 space-y-3" style={{ background: 'hsl(0, 0%, 9%)', border: '1px solid hsla(0, 0%, 100%, 0.07)' }}>
          <h2 className="text-lg font-semibold">Avaliações</h2>
          {avaliacoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma avaliação concluída.</p>
          ) : (
            <div className="space-y-3">
              {avaliacoes.map(av => (
                <div key={av.id} className="rounded-lg p-3 flex items-center justify-between" style={{ background: 'hsla(0, 0%, 100%, 0.02)' }}>
                  <div>
                    <p className="text-sm font-medium">{av.tipo_avaliador === 'autoavaliacao' ? 'Autoavaliação' : av.tipo_avaliador === 'gestor' ? 'Avaliação Gestor' : 'Avaliação Par'}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(av.created_at), 'dd/MM/yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-primary fill-primary" />
                    <span className="text-lg font-bold">{avgScore(av)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
