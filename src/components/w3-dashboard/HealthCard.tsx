import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Activity, Info } from 'lucide-react';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface StatusGroup {
  label: string;
  count: number;
  mrr: number;
  color: string;
}

interface HealthCardProps {
  groups: StatusGroup[];
  ltv: number | null;
}

const STATUS_CONFIG: Record<string, { color: string }> = {
  Ativo: { color: '#22C55E' },
  Pausado: { color: '#FBBF24' },
  Atrasado: { color: '#EF4444' },
  Cancelado: { color: '#888888' },
  Trial: { color: '#0EA5E9' },
};

export function HealthCard({ groups, ltv }: HealthCardProps) {
  const hasAlert = groups.some(g => g.label === 'Atrasado' && g.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4" style={{ color: '#F97316' }} />
          Saúde da Carteira
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {groups.map(g => (
          <div key={g.label} className="flex items-center justify-between p-3 rounded-xl" style={{
            background: g.label === 'Atrasado' && g.count > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
          }}>
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: g.color }} />
              <span className="text-sm font-medium">{g.label}</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-sm">{g.count}</span>
              <span className="ml-2 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{formatCurrency(g.mrr)}</span>
            </div>
          </div>
        ))}

        {hasAlert && (
          <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <span style={{ fontSize: '12px', color: '#EF4444', fontWeight: 600 }}>
              ⚠ Existem clientes com pagamento atrasado
            </span>
          </div>
        )}

        {ltv !== null && ltv > 0 && (
          <div className="pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-between cursor-help">
                    <span className="text-sm flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Valor de Vida do Cliente
                      <Info className="h-3 w-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
                    </span>
                    <span className="font-bold text-sm" style={{ color: '#F97316' }}>{formatCurrency(ltv)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent><p>Quanto um cliente gera em média durante todo o tempo com você. Calculado como: Valor Médio por Cliente × Tempo Médio de Permanência</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
