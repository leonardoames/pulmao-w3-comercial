import { useState, useEffect, useRef } from 'react';
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
  Megaphone,
  ShoppingBag,
  Camera,
  Package,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentUserRole, useIsSocialSelling } from '@/hooks/useUserRoles';
import { usePermissionChecks, ROUTE_TO_RESOURCE } from '@/hooks/useRolePermissions';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ROLE_LABELS_NEW } from '@/types/roles';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const navGroups = [
  {
    label: 'W3 Educação',
    items: [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/vendas', icon: DollarSign, label: 'Vendas' },
      { path: '/meu-fechamento', icon: ClipboardList, label: 'Meu Fechamento' },
      { path: '/meta-ote', icon: Target, label: 'Meta OTE' },
      { path: '/social-selling', icon: Users, label: 'Social Selling' },
    ],
  },
  {
    label: 'W3 Tráfego Pago',
    items: [
      { path: '/trafego-pago/dashboard', icon: BarChart3, label: 'Visão Geral' },
      { path: '/trafego-pago/clientes', icon: Users, label: 'Clientes' },
    ],
  },
  {
    label: 'W3 Marketplaces',
    items: [
      { path: '/marketplaces/dashboard', icon: BarChart3, label: 'Visão Geral' },
      { path: '/marketplaces/clientes', icon: Users, label: 'Clientes' },
    ],
  },
  {
    label: 'Administrativo W3',
    items: [
      { path: '/administrativo/dashboard', icon: BarChart3, label: 'Dashboard' },
      { path: '/administrativo/almoxarifado', icon: Package, label: 'Almoxarifado' },
      { path: '/administrativo/patrimonio', icon: Building2, label: 'Patrimônio' },
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
      { path: '/marketing/dashboard', icon: BarChart3, label: 'Visão Geral' },
    ],
  },
];

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ isOpen = false, onClose }: AppSidebarProps) {
  const location = useLocation();
  const { profile, signOut, refreshProfile } = useAuth();
  const { data: userRole } = useCurrentUserRole();
  const { canView } = usePermissionChecks();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const activeGroupLabel = visibleGroups.find(g =>
    g.items.some(item => location.pathname === item.path)
  )?.label ?? visibleGroups[0]?.label ?? '';

  const [openGroup, setOpenGroup] = useState<string>(activeGroupLabel);

  useEffect(() => {
    const newActive = visibleGroups.find(g =>
      g.items.some(item => location.pathname === item.path)
    )?.label;
    if (newActive) setOpenGroup(newActive);
  }, [location.pathname]);

  const toggleGroup = (label: string) => {
    setOpenGroup(prev => (prev === label ? '' : label));
  };

  const handleLinkClick = () => {
    onClose?.();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    const fileExt = file.name.split('.').pop();
    const filePath = `${profile.id}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error('Erro ao enviar foto');
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: `${publicUrl}?t=${Date.now()}` })
      .eq('id', profile.id);

    if (updateError) {
      toast.error('Erro ao atualizar perfil');
      return;
    }

    toast.success('Foto atualizada!');
    refreshProfile?.();
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
          isActive ? 'font-semibold' : 'font-normal'
        )}
        style={
          isActive
            ? {
                background: 'hsla(24, 94%, 53%, 0.18)',
                borderLeft: '3px solid hsl(24, 94%, 53%)',
                color: 'hsl(24, 94%, 53%)',
                fontWeight: 600,
              }
            : { color: 'hsla(0, 0%, 100%, 0.4)', borderLeft: '3px solid transparent' }
        }
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'hsla(0, 0%, 100%, 0.04)';
            e.currentTarget.style.color = 'hsla(0, 0%, 100%, 0.7)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'hsla(0, 0%, 100%, 0.4)';
          }
        }}
      >
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: '28px', height: '28px', borderRadius: '6px',
            background: isActive ? 'hsla(24, 94%, 53%, 0.2)' : 'transparent',
          }}
        >
          <Icon className="h-4 w-4" style={{ color: isActive ? 'hsl(24, 94%, 53%)' : 'inherit' }} />
        </div>
        <span>{label}</span>
      </Link>
    );
  };

  const renderSystemLink = (path: string, icon: any, label: string) => {
    const Icon = icon;
    const isActive = location.pathname === path;
    return (
      <Link
        key={path}
        to={path}
        onClick={handleLinkClick}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
          isActive ? 'font-medium' : 'font-normal'
        )}
        style={
          isActive
            ? {
                background: 'hsla(0, 0%, 100%, 0.08)',
                color: 'hsla(0, 0%, 100%, 0.85)',
                borderLeft: '3px solid transparent',
              }
            : { color: 'hsla(0, 0%, 100%, 0.35)', borderLeft: '3px solid transparent' }
        }
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'hsla(0, 0%, 100%, 0.04)';
            e.currentTarget.style.color = 'hsla(0, 0%, 100%, 0.6)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'hsla(0, 0%, 100%, 0.35)';
          }
        }}
      >
        <div
          className="flex items-center justify-center shrink-0"
          style={{ width: '28px', height: '28px', borderRadius: '6px' }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[998] lg:hidden" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-[999] h-screen w-[260px] flex flex-col transition-transform duration-300',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{ background: 'hsl(var(--sidebar-background))', borderRight: '1px solid hsla(0, 0%, 100%, 0.06)' }}
      >
        {/* Logo + Close */}
        <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid hsla(0, 0%, 100%, 0.06)' }}>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-primary">Pulmão</span>{' '}
              <span className="text-foreground">W3</span>
            </h1>
            <p className="text-xs mt-1" style={{ color: 'hsla(0, 0%, 100%, 0.25)' }}>Gestão Integrada</p>
          </div>
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
        <nav className="flex-1 px-3 py-4 overflow-y-auto flex flex-col gap-1">
          {visibleGroups.map((group) => {
            const isGroupOpen = openGroup === group.label;
            return (
              <div key={group.label}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-md transition-colors duration-150"
                  style={{
                    fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em',
                    textTransform: 'uppercase', color: 'hsla(0, 0%, 100%, 0.25)', marginBottom: '4px',
                  }}
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    className="h-3 w-3 transition-transform duration-200 ease-in-out"
                    style={{ transform: isGroupOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                  />
                </button>
                <div
                  className="overflow-hidden transition-all duration-200 ease-in-out"
                  style={{
                    maxHeight: isGroupOpen ? `${group.items.length * 48}px` : '0px',
                    opacity: isGroupOpen ? 1 : 0,
                    marginBottom: isGroupOpen ? '8px' : '0px',
                  }}
                >
                  <div className="space-y-0.5">
                    {group.items.map((item) => renderNavLink(item.path, item.icon, item.label))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* SISTEMA section */}
        <div className="px-3 pb-2">
          <div style={{ borderTop: '1px solid hsla(0, 0%, 100%, 0.08)', marginBottom: '8px' }} />
          <span
            className="block px-3 mb-2"
            style={{
              fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em',
              textTransform: 'uppercase', color: 'hsla(0, 0%, 100%, 0.2)',
            }}
          >
            Sistema
          </span>
          <div className="space-y-0.5">
            {renderSystemLink('/tv', Tv, 'Modo TV')}
            {canViewAdmin && renderSystemLink('/painel-admin', Settings, 'Painel Admin')}
          </div>
        </div>

        {/* User Profile */}
        {profile && (
          <div className="p-4" style={{ borderTop: '1px solid hsla(0, 0%, 100%, 0.06)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Avatar className="h-10 w-10 border-2 border-primary/30">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.nome} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {profile.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-4 w-4 text-white" />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">{profile.nome}</p>
                <p className="text-xs" style={{ color: 'hsla(0, 0%, 100%, 0.35)' }}>
                  {userRole ? ROLE_LABELS_NEW[userRole.role] : 'Carregando...'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start transition-colors duration-150"
              style={{ color: 'hsla(0, 0%, 100%, 0.5)' }}
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
