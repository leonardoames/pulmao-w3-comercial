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
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('nome');

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles = profiles.map((profile) => {
        const role = roles.find(r => r.user_id === profile.id);
        return {
          ...profile,
          user_role: role ? { role: role.role as AppRole } : null
        } as UserWithRole;
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
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
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
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nome }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Falha ao criar usuário');

      // Wait a bit for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update profile with area
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ area })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Erro ao atualizar perfil:', profileError);
      }

      // Update role
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: authData.user.id, 
          role 
        }, {
          onConflict: 'user_id'
        });

      if (roleError) {
        console.error('Erro ao definir role:', roleError);
      }

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      queryClient.invalidateQueries({ queryKey: ['all-user-roles'] });
      toast.success('Usuário criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar usuário:', error);
      toast.error('Erro ao criar usuário: ' + (error as Error).message);
    }
  });
}
