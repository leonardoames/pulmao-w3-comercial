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
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-20 h-14 flex items-center px-4 gap-3"
        style={{
          background: 'hsl(var(--sidebar-background))',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="text-foreground"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="font-bold text-lg">
          <span className="text-primary">Pulmão</span>{' '}
          <span className="text-foreground">W3</span>
        </span>
      </header>

      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="md:pl-64">
        <div className="pt-14 md:pt-0" style={{ padding: '24px 32px', paddingTop: '24px' }}>
          <div className="pt-14 md:pt-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
