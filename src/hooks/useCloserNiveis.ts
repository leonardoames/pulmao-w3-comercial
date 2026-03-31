import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CloserNivel } from '@/types/ote';
import { toast } from 'sonner';

export function useCloserNiveis() {
  return useQuery({
    queryKey: ['closer-niveis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('closer_niveis' as any)
        .select('*')
        .order('ordem');
      if (error) throw error;
      return data as unknown as CloserNivel[];
    },
  });
}

interface UpdateCloserNivelInput {
  nivel: string;
  taxa_conversao: number;
  salario_fixo: number;
}

export function useUpdateCloserNivel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ nivel, taxa_conversao, salario_fixo }: UpdateCloserNivelInput) => {
      const { data, error } = await supabase
        .from('closer_niveis' as any)
        .update({ taxa_conversao, salario_fixo, atualizado_em: new Date().toISOString() })
        .eq('nivel', nivel)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closer-niveis'] });
      toast.success('Nível atualizado!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar nível: ' + error.message);
    },
  });
}

interface UpdateCloserProfileInput {
  userId: string;
  nivel_closer: string | null;
  rampagem: 'none' | 'ramp1' | 'ramp2';
}

export function useUpdateCloserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, nivel_closer, rampagem }: UpdateCloserProfileInput) => {
      const { error } = await supabase
        .from('profiles')
        .update({ nivel_closer: nivel_closer as any, rampagem: rampagem as any })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closers'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['ote-realized'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar perfil: ' + error.message);
    },
  });
}
