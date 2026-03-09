import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Star, Plus, ClipboardCheck } from 'lucide-react';
import { useRHCiclos, useCreateCiclo, useUpdateCiclo, useRHAvaliacoes, useCreateAvaliacao, useUpdateAvaliacao, useRHColaboradores } from '@/hooks/useRH';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentUserRole } from '@/hooks/useUserRoles';
import { PERIODO_LABELS, STATUS_CICLO_LABELS, type PeriodoCiclo, type StatusCiclo, type TipoAvaliador } from '@/types/rh';
import { format } from 'date-fns';

function StarRating({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)} className="transition-colors">
          <Star className={`h-5 w-5 ${(value || 0) >= n ? 'text-primary fill-primary' : 'text-muted-foreground/30'}`} />
        </button>
      ))}
    </div>
  );
}

export default function RHAvaliacoes() {
  const { user } = useAuth();
  const { data: userRole } = useCurrentUserRole();
  const isAdmin = userRole?.role === 'MASTER' || userRole?.role === 'DIRETORIA' || userRole?.role === 'GESTOR_COMERCIAL';
  const { data: ciclos = [] } = useRHCiclos();
  const { data: colaboradores = [] } = useRHColaboradores();
  const createCiclo = useCreateCiclo();
  const updateCiclo = useUpdateCiclo();

  const [showNewCiclo, setShowNewCiclo] = useState(false);
  const [selectedCiclo, setSelectedCiclo] = useState<string | null>(null);
  const [showEvalForm, setShowEvalForm] = useState(false);
  const [evalTarget, setEvalTarget] = useState<{ avaliado_id: string; tipo_avaliador: TipoAvaliador } | null>(null);

  const [cicloForm, setCicloForm] = useState({ nome: '', periodo: 'trimestral' as PeriodoCiclo, data_inicio: '', data_fim: '', status: 'rascunho' as StatusCiclo });
  const [evalForm, setEvalForm] = useState({ nota_resultado: null as number | null, nota_atitude: null as number | null, nota_colaboracao: null as number | null, nota_desenvolvimento: null as number | null, pontos_fortes: '', pontos_melhoria: '', comentario_geral: '' });

  const { data: avaliacoes = [] } = useRHAvaliacoes(selectedCiclo || undefined);
  const createAvaliacao = useCreateAvaliacao();

  const handleCreateCiclo = () => {
    createCiclo.mutate(cicloForm as any, {
      onSuccess: () => { setShowNewCiclo(false); setCicloForm({ nome: '', periodo: 'trimestral', data_inicio: '', data_fim: '', status: 'rascunho' }); },
    });
  };

  const handleSubmitEval = () => {
    if (!evalTarget || !selectedCiclo || !user) return;
    createAvaliacao.mutate({
      ciclo_id: selectedCiclo,
      avaliado_id: evalTarget.avaliado_id,
      avaliador_id: user.id,
      tipo_avaliador: evalTarget.tipo_avaliador,
      ...evalForm,
      status: 'concluida',
    } as any, {
      onSuccess: () => {
        setShowEvalForm(false);
        setEvalForm({ nota_resultado: null, nota_atitude: null, nota_colaboracao: null, nota_desenvolvimento: null, pontos_fortes: '', pontos_melhoria: '', comentario_geral: '' });
        setEvalTarget(null);
      },
    });
  };

  const activeCiclo = ciclos.find(c => c.id === selectedCiclo);
  const completedCount = avaliacoes.filter(a => a.status === 'concluida').length;
  const totalExpected = colaboradores.length;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <PageHeader title="Avaliações 360°" description="Ciclos de avaliação de desempenho">
          {isAdmin && <Button onClick={() => setShowNewCiclo(true)} className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4 mr-2" />Novo Ciclo</Button>}
        </PageHeader>

        {/* Ciclos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ciclos.map(ciclo => {
            const cAvals = avaliacoes.filter(a => a.ciclo_id === ciclo.id && a.status === 'concluida').length;
            return (
              <div key={ciclo.id} className="rounded-xl p-5 cursor-pointer transition-all" style={{ background: 'hsl(0, 0%, 9%)', border: selectedCiclo === ciclo.id ? '1px solid hsl(24, 94%, 53%)' : '1px solid hsla(0, 0%, 100%, 0.07)' }}
                onClick={() => setSelectedCiclo(ciclo.id)}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold">{ciclo.nome}</h3>
                  <Badge variant={ciclo.status === 'aberto' ? 'default' : 'outline'} className={ciclo.status === 'aberto' ? 'bg-green-500/20 text-green-400' : ''}>{STATUS_CICLO_LABELS[ciclo.status as keyof typeof STATUS_CICLO_LABELS]}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{PERIODO_LABELS[ciclo.periodo as keyof typeof PERIODO_LABELS]} · {format(new Date(ciclo.data_inicio + 'T12:00:00'), 'dd/MM')} a {format(new Date(ciclo.data_fim + 'T12:00:00'), 'dd/MM/yyyy')}</p>
                <Progress value={totalExpected ? (cAvals / totalExpected) * 100 : 0} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{cAvals} de {totalExpected} avaliações</p>
              </div>
            );
          })}
          {ciclos.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">Nenhum ciclo criado ainda.</div>}
        </div>

        {/* Cycle detail */}
        {activeCiclo && activeCiclo.status === 'aberto' && (
          <section className="rounded-xl p-5 space-y-4" style={{ background: 'hsl(0, 0%, 9%)', border: '1px solid hsla(0, 0%, 100%, 0.07)' }}>
            <h2 className="text-lg font-semibold">Avaliações - {activeCiclo.nome}</h2>
            <div className="space-y-2">
              {colaboradores.map(colab => {
                const existing = avaliacoes.find(a => a.avaliado_id === colab.id && a.avaliador_id === user?.id);
                return (
                  <div key={colab.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'hsla(0, 0%, 100%, 0.02)' }}>
                    <span className="text-sm font-medium">{colab.nome}</span>
                    {existing?.status === 'concluida' ? (
                      <Badge className="bg-green-500/20 text-green-400">✓ Concluída</Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => { setEvalTarget({ avaliado_id: colab.id, tipo_avaliador: 'gestor' }); setShowEvalForm(true); }}>
                        <ClipboardCheck className="h-4 w-4 mr-1" />Avaliar
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            {isAdmin && activeCiclo.status === 'aberto' && (
              <Button variant="outline" onClick={() => updateCiclo.mutate({ id: activeCiclo.id, status: 'encerrado' })}>Encerrar Ciclo</Button>
            )}
          </section>
        )}
      </div>

      {/* New Cycle Dialog */}
      <Dialog open={showNewCiclo} onOpenChange={setShowNewCiclo}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Ciclo de Avaliação</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome *</Label><Input value={cicloForm.nome} onChange={e => setCicloForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Q1 2026" /></div>
            <div><Label>Período</Label>
              <Select value={cicloForm.periodo} onValueChange={v => setCicloForm(f => ({ ...f, periodo: v as PeriodoCiclo }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(PERIODO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Data Início</Label><Input type="date" value={cicloForm.data_inicio} onChange={e => setCicloForm(f => ({ ...f, data_inicio: e.target.value }))} /></div>
              <div><Label>Data Fim</Label><Input type="date" value={cicloForm.data_fim} onChange={e => setCicloForm(f => ({ ...f, data_fim: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewCiclo(false)}>Cancelar</Button>
            <Button onClick={handleCreateCiclo} disabled={!cicloForm.nome || !cicloForm.data_inicio || !cicloForm.data_fim || createCiclo.isPending} className="bg-primary hover:bg-primary/90">Criar Ciclo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evaluation Form Dialog */}
      <Dialog open={showEvalForm} onOpenChange={setShowEvalForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Avaliar Colaborador</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label className="text-sm font-medium">Resultado</Label>
              <p className="text-xs text-muted-foreground mb-1">Entregou os resultados esperados no período</p>
              <StarRating value={evalForm.nota_resultado} onChange={v => setEvalForm(f => ({ ...f, nota_resultado: v }))} />
            </div>
            <div>
              <Label className="text-sm font-medium">Atitude</Label>
              <p className="text-xs text-muted-foreground mb-1">Demonstrou proatividade e comprometimento</p>
              <StarRating value={evalForm.nota_atitude} onChange={v => setEvalForm(f => ({ ...f, nota_atitude: v }))} />
            </div>
            <div>
              <Label className="text-sm font-medium">Colaboração</Label>
              <p className="text-xs text-muted-foreground mb-1">Colaborou com o time e outros setores</p>
              <StarRating value={evalForm.nota_colaboracao} onChange={v => setEvalForm(f => ({ ...f, nota_colaboracao: v }))} />
            </div>
            <div>
              <Label className="text-sm font-medium">Desenvolvimento</Label>
              <p className="text-xs text-muted-foreground mb-1">Buscou aprendizado e melhorou suas habilidades</p>
              <StarRating value={evalForm.nota_desenvolvimento} onChange={v => setEvalForm(f => ({ ...f, nota_desenvolvimento: v }))} />
            </div>
            <div><Label>Pontos Fortes</Label><Textarea value={evalForm.pontos_fortes} onChange={e => setEvalForm(f => ({ ...f, pontos_fortes: e.target.value }))} placeholder="O que essa pessoa faz muito bem?" /></div>
            <div><Label>Pontos de Melhoria</Label><Textarea value={evalForm.pontos_melhoria} onChange={e => setEvalForm(f => ({ ...f, pontos_melhoria: e.target.value }))} placeholder="O que essa pessoa pode melhorar?" /></div>
            <div><Label>Comentário Geral</Label><Textarea value={evalForm.comentario_geral} onChange={e => setEvalForm(f => ({ ...f, comentario_geral: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEvalForm(false)}>Cancelar</Button>
            <Button onClick={handleSubmitEval} disabled={createAvaliacao.isPending} className="bg-primary hover:bg-primary/90">Salvar Avaliação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
