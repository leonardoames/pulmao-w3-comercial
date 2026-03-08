import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FunnelData {
  conversas: number;
  convites: number;
  formularios: number;
  agendamentos: number;
  prevConversas: number;
  prevConvites: number;
  prevFormularios: number;
  prevAgendamentos: number;
}

const STEPS = [
  { key: 'conversas', label: 'Conversas Iniciadas', color: '#0EA5E9' },
  { key: 'convites', label: 'Convites Enviados', color: '#8B5CF6' },
  { key: 'formularios', label: 'Formulários Enviados', color: '#F97316' },
  { key: 'agendamentos', label: 'Agendamentos', color: '#22C55E' },
] as const;

function conversionRateColor(pct: number): string {
  if (pct > 30) return '#22C55E';
  if (pct >= 10) return '#FBBF24';
  return '#EF4444';
}

function pctChangeBadge(current: number, previous: number, label: string) {
  if (previous === 0 && current === 0) return null;
  let change: number;
  if (previous === 0) change = 100;
  else change = ((current - previous) / previous) * 100;
  const isPositive = change >= 0;
  const color = isPositive ? '#22C55E' : '#EF4444';
  const bg = isPositive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)';
  return (
    <span
      key={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 500,
        color,
        background: bg,
      }}
    >
      {label} {isPositive ? '↑' : '↓'}{Math.round(Math.abs(change))}%
    </span>
  );
}

export function SocialSellingFunnel({ data }: { data: FunnelData }) {
  const values = [data.conversas, data.convites, data.formularios, data.agendamentos];
  const prevValues = [data.prevConversas, data.prevConvites, data.prevFormularios, data.prevAgendamentos];
  const maxValue = Math.max(...values, 1);
  const allZero = values.every(v => v === 0);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Funil de Conversão</CardTitle>
      </CardHeader>
      <CardContent>
        {allZero ? (
          <p className="text-center py-12" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
            Nenhum registro neste período
          </p>
        ) : (
          <div className="space-y-1">
            {STEPS.map((step, i) => {
              const value = values[i];
              const widthPct = (value / maxValue) * 100;
              const convRate = i < 3 && values[i] > 0
                ? (values[i + 1] / values[i]) * 100
                : null;

              return (
                <div key={step.key}>
                  {/* Step row */}
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: '13px', fontWeight: 500, width: '160px', flexShrink: 0, color: 'rgba(255,255,255,0.8)' }}>
                      {step.label}
                    </span>
                    <div className="flex-1 relative" style={{ height: '36px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.max(widthPct, 2)}%`,
                          background: step.color,
                          borderRadius: '6px',
                          transition: 'width 0.5s ease',
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: '10px',
                          minWidth: '60px',
                        }}
                      >
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                          {value.toLocaleString('pt-BR')} registros
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Conversion arrow between steps */}
                  {convRate !== null && (
                    <div className="flex items-center justify-center py-1">
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: conversionRateColor(convRate),
                      }}>
                        ↓ {convRate.toFixed(1)}% converteram
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Comparison badges */}
        {!allZero && (
          <>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '16px 0 12px' }} />
            <div className="flex flex-wrap gap-2">
              {STEPS.map((step, i) =>
                pctChangeBadge(values[i], prevValues[i], step.label.split(' ')[0])
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
