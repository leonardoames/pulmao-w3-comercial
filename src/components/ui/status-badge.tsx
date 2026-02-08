import { cn } from '@/lib/utils';
import { VendaStatus, VENDA_STATUS_LABELS } from '@/types/crm';

interface StatusBadgeProps {
  status: VendaStatus;
  type: 'venda';
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const getLabel = () => {
    return VENDA_STATUS_LABELS[status as VendaStatus];
  };

  const getClassName = () => {
    if (status === 'Ativo') return 'bg-success/15 text-success';
    if (status === 'Congelado') return 'bg-warning/15 text-warning';
    if (status === 'Cancelado') return 'bg-destructive/15 text-destructive';
    if (status === 'Finalizado') return 'bg-muted text-muted-foreground';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full', getClassName())}>
      {getLabel()}
    </span>
  );
}
