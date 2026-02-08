import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/crm';

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data as Profile[];
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

      const closerIds = closerRoles.map(r => r.user_id);

      // Buscar profiles dos closers ativos
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('ativo', true)
        .in('id', closerIds)
        .order('nome');

      if (error) throw error;
      return data as Profile[];
    }
  });
}
