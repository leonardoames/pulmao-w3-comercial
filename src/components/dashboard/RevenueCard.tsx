import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { OteProgressBar } from '@/components/ote/OteProgressBar';
import { OteBadge } from '@/components/ote/OteBadge';
import { cn } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RevenueCardProps {
  volumeVendas: number;
  totalVendas: number;
  valorPix: number;
  valorCartao: number;
  valorBoleto: number;
  caixaDoMes: number;
  proporcaoCaixa: number;
  // Closer select
  closers?: { id: string; nome: string }[];
  selectedCloser: string;
  onCloserChange: (value: string) => void;
  // Expected proportion
  expectedProportion: number;
  expectedPercent: number;
  currentDay: number;
  daysInMonth: number;
  // Meta Mensal
  metaMensalValue: number;
  metaMensalPercent: number;
  // OTE
  oteTarget: number;
  oteRealized: number;
  otePercentAchieved: number;
  oteBadge: any;
  oteLabel: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatCurrencyShort = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

function getMetaColor(actual: number, expected: number): string {
  const ratio = expected > 0 ? actual / expected : 1;
  if (ratio >= 1) return '#22C55E';
  if (ratio >= 0.6) return '#FBBF24';
  return '#EF4444';
}

export function RevenueCard({
  volumeVendas,
  totalVendas,
  valorPix,
  valorCartao,
  valorBoleto,
  caixaDoMes,
  proporcaoCaixa,
  closers,
  selectedCloser,
  onCloserChange,
  expectedProportion,
  expectedPercent,
  currentDay,
  daysInMonth,
  metaMensalValue,
  metaMensalPercent,
  oteTarget,
  oteRealized,
  otePercentAchieved,
  oteBadge,
  oteLabel,
}: RevenueCardProps) {
  const total = volumeVendas || 1;
  const pctPix = (valorPix / total) * 100;
  const pctCartao = (valorCartao / total) * 100;
  const pctBoleto = (valorBoleto / total) * 100;

  const segments = [
    { label: 'Pix', value: valorPix, pct: pctPix, color: '#F97316' },
    { label: 'Cartão', value: valorCartao, pct: pctCartao, color: '#FBBF24' },
    { label: 'Boleto', value: valorBoleto, pct: pctBoleto, color: 'rgba(249,115,22,0.4)' },
  ];

  // Filter segments: hide zero-value ones only if at least one has value
  const hasAnyValue = segments.some((s) => s.value > 0);
  const visibleSegments = hasAnyValue ? segments.filter((s) => s.value > 0) : segments;

  // Semantic color for overall expected %
  const expectedVolumeValue = metaMensalValue * expectedProportion;
  const overallColor = getMetaColor(volumeVendas, expectedVolumeValue);
  const overallPctOfExpected = expectedVolumeValue > 0 ? (volumeVendas / expectedVolumeValue) * 100 : 0;

  // OTE
  const hasOteGoal = oteTarget > 0;

  // Unified scale: both bars use 0-120% range
  const maxScale = 120;
  const metaMensalBarPct = metaMensalValue > 0 ? (volumeVendas / metaMensalValue) * 100 : 0;
  const oteBarPct = oteTarget > 0 ? (oteRealized / oteTarget) * 100 : 0;

  // Markers for unified bars
  const barMarkers = [50, 70, 100, 120];

  const renderUnifiedBar = (percent: number, expectedPct: number) => {
    const cappedPercent = Math.min(percent, maxScale);
    const barWidth = (cappedPercent / maxScale) * 100;
    const espLeft = (Math.min(expectedPct, maxScale) / maxScale) * 100;

    return (
      <div className="relative pb-5">
        <div
          className="w-full overflow-hidden"
          style={{ height: '6px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className={cn(
              'h-full transition-all duration-1000',
              percent >= 100 ? 'progress-fill-success' : 'progress-fill'
            )}
            style={{ width: `${Math.min(barWidth, 100)}%`, borderRadius: '999px' }}
          />
        </div>
        {/* Expected marker */}
        <div
          className="absolute"
          style={{
            left: `${espLeft}%`,
            width: '2px',
            height: '14px',
            background: '#FBBF24',
            opacity: 0.8,
            top: '-1px',
          }}
          title={`Esperado: ${expectedPct.toFixed(0)}%`}
        />
        <span
          className="absolute -translate-x-1/2 whitespace-nowrap"
          style={{
            left: `${espLeft}%`,
            top: '14px',
            fontSize: '10px',
            color: '#FBBF24',
            fontWeight: 500,
          }}
        >
          Esp.
        </span>
        {/* Fixed markers */}
        {barMarkers.map((m) => {
          const mLeft = (m / maxScale) * 100;
          return (
            <div key={m}>
              <div
                className="absolute"
                style={{
                  left: `${mLeft}%`,
                  top: '0px',
                  width: '1px',
                  height: '10px',
                  background: m === 100 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
                }}
              />
              <span
                className="absolute -translate-x-1/2"
                style={{
                  left: `${mLeft}%`,
                  bottom: '0px',
                  fontSize: '9px',
                  color: m === 100 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)',
                }}
              >
                {m}%
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card
      className="lg:col-span-2"
      style={{ borderColor: 'rgba(249, 115, 22, 0.3)' }}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <p
            style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}
          >
            Receita
          </p>
          <Select value={selectedCloser} onValueChange={onCloserChange}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="Todos os closers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Closers</SelectItem>
              {closers?.map((closer) => (
                <SelectItem key={closer.id} value={closer.id}>
                  {closer.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Main value block */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <p style={{ fontSize: '36px', fontWeight: 700, color: '#F97316', lineHeight: 1.1 }}>
                {formatCurrency(volumeVendas)}
              </p>
              <span
                className="inline-flex items-center gap-1"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '9999px',
                  padding: '3px 10px',
                  fontSize: '12px',
                  fontWeight: 400,
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                💰 {formatCurrencyShort(caixaDoMes)} em caixa ({proporcaoCaixa.toFixed(0)}%)
              </span>
            </div>
            <p className="mt-1.5" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
              {totalVendas} {totalVendas === 1 ? 'venda' : 'vendas'} no período
            </p>
          </div>
          <div className="text-right shrink-0 ml-4">
            <p className="text-2xl font-bold" style={{ color: overallColor }}>
              {overallPctOfExpected.toFixed(0)}%
            </p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>do esperado</p>
          </div>
        </div>

        {/* Divider before metas */}
        <div className="my-5" style={{ borderTop: '1px solid #222' }} />

        {/* Meta Mensal bar — scale 0-120% */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>Meta Mensal</p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
              {formatCurrencyShort(volumeVendas)} / {formatCurrencyShort(metaMensalValue)}
            </p>
          </div>
          {renderUnifiedBar(metaMensalBarPct, expectedPercent)}
        </div>

        {/* Meta OTE bar — scale 0-120% */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1.5">
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>
              Meta OTE {oteLabel !== 'Time' ? `— ${oteLabel}` : 'do Time'}
            </p>
            {hasOteGoal && (
              <div className="flex items-center gap-2">
                <OteBadge badge={oteBadge} />
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                  {formatCurrencyShort(oteRealized)} / {formatCurrencyShort(oteTarget)}
                </p>
              </div>
            )}
          </div>
          {hasOteGoal ? (
            renderUnifiedBar(oteBarPct, expectedPercent)
          ) : (
            <p className="text-xs text-muted-foreground">Nenhuma meta OTE cadastrada para este mês.</p>
          )}
        </div>

        {/* Divider before breakdown */}
        <div className="my-4" style={{ borderTop: '1px solid #222' }} />

        {/* Payment breakdown label */}
        <p
          className="mb-3"
          style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}
        >
          Formas de Pagamento
        </p>

        {/* Segmented bar — 6px */}
        <div
          className="flex overflow-hidden gap-0.5"
          style={{ height: '6px', borderRadius: '999px' }}
        >
          {segments.map((seg) => (
            <div
              key={seg.label}
              className="revenue-bar-segment"
              style={{
                width: `${Math.max(seg.pct, 0)}%`,
                background: seg.color,
              }}
            />
          ))}
        </div>

        {/* Breakdown grid */}
        <div className={`grid gap-4 mt-4`} style={{ gridTemplateColumns: `repeat(${visibleSegments.length}, minmax(0, 1fr))` }}>
          {visibleSegments.map((seg) => (
            <div key={seg.label} className="flex items-start gap-2">
              <span
                className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                style={{ background: seg.color }}
              />
              <div>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{seg.label}</p>
                <p className="font-semibold text-foreground" style={{ fontSize: '15px' }}>{formatCurrency(seg.value)}</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{seg.pct.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end">
          <Link to="/meta-ote">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              style={{
                border: '1px solid #333',
                color: '#F5F5F5',
                background: 'transparent',
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.background = '#2a2a2a'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent'; }}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Ver detalhes
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}