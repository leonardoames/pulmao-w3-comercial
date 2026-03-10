import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Venda, VendaStatus } from '@/types/crm';
import { toast } from 'sonner';
import { vendaSchema, updateVendaSchema } from '@/schemas/validation';

// Sincroniza lead na Base Leads W3 após criar venda (non-blocking)
async function sincronizarLeadAposVenda(venda: {
  id: string;
  nome_empresa: string;
  nome_lead: string;
  valor_total?: number;
  data_fechamento?: string;
}) {
  // 1. Busca lead por nome_negocio
  let { data: lead } = await supabase
    .from('leads_w3')
    .select('id')
    .ilike('nome_negocio', venda.nome_empresa)
    .maybeSingle();

  // 2. Fallback: busca por nome_mentorado
  if (!lead) {
    const { data } = await supabase
      .from('leads_w3')
      .select('id')
      .ilike('nome_mentorado', venda.nome_lead)
      .maybeSingle();
    lead = data;
  }

  if (lead) {
    // Lead existente: atualiza vínculo e upsert produto educação
    await supabase
      .from('leads_w3')
      .update({ is_cliente_educacao: true, venda_id: venda.id, updated_at: new Date().toISOString() })
      .eq('id', lead.id);
    await (supabase
      .from('leads_w3_produtos' as any))
      .upsert(
        { lead_id: lead.id, produto: 'educacao', status: 'ativo', data_inicio: venda.data_fechamento ?? null },
        { onConflict: 'lead_id,produto' }
      );
  } else {
    // Novo lead: cria lead + produto educação
    const codigo = `AUTO-${Date.now()}`;
    const { data: newLead } = await supabase
      .from('leads_w3')
      .insert({
        codigo,
        nome_negocio: venda.nome_empresa,
        nome_mentorado: venda.nome_lead,
        is_cliente_educacao: true,
        is_cliente_trafego: false,
        is_cliente_marketplace: false,
        venda_id: venda.id,
      })
      .select('id')
      .single();
    if (newLead) {
      await (supabase
        .from('leads_w3_produtos' as any))
        .insert({
          lead_id: newLead.id,
          produto: 'educacao',
          status: 'ativo',
          data_inicio: venda.data_fechamento ?? null,
        });
    }
  }
}

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
  closer_user_id: string;
  data_fechamento: string;
  nome_lead: string;
  nome_empresa: string;
  duracao_contrato_meses: number;
  valor_pix: number;
  valor_cartao: number;
  valor_boleto_parcela: number;
  quantidade_parcelas_boleto: number;
  pago?: boolean;
  contrato_assinado?: boolean;
  enviado_financeiro?: boolean;
  enviado_cs?: boolean;
  observacoes?: string;
  origem_lead?: string | null;
}

export function useCreateVenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (venda: CreateVendaInput) => {
      // Validate input
      vendaSchema.parse(venda);
      // Calculate valor_total
      const valor_boleto_total = venda.valor_boleto_parcela * venda.quantidade_parcelas_boleto;
      const valor_total = venda.valor_pix + venda.valor_cartao + valor_boleto_total;

      const { data, error } = await supabase
        .from('vendas')
        .insert([{ ...venda, valor_total }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Venda registrada com sucesso!');
      
      // Fire webhook (non-blocking)
      supabase.functions.invoke('venda-webhook', {
        body: { venda_id: data.id },
      }).catch((err) => {
        console.error('Webhook error (non-blocking):', err);
      });

      // Sincroniza lead na Base Leads W3 (non-blocking)
      sincronizarLeadAposVenda({
        id: data.id,
        nome_empresa: data.nome_empresa,
        nome_lead: data.nome_lead,
        valor_total: data.valor_total,
        data_fechamento: data.data_fechamento,
      }).catch((err) => {
        console.error('Lead sync error (non-blocking):', err);
      });
    },
    onError: (error) => {
      toast.error('Erro ao registrar venda: ' + error.message);
    }
  });
}

interface UpdateVendaInput {
  id: string;
  closer_user_id?: string;
  data_fechamento?: string;
  nome_lead?: string;
  nome_empresa?: string;
  duracao_contrato_meses?: number;
  valor_pix?: number;
  valor_cartao?: number;
  valor_boleto_parcela?: number;
  quantidade_parcelas_boleto?: number;
  pago?: boolean;
  contrato_assinado?: boolean;
  enviado_financeiro?: boolean;
  enviado_cs?: boolean;
  status?: VendaStatus;
  observacoes?: string;
  origem_lead?: string | null;
}

export function useUpdateVenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateVendaInput) => {
      // Validate input
      updateVendaSchema.parse({ id, ...updates });
      // Recalculate valor_total if payment values changed
      let valor_total: number | undefined;
      if (updates.valor_pix !== undefined || updates.valor_cartao !== undefined || 
          updates.valor_boleto_parcela !== undefined || updates.quantidade_parcelas_boleto !== undefined) {
        // Need to get current values - use maybeSingle to avoid error if not found
        const { data: current, error: fetchError } = await supabase
          .from('vendas')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        
        if (fetchError) throw fetchError;
        if (!current) throw new Error('Venda não encontrada ou sem permissão para editar');
        
        const pix = updates.valor_pix ?? current.valor_pix;
        const cartao = updates.valor_cartao ?? current.valor_cartao;
        const parcela = updates.valor_boleto_parcela ?? current.valor_boleto_parcela;
        const qtd = updates.quantidade_parcelas_boleto ?? current.quantidade_parcelas_boleto;
        valor_total = pix + cartao + (parcela * qtd);
      }

      const { data, error } = await supabase
        .from('vendas')
        .update({ ...updates, ...(valor_total !== undefined && { valor_total }) })
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Venda não encontrada ou sem permissão para editar');
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Venda atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar venda: ' + error.message);
    }
  });
}

export function useDeleteVenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vendas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Venda excluída com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao excluir venda: ' + error.message);
    }
  });
}

export function useRefundVenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo_reembolso, reembolsado_por }: { id: string; motivo_reembolso?: string; reembolsado_por: string }) => {
      const { data, error } = await supabase
        .from('vendas')
        .update({
          status: 'Reembolsado' as any,
          motivo_reembolso,
          reembolsado_por,
          reembolsado_em: new Date().toISOString(),
        } as any)
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Venda não encontrada');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Venda marcada como reembolsada');
    },
    onError: (error) => {
      toast.error('Erro ao reembolsar venda: ' + error.message);
    }
  });
}
