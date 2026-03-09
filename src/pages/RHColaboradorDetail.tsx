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
import { ArrowLeft, Pencil, Save, X, LinkIcon, Star } from 'lucide-react';
import { useRHColaborador, useUpdateColaborador, useFeedbacksByColaborador, useAvaliacoesByColaborador } from '@/hooks/useRH';
import { useCurrentUserRole } from '@/hooks/useUserRoles';
import { SETOR_LABELS, STATUS_COLABORADOR_LABELS, STATUS_COLABORADOR_COLORS, TIPO_CONTRATO_LABELS, TIPO_FEEDBACK_COLORS, TIPO_FEEDBACK_LABELS, type SetorRH, type TipoContrato, type StatusColaborador } from '@/types/rh';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RHColaboradorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: colab, isLoading } = useRHColaborador(id);
  const { data: feedbacks = [] } = useFeedbacksByColaborador(id);
  const { data: avaliacoes = [] } = useAvaliacoesByColaborador(id);
  const updateColaborador = useUpdateColaborador();
  const { data: userRole } = useCurrentUserRole();
  const isAdmin = userRole?.role === 'MASTER' || userRole?.role === 'DIRETORIA' || userRole?.role === 'GESTOR_COMERCIAL';

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  if (isLoading || !colab) {
    return <AppLayout><div className="p-6 flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></AppLayout>;
  }

  const startEdit = () => {
    setForm({ ...colab });
    setEditing(true);
  };

  const saveEdit = () => {
    updateColaborador.mutate({ id: colab.id, ...form }, { onSuccess: () => setEditing(false) });
  };

  const avgScore = (av: any) => {
    const scores = [av.nota_resultado, av.nota_atitude, av.nota_colaboracao, av.nota_desenvolvimento].filter(Boolean);
    return scores.length ? (scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1) : '—';
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
            <p className="text-sm text-muted-foreground">{colab.cargo} · {SETOR_LABELS[colab.setor as keyof typeof SETOR_LABELS]}</p>
          </div>
          {isAdmin && !editing && <Button variant="outline" size="sm" onClick={startEdit}><Pencil className="h-4 w-4 mr-1" />Editar</Button>}
        </div>

        {/* Dados Pessoais */}
        <section className="rounded-xl p-5 space-y-4" style={{ background: 'hsl(0, 0%, 9%)', border: '1px solid hsla(0, 0%, 100%, 0.07)' }}>
          <h2 className="text-lg font-semibold">Dados Pessoais</h2>
          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nome</Label><Input value={form.nome || ''} onChange={e => setForm((f: any) => ({ ...f, nome: e.target.value }))} /></div>
                <div><Label>Email</Label><Input value={form.email || ''} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} /></div>
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
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Data Entrada</Label><Input type="date" value={form.data_entrada || ''} onChange={e => setForm((f: any) => ({ ...f, data_entrada: e.target.value }))} /></div>
                <div><Label>Tipo Contrato</Label>
                  <Select value={form.tipo_contrato} onValueChange={v => setForm((f: any) => ({ ...f, tipo_contrato: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(TIPO_CONTRATO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm((f: any) => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(STATUS_COLABORADOR_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              {isAdmin && <div><Label>Salário</Label><Input type="number" value={form.salario || ''} onChange={e => setForm((f: any) => ({ ...f, salario: e.target.value ? parseFloat(e.target.value) : null }))} /></div>}
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
              <div><span className="text-muted-foreground">Setor:</span> <span>{SETOR_LABELS[colab.setor as keyof typeof SETOR_LABELS]}</span></div>
              <div><span className="text-muted-foreground">Contrato:</span> <span>{TIPO_CONTRATO_LABELS[colab.tipo_contrato as keyof typeof TIPO_CONTRATO_LABELS]}</span></div>
              <div><span className="text-muted-foreground">Data Entrada:</span> <span>{colab.data_entrada ? format(new Date(colab.data_entrada + 'T12:00:00'), 'dd/MM/yyyy') : '—'}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <span>{STATUS_COLABORADOR_LABELS[colab.status as keyof typeof STATUS_COLABORADOR_LABELS]}</span></div>
              {isAdmin && <div><span className="text-muted-foreground">Salário:</span> <span>{colab.salario ? `R$ ${colab.salario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</span></div>}
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
