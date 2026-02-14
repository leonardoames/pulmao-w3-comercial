import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  DollarSign,
  LogOut,
  ClipboardList,
  ChevronRight,
  Settings,
  Target,
  Users,
  BarChart3,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useCanAccessAdminPanel, useCurrentUserRole, useIsSocialSelling } from '@/hooks/useUserRoles';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme-toggle';
import { ROLE_LABELS_NEW } from '@/types/roles';

const navGroups = [
  {
    label: 'Comercial',
    items: [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/vendas', icon: DollarSign, label: 'Vendas' },
      { path: '/meu-fechamento', icon: ClipboardList, label: 'Meu Fechamento' },
      { path: '/meta-ote', icon: Target, label: 'Meta OTE' },
      { path: '/social-selling', icon: Users, label: 'Social Selling' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { path: '/marketing/dashboard', icon: BarChart3, label: 'Dashboard' },
      { path: '/marketing/conteudos', icon: FileText, label: 'Controle de Conteúdos' },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const canAccessAdmin = useCanAccessAdminPanel();
  const { data: userRole } = useCurrentUserRole();
  const isSocialSelling = useIsSocialSelling();

  // Social Selling users only see Social Selling page
  const visibleGroups = isSocialSelling
    ? [
        {
          label: 'Comercial',
          items: [{ path: '/social-selling', icon: Users, label: 'Social Selling' }],
        },
      ]
    : navGroups;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-sidebar-primary">Pulmão</span> W3
        </h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1">Gestão Integrada</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              {group.label}
            </p>
            <div className="mt-1 space-y-1">
              {group.items.map((item) => {
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
            </div>
          </div>
        ))}
      </nav>

      {/* Admin Panel Link */}
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
