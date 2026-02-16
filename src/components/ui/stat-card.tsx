import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
  variant = 'default'
}: StatCardProps) {
  return (
    <div className={cn(
      'stat-card animate-fade-in',
      variant === 'primary' && 'border-primary/15 bg-primary/[0.03]',
      variant === 'success' && 'border-success/15 bg-success/[0.03]',
      variant === 'warning' && 'border-warning/15 bg-warning/[0.03]',
      variant === 'destructive' && 'border-destructive/15 bg-destructive/[0.03]',
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-2 tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-sm font-medium',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn(
            'p-3 rounded-lg',
            variant === 'default' && 'bg-muted/50',
            variant === 'primary' && 'bg-primary/10 text-primary',
            variant === 'success' && 'bg-success/10 text-success',
            variant === 'warning' && 'bg-warning/10 text-warning',
            variant === 'destructive' && 'bg-destructive/10 text-destructive'
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
