import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ORIGEM_LEAD_OPTIONS, Venda } from '@/types/crm';
import { Link } from 'react-router-dom';

interface OrigemLeadCardProps {
  vendas: Venda[];
}

export function OrigemLeadCard({ vendas }: OrigemLeadCardProps) {
  const byOrigem = ORIGEM_LEAD_OPTIONS.map(origem => {
    const filtered = vendas.filter(v => v.origem_lead === origem);
    return {
      origem,
      quantidade: filtered.length,
      volume: filtered.reduce((acc, v) => acc + Number(v.valor_total ?? 0), 0),
    };
  });

  const semOrigem = vendas.filter(v => !v.origem_lead).length;
  const totalVendas = vendas.length;
  const maxQuantidade = Math.max(...byOrigem.map(o => o.quantidade), 1);

  const withValue = byOrigem.filter(o => o.quantidade > 0);
  const withoutValue = byOrigem.filter(o => o.quantidade === 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Origem dos Leads</CardTitle>
        <p className="text-sm text-muted-foreground">Distribuição por canal de entrada</p>
      </CardHeader>
      <CardContent className="space-y-0">
        {/* Channels with sales */}
        <div className="space-y-4">
          {withValue.map(({ origem, quantidade, volume }) => {
            const pctOfTotal = totalVendas > 0 ? (quantidade / totalVendas) * 100 : 0;
            const barWidth = maxQuantidade > 0 ? (quantidade / maxQuantidade) * 100 : 0;
            return (
              <div key={origem}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#F97316' }} />
                    <span style={{ fontSize: '14px', fontWeight: 500 }} className="text-foreground">{origem}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                      {quantidade} venda{quantidade !== 1 ? 's' : ''}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#F97316', minWidth: 80, textAlign: 'right' as const }}>
                      {formatCurrency(volume)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 overflow-hidden"
                    style={{ height: '4px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="h-full transition-all duration-700"
                      style={{
                        width: `${barWidth}%`,
                        borderRadius: '999px',
                        background: '#F97316',
                        opacity: 0.8,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', minWidth: 36, textAlign: 'right' as const }}>
                    {pctOfTotal.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Channels with zero sales */}
        {withoutValue.length > 0 && (
          <>
            <div className="my-3" style={{ borderTop: '1px solid #1e1e1e' }} />
            <div className="space-y-1.5">
              {withoutValue.map(({ origem }) => (
                <div key={origem} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }} />
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{origem}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>0 vendas</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Alert for missing origin */}
        {semOrigem > 0 && (
          <div
            className="mt-4 flex items-center justify-between"
            style={{
              background: 'rgba(251,191,36,0.08)',
              borderLeft: '3px solid #FBBF24',
              borderRadius: '8px',
              padding: '10px 14px',
            }}
          >
            <span style={{ fontSize: '13px', color: '#FBBF24' }}>
              ⚠ {semOrigem} venda{semOrigem !== 1 ? 's' : ''} sem origem definida
            </span>
            <Link to="/vendas?filter=sem-origem">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                style={{ color: '#FBBF24' }}
              >
                Corrigir →
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
