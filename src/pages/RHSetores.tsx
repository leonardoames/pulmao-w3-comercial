import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Briefcase, TrendingUp, Code, DollarSign, Megaphone, Settings, HelpCircle } from 'lucide-react';
import { useRHColaboradores, useRHAvaliacoes, useRHFeedbacks } from '@/hooks/useRH';
import { useCurrentUserRole } from '@/hooks/useUserRoles';
import { SETOR_LABELS, type SetorRH } from '@/types/rh';

const SETOR_ICONS: Record<string, any> = {
  comercial: DollarSign,
  conteudo: Megaphone,
  marketing: TrendingUp,
  operacoes: Settings,
  financeiro: Briefcase,
  tecnologia: Code,
  outro: HelpCircle,
};

export default function RHSetores() {
  const { data: colaboradores = [] } = useRHColaboradores();
  const { data: avaliacoes = [] } = useRHAvaliacoes();
  const { data: feedbacks = [] } = useRHFeedbacks();
  const { data: userRole } = useCurrentUserRole();
  const isAdmin = userRole?.role === 'MASTER' || userRole?.role === 'DIRETORIA' || userRole?.role === 'GESTOR_COMERCIAL';

  const setores = useMemo(() => {
    const setorSet = new Set(colaboradores.map(c => c.setor));
    return Array.from(setorSet).map(setor => {
      const colabs = colaboradores.filter(c => c.setor === setor);
      const ativos = colabs.filter(c => c.status === 'ativo').length;
      const folha = isAdmin ? colabs.reduce((s, c) => s + (c.salario || 0), 0) : null;

      // Avg performance from completed evaluations
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

      // Recent feedbacks (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentFbs = feedbacks.filter(fb => colabIds.has(fb.colaborador_id) && new Date(fb.created_at) >= thirtyDaysAgo);
      const positivoCount = recentFbs.filter(fb => fb.tipo === 'positivo').length;
      const construtivoCount = recentFbs.filter(fb => fb.tipo === 'construtivo').length;

      // No evaluation count
      const avaliadoIds = new Set(setorAvals.map(a => a.avaliado_id));
      const semAvaliacao = colabs.filter(c => c.status === 'ativo' && !avaliadoIds.has(c.id)).length;

      return { setor, ativos, folha, avgPerf, positivoCount, construtivoCount, semAvaliacao, total: colabs.length };
    }).sort((a, b) => b.ativos - a.ativos);
  }, [colaboradores, avaliacoes, feedbacks, isAdmin]);

  const perfBadgeColor = (avg: number) => {
    if (avg >= 4) return { bg: 'hsla(142, 71%, 45%, 0.15)', color: '#22C55E' };
    if (avg >= 3) return { bg: 'hsla(24, 94%, 53%, 0.15)', color: '#F97316' };
    if (avg > 0) return { bg: 'hsla(0, 84%, 60%, 0.15)', color: '#EF4444' };
    return { bg: 'hsla(0, 0%, 100%, 0.05)', color: 'hsla(0, 0%, 100%, 0.3)' };
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <PageHeader title="Visão por Setor" subtitle="Análise consolidada por área da empresa" />

        {/* Sector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {setores.map(s => {
            const Icon = SETOR_ICONS[s.setor] || HelpCircle;
            const badge = perfBadgeColor(s.avgPerf);
            return (
              <div key={s.setor} className="rounded-xl p-5" style={{ background: 'hsl(0, 0%, 9%)', border: '1px solid hsla(0, 0%, 100%, 0.07)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'hsla(24, 94%, 53%, 0.1)' }}>
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">{SETOR_LABELS[s.setor as keyof typeof SETOR_LABELS] || s.setor}</h3>
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
                  <TableHead>Setor</TableHead>
                  <TableHead className="text-center">Headcount</TableHead>
                  {isAdmin && <TableHead className="text-right">Folha</TableHead>}
                  <TableHead className="text-center">Média Perf.</TableHead>
                  <TableHead className="text-center">FB Positivos (30d)</TableHead>
                  <TableHead className="text-center">FB Construtivos (30d)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {setores.map(s => (
                  <TableRow key={s.setor}>
                    <TableCell className="font-medium">{SETOR_LABELS[s.setor as keyof typeof SETOR_LABELS] || s.setor}</TableCell>
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
    </AppLayout>
  );
}
