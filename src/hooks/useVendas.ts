import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Venda, VendaStatus, VendaFormaPagamento } from '@/types/crm';
import { toast } from 'sonner';

export function useVendas(filters?: {
  status?: VendaStatus;
  closer_id?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  return useQuery({
    queryKey: ['vendas', filters],
    queryFn: async () => {
      let query = supabase
        .from('vendas')
        .select(`
          *,
          lead:leads(id, nome_pessoa, nome_empresa, email),
          closer:profiles!vendas_closer_user_id_fkey(id, nome)
        `)
        .order('data_fechamento', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.closer_id) {
        query = query.eq('closer_user_id', filters.closer_id);
      }
      if (filters?.startDate) {
        query = query.gte('data_fechamento', filters.startDate.toISOString().split('T')[0]);
      }
      if (filters?.endDate) {
        query = query.lte('data_fechamento', filters.endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Venda[];
    }
  });
}

interface CreateVendaInput {
  lead_id: string;
  closer_user_id: string;
  data_fechamento: string;
  plano_nome: string;
  valor_total: number;
  entrada_valor: number;
  forma_pagamento: VendaFormaPagamento;
  detalhes_pagamento?: string;
  data_inicio: string;
  data_fim: string;
  observacoes?: string;
}

export function useCreateVenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (venda: CreateVendaInput) => {
      const { data, error } = await supabase
        .from('vendas')
        .insert([venda])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Venda registrada com sucesso!');
    },
    onError: (error) => {
      if (error.message.includes('unique')) {
        toast.error('Este lead já possui uma venda registrada.');
      } else {
        toast.error('Erro ao registrar venda: ' + error.message);
      }
    }
  });
}

interface UpdateVendaInput {
  id: string;
  plano_nome?: string;
  valor_total?: number;
  entrada_valor?: number;
  forma_pagamento?: VendaFormaPagamento;
  detalhes_pagamento?: string;
  data_inicio?: string;
  data_fim?: string;
  status?: VendaStatus;
  observacoes?: string;
}

export function useUpdateVenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateVendaInput) => {
      // Não permite alterar o closer após criação
      const { data, error } = await supabase
        .from('vendas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Venda atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar venda: ' + error.message);
    }
  });
}
