import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const STATUS_COLORS: Record<string, string> = {
  Ativo: '#22C55E', Pausado: '#FBBF24', Cancelado: '#888888', Trial: '#0EA5E9',
};

export interface TopCliente {
  id: string;
  nome: string;
  valor: number;
  status: string;
  gestor: string;
}

interface TopClientesCardProps {
  clientes: TopCliente[];
}

export function TopClientesCard({ clientes }: TopClientesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Trophy className="h-4 w-4" style={{ color: '#F97316' }} />
          Top 5 Clientes por Valor
        </CardTitle>
      </CardHeader>
      <CardContent>
        {clientes.length > 0 ? (
          <div className="space-y-3">
            {clientes.map((c, i) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground">{i + 1}</div>
                  <div>
                    <p className="font-medium text-sm">{c.nome}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{c.gestor}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold" style={{ color: '#F97316' }}>{formatCurrency(c.valor)}</p>
                  <Badge variant="outline" style={{ fontSize: '10px', borderColor: STATUS_COLORS[c.status] || '#888', color: STATUS_COLORS[c.status] || '#888' }}>
                    {c.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">Nenhum registro no período</p>
        )}
      </CardContent>
    </Card>
  );
}
