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
  const displayPercent = Math.min(percentAchieved, 130);

  return (
    <div className={cn('relative w-full', className)}>
      {/* Background track — always 6px */}
      <div
        className="w-full overflow-hidden"
        style={{
          height: '6px',
          borderRadius: '999px',
          background: 'rgba(255,255,255,0.08)',
        }}
      >
        <div
          className={cn(
            'h-full transition-all duration-700',
            percentAchieved >= 120 ? 'progress-fill-success' : 'progress-fill'
          )}
          style={{
            width: `${Math.min(displayPercent / 1.3, 100)}%`,
            borderRadius: '999px',
          }}
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
