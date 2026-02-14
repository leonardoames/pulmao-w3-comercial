import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="pl-64">
        <div className="mx-auto max-w-[1320px] px-6 py-8 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
