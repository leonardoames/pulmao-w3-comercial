import { ReactNode, useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  noPadding?: boolean;
}

export function AppLayout({ children, noPadding = false }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true');

  const onToggleCollapse = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'radial-gradient(ellipse at 15% 0%, rgba(249,115,22,0.05) 0%, transparent 55%), hsl(var(--background))',
      }}
    >
      {/* Hamburger button — visible below 1024px */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed lg:hidden z-[1000] flex items-center justify-center"
          style={{
            top: '16px',
            left: '16px',
            width: '44px',
            height: '44px',
            background: 'hsl(var(--card))',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: 'hsl(var(--foreground))',
          }}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <AppSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
      />

      {/* Main content — offset by sidebar width on lg+ */}
      <main className={cn('w-full transition-all duration-300', collapsed ? 'lg:pl-16' : 'lg:pl-[260px]')}>
        {noPadding ? (
          <div style={{ paddingTop: '56px' }}>
            {children}
          </div>
        ) : (
          <div
            className="px-4 pb-6 md:px-6 md:pb-8 lg:px-8"
            style={{ paddingTop: '56px' }}
          >
            {children}
          </div>
        )}
      </main>
    </div>
  );
}
