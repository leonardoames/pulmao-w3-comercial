import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { FileText } from 'lucide-react';

export default function MarketingConteudos() {
  return (
    <AppLayout>
      <PageHeader title="Controle de Conteúdos" description="Gerencie os conteúdos de marketing." />
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
        <FileText className="h-16 w-16" />
        <p className="text-lg font-medium">Em breve</p>
        <p className="text-sm">Esta página está sendo construída.</p>
      </div>
    </AppLayout>
  );
}
