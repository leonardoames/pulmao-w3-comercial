import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  DollarSign,
  LogOut,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Settings,
  Target,
  Users,
  BarChart3,
  FileText,
  Sparkles,
  PenTool,
  CalendarCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentUserRole, useIsSocialSelling } from '@/hooks/useUserRoles';
import { usePermissionChecks, ROUTE_TO_RESOURCE } from '@/hooks/useRolePermissions';
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
    label: 'Conteúdo',
    items: [
      { path: '/conteudo/dashboard', icon: BarChart3, label: 'Dashboard de Conteúdo' },
      { path: '/conteudo/acompanhamento', icon: CalendarCheck, label: 'Acompanhamento Diário' },
      { path: '/conteudo/controle', icon: FileText, label: 'Controle de Conteúdos' },
      { path: '/conteudo/twitter', icon: PenTool, label: 'Gerador Twitter' },
      { path: '/conteudo/ai', icon: Sparkles, label: 'Agentes IA' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { path: '/marketing/dashboard', icon: BarChart3, label: 'Dashboard' },
    ],
  },
];

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ isOpen = false, onClose }: AppSidebarProps) {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { data: userRole } = useCurrentUserRole();
  const { canView } = usePermissionChecks();

  const visibleGroups = navGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        const resourceKey = ROUTE_TO_RESOURCE[item.path];
        return resourceKey ? canView(resourceKey) : true;
      }),
    }))
    .filter(group => group.items.length > 0);

  const canViewAdmin = canView('route:painel-admin');

  const initialOpen = visibleGroups.reduce((acc, group) => {
    acc[group.label] = group.items.some((item) => location.pathname === item.path);
    return acc;
  }, {} as Record<string, boolean>);

  const allClosed = !Object.values(initialOpen).some(Boolean);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    allClosed
      ? visibleGroups.reduce((acc, g) => ({ ...acc, [g.label]: true }), {} as Record<string, boolean>)
      : initialOpen
  );

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLinkClick = () => {
    onClose?.();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300',
          // Mobile: hidden by default, slides in when open
          '-translate-x-full md:translate-x-0',
          isOpen && 'translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-sidebar-primary">Pulmão</span> W3
          </h1>
          <p className="text-xs text-sidebar-foreground/60 mt-1">Gestão Integrada</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {visibleGroups.map((group) => {
            const isGroupOpen = openGroups[group.label] ?? true;
            return (
              <div key={group.label}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground/70 transition-colors"
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      !isGroupOpen && '-rotate-90'
                    )}
                  />
                </button>
                <div
                  className={cn(
                    'mt-1 space-y-1 overflow-hidden transition-all duration-200',
                    isGroupOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                  )}
                >
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={handleLinkClick}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-primary text-primary-foreground'
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
            );
          })}
        </nav>

        {/* Admin Panel Link */}
        {canViewAdmin && (
          <div className="px-4 pb-2">
            <Link
              to="/painel-admin"
              onClick={handleLinkClick}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                location.pathname === '/painel-admin'
                  ? 'bg-primary text-primary-foreground'
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
    </>
  );
}
