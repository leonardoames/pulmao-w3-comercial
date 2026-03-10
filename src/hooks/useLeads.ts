import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type StatusEducacao =
  | 'Em Andamento' | 'Finalizado' | 'Cancelado' | 'Congelado'
  | 'Renovação' | 'Reembolsado' | 'Sem Retorno' | 'Não informado';

export type ProdutoTipo = 'educacao' | 'trafego' | 'marketplace' | 'pagamentos';
export type ProdutoStatus = 'ativo' | 'finalizado' | 'cancelado' | 'congelado' | 'nunca_contratou';

export interface LeadProduto {
  id: string;
  lead_id: string;
  produto: ProdutoTipo;
  status: ProdutoStatus;
  valor_total?: number | null;
  valor_pago?: number | null;
  saldo_devedor?: number | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  observacoes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadW3 {
  id: string;
  codigo: string;
  nome_negocio: string;
  nome_mentorado?: string | null;
  nicho?: string | null;
  email?: string | null;
  cnpj?: string | null;
  data_entrada?: string | null;
  vigencia_meses?: number | null;
  tempo_real_meses?: number | null;
  status_educacao?: StatusEducacao | null;
  valor_total?: number | null;
  valor_pago?: number | null;
  saldo_devedor?: number | null;
  forma_pagamento?: string | null;
  faturamento_inicial?: number | null;
  ticket_medio?: number | null;
  nps?: string | null;
  motivo_saida?: string | null;
  is_cliente_educacao: boolean;
  is_cliente_trafego: boolean;
  is_cliente_marketplace: boolean;
  venda_id?: string | null;
  created_at: string;
  updated_at: string;
  produtos?: LeadProduto[];
}

// Verifica duplicata de CNPJ antes de criar/editar
export async function checkDuplicateCNPJ(cnpj: string, excludeId?: string): Promise<boolean> {
  let query = supabase.from('leads_w3').select('id').eq('cnpj' as any, cnpj);
  if (excludeId) query = query.neq('id', excludeId);
  const { data } = await query.maybeSingle();
  return !!data;
}

export function useLeads(filters?: { status?: string; nicho?: string; search?: string }) {
  return useQuery({
    queryKey: ['leads_w3', filters],
    queryFn: async () => {
      let query = (supabase
        .from('leads_w3') as any)
        .select('*, produtos:leads_w3_produtos(*)')
        .order('created_at', { ascending: false });
      if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status);
      if (filters?.nicho && filters.nicho !== 'all') query = query.eq('nicho', filters.nicho);
      if (filters?.search)
        query = query.or(
          `nome_negocio.ilike.%${filters.search}%,nome_mentorado.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      const { data, error } = await query;
      if (error) throw error;
      return data as LeadW3[];
    },
  });
}

type CreateLeadInput = Omit<LeadW3, 'id' | 'created_at' | 'updated_at' | 'produtos'>;

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lead: CreateLeadInput) => {
      const { data, error } = await supabase.from('leads_w3').insert([lead]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads_w3'] });
      toast.success('Lead criado com sucesso!');
    },
    onError: (error: Error) => toast.error('Erro ao criar lead: ' + error.message),
  });
}

type UpdateLeadInput = { id: string } & Partial<CreateLeadInput>;

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateLeadInput) => {
      const { data, error } = await supabase
        .from('leads_w3')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads_w3'] });
      toast.success('Lead atualizado com sucesso!');
    },
    onError: (error: Error) => toast.error('Erro ao atualizar lead: ' + error.message),
  });
}

type CreateLeadProdutoInput = Omit<LeadProduto, 'id' | 'created_at' | 'updated_at'>;

export function useCreateLeadProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (produto: CreateLeadProdutoInput) => {
      const { data, error } = await supabase
        .from('leads_w3_produtos').insert([produto]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads_w3'] });
      toast.success('Produto salvo!');
    },
    onError: (error: Error) => toast.error('Erro ao salvar produto: ' + error.message),
  });
}

type UpdateLeadProdutoInput = { id: string } & Partial<CreateLeadProdutoInput>;

export function useUpdateLeadProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateLeadProdutoInput) => {
      const { data, error } = await supabase
        .from('leads_w3_produtos')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads_w3'] });
      toast.success('Produto atualizado!');
    },
    onError: (error: Error) => toast.error('Erro ao atualizar produto: ' + error.message),
  });
}

export function useAutoVincularLeads() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: leads, error: leadsError } = await supabase
        .from('leads_w3').select('id, email').not('email', 'is', null);
      if (leadsError) throw leadsError;

      const { data: vendas, error: vendasError } = await supabase
        .from('vendas').select('nome_lead');
      if (vendasError) throw vendasError;

      const vendaEmails = new Set(
        vendas.map((v) => v.nome_lead?.toLowerCase()).filter(Boolean)
      );
      const toUpdate = leads.filter((l) => vendaEmails.has(l.email!.toLowerCase()));

      let count = 0;
      for (const lead of toUpdate) {
        const { error } = await supabase
          .from('leads_w3')
          .update({ is_cliente_educacao: true, updated_at: new Date().toISOString() })
          .eq('id', lead.id);
        if (!error) count++;
      }
      return count;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['leads_w3'] });
      toast.success(`${count} lead(s) vinculado(s) à Educação automaticamente.`);
    },
    onError: (error: Error) => toast.error('Erro ao vincular leads: ' + error.message),
  });
}
