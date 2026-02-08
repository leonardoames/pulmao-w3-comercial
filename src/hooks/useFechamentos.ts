import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Fechamento } from '@/types/crm';
import { toast } from 'sonner';

export function useFechamentos(filters?: {
  closer_id?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  return useQuery({
    queryKey: ['fechamentos', filters],
    queryFn: async () => {
      let query = supabase
        .from('fechamentos')
        .select(`
          *,
          closer:profiles!fechamentos_closer_user_id_fkey(id, nome)
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
      
      // Add derived field
      return (data as unknown as Fechamento[]).map(f => ({
        ...f,
        calls_agendadas: f.calls_realizadas + f.no_show
      }));
    }
  });
}

export function useMeuFechamento(userId: string, data: string) {
  return useQuery({
    queryKey: ['meu-fechamento', userId, data],
    queryFn: async () => {
      const { data: fechamento, error } = await supabase
        .from('fechamentos')
        .select('*')
        .eq('closer_user_id', userId)
        .eq('data', data)
        .maybeSingle();

      if (error) throw error;
      return fechamento as Fechamento | null;
    },
    enabled: !!userId && !!data
  });
}

interface UpsertFechamentoInput {
  data: string;
  closer_user_id: string;
  calls_realizadas: number;
  no_show: number;
  observacoes?: string;
}

export function useUpsertFechamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpsertFechamentoInput) => {
      const { data, error } = await supabase
        .from('fechamentos')
        .upsert([input], { onConflict: 'data,closer_user_id' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fechamentos'] });
      queryClient.invalidateQueries({ queryKey: ['meu-fechamento'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Fechamento salvo com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao salvar fechamento: ' + error.message);
    }
  });
}
