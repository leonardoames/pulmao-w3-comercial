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
    { label: 'Pix', value: valorPix, pct: pctPix, color: 'bg-primary', dot: 'bg-primary' },
    { label: 'Cartão', value: valorCartao, pct: pctCartao, color: 'bg-[hsl(30,98%,71%)]', dot: 'bg-[hsl(30,98%,71%)]' },
    { label: 'Boleto', value: valorBoleto, pct: pctBoleto, color: 'bg-[hsl(27,100%,87%)]', dot: 'bg-[hsl(27,100%,87%)]' },
  ];

  return (
    <Card className="lg:col-span-2 border-primary/30 shadow-[0_0_20px_rgba(244,122,20,0.08)]">
      <CardContent className="p-8">
        {/* Header */}
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Receita Total</p>
        <div className="flex items-baseline gap-3 flex-wrap">
          <p className="text-4xl font-bold tracking-tight text-primary">
            {formatCurrency(volumeVendas)}
          </p>
          <span className="text-sm text-muted-foreground font-medium">
            / {formatCurrency(caixaDoMes)} em caixa ({proporcaoCaixa.toFixed(0)}%)
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {totalVendas} {totalVendas === 1 ? 'venda' : 'vendas'} no período
        </p>

        {/* Segmented bar */}
        <div className="flex h-2 rounded-full overflow-hidden mt-6">
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
