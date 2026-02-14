import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { BarChart3 } from 'lucide-react';

export default function MarketingDashboard() {
  return (
    <AppLayout>
      <PageHeader title="Dashboard de Marketing" description="Visão geral das métricas de marketing." />
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
        <BarChart3 className="h-16 w-16" />
        <p className="text-lg font-medium">Em breve</p>
        <p className="text-sm">Esta página está sendo construída.</p>
      </div>
    </AppLayout>
  );
}
