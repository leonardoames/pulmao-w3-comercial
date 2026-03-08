import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

export interface AlertaItem {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'atrasado' | 'pendente' | 'sem-registro';
}

interface AlertasCardProps {
  alertas: AlertaItem[];
}

export function AlertasCard({ alertas }: AlertasCardProps) {
  if (alertas.length === 0) return null;

  const bgColor = (tipo: string) =>
    tipo === 'atrasado' ? 'rgba(239,68,68,0.05)' : 'rgba(251,191,36,0.05)';
  const iconColor = (tipo: string) =>
    tipo === 'atrasado' ? '#EF4444' : '#FBBF24';
  const badgeLabel = (tipo: string) =>
    tipo === 'atrasado' ? 'Atrasado' : tipo === 'pendente' ? 'Pendente' : 'Sem registro';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" style={{ color: '#EF4444' }} />
          Alertas Operacionais
          <Badge variant="destructive" className="ml-auto text-xs">{alertas.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {alertas.map(a => (
          <div key={a.id} className="flex items-center justify-between px-4 py-3" style={{
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: bgColor(a.tipo),
          }}>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: iconColor(a.tipo) }} />
              <div>
                <p className="font-medium text-sm">{a.nome}</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{a.descricao}</p>
              </div>
            </div>
            <Badge variant="outline" style={{
              borderColor: iconColor(a.tipo), color: iconColor(a.tipo), fontSize: '10px',
            }}>
              {badgeLabel(a.tipo)}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
