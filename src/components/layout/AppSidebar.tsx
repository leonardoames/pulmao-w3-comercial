import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  DollarSign,
  LogOut,
  ClipboardList,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useCanAccessAdminPanel, useCurrentUserRole } from '@/hooks/useUserRoles';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme-toggle';
import { ROLE_LABELS_NEW } from '@/types/roles';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/vendas', icon: DollarSign, label: 'Vendas' },
  { path: '/meu-fechamento', icon: ClipboardList, label: 'Meu Fechamento' },
];

export function AppSidebar() {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const canAccessAdmin = useCanAccessAdminPanel();
  const { data: userRole } = useCurrentUserRole();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-sidebar-primary">Pulmão</span> W3
        </h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1">Comercial</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
              {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Admin Panel Link - Fixed at bottom above user profile */}
      {canAccessAdmin && (
        <div className="px-4 pb-2">
          <Link
            to="/painel-admin"
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
              location.pathname === '/painel-admin'
                ? 'bg-sidebar-accent text-sidebar-primary'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            )}
          >
            <Settings className="h-5 w-5" />
            <span>Painel Admin</span>
            {location.pathname === '/painel-admin' && <ChevronRight className="h-4 w-4 ml-auto" />}
          </Link>
        </div>
      )}

      {/* User Profile */}
      {profile && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10 border-2 border-sidebar-primary">
              <AvatarFallback className="bg-sidebar-accent text-sidebar-primary font-semibold">
                {profile.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile.nome}</p>
              <p className="text-xs text-sidebar-foreground/60">
                {userRole ? ROLE_LABELS_NEW[userRole.role] : 'Carregando...'}
              </p>
            </div>
            <ThemeToggle />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      )}
    </aside>
  );
}
