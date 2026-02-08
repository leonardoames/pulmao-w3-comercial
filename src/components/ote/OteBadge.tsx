import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { OteRealized } from '@/types/ote';

interface OteBadgeProps {
  badge: OteRealized['badge'];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function OteBadge({ badge, size = 'md', className }: OteBadgeProps) {
  if (!badge) return null;

  const sizeClass = {
    sm: 'text-xs px-1.5 py-0',
    md: 'text-sm px-2 py-0.5',
    lg: 'text-base px-3 py-1',
  }[size];

  const variantClass = {
    '50%': 'bg-muted text-muted-foreground border-muted-foreground/30',
    '70%': 'bg-primary/20 text-primary border-primary/30',
    '100%': 'bg-primary text-primary-foreground border-primary',
    '120%': 'bg-success text-success-foreground border-success',
  }[badge];

  return (
    <Badge 
      variant="outline" 
      className={cn(sizeClass, variantClass, className)}
    >
      {badge}
    </Badge>
  );
}
