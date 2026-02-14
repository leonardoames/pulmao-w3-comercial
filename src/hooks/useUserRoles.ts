import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, UserRole, canRoleManageClosers, canRoleAccessAdminPanel, isRoleSocialSelling } from '@/types/roles';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useUserRole(userId?: string) {
  return useQuery({
    queryKey: ['user-role', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data as UserRole | null;
    },
    enabled: !!userId
  });
}

export function useCurrentUserRole() {
  const { user } = useAuth();
  return useUserRole(user?.id);
}

export function useIsMaster() {
  const { data: userRole } = useCurrentUserRole();
  return userRole?.role === 'MASTER';
}

export function useCanManageUsers() {
  const { data: userRole } = useCurrentUserRole();
  return userRole?.role === 'MASTER';
}

export function useCanAccessAdminPanel() {
  const { data: userRole } = useCurrentUserRole();
  if (!userRole) return false;
  return canRoleAccessAdminPanel(userRole.role);
}

export function useCanEditAnyFechamento() {
  const { data: userRole } = useCurrentUserRole();
  if (!userRole) return false;
  return canRoleManageClosers(userRole.role);
}

export function useIsCloser() {
  const { data: userRole } = useCurrentUserRole();
  return userRole?.role === 'CLOSER';
}

export function useIsSocialSelling() {
  const { data: userRole } = useCurrentUserRole();
  if (!userRole) return false;
  return isRoleSocialSelling(userRole.role);
}

export function useAllUserRoles() {
  return useQuery({
    queryKey: ['all-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('criado_em');

      if (error) throw error;
      return data as UserRole[];
    }
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { data, error } = await supabase
        .from('user_roles')
        .upsert(
          { user_id: userId, role },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['user-role'] });
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('Role atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar role:', error);
      toast.error('Erro ao atualizar role');
    }
  });
}
