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

export function useClosers() {
  return useQuery({
    queryKey: ['closers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('ativo', true)
        .in('role', ['Closer', 'GestorComercial', 'CEO', 'Founder'])
        .order('nome');

      if (error) throw error;
      return data as Profile[];
    }
  });
}

export function useSDRs() {
  return useQuery({
    queryKey: ['sdrs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('ativo', true)
        .eq('role', 'SDR')
        .order('nome');

      if (error) throw error;
      return data as Profile[];
    }
  });
}
