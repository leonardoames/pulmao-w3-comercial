import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Call, CallStatus, CallPlataforma } from '@/types/crm';
import { toast } from 'sonner';

export function useCalls(filters?: {
  status?: CallStatus;
  closer_id?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  return useQuery({
    queryKey: ['calls', filters],
    queryFn: async () => {
      let query = supabase
        .from('calls')
        .select(`
          *,
          lead:leads(id, nome_pessoa, nome_empresa, email),
          closer:profiles!calls_closer_user_id_fkey(id, nome),
          sdr:profiles!calls_sdr_user_id_fkey(id, nome)
        `)
        .order('data_hora', { ascending: true });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.closer_id) {
        query = query.eq('closer_user_id', filters.closer_id);
      }
      if (filters?.startDate) {
        query = query.gte('data_hora', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        query = query.lte('data_hora', filters.endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Call[];
    }
  });
}

interface CreateCallInput {
  lead_id: string;
  data_hora: string;
  plataforma: CallPlataforma;
  link_reuniao?: string;
  closer_user_id: string;
  sdr_user_id?: string;
  observacoes?: string;
}

export function useCreateCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (call: CreateCallInput) => {
      const { data, error } = await supabase
        .from('calls')
        .insert([call])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calls'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Call agendada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao agendar call: ' + error.message);
    }
  });
}

interface UpdateCallInput {
  id: string;
  data_hora?: string;
  plataforma?: CallPlataforma;
  link_reuniao?: string;
  status?: CallStatus;
  observacoes?: string;
}

export function useUpdateCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateCallInput) => {
      const { data, error } = await supabase
        .from('calls')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calls'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Call atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar call: ' + error.message);
    }
  });
}
