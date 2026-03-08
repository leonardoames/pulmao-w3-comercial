import { cn } from '@/lib/utils';
import { OTE_THRESHOLDS } from '@/types/ote';

interface OteProgressBarProps {
  percentAchieved: number;
  showMarkers?: boolean;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
  expectedPercent?: number;
}

export function OteProgressBar({ 
  percentAchieved, 
  showMarkers = true, 
  height = 'md',
  className,
  expectedPercent,
}: OteProgressBarProps) {
  // Cap display at 130% for visual purposes
  const displayPercent = Math.min(percentAchieved, 130);

  const barHeight = height === 'lg' ? '8px' : '6px';

  return (
    <div className={cn('relative w-full', className)}>
      {/* Background track */}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{
          height: barHeight,
          background: 'rgba(255,255,255,0.08)',
        }}
      >
        {/* Progress fill with gradient */}
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700',
            percentAchieved >= 120 ? 'progress-fill-success' : 'progress-fill'
          )}
          style={{ width: `${Math.min(displayPercent / 1.3, 100)}%` }}
        />
      </div>

      {/* Threshold markers */}
      {showMarkers && (
        <div className="absolute inset-0">
          {OTE_THRESHOLDS.map((threshold) => (
            <div
              key={threshold}
              className="absolute top-1/2 -translate-y-1/2"
              style={{
                left: `${(threshold / 130) * 100}%`,
                width: '2px',
                height: '12px',
                background: threshold === 100 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
          {OTE_THRESHOLDS.map((threshold) => (
            <span
              key={`label-${threshold}`}
              className="absolute -translate-x-1/2"
              style={{
                left: `${(threshold / 130) * 100}%`,
                bottom: '-18px',
                fontSize: '10px',
                color: threshold === 100 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)',
                fontWeight: threshold === 100 ? 600 : 400,
              }}
            >
              {threshold}%
            </span>
          ))}

          {/* Expected progress ghost ruler */}
          {expectedPercent !== undefined && (
            <>
              <div
                className="absolute top-1/2 -translate-y-1/2"
                style={{
                  left: `${(Math.min(expectedPercent, 130) / 130) * 100}%`,
                  width: '2px',
                  height: '14px',
                  background: '#FBBF24',
                  opacity: 0.8,
                }}
                title={`Esperado: ${expectedPercent.toFixed(0)}%`}
              />
              <span
                className="absolute -translate-x-1/2 whitespace-nowrap"
                style={{
                  left: `${(Math.min(expectedPercent, 130) / 130) * 100}%`,
                  bottom: '-18px',
                  fontSize: '10px',
                  color: '#FBBF24',
                  fontWeight: 500,
                }}
              >
                Esp.
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
