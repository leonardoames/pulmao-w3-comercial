import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/roles';
import { useCurrentUserRole } from './useUserRoles';
import { toast } from 'sonner';

// Default permissions fallback per role (used when DB has no records for a role)
const DEFAULT_PERMISSIONS: Partial<Record<AppRole, Record<string, { can_view: boolean; can_edit: boolean }>>> = {
  ANALISTA_CONTEUDO: {
    'route:dashboard': { can_view: false, can_edit: false },
    'route:vendas': { can_view: false, can_edit: false },
    'route:meu-fechamento': { can_view: false, can_edit: false },
    'route:meta-ote': { can_view: false, can_edit: false },
    'route:social-selling': { can_view: false, can_edit: false },
    'route:leads': { can_view: false, can_edit: false },
    'route:trafego-pago-dashboard': { can_view: false, can_edit: false },
    'route:trafego-pago-clientes': { can_view: false, can_edit: false },
    'route:marketplaces-dashboard': { can_view: false, can_edit: false },
    'route:marketplaces-clientes': { can_view: false, can_edit: false },
    'route:conteudo-dashboard': { can_view: true, can_edit: true },
    'route:conteudo-acompanhamento': { can_view: true, can_edit: true },
    'route:conteudo-controle': { can_view: true, can_edit: true },
    'route:conteudo-twitter': { can_view: true, can_edit: true },
    'route:conteudo-ai': { can_view: true, can_edit: true },
    'route:marketing-dashboard': { can_view: true, can_edit: false },
    'route:painel-admin': { can_view: false, can_edit: false },
    'section:dashboard:receita': { can_view: false, can_edit: false },
    'section:dashboard:performance': { can_view: false, can_edit: false },
    'section:dashboard:destaques': { can_view: false, can_edit: false },
    'section:dashboard:ote': { can_view: false, can_edit: false },
    'section:vendas:criar': { can_view: false, can_edit: false },
    'section:vendas:exportar': { can_view: false, can_edit: false },
    'section:vendas:editar': { can_view: false, can_edit: false },
  },
  SOCIAL_SELLING: {
    'route:dashboard': { can_view: false, can_edit: false },
    'route:vendas': { can_view: false, can_edit: false },
    'route:meu-fechamento': { can_view: false, can_edit: false },
    'route:meta-ote': { can_view: false, can_edit: false },
    'route:social-selling': { can_view: true, can_edit: true },
    'route:leads': { can_view: false, can_edit: false },
    'route:trafego-pago-dashboard': { can_view: false, can_edit: false },
    'route:trafego-pago-clientes': { can_view: false, can_edit: false },
    'route:marketplaces-dashboard': { can_view: false, can_edit: false },
    'route:marketplaces-clientes': { can_view: false, can_edit: false },
    'route:conteudo-dashboard': { can_view: false, can_edit: false },
    'route:conteudo-acompanhamento': { can_view: false, can_edit: false },
    'route:conteudo-controle': { can_view: false, can_edit: false },
    'route:conteudo-twitter': { can_view: false, can_edit: false },
    'route:conteudo-ai': { can_view: false, can_edit: false },
    'route:marketing-dashboard': { can_view: false, can_edit: false },
    'route:painel-admin': { can_view: false, can_edit: false },
  },
  CLOSER: {
    'route:dashboard': { can_view: true, can_edit: true },
    'route:vendas': { can_view: true, can_edit: true },
    'route:meu-fechamento': { can_view: true, can_edit: true },
    'route:meta-ote': { can_view: true, can_edit: true },
    'route:social-selling': { can_view: true, can_edit: true },
    'route:leads': { can_view: false, can_edit: false },
    'route:trafego-pago-dashboard': { can_view: false, can_edit: false },
    'route:trafego-pago-clientes': { can_view: false, can_edit: false },
    'route:marketplaces-dashboard': { can_view: false, can_edit: false },
    'route:marketplaces-clientes': { can_view: false, can_edit: false },
    'route:conteudo-dashboard': { can_view: false, can_edit: false },
    'route:conteudo-acompanhamento': { can_view: false, can_edit: false },
    'route:conteudo-controle': { can_view: false, can_edit: false },
    'route:conteudo-twitter': { can_view: false, can_edit: false },
    'route:conteudo-ai': { can_view: false, can_edit: false },
    'route:marketing-dashboard': { can_view: false, can_edit: false },
    'route:painel-admin': { can_view: false, can_edit: false },
    'section:vendas:criar':    { can_view: true, can_edit: true },
    'section:vendas:exportar': { can_view: true, can_edit: true },
    'section:vendas:editar':   { can_view: true, can_edit: true },
  },
  GESTOR_TRAFEGO: {
    'route:dashboard': { can_view: false, can_edit: false },
    'route:vendas': { can_view: false, can_edit: false },
    'route:meu-fechamento': { can_view: false, can_edit: false },
    'route:meta-ote': { can_view: false, can_edit: false },
    'route:social-selling': { can_view: false, can_edit: false },
    'route:leads': { can_view: false, can_edit: false },
    'route:trafego-pago-dashboard': { can_view: true, can_edit: true },
    'route:trafego-pago-clientes': { can_view: true, can_edit: true },
    'route:marketplaces-dashboard': { can_view: false, can_edit: false },
    'route:marketplaces-clientes': { can_view: false, can_edit: false },
    'route:conteudo-dashboard': { can_view: false, can_edit: false },
    'route:conteudo-acompanhamento': { can_view: false, can_edit: false },
    'route:conteudo-controle': { can_view: false, can_edit: false },
    'route:conteudo-twitter': { can_view: false, can_edit: false },
    'route:conteudo-ai': { can_view: false, can_edit: false },
    'route:marketing-dashboard': { can_view: false, can_edit: false },
    'route:painel-admin': { can_view: false, can_edit: false },
  },
  GESTOR_MARKETPLACE: {
    'route:dashboard': { can_view: false, can_edit: false },
    'route:vendas': { can_view: false, can_edit: false },
    'route:meu-fechamento': { can_view: false, can_edit: false },
    'route:meta-ote': { can_view: false, can_edit: false },
    'route:social-selling': { can_view: false, can_edit: false },
    'route:leads': { can_view: false, can_edit: false },
    'route:trafego-pago-dashboard': { can_view: false, can_edit: false },
    'route:trafego-pago-clientes': { can_view: false, can_edit: false },
    'route:marketplaces-dashboard': { can_view: true, can_edit: true },
    'route:marketplaces-clientes': { can_view: true, can_edit: true },
    'route:conteudo-dashboard': { can_view: false, can_edit: false },
    'route:conteudo-acompanhamento': { can_view: false, can_edit: false },
    'route:conteudo-controle': { can_view: false, can_edit: false },
    'route:conteudo-twitter': { can_view: false, can_edit: false },
    'route:conteudo-ai': { can_view: false, can_edit: false },
    'route:marketing-dashboard': { can_view: false, can_edit: false },
    'route:painel-admin': { can_view: false, can_edit: false },
    'route:admin-dashboard': { can_view: false, can_edit: false },
    'route:admin-almoxarifado': { can_view: false, can_edit: false },
    'route:admin-patrimonio': { can_view: false, can_edit: false },
  },
  ADMINISTRATIVO: {
    'route:dashboard': { can_view: false, can_edit: false },
    'route:vendas': { can_view: false, can_edit: false },
    'route:meu-fechamento': { can_view: false, can_edit: false },
    'route:meta-ote': { can_view: false, can_edit: false },
    'route:social-selling': { can_view: false, can_edit: false },
    'route:leads': { can_view: false, can_edit: false },
    'route:trafego-pago-dashboard': { can_view: false, can_edit: false },
    'route:trafego-pago-clientes': { can_view: false, can_edit: false },
    'route:marketplaces-dashboard': { can_view: false, can_edit: false },
    'route:marketplaces-clientes': { can_view: false, can_edit: false },
    'route:conteudo-dashboard': { can_view: false, can_edit: false },
    'route:conteudo-acompanhamento': { can_view: false, can_edit: false },
    'route:conteudo-controle': { can_view: false, can_edit: false },
    'route:conteudo-twitter': { can_view: false, can_edit: false },
    'route:conteudo-ai': { can_view: false, can_edit: false },
    'route:marketing-dashboard': { can_view: false, can_edit: false },
    'route:painel-admin': { can_view: false, can_edit: false },
    'route:admin-dashboard': { can_view: true, can_edit: true },
    'route:admin-almoxarifado': { can_view: true, can_edit: true },
    'route:admin-patrimonio': { can_view: true, can_edit: true },
  },
};

export interface RolePermission {
  id: string;
  role: AppRole;
  resource_key: string;
  can_view: boolean;
  can_edit: boolean;
}

// All configurable resources with labels
export const RESOURCE_DEFINITIONS: { key: string; label: string; group: string }[] = [
  // Routes - W3 Educação
  { key: 'route:dashboard', label: 'Dashboard Comercial', group: 'Rotas - W3 Educação' },
  { key: 'route:vendas', label: 'Vendas', group: 'Rotas - W3 Educação' },
  { key: 'route:meu-fechamento', label: 'Meu Fechamento', group: 'Rotas - W3 Educação' },
  { key: 'route:meta-ote', label: 'Meta OTE', group: 'Rotas - W3 Educação' },
  { key: 'route:social-selling', label: 'Social Selling', group: 'Rotas - W3 Educação' },
  { key: 'route:leads', label: 'Base Leads W3', group: 'Rotas - W3 Educação' },
  // Routes - W3 Tráfego Pago
  { key: 'route:trafego-pago-dashboard', label: 'Dashboard Tráfego Pago', group: 'Rotas - W3 Tráfego Pago' },
  { key: 'route:trafego-pago-clientes', label: 'Clientes Tráfego Pago', group: 'Rotas - W3 Tráfego Pago' },
  // Routes - W3 Marketplaces
  { key: 'route:marketplaces-dashboard', label: 'Dashboard Marketplaces', group: 'Rotas - W3 Marketplaces' },
  { key: 'route:marketplaces-clientes', label: 'Clientes Marketplaces', group: 'Rotas - W3 Marketplaces' },
  // Routes - Conteúdo
  { key: 'route:conteudo-dashboard', label: 'Dashboard de Conteúdo', group: 'Rotas - Conteúdo' },
  { key: 'route:conteudo-acompanhamento', label: 'Acompanhamento Diário', group: 'Rotas - Conteúdo' },
  { key: 'route:conteudo-controle', label: 'Controle de Conteúdos', group: 'Rotas - Conteúdo' },
  { key: 'route:conteudo-twitter', label: 'Gerador Twitter', group: 'Rotas - Conteúdo' },
  { key: 'route:conteudo-ai', label: 'Agentes IA', group: 'Rotas - Conteúdo' },
  // Routes - Marketing & Admin
  { key: 'route:marketing-dashboard', label: 'Marketing Dashboard', group: 'Rotas - Outros' },
  { key: 'route:painel-admin', label: 'Painel Admin', group: 'Rotas - Outros' },
  // Routes - Administrativo
  { key: 'route:admin-dashboard', label: 'Dashboard Administrativo', group: 'Rotas - Administrativo' },
  { key: 'route:admin-almoxarifado', label: 'Almoxarifado', group: 'Rotas - Administrativo' },
  { key: 'route:admin-patrimonio', label: 'Patrimônio', group: 'Rotas - Administrativo' },
  // Routes - Recursos Humanos
  { key: 'route:rh-colaboradores', label: 'Colaboradores RH', group: 'Rotas - Recursos Humanos' },
  { key: 'route:rh-feedbacks', label: 'Feedbacks RH', group: 'Rotas - Recursos Humanos' },
  { key: 'route:rh-avaliacoes', label: 'Avaliações RH', group: 'Rotas - Recursos Humanos' },
  { key: 'route:rh-setores', label: 'Visão por Setor RH', group: 'Rotas - Recursos Humanos' },
  // Sections - Dashboard
  { key: 'section:dashboard:receita', label: 'Seção Receita', group: 'Seções - Dashboard' },
  { key: 'section:dashboard:performance', label: 'Seção Performance', group: 'Seções - Dashboard' },
  { key: 'section:dashboard:destaques', label: 'Seção Destaques', group: 'Seções - Dashboard' },
  { key: 'section:dashboard:ote', label: 'Card OTE', group: 'Seções - Dashboard' },
  // Sections - Vendas
  { key: 'section:vendas:criar', label: 'Criar Vendas', group: 'Seções - Vendas' },
  { key: 'section:vendas:exportar', label: 'Exportar PDF', group: 'Seções - Vendas' },
  { key: 'section:vendas:editar', label: 'Editar Vendas', group: 'Seções - Vendas' },
];

// Map route paths to resource keys
export const ROUTE_TO_RESOURCE: Record<string, string> = {
  '/': 'route:dashboard',
  '/vendas': 'route:vendas',
  '/meu-fechamento': 'route:meu-fechamento',
  '/meta-ote': 'route:meta-ote',
  '/social-selling': 'route:social-selling',
  '/leads': 'route:leads',
  '/trafego-pago/dashboard': 'route:trafego-pago-dashboard',
  '/trafego-pago/clientes': 'route:trafego-pago-clientes',
  '/marketplaces/dashboard': 'route:marketplaces-dashboard',
  '/marketplaces/clientes': 'route:marketplaces-clientes',
  '/conteudo/dashboard': 'route:conteudo-dashboard',
  '/conteudo/acompanhamento': 'route:conteudo-acompanhamento',
  '/conteudo/controle': 'route:conteudo-controle',
  '/conteudo/twitter': 'route:conteudo-twitter',
  '/conteudo/ai': 'route:conteudo-ai',
  '/marketing/dashboard': 'route:marketing-dashboard',
  '/painel-admin': 'route:painel-admin',
  '/administrativo/dashboard': 'route:admin-dashboard',
  '/administrativo/almoxarifado': 'route:admin-almoxarifado',
  '/administrativo/patrimonio': 'route:admin-patrimonio',
  '/rh/colaboradores': 'route:rh-colaboradores',
  '/rh/feedbacks': 'route:rh-feedbacks',
  '/rh/avaliacoes': 'route:rh-avaliacoes',
  '/rh/setores': 'route:rh-setores',
};

export function useAllRolePermissions() {
  return useQuery({
    queryKey: ['role-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .order('role')
        .order('resource_key');

      if (error) throw error;
      return data as RolePermission[];
    },
  });
}

export function useMyPermissions() {
  const { data: userRole } = useCurrentUserRole();
  const role = userRole?.role;

  return useQuery({
    queryKey: ['role-permissions', role],
    queryFn: async () => {
      if (!role) return [];
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role', role);

      if (error) throw error;
      return data as RolePermission[];
    },
    enabled: !!role,
  });
}

/** Check if current user can view a resource */
export function useCanView(resourceKey: string): boolean {
  const { data: permissions } = useMyPermissions();
  const { data: userRole } = useCurrentUserRole();
  
  // MASTER always has access (fallback safety)
  if (userRole?.role === 'MASTER') return true;
  
  if (!permissions) return false;
  const perm = permissions.find(p => p.resource_key === resourceKey);
  return perm?.can_view ?? false;
}

/** Check if current user can edit a resource */
export function useCanEdit(resourceKey: string): boolean {
  const { data: permissions } = useMyPermissions();
  const { data: userRole } = useCurrentUserRole();
  
  if (userRole?.role === 'MASTER') return true;
  
  if (!permissions) return false;
  const perm = permissions.find(p => p.resource_key === resourceKey);
  return perm?.can_edit ?? false;
}

/** Hook that returns helper functions for checking permissions */
export function usePermissionChecks() {
  const myPerms = useMyPermissions();
  const roleQuery = useCurrentUserRole();
  const isMaster = roleQuery.data?.role === 'MASTER';
  const role = roleQuery.data?.role;

  const permissions = myPerms.data;
  // Use fallback when DB returned empty for this role
  const useFallback = myPerms.isFetched && (!permissions || permissions.length === 0) && !!role;
  const fallbackMap = role ? DEFAULT_PERMISSIONS[role] : undefined;

  const canView = (resourceKey: string): boolean => {
    if (isMaster) return true;
    if (useFallback && fallbackMap) {
      return fallbackMap[resourceKey]?.can_view ?? false;
    }
    if (!permissions) return false;
    const perm = permissions.find(p => p.resource_key === resourceKey);
    return perm?.can_view ?? false;
  };

  const canEdit = (resourceKey: string): boolean => {
    if (isMaster) return true;
    if (useFallback && fallbackMap) {
      return fallbackMap[resourceKey]?.can_edit ?? false;
    }
    if (!permissions) return false;
    const perm = permissions.find(p => p.resource_key === resourceKey);
    return perm?.can_edit ?? false;
  };

  const isLoading =
    roleQuery.isLoading ||
    (!isMaster && !!roleQuery.data?.role && !myPerms.isFetched);

  return { canView, canEdit, isLoading };
}

export function useUpdateRolePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ role, resourceKey, canView, canEdit }: { 
      role: AppRole; resourceKey: string; canView: boolean; canEdit: boolean 
    }) => {
      const { data, error } = await supabase
        .from('role_permissions')
        .upsert(
          { role, resource_key: resourceKey, can_view: canView, can_edit: canEdit },
          { onConflict: 'role,resource_key' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
    },
    onError: (error) => {
      console.error('Erro ao atualizar permissão:', error);
      toast.error('Erro ao atualizar permissão');
    },
  });
}
