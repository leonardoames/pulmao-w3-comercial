import { ReactNode, useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile topbar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-20 h-14 bg-sidebar border-b border-sidebar-border flex items-center px-4 gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-sidebar-foreground font-bold text-lg">
          <span className="text-sidebar-primary">Pulmão</span> W3
        </span>
      </header>

      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="md:pl-64">
        <div className="pt-14 md:pt-0 p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
