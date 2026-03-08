import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Line, ComposedChart, ReferenceLine } from 'recharts';
import { format, subMonths, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface RevenueChartProps {
  /** Map of month ('yyyy-MM') → MRR value */
  monthlyData: Record<string, number>;
  meta: number;
  currentMonth: string;
}

export function RevenueChart({ monthlyData, meta, currentMonth }: RevenueChartProps) {
  const chartData = useMemo(() => {
    const data: { month: string; label: string; receita: number; meta: number }[] = [];
    const baseDate = parse(currentMonth + '-01', 'yyyy-MM-dd', new Date());
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(baseDate, i);
      const key = format(d, 'yyyy-MM');
      const label = format(d, 'MMM/yy', { locale: ptBR });
      data.push({ month: key, label, receita: monthlyData[key] || 0, meta });
    }
    return data;
  }, [monthlyData, meta, currentMonth]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const receita = payload[0]?.value || 0;
    const metaVal = payload[1]?.value || 0;
    const variacao = metaVal > 0 ? ((receita - metaVal) / metaVal * 100) : 0;
    return (
      <div className="rounded-lg p-3" style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px' }}>
        <p className="font-semibold mb-1 capitalize">{label}</p>
        <p style={{ color: '#F97316' }}>Receita: {formatCurrency(receita)}</p>
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Meta: {formatCurrency(metaVal)}</p>
        <p style={{ color: variacao >= 0 ? '#22C55E' : '#EF4444' }}>
          {variacao >= 0 ? '+' : ''}{variacao.toFixed(1)}% vs meta
        </p>
      </div>
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Evolução da Receita</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F97316" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#F97316" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="receita" stroke="#F97316" strokeWidth={2.5} fill="url(#colorReceita)" />
              <Line type="monotone" dataKey="meta" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} strokeDasharray="6 4" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
