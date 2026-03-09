import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Briefcase, TrendingUp, Code, DollarSign, Megaphone, Settings, HelpCircle, Plus, Pencil, Trash2 } from 'lucide-react';
import { useRHColaboradores, useRHAvaliacoes, useRHFeedbacks, useRHSetoresConfig, useCreateSetorConfig, useUpdateSetorConfig, useDeleteSetorConfig } from '@/hooks/useRH';
import { useCurrentUserRole } from '@/hooks/useUserRoles';
import { SETOR_LABELS, type RHSetorConfig } from '@/types/rh';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const SETOR_ICONS: Record<string, any> = {
  comercial: DollarSign,
  conteudo: Megaphone,
  marketing: TrendingUp,
  operacoes: Settings,
  financeiro: Briefcase,
  tecnologia: Code,
  outro: HelpCircle,
};

const PRESET_COLORS = ['#F97316', '#3B82F6', '#8B5CF6', '#22C55E', '#EAB308', '#06B6D4', '#EC4899', '#EF4444', '#6B7280'];

export default function RHSetores() {
  const { data: colaboradores = [] } = useRHColaboradores();
  const { data: avaliacoes = [] } = useRHAvaliacoes();
  const { data: feedbacks = [] } = useRHFeedbacks();
  const { data: setoresConfig = [] } = useRHSetoresConfig();
  const createSetor = useCreateSetorConfig();
  const updateSetor = useUpdateSetorConfig();
  const deleteSetor = useDeleteSetorConfig();
  const { data: userRole } = useCurrentUserRole();
  const isAdmin = userRole?.role === 'MASTER' || userRole?.role === 'DIRETORIA' || userRole?.role === 'GESTOR_COMERCIAL';

  const [showSetorDialog, setShowSetorDialog] = useState(false);
  const [editingSetor, setEditingSetor] = useState<RHSetorConfig | null>(null);
  const [setorForm, setSetorForm] = useState({ nome: '', cor: '#F97316' });
  const [deletingSetor, setDeletingSetor] = useState<RHSetorConfig | null>(null);

  const setores = useMemo(() => {
    // Build from centro_custo (multi) and setor (legacy)
    const setorMap = new Map<string, typeof colaboradores>();
    colaboradores.forEach(c => {
      // Add to centro_custo groups
      if (c.centro_custo && c.centro_custo.length > 0) {
        c.centro_custo.forEach(cc => {
          if (!setorMap.has(cc)) setorMap.set(cc, []);
          setorMap.get(cc)!.push(c);
        });
      } else if (c.setor) {
        const label = SETOR_LABELS[c.setor as keyof typeof SETOR_LABELS] || c.setor;
        if (!setorMap.has(label)) setorMap.set(label, []);
        setorMap.get(label)!.push(c);
      }
    });

    return Array.from(setorMap.entries()).map(([nome, colabs]) => {
      const config = setoresConfig.find(sc => sc.nome === nome);
      const ativos = colabs.filter(c => c.status === 'ativo').length;
      const folha = isAdmin ? colabs.reduce((s, c) => s + (c.salario || 0), 0) : null;

      const colabIds = new Set(colabs.map(c => c.id));
      const setorAvals = avaliacoes.filter(a => colabIds.has(a.avaliado_id) && a.status === 'concluida');
      let avgPerf = 0;
      if (setorAvals.length > 0) {
        const scores = setorAvals.map(a => {
          const vals = [a.nota_resultado, a.nota_atitude, a.nota_colaboracao, a.nota_desenvolvimento].filter(Boolean) as number[];
          return vals.length ? vals.reduce((x, y) => x + y, 0) / vals.length : 0;
        }).filter(s => s > 0);
        avgPerf = scores.length ? scores.reduce((x, y) => x + y, 0) / scores.length : 0;
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentFbs = feedbacks.filter(fb => colabIds.has(fb.colaborador_id) && new Date(fb.created_at) >= thirtyDaysAgo);
      const positivoCount = recentFbs.filter(fb => fb.tipo === 'positivo').length;
      const construtivoCount = recentFbs.filter(fb => fb.tipo === 'construtivo').length;

      const avaliadoIds = new Set(setorAvals.map(a => a.avaliado_id));
      const semAvaliacao = colabs.filter(c => c.status === 'ativo' && !avaliadoIds.has(c.id)).length;

      return { nome, cor: config?.cor || '#6B7280', ativos, folha, avgPerf, positivoCount, construtivoCount, semAvaliacao, total: colabs.length };
    }).sort((a, b) => b.ativos - a.ativos);
  }, [colaboradores, avaliacoes, feedbacks, isAdmin, setoresConfig]);

  const perfBadgeColor = (avg: number) => {
    if (avg >= 4) return { bg: 'hsla(142, 71%, 45%, 0.15)', color: '#22C55E' };
    if (avg >= 3) return { bg: 'hsla(24, 94%, 53%, 0.15)', color: '#F97316' };
    if (avg > 0) return { bg: 'hsla(0, 84%, 60%, 0.15)', color: '#EF4444' };
    return { bg: 'hsla(0, 0%, 100%, 0.05)', color: 'hsla(0, 0%, 100%, 0.3)' };
  };

  const openNewSetor = () => {
    setEditingSetor(null);
    setSetorForm({ nome: '', cor: '#F97316' });
    setShowSetorDialog(true);
  };

  const openEditSetor = (s: RHSetorConfig) => {
    setEditingSetor(s);
    setSetorForm({ nome: s.nome, cor: s.cor });
    setShowSetorDialog(true);
  };

  const handleSaveSetor = () => {
    if (editingSetor) {
      updateSetor.mutate({ id: editingSetor.id, nome: setorForm.nome, cor: setorForm.cor }, { onSuccess: () => setShowSetorDialog(false) });
    } else {
      createSetor.mutate({ nome: setorForm.nome, cor: setorForm.cor, ordem: setoresConfig.length + 1 } as any, { onSuccess: () => setShowSetorDialog(false) });
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <PageHeader title="Visão por Setor" description="Análise consolidada por área da empresa">
          {isAdmin && <Button onClick={openNewSetor} className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4 mr-2" />Novo Setor</Button>}
        </PageHeader>

        {/* Admin: Setor Config Panel */}
        {isAdmin && setoresConfig.length > 0 && (
          <div className="rounded-xl p-4 space-y-3" style={{ background: 'hsl(0, 0%, 9%)', border: '1px solid hsla(0, 0%, 100%, 0.07)' }}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Centros de Custo Configurados</h3>
            <div className="flex flex-wrap gap-2">
              {setoresConfig.map(s => (
                <div key={s.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: `${s.cor}15`, border: `1px solid ${s.cor}30` }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.cor }} />
                  <span className="text-xs font-medium" style={{ color: s.cor }}>{s.nome}</span>
                  <button onClick={() => openEditSetor(s)} className="text-muted-foreground hover:text-foreground ml-1"><Pencil className="h-3 w-3" /></button>
                  <button onClick={() => setDeletingSetor(s)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {setores.map(s => {
            const badge = perfBadgeColor(s.avgPerf);
            return (
              <div key={s.nome} className="rounded-xl p-5" style={{ background: 'hsl(0, 0%, 9%)', border: '1px solid hsla(0, 0%, 100%, 0.07)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${s.cor}20` }}>
                    <Users className="h-5 w-5" style={{ color: s.cor }} />
                  </div>
                  <div>
                    <h3 className="font-bold">{s.nome}</h3>
                    <p className="text-xs text-muted-foreground">{s.ativos} ativos</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground">Folha</span>
                    <p className="font-semibold">{s.folha !== null ? `R$ ${s.folha.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Média Performance</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{s.avgPerf > 0 ? s.avgPerf.toFixed(1) : '—'}</span>
                      {s.avgPerf > 0 && <Badge className="text-[10px] px-1.5" style={{ background: badge.bg, color: badge.color }}>{s.avgPerf >= 4 ? 'Ótimo' : s.avgPerf >= 3 ? 'Regular' : 'Atenção'}</Badge>}
                    </div>
                  </div>
                </div>
                {s.semAvaliacao > 0 && (
                  <p className="text-xs mt-2" style={{ color: '#EAB308' }}>⚠ {s.semAvaliacao} sem avaliação</p>
                )}
              </div>
            );
          })}
          {setores.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">Nenhum setor com colaboradores cadastrados.</div>}
        </div>

        {/* Comparison Table */}
        {setores.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid hsla(0, 0%, 100%, 0.07)' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Setor / Centro de Custo</TableHead>
                  <TableHead className="text-center">Headcount</TableHead>
                  {isAdmin && <TableHead className="text-right">Folha</TableHead>}
                  <TableHead className="text-center">Média Perf.</TableHead>
                  <TableHead className="text-center">FB Positivos (30d)</TableHead>
                  <TableHead className="text-center">FB Construtivos (30d)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {setores.map(s => (
                  <TableRow key={s.nome}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.cor }} />
                        <span className="font-medium">{s.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{s.ativos}</TableCell>
                    {isAdmin && <TableCell className="text-right">{s.folha !== null ? `R$ ${s.folha.toLocaleString('pt-BR')}` : '—'}</TableCell>}
                    <TableCell className="text-center">{s.avgPerf > 0 ? s.avgPerf.toFixed(1) : '—'}</TableCell>
                    <TableCell className="text-center">{s.positivoCount}</TableCell>
                    <TableCell className="text-center">{s.construtivoCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Setor Config Dialog */}
      <Dialog open={showSetorDialog} onOpenChange={setShowSetorDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingSetor ? 'Editar Setor' : 'Novo Setor / Centro de Custo'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={setorForm.nome} onChange={e => setSetorForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: W3 Pagamentos" /></div>
            <div>
              <Label>Cor</Label>
              <div className="flex gap-2 mt-1">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setSetorForm(f => ({ ...f, cor: c }))}
                    className="w-7 h-7 rounded-full transition-all"
                    style={{
                      background: c,
                      boxShadow: setorForm.cor === c ? `0 0 0 3px ${c}40` : 'none',
                      transform: setorForm.cor === c ? 'scale(1.15)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSetorDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveSetor} disabled={!setorForm.nome || createSetor.isPending || updateSetor.isPending} className="bg-primary hover:bg-primary/90">
              {editingSetor ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSetor} onOpenChange={() => setDeletingSetor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover setor "{deletingSetor?.nome}"?</AlertDialogTitle>
            <AlertDialogDescription>Os colaboradores vinculados a este centro de custo não serão afetados.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deletingSetor) { deleteSetor.mutate(deletingSetor.id); setDeletingSetor(null); } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
