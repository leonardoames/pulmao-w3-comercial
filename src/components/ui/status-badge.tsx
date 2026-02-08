import { cn } from '@/lib/utils';
import { LeadStatusFunil, CallStatus, VendaStatus, STATUS_FUNIL_LABELS, CALL_STATUS_LABELS, VENDA_STATUS_LABELS } from '@/types/crm';

interface StatusBadgeProps {
  status: LeadStatusFunil | CallStatus | VendaStatus;
  type: 'funil' | 'call' | 'venda';
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const getLabel = () => {
    if (type === 'funil') return STATUS_FUNIL_LABELS[status as LeadStatusFunil];
    if (type === 'call') return CALL_STATUS_LABELS[status as CallStatus];
    return VENDA_STATUS_LABELS[status as VendaStatus];
  };

  const getClassName = () => {
    // Funil statuses
    if (status === 'Novo') return 'funil-novo';
    if (status === 'ContatoFeito') return 'funil-contato';
    if (status === 'CallAgendada' || status === 'Agendada') return 'funil-agendada';
    if (status === 'CallRealizada' || status === 'Realizada') return 'funil-realizada';
    if (status === 'NoShow' || status === 'No-show') return 'funil-noshow';
    if (status === 'Perdido' || status === 'Cancelada' || status === 'Cancelado') return 'funil-perdido';
    if (status === 'Ganho' || status === 'Ativo' || status === 'Finalizado') return 'funil-ganho';
    if (status === 'Remarcada' || status === 'Congelado') return 'funil-agendada';
    return 'funil-novo';
  };

  return (
    <span className={cn('funil-badge', getClassName())}>
      {getLabel()}
    </span>
  );
}
