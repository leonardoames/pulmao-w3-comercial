import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users } from 'lucide-react';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export interface GestorRow {
  id: string;
  nome: string;
  clientes: number;
  receita: number;
  investimento?: number; // Tráfego Pago only
  faturamento?: number; // Marketplace only
}

interface GestorPerfCardProps {
  rows: GestorRow[];
  type: 'trafego' | 'marketplace';
}

export function GestorPerfCard({ rows, type }: GestorPerfCardProps) {
  const topId = rows[0]?.id;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4" style={{ color: '#8B5CF6' }} />
          Performance por Gestor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gestor</TableHead>
              <TableHead className="text-right">Clientes</TableHead>
              {type === 'trafego' && <TableHead className="text-right">Investimento</TableHead>}
              {type === 'marketplace' && <TableHead className="text-right">Fat. Gerenciado</TableHead>}
              <TableHead className="text-right">Receita</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(g => (
              <TableRow key={g.id}>
                <TableCell className="font-medium">
                  {g.nome}
                  {g.id === topId && rows.length > 1 && <span className="ml-1.5" style={{ fontSize: '11px', color: '#F97316' }}>🏆</span>}
                </TableCell>
                <TableCell className="text-right">{g.clientes}</TableCell>
                {type === 'trafego' && (
                  <TableCell className="text-right" style={{ color: 'rgba(255,255,255,0.5)' }}>{formatCurrency(g.investimento || 0)}</TableCell>
                )}
                {type === 'marketplace' && (
                  <TableCell className="text-right" style={{ color: 'rgba(255,255,255,0.5)' }}>{formatCurrency(g.faturamento || 0)}</TableCell>
                )}
                <TableCell className="text-right font-semibold" style={{ color: '#F97316' }}>{formatCurrency(g.receita)}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sem dados</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
