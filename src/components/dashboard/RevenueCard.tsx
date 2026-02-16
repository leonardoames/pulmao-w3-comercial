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
  const total = volumeVendas || 1; // avoid division by zero
  const pctPix = (valorPix / total) * 100;
  const pctCartao = (valorCartao / total) * 100;
  const pctBoleto = (valorBoleto / total) * 100;

  const segments = [
    { label: 'Pix', value: valorPix, pct: pctPix, color: 'bg-success', dot: 'bg-success' },
    { label: 'Cartão', value: valorCartao, pct: pctCartao, color: 'bg-info', dot: 'bg-info' },
    { label: 'Boleto', value: valorBoleto, pct: pctBoleto, color: 'bg-warning', dot: 'bg-warning' },
  ];

  return (
    <Card className="lg:col-span-2">
      <CardContent className="p-6">
        {/* Header */}
        <p className="text-sm font-medium text-muted-foreground mb-1">Receita Total</p>
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="text-4xl font-bold tracking-tight text-foreground">
            {formatCurrency(volumeVendas)}
          </p>
          <span className="text-base text-muted-foreground font-medium">
            / {formatCurrency(caixaDoMes)} em caixa ({proporcaoCaixa.toFixed(0)}%)
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {totalVendas} {totalVendas === 1 ? 'venda' : 'vendas'} no período
        </p>

        {/* Segmented bar */}
        <div className="flex h-3 rounded-full overflow-hidden mt-5 gap-0.5">
          {segments.map((seg) => (
            <div
              key={seg.label}
              className={`${seg.color} revenue-bar-segment`}
              style={{ width: `${Math.max(seg.pct, 0)}%` }}
            />
          ))}
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-start gap-2">
              <span className={`${seg.dot} w-2.5 h-2.5 rounded-full mt-1.5 shrink-0`} />
              <div>
                <p className="text-xs text-muted-foreground">{seg.label}</p>
                <p className="text-sm font-semibold">{formatCurrency(seg.value)}</p>
                <p className="text-xs text-muted-foreground">{seg.pct.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
