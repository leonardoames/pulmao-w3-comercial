import { StatCard } from '@/components/ui/stat-card';
import { SectionLabel } from '@/components/dashboard/SectionLabel';
import { Card, CardContent } from '@/components/ui/card';
import { FacebookAdsResult } from '@/hooks/useFacebookAdsInsights';
import { DollarSign, Eye, MousePointerClick, Percent, Users, ShoppingBag, AlertTriangle, Settings, CalendarCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface FacebookAdsSectionProps {
  result: FacebookAdsResult | undefined;
  isLoading: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat('pt-BR').format(value);

const formatPercent = (value: number) => `${value.toFixed(2)}%`;

export function FacebookAdsSection({ result, isLoading }: FacebookAdsSectionProps) {
  if (isLoading) {
    return (
      <>
        <SectionLabel title="Facebook Ads" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-lg" />
          ))}
        </div>
      </>
    );
  }

  if (!result || result.status === 'not_configured') {
    return (
      <>
        <SectionLabel title="Facebook Ads" />
        <Card className="mb-10">
          <CardContent className="flex items-center gap-3 py-6">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Facebook Ads não configurado. Entre em contato com o administrador para configurar as credenciais.
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  if (result.status === 'token_expired') {
    return (
      <>
        <SectionLabel title="Facebook Ads" />
        <Card className="mb-10 border-warning/30">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <p className="text-sm text-warning">
              O token do Facebook expirou. Renove o token de acesso nas configurações.
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  if (result.status === 'error') {
    return (
      <>
        <SectionLabel title="Facebook Ads" />
        <Card className="mb-10 border-destructive/30">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">
              Erro ao buscar dados do Facebook: {result.message}
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  const { data } = result;

  return (
    <>
      <SectionLabel title="Facebook Ads" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <StatCard
          title="Gasto Facebook"
          value={formatCurrency(data.spend)}
          icon={<DollarSign className="h-5 w-5" />}
          variant="primary"
        />
        <StatCard
          title="Impressões"
          value={formatNumber(data.impressions)}
          icon={<Eye className="h-5 w-5" />}
        />
        <StatCard
          title="Cliques"
          value={formatNumber(data.clicks)}
          icon={<MousePointerClick className="h-5 w-5" />}
        />
        <StatCard
          title="CTR"
          value={formatPercent(data.ctr)}
          icon={<Percent className="h-5 w-5" />}
        />
        <StatCard
          title="Leads"
          value={formatNumber(data.leads)}
          icon={<Users className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="ScheduledCG"
          value={formatNumber(data.scheduled)}
          icon={<CalendarCheck className="h-5 w-5" />}
          variant="warning"
        />
        <StatCard
          title="Conversões"
          value={formatNumber(data.conversions)}
          icon={<ShoppingBag className="h-5 w-5" />}
        />
      </div>
    </>
  );
}
