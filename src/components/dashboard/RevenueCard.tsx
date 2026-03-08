import { Card, CardContent } from '@/components/ui/card';

interface RevenueCardProps {
  volumeVendas: number;
  totalVendas: number;
  valorPix: number;
  valorCartao: number;
  valorBoleto: number;
  caixaDoMes: number;
  proporcaoCaixa: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function RevenueCard({
  volumeVendas,
  totalVendas,
  valorPix,
  valorCartao,
  valorBoleto,
  caixaDoMes,
  proporcaoCaixa,
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

  return (
    <Card
      className="lg:col-span-2"
      style={{ borderColor: 'rgba(249, 115, 22, 0.3)' }}
    >
      <CardContent className="p-6">
        {/* Section title */}
        <p
          className="section-label-text mb-2"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          Receita Total
        </p>
        <div className="flex items-baseline gap-3 flex-wrap">
          <p style={{ fontSize: '36px', fontWeight: 700, color: '#F97316' }}>
            {formatCurrency(volumeVendas)}
          </p>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
            / {formatCurrency(caixaDoMes)} em caixa ({proporcaoCaixa.toFixed(0)}%)
          </span>
        </div>
        <p className="mt-2" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
          {totalVendas} {totalVendas === 1 ? 'venda' : 'vendas'} no período
        </p>

        {/* Segmented bar */}
        <div className="flex rounded-full overflow-hidden mt-6 gap-0.5" style={{ height: '6px' }}>
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

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-start gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                style={{ background: seg.color }}
              />
              <div>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{seg.label}</p>
                <p className="font-semibold text-foreground" style={{ fontSize: '13px' }}>{formatCurrency(seg.value)}</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{seg.pct.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
