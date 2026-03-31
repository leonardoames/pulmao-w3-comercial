import { useState, useMemo, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useClosers } from '@/hooks/useProfiles';
import { useCloserNiveis, useUpdateCloserProfile } from '@/hooks/useCloserNiveis';
import { useOteGoals, useCreateOteGoal, useUpdateOteGoal } from '@/hooks/useOteGoals';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentUserRole } from '@/hooks/useUserRoles';
import { NivelConfigModal } from '@/components/ote/NivelConfigModal';
import { RAMPAGEM_MULTIPLIERS, RAMPAGEM_LABELS, OTE_MULTIPLIERS } from '@/types/ote';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calculator, Settings, AlertTriangle } from 'lucide-react';
import { Profile } from '@/types/crm';

interface GlobalParams {
  monthRef: string;
  diasUteis: number;
  callsPorDia: number;
  noshow: number;
  ticketMedio: number;
  pctPix: number;
  pctCartao: number;
  pctBoleto: number;
}

interface CloserRow {
  closer: Profile;
  nivelKey: string;
  rampagem: 'none' | 'ramp1' | 'ramp2';
  selected: boolean;
}

function generateMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = -3; i <= 6; i++) {
    const date = i < 0 ? subMonths(now, Math.abs(i)) : addMonths(now, i);
    options.push({
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: ptBR }),
    });
  }
  return options;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

export default function OteCalculadoraPage() {
  const { user } = useAuth();
  const { data: userRole } = useCurrentUserRole();
  const canConfigNiveis = ['MASTER', 'DIRETORIA'].includes(userRole?.role || '');

  const { data: closers } = useClosers();
  const { data: niveis } = useCloserNiveis();

  const createGoal = useCreateOteGoal();
  const updateGoal = useUpdateOteGoal();
  const updateProfile = useUpdateCloserProfile();

  const [nivelModalOpen, setNivelModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [params, setParams] = useState<GlobalParams>({
    monthRef: format(new Date(), 'yyyy-MM'),
    diasUteis: 22,
    callsPorDia: 4,
    noshow: 20,
    ticketMedio: 5000,
    pctPix: 60,
    pctCartao: 30,
    pctBoleto: 10,
  });

  // Build rows from closers + niveis
  const [rows, setRows] = useState<CloserRow[]>([]);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (closers && closers.length > 0 && !initializedRef.current) {
      initializedRef.current = true;
      setRows(
        closers.map((c) => ({
          closer: c,
          nivelKey: (c as any).nivel_closer || (niveis?.[0]?.nivel ?? ''),
          rampagem: ((c as any).rampagem as 'none' | 'ramp1' | 'ramp2') || 'none',
          selected: false,
        }))
      );
    }
  }, [closers, niveis]);

  // Existing goals for the selected month (to show warnings)
  const { data: existingGoals } = useOteGoals(params.monthRef);

  const nivelMap = useMemo(() => {
    const map = new Map<string, { taxa_conversao: number; salario_fixo: number; label: string }>();
    niveis?.forEach((n) => map.set(n.nivel, { taxa_conversao: n.taxa_conversao, salario_fixo: n.salario_fixo, label: n.label }));
    return map;
  }, [niveis]);

  // Compute OTE per closer row
  const computed = useMemo(() => {
    const pctSum = params.pctPix + params.pctCartao + params.pctBoleto;
    const pixW = pctSum > 0 ? (params.pctPix / pctSum) * OTE_MULTIPLIERS.pix : 0;
    const cartaoW = pctSum > 0 ? (params.pctCartao / pctSum) * OTE_MULTIPLIERS.card : 0;
    const boletoW = pctSum > 0 ? (params.pctBoleto / pctSum) * OTE_MULTIPLIERS.boleto : 0;
    const oteWeight = pixW + cartaoW + boletoW;

    return rows.map((r) => {
      const nivel = nivelMap.get(r.nivelKey);
      const taxa = nivel?.taxa_conversao ?? 0;
      const callsEf = params.diasUteis * params.callsPorDia * (1 - params.noshow / 100);
      const vendas = callsEf * taxa;
      const receita = vendas * params.ticketMedio;
      const oteSim = receita * oteWeight;
      const rampMult = RAMPAGEM_MULTIPLIERS[r.rampagem];
      const oteFinal = oteSim * rampMult;
      return { ...r, callsEf, vendas, receita, oteSim, oteFinal, taxa };
    });
  }, [rows, params, nivelMap]);

  const selectedRows = computed.filter((r) => r.selected);
  const paramsValid =
    params.diasUteis > 0 &&
    params.callsPorDia > 0 &&
    params.ticketMedio > 0;

  const existingGoalMap = useMemo(() => {
    const map = new Map<string, string>();
    existingGoals?.forEach((g) => map.set(g.closer_user_id, g.id));
    return map;
  }, [existingGoals]);

  const handleParamChange = (key: keyof GlobalParams, value: string | number) => {
    setParams((p) => ({ ...p, [key]: typeof value === 'string' ? value : Number(value) }));
  };

  const handleRowChange = (closerId: string, field: 'nivelKey' | 'rampagem' | 'selected', value: any) => {
    setRows((prev) =>
      prev.map((r) => (r.closer.id === closerId ? { ...r, [field]: value } : r))
    );

    if (field === 'nivelKey' || field === 'rampagem') {
      const row = rows.find((r) => r.closer.id === closerId);
      if (!row) return;
      updateProfile.mutate({
        userId: closerId,
        nivel_closer: field === 'nivelKey' ? value : row.nivelKey,
        rampagem: field === 'rampagem' ? value : row.rampagem,
      });
    }
  };

  const handleDefineGoals = async () => {
    if (!user) return;
    for (const row of selectedRows) {
      const existingId = existingGoalMap.get(row.closer.id);
      if (existingId) {
        await updateGoal.mutateAsync({ id: existingId, ote_target_value: row.oteFinal });
      } else {
        await createGoal.mutateAsync({
          month_ref: params.monthRef,
          closer_user_id: row.closer.id,
          ote_target_value: row.oteFinal,
          created_by_user_id: user.id,
        });
      }
    }
    setConfirmOpen(false);
    // Deselect all
    setRows((prev) => prev.map((r) => ({ ...r, selected: false })));
  };

  const monthLabel = (monthRef: string) => {
    try {
      const [y, m] = monthRef.split('-');
      return format(new Date(Number(y), Number(m) - 1, 1), 'MMMM yyyy', { locale: ptBR });
    } catch {
      return monthRef;
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Calculadora OTE"
        description="Simule e defina metas OTE por closer"
      >
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-muted-foreground" />
          {canConfigNiveis && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setNivelModalOpen(true)}>
              <Settings className="h-4 w-4" />
              Configurar Níveis
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Global Parameters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Parâmetros Globais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Mês de referência</Label>
              <Select value={params.monthRef} onValueChange={(v) => handleParamChange('monthRef', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {generateMonthOptions().map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Dias úteis com call</Label>
              <Input
                type="number" min="1" max="31"
                value={params.diasUteis}
                onChange={(e) => handleParamChange('diasUteis', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Calls por dia</Label>
              <Input
                type="number" min="1"
                value={params.callsPorDia}
                onChange={(e) => handleParamChange('callsPorDia', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>% No-show</Label>
              <Input
                type="number" min="0" max="100"
                value={params.noshow}
                onChange={(e) => handleParamChange('noshow', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Ticket médio (R$)</Label>
              <Input
                type="number" min="0"
                value={params.ticketMedio}
                onChange={(e) => handleParamChange('ticketMedio', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>% PIX</Label>
              <Input
                type="number" min="0" max="100"
                value={params.pctPix}
                onChange={(e) => handleParamChange('pctPix', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>% Cartão</Label>
              <Input
                type="number" min="0" max="100"
                value={params.pctCartao}
                onChange={(e) => handleParamChange('pctCartao', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>% Boleto</Label>
              <Input
                type="number" min="0" max="100"
                value={params.pctBoleto}
                onChange={(e) => handleParamChange('pctBoleto', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Closers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>Simulação por Closer</span>
            <Button
              disabled={selectedRows.length === 0 || !paramsValid}
              onClick={() => setConfirmOpen(true)}
            >
              Definir como Meta ({selectedRows.length})
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">☑</TableHead>
                <TableHead>Closer</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Rampagem</TableHead>
                <TableHead className="text-right">Taxa Conv.</TableHead>
                <TableHead className="text-right">Calls Ef.</TableHead>
                <TableHead className="text-right">Vendas Est.</TableHead>
                <TableHead className="text-right">OTE Simulada</TableHead>
                <TableHead className="text-right">OTE Final</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {computed.map((row) => {
                const hasGoal = existingGoalMap.has(row.closer.id);
                return (
                  <TableRow key={row.closer.id} className={row.selected ? 'bg-primary/5' : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={row.selected}
                        onCheckedChange={(v) => handleRowChange(row.closer.id, 'selected', !!v)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{row.closer.nome}</span>
                        {hasGoal && row.selected && (
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.nivelKey}
                        onValueChange={(v) => handleRowChange(row.closer.id, 'nivelKey', v)}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {niveis?.map((n) => (
                            <SelectItem key={n.nivel} value={n.nivel}>{n.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.rampagem}
                        onValueChange={(v) => handleRowChange(row.closer.id, 'rampagem', v)}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.entries(RAMPAGEM_LABELS) as [keyof typeof RAMPAGEM_LABELS, string][]).map(([k, label]) => (
                            <SelectItem key={k} value={k}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {(row.taxa * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {row.callsEf.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {row.vendas.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.oteSim)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {formatCurrency(row.oteFinal)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Definir metas OTE</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Você está prestes a definir metas para <strong>{selectedRows.length} closer(s)</strong> em <strong>{monthLabel(params.monthRef)}</strong>:</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {selectedRows.map((r) => {
                    const hasGoal = existingGoalMap.has(r.closer.id);
                    return (
                      <div key={r.closer.id} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5">
                          {hasGoal && <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
                          {r.closer.nome}
                        </span>
                        <span className="font-semibold">{formatCurrency(r.oteFinal)}</span>
                      </div>
                    );
                  })}
                </div>
                {selectedRows.some((r) => existingGoalMap.has(r.closer.id)) && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>Alguns closers já possuem meta para este mês. Elas serão sobrescritas.</span>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDefineGoals}
              disabled={createGoal.isPending || updateGoal.isPending}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NivelConfigModal open={nivelModalOpen} onOpenChange={setNivelModalOpen} />
    </AppLayout>
  );
}
