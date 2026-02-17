import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/roles';
import { useCurrentUserRole } from './useUserRoles';
import { toast } from 'sonner';

export interface RolePermission {
  id: string;
  role: AppRole;
  resource_key: string;
  can_view: boolean;
  can_edit: boolean;
}

// All configurable resources with labels
export const RESOURCE_DEFINITIONS: { key: string; label: string; group: string }[] = [
  // Routes - Comercial
  { key: 'route:dashboard', label: 'Dashboard Comercial', group: 'Rotas - Comercial' },
  { key: 'route:vendas', label: 'Vendas', group: 'Rotas - Comercial' },
  { key: 'route:meu-fechamento', label: 'Meu Fechamento', group: 'Rotas - Comercial' },
  { key: 'route:meta-ote', label: 'Meta OTE', group: 'Rotas - Comercial' },
  { key: 'route:social-selling', label: 'Social Selling', group: 'Rotas - Comercial' },
  // Routes - Conteúdo
  { key: 'route:conteudo-dashboard', label: 'Dashboard de Conteúdo', group: 'Rotas - Conteúdo' },
  { key: 'route:conteudo-acompanhamento', label: 'Acompanhamento Diário', group: 'Rotas - Conteúdo' },
  { key: 'route:conteudo-controle', label: 'Controle de Conteúdos', group: 'Rotas - Conteúdo' },
  { key: 'route:conteudo-twitter', label: 'Gerador Twitter', group: 'Rotas - Conteúdo' },
  { key: 'route:conteudo-ai', label: 'Agentes IA', group: 'Rotas - Conteúdo' },
  // Routes - Marketing & Admin
  { key: 'route:marketing-dashboard', label: 'Marketing Dashboard', group: 'Rotas - Outros' },
  { key: 'route:painel-admin', label: 'Painel Admin', group: 'Rotas - Outros' },
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
  '/conteudo/dashboard': 'route:conteudo-dashboard',
  '/conteudo/acompanhamento': 'route:conteudo-acompanhamento',
  '/conteudo/controle': 'route:conteudo-controle',
  '/conteudo/twitter': 'route:conteudo-twitter',
  '/conteudo/ai': 'route:conteudo-ai',
  '/marketing/dashboard': 'route:marketing-dashboard',
  '/painel-admin': 'route:painel-admin',
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

  const permissions = myPerms.data;

  const canView = (resourceKey: string): boolean => {
    if (isMaster) return true;
    if (!permissions) return false;
    const perm = permissions.find(p => p.resource_key === resourceKey);
    return perm?.can_view ?? false;
  };

  const canEdit = (resourceKey: string): boolean => {
    if (isMaster) return true;
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
