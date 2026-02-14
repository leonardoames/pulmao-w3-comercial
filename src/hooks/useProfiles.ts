import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/crm';

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles_safe' as any)
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data as unknown as Profile[];
    }
  });
}

// Busca closers pela tabela user_roles com role = 'CLOSER'
export function useClosers() {
  return useQuery({
    queryKey: ['closers'],
    queryFn: async () => {
      // Primeiro, buscar todos os user_ids com role = 'CLOSER'
      const { data: closerRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'CLOSER');

      if (rolesError) throw rolesError;

      if (!closerRoles || closerRoles.length === 0) {
        return [] as Profile[];
      }

      // Excluir Gustavo Hofmann do filtro de closers
      const EXCLUDED_FROM_FILTER = ['6c7a0c54-6bbc-4d40-829a-217f098adb74'];
      const closerIds = closerRoles.map(r => r.user_id).filter(id => !EXCLUDED_FROM_FILTER.includes(id));

      // Buscar profiles dos closers ativos
      const { data, error } = await supabase
        .from('profiles_safe' as any)
        .select('*')
        .eq('ativo', true)
        .in('id', closerIds)
        .order('nome');

      if (error) throw error;
      return data as unknown as Profile[];
    }
  });
}

// Busca social sellers pela tabela user_roles com role = 'SOCIAL_SELLING'
export function useSocialSellers() {
  return useQuery({
    queryKey: ['social-sellers'],
    queryFn: async () => {
      const { data: ssRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'SOCIAL_SELLING');

      if (rolesError) throw rolesError;

      if (!ssRoles || ssRoles.length === 0) {
        return [] as Profile[];
      }

      const ssIds = ssRoles.map(r => r.user_id);

      const { data, error } = await supabase
        .from('profiles_safe' as any)
        .select('*')
        .eq('ativo', true)
        .in('id', ssIds)
        .order('nome');

      if (error) throw error;
      return data as unknown as Profile[];
    }
  });
}
