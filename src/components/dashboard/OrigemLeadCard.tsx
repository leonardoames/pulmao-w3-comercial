import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ORIGEM_LEAD_OPTIONS, OrigemLead, Venda } from '@/types/crm';

interface OrigemLeadCardProps {
  vendas: Venda[];
}

const ORIGEM_COLORS: Record<OrigemLead, string> = {
  'Tráfego Pago': '#3B82F6',
  'Formulário Direto': '#22C55E',
  'Bio': '#A855F7',
  'SDR': '#F97316',
  'Social Selling': '#EC4899',
};

export function OrigemLeadCard({ vendas }: OrigemLeadCardProps) {
  const byOrigem = ORIGEM_LEAD_OPTIONS.map(origem => {
    const filtered = vendas.filter(v => v.origem_lead === origem);
    return {
      origem,
      quantidade: filtered.length,
      volume: filtered.reduce((acc, v) => acc + Number(v.valor_total ?? 0), 0),
      color: ORIGEM_COLORS[origem],
    };
  });

  const semOrigem = vendas.filter(v => !v.origem_lead).length;
  const maxQuantidade = Math.max(...byOrigem.map(o => o.quantidade), 1);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>Origem dos Leads</CardTitle>
          <p className="text-sm text-muted-foreground">Distribuição por canal de entrada</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {byOrigem.map(({ origem, quantidade, volume, color }) => (
            <div key={origem} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-sm font-medium text-foreground">{origem}</span>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <span className="text-xs text-muted-foreground">
                    {quantidade} venda{quantidade !== 1 ? 's' : ''}
                  </span>
                  <span className="text-sm font-bold" style={{ color, minWidth: 80, textAlign: 'right' }}>
                    {formatCurrency(volume)}
                  </span>
                </div>
              </div>
              {/* Proportion bar */}
              <div
                className="w-full overflow-hidden"
                style={{ height: '4px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)' }}
              >
                <div
                  className="h-full transition-all duration-700"
                  style={{
                    width: `${maxQuantidade > 0 ? (quantidade / maxQuantidade) * 100 : 0}%`,
                    borderRadius: '999px',
                    background: color,
                    opacity: 0.8,
                  }}
                />
              </div>
            </div>
          ))}
          {semOrigem > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-between px-3 pt-2 border-t border-border cursor-help">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: '#888888' }} />
                    <span className="text-xs text-muted-foreground">Sem origem definida</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{semOrigem}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Vendas sem canal de origem registrado. Edite as vendas para corrigir.</p>
              </TooltipContent>
            </Tooltip>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
