import { useOteRealized } from '@/hooks/useOteGoals';
import { OteProgressBar } from './OteProgressBar';
import { OteBadge } from './OteBadge';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OteTVPanelProps {
  monthRef: string;
}

export function OteTVPanel({ monthRef }: OteTVPanelProps) {
  const { data: oteData, isLoading } = useOteRealized(monthRef);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get top 5 performers
  const topPerformers = oteData?.slice(0, 5) || [];

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl bg-card border">
        <p className="text-center text-muted-foreground">Carregando metas OTE...</p>
      </div>
    );
  }

  if (topPerformers.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-card border">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-bold">Meta OTE</h3>
        </div>
        <p className="text-center text-muted-foreground py-4">
          Nenhuma meta cadastrada para este mês.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-card border">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="h-6 w-6 text-primary" />
        <h3 className="text-xl font-bold">Top 5 Meta OTE</h3>
      </div>

      <div className="space-y-4">
        {topPerformers.map((closer, index) => (
          <div
            key={closer.closerId}
            className="flex items-center gap-4"
          >
            {/* Position */}
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0',
              index === 0 && 'bg-primary text-primary-foreground',
              index === 1 && 'medal-silver',
              index === 2 && 'medal-bronze',
              index > 2 && 'bg-muted text-muted-foreground'
            )}>
              {index + 1}
            </div>

            {/* Info and progress */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium truncate">{closer.closerNome}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-primary">
                    {closer.percentAchieved.toFixed(0)}%
                  </span>
                  <OteBadge badge={closer.badge} size="sm" />
                </div>
              </div>
              <OteProgressBar 
                percentAchieved={closer.percentAchieved} 
                showMarkers={false}
                height="sm"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{formatCurrency(closer.oteRealized)}</span>
                <span>Meta: {formatCurrency(closer.oteTarget)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
