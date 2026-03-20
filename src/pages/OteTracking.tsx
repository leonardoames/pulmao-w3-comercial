import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOteRealized, useOteTeamStats } from '@/hooks/useOteGoals';
import { useClosers } from '@/hooks/useProfiles';
import { useCurrentUserRole, useCanManageUsers } from '@/hooks/useUserRoles';
import { OteProgressBar } from '@/components/ote/OteProgressBar';
import { OteBadge } from '@/components/ote/OteBadge';
import { OteGoalModal } from '@/components/ote/OteGoalModal';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Target, Trophy, TrendingUp, Users, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { RAMPAGEM_LABELS } from '@/types/ote';

export default function OteTrackingPage() {
  const [monthRef, setMonthRef] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedCloser, setSelectedCloser] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  
  const { data: userRole } = useCurrentUserRole();
  const canManage = useCanManageUsers() || ['MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL'].includes(userRole?.role || '');
  const isCloser = userRole?.role === 'CLOSER';

  const [editingCloserId, setEditingCloserId] = useState<string | null>(null);

  const { data: closers } = useClosers();
  const closerId = selectedCloser === 'all' ? undefined : selectedCloser;
  const { data: oteData, isLoading } = useOteRealized(monthRef, closerId);
  const { data: teamStats } = useOteTeamStats(monthRef);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    
    for (let i = -6; i <= 3; i++) {
      const date = i < 0 ? subMonths(now, Math.abs(i)) : addMonths(now, i);
      options.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy', { locale: ptBR }),
      });
    }
    
    return options;
  };

  // Get top performers for badges
  const topPerformers = oteData?.slice(0, 3) || [];

  return (
    <AppLayout>
      <PageHeader
        title="Acompanhamento de Meta OTE"
        description="Acompanhe a progressão das metas por closer"
      >
        <div className="flex items-center gap-3">
          {/* Month filter */}
          <Select value={monthRef} onValueChange={setMonthRef}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {generateMonthOptions().map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Closer filter */}
          {!isCloser && (
            <Select value={selectedCloser} onValueChange={setSelectedCloser}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos os closers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {closers?.map((closer) => (
                  <SelectItem key={closer.id} value={closer.id}>
                    {closer.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Add goal button */}
          {canManage && (
            <Button onClick={() => { setEditingCloserId(null); setModalOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              Cadastrar Meta
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Team Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Meta Total</p>
                <p className="text-2xl font-bold">{formatCurrency(teamStats?.totalTarget || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">OTE Realizado</p>
                <p className="text-2xl font-bold">{formatCurrency(teamStats?.totalRealized || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">% Atingido</p>
                  <p className="text-2xl font-bold">{(teamStats?.percentAchieved || 0).toFixed(1)}%</p>
                </div>
                <OteBadge badge={teamStats?.badge || null} size="md" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Closers com Meta</p>
                <p className="text-2xl font-bold">{teamStats?.closersWithGoals || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar for team */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Progresso Geral do Time</span>
            <span className="text-lg font-normal text-muted-foreground">
              {formatCurrency(teamStats?.totalRealized || 0)} / {formatCurrency(teamStats?.totalTarget || 0)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="pb-6">
            <OteProgressBar percentAchieved={teamStats?.percentAchieved || 0} height="lg" />
          </div>
        </CardContent>
      </Card>

      {/* Ranking Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking por Closer</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : oteData && oteData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Closer</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Rampagem</TableHead>
                  <TableHead className="text-right">Meta OTE</TableHead>
                  <TableHead className="text-right">PIX</TableHead>
                  <TableHead className="text-right">Cartão</TableHead>
                  <TableHead className="text-right">Boleto</TableHead>
                  <TableHead className="text-right">OTE Realizado</TableHead>
                  <TableHead className="text-center">% Atingido</TableHead>
                  <TableHead className="text-right">Faltante</TableHead>
                  <TableHead className="w-24">Progresso</TableHead>
                  <TableHead className="text-right">Fixo (R$)</TableHead>
                  <TableHead className="text-right">Remuneração</TableHead>
                  {canManage && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {oteData.map((row, index) => (
                  <TableRow key={row.closerId}>
                    <TableCell>
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                        index === 0 && 'bg-primary text-primary-foreground',
                        index === 1 && 'medal-silver',
                        index === 2 && 'medal-bronze',
                        index > 2 && 'bg-muted text-muted-foreground'
                      )}>
                        {index + 1}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{row.closerNome}</TableCell>
                    <TableCell>
                      {row.nivelLabel ? (
                        <Badge variant="outline" className="text-xs">{row.nivelLabel}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.rampagemKey && row.rampagemKey !== 'none' ? (
                        <Badge className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/30">
                          {RAMPAGEM_LABELS[row.rampagemKey as keyof typeof RAMPAGEM_LABELS] || row.rampagemKey}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(row.oteTarget)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(row.pixSum)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(row.cardSum)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(row.boletoSum)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {formatCurrency(row.oteRealized)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-medium">{row.percentAchieved.toFixed(1)}%</span>
                        <OteBadge badge={row.badge} size="sm" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {row.remaining > 0 ? formatCurrency(row.remaining) : '-'}
                    </TableCell>
                    <TableCell>
                      <OteProgressBar
                        percentAchieved={row.percentAchieved}
                        showMarkers={false}
                        height="sm"
                      />
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(row.salarioFixo || 0)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency((row.salarioFixo || 0) + row.oteRealized)}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => { setEditingCloserId(row.closerId); setModalOpen(true); }}
                          title="Editar meta"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Nenhuma meta cadastrada para este mês.
              </p>
              {canManage && (
                <Button onClick={() => setModalOpen(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar primeira meta
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goal Modal */}
      <OteGoalModal
        open={modalOpen}
        onOpenChange={(open) => { setModalOpen(open); if (!open) setEditingCloserId(null); }}
        defaultMonth={monthRef}
        defaultCloserId={editingCloserId || undefined}
      />
    </AppLayout>
  );
}
