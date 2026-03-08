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
      className={cn('stat-card animate-fade-in', className)}
      style={{ minHeight: '130px', padding: '24px' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p
            className="font-normal"
            style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}
          >
            {title}
          </p>
          <p
            className="mt-2 tracking-tight truncate"
            style={{
              fontSize: '36px',
              fontWeight: 700,
              color: variant === 'primary' ? '#F97316' : '#FFFFFF',
            }}
          >
            {value}
          </p>
          {subtitle && (
            <p
              className="mt-1"
              style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}
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
        {icon && (
          <div
            className="shrink-0 flex items-center justify-center"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: variant === 'destructive'
                ? 'rgba(239, 68, 68, 0.12)'
                : variant === 'success'
                ? 'rgba(34, 197, 94, 0.12)'
                : variant === 'warning'
                ? 'rgba(251, 191, 36, 0.12)'
                : 'rgba(249, 115, 22, 0.15)',
              color: variant === 'destructive'
                ? '#EF4444'
                : variant === 'success'
                ? '#22C55E'
                : variant === 'warning'
                ? '#FBBF24'
                : '#F97316',
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
