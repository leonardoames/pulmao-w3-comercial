import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Lead, LeadOrigem, LeadStatusFunil } from '@/types/crm';
import { toast } from 'sonner';

export function useLeads(filters?: {
  status_funil?: LeadStatusFunil;
  origem?: LeadOrigem;
  closer_id?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select(`
          *,
          closer_responsavel:profiles!leads_closer_responsavel_user_id_fkey(id, nome),
          sdr_responsavel:profiles!leads_sdr_responsavel_user_id_fkey(id, nome)
        `)
        .order('criado_em', { ascending: false });

      if (filters?.status_funil) {
        query = query.eq('status_funil', filters.status_funil);
      }
      if (filters?.origem) {
        query = query.eq('origem', filters.origem);
      }
      if (filters?.closer_id) {
        query = query.eq('closer_responsavel_user_id', filters.closer_id);
      }
      if (filters?.startDate) {
        query = query.gte('criado_em', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        query = query.lte('criado_em', filters.endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Lead[];
    }
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          closer_responsavel:profiles!leads_closer_responsavel_user_id_fkey(id, nome, email, role),
          sdr_responsavel:profiles!leads_sdr_responsavel_user_id_fkey(id, nome, email, role),
          calls(*, closer:profiles!calls_closer_user_id_fkey(id, nome)),
          vendas(*, closer:profiles!vendas_closer_user_id_fkey(id, nome))
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return { ...data, venda: data.vendas?.[0] } as unknown as Lead;
    },
    enabled: !!id
  });
}

interface CreateLeadInput {
  nome_pessoa: string;
  telefone: string;
  email: string;
  instagram?: string;
  nome_empresa: string;
  cnpj?: string;
  cidade?: string;
  estado?: string;
  origem: LeadOrigem;
  closer_responsavel_user_id?: string;
  sdr_responsavel_user_id?: string;
  observacoes?: string;
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lead: CreateLeadInput) => {
      const { data, error } = await supabase
        .from('leads')
        .insert([lead])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar lead: ' + error.message);
    }
  });
}

interface UpdateLeadInput {
  id: string;
  nome_pessoa?: string;
  telefone?: string;
  email?: string;
  instagram?: string;
  nome_empresa?: string;
  cnpj?: string;
  cidade?: string;
  estado?: string;
  origem?: LeadOrigem;
  closer_responsavel_user_id?: string;
  sdr_responsavel_user_id?: string;
  status_funil?: LeadStatusFunil;
  motivo_perda?: string;
  observacoes?: string;
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateLeadInput) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
      toast.success('Lead atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar lead: ' + error.message);
    }
  });
}
