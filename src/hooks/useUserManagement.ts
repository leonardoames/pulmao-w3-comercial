import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/crm';
import { AppRole } from '@/types/roles';
import { toast } from 'sonner';

interface UserWithRole extends Profile {
  user_role?: {
    role: AppRole;
  } | null;
}

export function useUsersWithRoles() {
  return useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('criado_em', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      const usersWithRoles = profiles.map((profile) => {
        const role = roles.find(r => r.user_id === profile.id);
        return {
          ...profile,
          user_role: role ? { role: role.role as AppRole } : null
        } as UserWithRole;
      });

      // Sort: active first (preserving criado_em order within each group), then inactive
      usersWithRoles.sort((a, b) => {
        if (a.ativo !== b.ativo) return a.ativo ? -1 : 1;
        return 0; // preserve criado_em order from DB
      });

      return usersWithRoles;
    }
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      nome,
      email,
      ativo,
      centro_custo,
    }: {
      id: string;
      nome: string;
      email: string;
      ativo: boolean;
      centro_custo?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ nome, email, ativo, centro_custo })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['closers'] });
      toast.success('Usuário atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário');
    }
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      password,
      nome,
      role,
    }: {
      email: string;
      password: string;
      nome: string;
      role: AppRole;
    }) => {
      // Uses Edge Function with service_role key so the admin's session
      // is never affected (supabase.auth.signUp() would replace the session).
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: { email, password, nome, role },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      queryClient.invalidateQueries({ queryKey: ['all-user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['closers'] });
      toast.success('Usuário criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar usuário:', error);
      toast.error('Erro ao criar usuário: ' + (error as Error).message);
    },
  });
}
