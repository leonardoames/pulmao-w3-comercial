import { ReactNode, useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { Menu } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'radial-gradient(ellipse at 15% 0%, rgba(249,115,22,0.05) 0%, transparent 55%), hsl(var(--background))',
      }}
    >
      {/* Hamburger button — visible below 1024px */}
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

      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content — offset by sidebar width on lg+ */}
      <main className="w-full lg:pl-[260px]">
        <div
          className="px-4 pb-6 md:px-6 md:pb-8 lg:px-8"
          style={{ paddingTop: '72px' }}
        >
          <div className="lg:pt-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
