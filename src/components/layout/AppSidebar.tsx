import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  DollarSign,
  LogOut,
  ClipboardList,
  ChevronDown,
  Settings,
  Target,
  Users,
  BarChart3,
  FileText,
  Sparkles,
  PenTool,
  CalendarCheck,
  Tv,
  X,
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

  const renderNavLink = (path: string, icon: any, label: string) => {
    const Icon = icon;
    const isActive = location.pathname === path;
    return (
      <Link
        key={path}
        to={path}
        onClick={handleLinkClick}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
          isActive ? 'font-semibold text-foreground' : 'font-normal hover:text-foreground/80'
        )}
        style={
          isActive
            ? { background: 'rgba(249, 115, 22, 0.15)', borderLeft: '3px solid #F97316', color: '#FFFFFF' }
            : { color: 'rgba(255,255,255,0.5)', borderLeft: '3px solid transparent' }
        }
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
          }
        }}
      >
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: '28px', height: '28px', borderRadius: '6px',
            background: isActive ? 'rgba(249, 115, 22, 0.2)' : 'transparent',
          }}
        >
          <Icon className="h-4 w-4" style={{ color: isActive ? '#F97316' : 'inherit' }} />
        </div>
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Overlay — visible on <1024px when sidebar is open */}
      {isOpen && (
        <div className="fixed inset-0 z-[998] lg:hidden" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-[999] h-screen w-[260px] flex flex-col transition-transform duration-300',
          // Mobile/tablet: hidden by default, shown when isOpen
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{ background: 'hsl(var(--sidebar-background))', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Logo + Close button */}
        <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-primary">Pulmão</span>{' '}
              <span className="text-foreground">W3</span>
            </h1>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Gestão Integrada</p>
          </div>
          {/* Close button — only on <1024px */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden text-foreground/60 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto" style={{ gap: '24px', display: 'flex', flexDirection: 'column' }}>
          {visibleGroups.map((group) => {
            const isGroupOpen = openGroups[group.label] ?? true;
            return (
              <div key={group.label}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-md transition-colors duration-150"
                  style={{
                    fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em',
                    textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '8px',
                  }}
                >
                  <span>{group.label}</span>
                  <ChevronDown className={cn('h-3 w-3 transition-transform duration-200', !isGroupOpen && '-rotate-90')} />
                </button>
                <div className={cn(
                  'space-y-0.5 overflow-hidden transition-all duration-200',
                  isGroupOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                )}>
                  {group.items.map((item) => renderNavLink(item.path, item.icon, item.label))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom links */}
        <div className="px-3 pb-2 space-y-1">
          {renderNavLink('/tv', Tv, 'Modo TV')}
          {canViewAdmin && renderNavLink('/painel-admin', Settings, 'Painel Admin')}
        </div>

        {/* User Profile */}
        {profile && (
          <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10 border-2 border-primary/30">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {profile.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">{profile.nome}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {userRole ? ROLE_LABELS_NEW[userRole.role] : 'Carregando...'}
                </p>
              </div>
              <ThemeToggle />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start transition-colors duration-150"
              style={{ color: 'rgba(255,255,255,0.5)' }}
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
