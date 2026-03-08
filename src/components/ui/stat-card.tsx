import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: ReactNode;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  trendLabel?: string;
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
}

export function StatCard({
  title,
  value,
  subtitle,
  badge,
  icon,
  trend,
  trendLabel,
  className,
  variant = 'default'
}: StatCardProps) {
  return (
    <div
      className={cn('stat-card animate-fade-in relative', className)}
      style={{ minHeight: '120px', padding: 'clamp(16px, 2vw, 24px)' }}
    >
      {/* Small icon top-right */}
      {icon && (
        <div
          className="absolute flex items-center justify-center"
          style={{
            top: 'clamp(12px, 1.5vw, 16px)',
            right: 'clamp(12px, 1.5vw, 16px)',
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: variant === 'destructive'
              ? 'rgba(239, 68, 68, 0.12)'
              : variant === 'success'
              ? 'rgba(34, 197, 94, 0.12)'
              : variant === 'warning'
              ? 'rgba(251, 191, 36, 0.12)'
              : 'rgba(249, 115, 22, 0.1)',
            color: variant === 'destructive'
              ? '#EF4444'
              : variant === 'success'
              ? '#22C55E'
              : variant === 'warning'
              ? '#FBBF24'
              : '#F97316',
          }}
        >
          <span className="[&>svg]:h-[20px] [&>svg]:w-[20px]">{icon}</span>
        </div>
      )}

      <div className="pr-10">
        <p
          className="font-normal uppercase"
          style={{
            fontSize: 'clamp(11px, 1.2vw, 13px)',
            color: 'rgba(255,255,255,0.45)',
            letterSpacing: '0.08em',
          }}
        >
          {title}
        </p>
        <p
          className="mt-2 tracking-tight"
          style={{
            fontSize: 'clamp(20px, 3vw, 32px)',
            fontWeight: 700,
            color: variant === 'primary' ? '#F97316' : '#FFFFFF',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </p>
        {subtitle && (
          <p
            className="mt-1"
            style={{ fontSize: 'clamp(11px, 1vw, 12px)', color: 'rgba(255,255,255,0.35)' }}
          >
            {subtitle}
          </p>
        )}
        {trend && (
          <div className="mt-2">
            <span className={cn(
              'trend-pill',
              trend.isPositive ? 'trend-pill-positive' : 'trend-pill-negative'
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          </div>
        )}
        {trendLabel && !trend && (
          <div className="mt-2">
            <span className="trend-pill trend-pill-positive">
              ↑ {trendLabel}
            </span>
          </div>
        )}
        {badge && <div className="mt-1">{badge}</div>}
      </div>
    </div>
  );
}
