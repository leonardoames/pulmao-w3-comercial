import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { socialSellingSchema } from '@/schemas/validation';

export interface SocialSellingEntry {
  id: string;
  data: string;
  closer_user_id: string;
  conversas_iniciadas: number;
  convites_enviados: number;
  agendamentos: number;
  observacoes: string | null;
  criado_em: string;
  atualizado_em: string;
  closer?: { id: string; nome: string };
}

export function useSocialSellingEntries(filters?: {
  closer_id?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  return useQuery({
    queryKey: ['social-selling', filters?.closer_id, filters?.startDate?.toISOString(), filters?.endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from('social_selling')
        .select(`
          *,
          closer:profiles!social_selling_closer_user_id_fkey(id, nome)
        `)
        .order('data', { ascending: false });

      if (filters?.closer_id) {
        query = query.eq('closer_user_id', filters.closer_id);
      }
      if (filters?.startDate) {
        query = query.gte('data', filters.startDate.toISOString().split('T')[0]);
      }
      if (filters?.endDate) {
        query = query.lte('data', filters.endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as SocialSellingEntry[];
    },
    enabled: !filters?.closer_id || filters.closer_id.length > 0
  });
}

export function useSocialSellingEntry(userId: string, data: string) {
  return useQuery({
    queryKey: ['social-selling-entry', userId, data],
    queryFn: async () => {
      const { data: entry, error } = await supabase
        .from('social_selling')
        .select('*')
        .eq('closer_user_id', userId)
        .eq('data', data)
        .maybeSingle();

      if (error) throw error;
      return entry as SocialSellingEntry | null;
    },
    enabled: !!userId && !!data
  });
}

interface UpsertSocialSellingInput {
  data: string;
  closer_user_id: string;
  conversas_iniciadas: number;
  convites_enviados: number;
  agendamentos: number;
  observacoes?: string;
}

export function useUpsertSocialSelling() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpsertSocialSellingInput) => {
      socialSellingSchema.parse(input);
      const { data, error } = await supabase
        .from('social_selling')
        .upsert([input], { onConflict: 'data,closer_user_id' })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-selling'] });
      queryClient.invalidateQueries({ queryKey: ['social-selling-entry'] });
      toast.success('Social Selling salvo com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao salvar Social Selling: ' + error.message);
    }
  });
}

// Daily goals constants
export const SOCIAL_SELLING_GOALS = {
  conversas_iniciadas: 100,
  convites_enviados: 30,
  agendamentos: 10,
} as const;
