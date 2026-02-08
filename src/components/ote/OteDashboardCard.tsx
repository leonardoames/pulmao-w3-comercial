import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOteRealized, useOteTeamStats } from '@/hooks/useOteGoals';
import { useClosers } from '@/hooks/useProfiles';
import { useCurrentUserRole } from '@/hooks/useUserRoles';
import { OteProgressBar } from './OteProgressBar';
import { OteBadge } from './OteBadge';
import { Target, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface OteDashboardCardProps {
  monthRef?: string;
  selectedCloser?: string;
  onCloserChange?: (closerId: string) => void;
  showCloserFilter?: boolean;
}

export function OteDashboardCard({ 
  monthRef = format(new Date(), 'yyyy-MM'),
  selectedCloser = 'all',
  onCloserChange,
  showCloserFilter = true,
}: OteDashboardCardProps) {
  const { data: userRole } = useCurrentUserRole();
  const isCloser = userRole?.role === 'CLOSER';
  const { data: closers } = useClosers();
  
  const closerId = selectedCloser === 'all' ? undefined : selectedCloser;
  const { data: oteData, isLoading } = useOteRealized(monthRef, closerId);
  const { data: teamStats } = useOteTeamStats(monthRef);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Use individual closer data if one is selected, otherwise use team stats
  const displayData = selectedCloser !== 'all' && oteData?.[0]
    ? {
        target: oteData[0].oteTarget,
        realized: oteData[0].oteRealized,
        percentAchieved: oteData[0].percentAchieved,
        badge: oteData[0].badge,
        label: oteData[0].closerNome,
      }
    : {
        target: teamStats?.totalTarget || 0,
        realized: teamStats?.totalRealized || 0,
        percentAchieved: teamStats?.percentAchieved || 0,
        badge: teamStats?.badge || null,
        label: 'Time',
      };

  const hasGoal = displayData.target > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" />
            Meta OTE do Mês
          </CardTitle>
          
          {showCloserFilter && !isCloser && onCloserChange && (
            <Select value={selectedCloser} onValueChange={onCloserChange}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {closers?.map((closer) => (
                  <SelectItem key={closer.id} value={closer.id}>
                    {closer.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : hasGoal ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{displayData.label}</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(displayData.realized)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {formatCurrency(displayData.target)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {displayData.percentAchieved.toFixed(0)}%
                </span>
                <OteBadge badge={displayData.badge} />
              </div>
            </div>
            
            <div className="pb-4">
              <OteProgressBar percentAchieved={displayData.percentAchieved} height="md" />
            </div>

            <Link to="/meta-ote">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <TrendingUp className="h-4 w-4" />
                Ver detalhes
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Nenhuma meta cadastrada para este mês.
            </p>
            <Link to="/meta-ote">
              <Button variant="outline" size="sm">
                Ir para Metas OTE
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
