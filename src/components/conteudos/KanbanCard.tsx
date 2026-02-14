import { ConteudoMarketing, CONTEUDO_STATUS_LABELS, CONTEUDO_STATUS_COLORS, ConteudoStatus } from '@/types/conteudo';
import { Profile } from '@/types/crm';
import { CalendarDays, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface KanbanCardProps {
  conteudo: ConteudoMarketing;
  profiles: Profile[];
  onClick: () => void;
}

export function KanbanCard({ conteudo, profiles, onClick }: KanbanCardProps) {
  const responsavel = profiles.find((p) => p.id === conteudo.responsavel_user_id);

  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow space-y-2"
    >
      <p className="text-sm font-semibold leading-tight truncate">{conteudo.titulo || 'Sem título'}</p>

      {responsavel && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span className="truncate">{responsavel.nome}</span>
        </div>
      )}

      {conteudo.tipo_conteudo.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {conteudo.tipo_conteudo.map((t) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {t}
            </span>
          ))}
        </div>
      )}

      {conteudo.onde_postar.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {conteudo.onde_postar.map((o) => (
            <span key={o} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              {o}
            </span>
          ))}
        </div>
      )}

      {conteudo.data_publicacao && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="h-3 w-3" />
          <span>{format(new Date(conteudo.data_publicacao + 'T12:00:00'), 'dd/MM/yyyy')}</span>
        </div>
      )}
    </div>
  );
}
