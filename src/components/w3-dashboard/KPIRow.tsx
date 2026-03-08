import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface KPIItem {
  label: string;
  value: string;
  tooltip: string;
  variacao?: number | null; // % vs prev month
  color?: string;
}

interface KPIRowProps {
  items: KPIItem[];
}

export function KPIRow({ items }: KPIRowProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {items.map((item, i) => (
        <Card key={i} className="!p-4" style={{ minHeight: '80px' }}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="uppercase flex items-center gap-1 cursor-help" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>
                  {item.label}
                  <Info className="h-3 w-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
                </p>
              </TooltipTrigger>
              <TooltipContent><p>{item.tooltip}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <p className="mt-1 font-bold" style={{ fontSize: '20px', color: item.color || '#FFFFFF' }}>
            {item.value}
          </p>
          {item.variacao !== undefined && item.variacao !== null && (
            <p className="mt-0.5" style={{ fontSize: '11px', color: item.variacao >= 0 ? '#22C55E' : '#EF4444', fontWeight: 500 }}>
              {item.variacao >= 0 ? '↑' : '↓'} {Math.abs(item.variacao).toFixed(1)}% vs mês anterior
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
