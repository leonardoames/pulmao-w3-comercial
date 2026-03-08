import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile, UserArea } from '@/types/crm';
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
      area, 
      ativo 
    }: { 
      id: string; 
      nome: string; 
      email: string; 
      area: UserArea; 
      ativo: boolean;
    }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ nome, email, area, ativo })
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
      area, 
      role 
    }: { 
      email: string; 
      password: string; 
      nome: string; 
      area: UserArea; 
      role: AppRole;
    }) => {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nome }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Falha ao criar usuário');

      await new Promise(resolve => setTimeout(resolve, 1000));

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ area })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Erro ao atualizar perfil:', profileError);
      }

      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      if (existingRole) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', authData.user.id);

        if (roleError) {
          console.error('Erro ao atualizar role:', roleError);
        }
      } else {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: authData.user.id, role });

        if (roleError) {
          console.error('Erro ao inserir role:', roleError);
        }
      }

      return authData.user;
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
    }
  });
}
