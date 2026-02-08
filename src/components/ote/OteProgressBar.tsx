import { cn } from '@/lib/utils';
import { OTE_THRESHOLDS } from '@/types/ote';

interface OteProgressBarProps {
  percentAchieved: number;
  showMarkers?: boolean;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function OteProgressBar({ 
  percentAchieved, 
  showMarkers = true, 
  height = 'md',
  className 
}: OteProgressBarProps) {
  const heightClass = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
  }[height];

  // Cap display at 130% for visual purposes
  const displayPercent = Math.min(percentAchieved, 130);
  
  // Get progress color based on achievement
  const getProgressColor = () => {
    if (percentAchieved >= 120) return 'bg-success';
    if (percentAchieved >= 100) return 'bg-primary';
    if (percentAchieved >= 70) return 'bg-primary/80';
    if (percentAchieved >= 50) return 'bg-primary/60';
    return 'bg-primary/40';
  };

  return (
    <div className={cn('relative w-full', className)}>
      {/* Background bar */}
      <div className={cn('w-full bg-muted rounded-full overflow-hidden', heightClass)}>
        {/* Progress fill */}
        <div
          className={cn('h-full rounded-full transition-all duration-500', getProgressColor())}
          style={{ width: `${Math.min(displayPercent / 1.3, 100)}%` }}
        />
      </div>

      {/* Threshold markers */}
      {showMarkers && (
        <div className="absolute inset-0">
          {OTE_THRESHOLDS.map((threshold) => (
            <div
              key={threshold}
              className="absolute top-0 bottom-0 w-0.5"
              style={{ left: `${(threshold / 130) * 100}%` }}
            >
              <div className={cn(
                'absolute inset-0',
                threshold === 100 ? 'bg-foreground' : 'bg-muted-foreground/50'
              )} />
              <span className={cn(
                'absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px]',
                threshold === 100 ? 'font-bold text-foreground' : 'text-muted-foreground'
              )}>
                {threshold}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
