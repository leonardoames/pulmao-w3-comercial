import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ContentDailyLog, CONTENT_ITEM_STATUS_LABELS, CONTENT_ITEM_STATUS_COLORS } from '@/types/content';
import { useContentPostItems } from '@/hooks/useContentTracking';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DailyLogViewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: ContentDailyLog | null;
}

export function DailyLogViewSheet({ open, onOpenChange, log }: DailyLogViewSheetProps) {
  const { data: items = [] } = useContentPostItems(log?.date);

  if (!log) return null;

  const requiredItems = items.filter(i => i.is_required);
  const additionalItems = items.filter(i => !i.is_required);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            Registro de {format(new Date(log.date + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Info */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">Responsável:</span>
            <span className="font-medium">{log.responsible_name}</span>
          </div>

          <Separator />

          {/* Posts obrigatórios */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Posts obrigatórios</h4>
            <div className="space-y-2">
              {requiredItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-background/50 border border-border/50">
                  <span className="flex-1 text-sm">{item.label}</span>
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', CONTENT_ITEM_STATUS_COLORS[item.status])}>
                    {CONTENT_ITEM_STATUS_LABELS[item.status]}
                  </span>
                </div>
              ))}
              {requiredItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">Sem itens</p>
              )}
            </div>
          </div>

          {/* Posts adicionais */}
          {additionalItems.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3">Posts adicionais</h4>
              <div className="space-y-2">
                {additionalItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-background/50 border border-border/50">
                    <Badge variant="outline" className="text-xs shrink-0">{item.platform === 'youtube' ? 'YouTube' : 'Instagram'}</Badge>
                    <span className="flex-1 text-sm">{item.label}</span>
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', CONTENT_ITEM_STATUS_COLORS[item.status])}>
                      {CONTENT_ITEM_STATUS_LABELS[item.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Métricas */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Stories', value: log.stories_done_count },
              { label: 'YouTube', value: log.youtube_videos_published_count },
              { label: 'Seguidores @leo', value: log.followers_leo },
              { label: 'Seguidores @w3', value: log.followers_w3 },
            ].map(m => (
              <div key={m.label} className="p-3 rounded-lg bg-background/50 border border-border/50 text-center">
                <p className="text-lg font-bold">{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Observação */}
          {log.notes && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Observação</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{log.notes}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
