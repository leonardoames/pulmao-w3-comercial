import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Sincroniza lead na Base Leads W3 após criar/atualizar cliente de Tráfego (non-blocking)
async function sincronizarLeadAposClienteTrafego(cliente: {
  id: string;
  lead_id?: string | null;
  cnpj?: string | null;
  nome_ecommerce: string;
  nicho?: string | null;
  data_entrada?: string | null;
  status: string;
}) {
  const produtoStatus = (
    { Ativo: 'ativo', Pausado: 'congelado', Trial: 'ativo', Cancelado: 'cancelado' } as Record<string, string>
  )[cliente.status] ?? 'ativo';

  let leadId = cliente.lead_id ?? null;

  if (!leadId) {
    // 1. Busca por CNPJ
    if (cliente.cnpj) {
      const { data } = await supabase.from('leads_w3').select('id').eq('cnpj', cliente.cnpj).maybeSingle();
      leadId = data?.id ?? null;
    }
    // 2. Fallback: busca por nome_negocio
    if (!leadId) {
      const { data } = await supabase.from('leads_w3').select('id').ilike('nome_negocio', cliente.nome_ecommerce).maybeSingle();
      leadId = data?.id ?? null;
    }
    // 3. Cria novo lead se não encontrou
    if (!leadId) {
      const { data: newLead } = await supabase
        .from('leads_w3')
        .insert({
          codigo: `TP-${Date.now()}`,
          nome_negocio: cliente.nome_ecommerce,
          nicho: cliente.nicho ?? null,
          cnpj: cliente.cnpj ?? null,
          data_entrada: cliente.data_entrada ?? null,
          is_cliente_trafego: true,
          is_cliente_educacao: false,
          is_cliente_marketplace: false,
        })
        .select('id')
        .single();
      leadId = newLead?.id ?? null;
    }
    // Linka de volta na tabela operacional
    if (leadId) {
      await supabase.from('trafego_pago_clientes').update({ lead_id: leadId }).eq('id', cliente.id);
    }
  }

  if (leadId) {
    await supabase.from('leads_w3').update({
      is_cliente_trafego: true,
      ...(cliente.nicho ? { nicho: cliente.nicho } : {}),
    }).eq('id', leadId);
    await supabase.from('leads_w3_produtos').upsert(
      { lead_id: leadId, produto: 'trafego', status: produtoStatus, data_inicio: cliente.data_entrada ?? null },
      { onConflict: 'lead_id,produto' }
    );
  }
}

// Recalcula e atualiza valor_pago e valor_total em leads_w3_produtos após registro mensal (non-blocking)
async function atualizarLTVTrafego(clienteId: string) {
  const { data: cliente } = await supabase
    .from('trafego_pago_clientes').select('lead_id').eq('id', clienteId).maybeSingle();
  if (!cliente?.lead_id) return;

  const { data: regs } = await supabase
    .from('trafego_pago_registros').select('valor_pago, status_pagamento').eq('cliente_id', clienteId);

  const valor_total = (regs ?? []).reduce((s, r) => s + Number(r.valor_pago), 0);
  const valor_pago = (regs ?? [])
    .filter(r => r.status_pagamento === 'Pago')
    .reduce((s, r) => s + Number(r.valor_pago), 0);

  await supabase.from('leads_w3_produtos').upsert(
    { lead_id: cliente.lead_id, produto: 'trafego', valor_total, valor_pago },
    { onConflict: 'lead_id,produto' }
  );
}

export interface TrafegoPagoCliente {
  id: string;
  nome_ecommerce: string;
  site: string;
  nicho: string;
  faturamento_ao_entrar: number;
  data_entrada: string;
  dia_cobranca: number;
  gestor_user_id: string | null;
  plataformas: string[];
  status: 'Ativo' | 'Pausado' | 'Cancelado' | 'Trial';
  tabela_precos: string;
  observacoes: string;
  valor_mrr: number;
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
  gestor_nome?: string;
  cnpj?: string | null;
  lead_id?: string | null;
}

export interface TrafegoPagoRegistro {
  id: string;
  cliente_id: string;
  mes_ano: string;
  investimento_gerenciado: number;
  valor_pago: number;
  status_pagamento: 'Pago' | 'Pendente' | 'Atrasado';
  roas_entregue: number | null;
  observacao: string;
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
}

export function useTrafegoPagoClientes(filters?: {
  search?: string;
  status?: string;
  gestor?: string;
  plataforma?: string;
}) {
  return useQuery({
    queryKey: ['trafego-pago-clientes', filters],
    queryFn: async () => {
      let q = supabase
        .from('trafego_pago_clientes')
        .select('*')
        .order('criado_em', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        q = q.eq('status', filters.status as any);
      }
      if (filters?.gestor && filters.gestor !== 'all') {
        q = q.eq('gestor_user_id', filters.gestor);
      }
      if (filters?.search) {
        q = q.ilike('nome_ecommerce', `%${filters.search}%`);
      }
      if (filters?.plataforma && filters.plataforma !== 'all') {
        q = q.contains('plataformas', [filters.plataforma]);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as TrafegoPagoCliente[];
    },
  });
}

export function useTrafegoPagoRegistros(clienteId?: string) {
  return useQuery({
    queryKey: ['trafego-pago-registros', clienteId],
    queryFn: async () => {
      if (!clienteId) return [];
      const { data, error } = await supabase
        .from('trafego_pago_registros')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('mes_ano', { ascending: false });
      if (error) throw error;
      return data as unknown as TrafegoPagoRegistro[];
    },
    enabled: !!clienteId,
  });
}

export function useTrafegoPagoAllRegistros(mesAno?: string) {
  return useQuery({
    queryKey: ['trafego-pago-all-registros', mesAno],
    queryFn: async () => {
      let q = supabase
        .from('trafego_pago_registros')
        .select('*')
        .order('mes_ano', { ascending: false });
      if (mesAno) q = q.eq('mes_ano', mesAno);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as TrafegoPagoRegistro[];
    },
  });
}

export function useTrafegoPagoRegistrosByMonths(months: string[]) {
  return useQuery({
    queryKey: ['trafego-pago-registros-months', months],
    queryFn: async () => {
      if (months.length === 0) return [];
      const { data, error } = await supabase
        .from('trafego_pago_registros')
        .select('*')
        .in('mes_ano', months)
        .order('mes_ano', { ascending: false });
      if (error) throw error;
      return data as unknown as TrafegoPagoRegistro[];
    },
    enabled: months.length > 0,
  });
}

export function useUpsertTrafegoPagoCliente() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (cliente: Partial<TrafegoPagoCliente> & { nome_ecommerce: string }) => {
      const payload = {
        ...cliente,
        criado_por: cliente.criado_por || user?.id,
      };

      if (cliente.id) {
        const { data, error } = await supabase
          .from('trafego_pago_clientes')
          .update(payload)
          .eq('id', cliente.id)
          .select()
          .maybeSingle();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('trafego_pago_clientes')
          .insert(payload as any)
          .select()
          .maybeSingle();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trafego-pago-clientes'] });
      if (data) {
        sincronizarLeadAposClienteTrafego(data as any).catch((err) => {
          console.error('Lead sync error (trafego, non-blocking):', err);
        });
      }
    },
  });
}

export function useUpsertTrafegoPagoRegistro() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (registro: Partial<TrafegoPagoRegistro> & { cliente_id: string; mes_ano: string }) => {
      const payload = {
        ...registro,
        criado_por: registro.criado_por || user?.id,
      };

      if (registro.id) {
        const { data, error } = await supabase
          .from('trafego_pago_registros')
          .update(payload)
          .eq('id', registro.id)
          .select()
          .maybeSingle();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('trafego_pago_registros')
          .insert(payload as any)
          .select()
          .maybeSingle();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['trafego-pago-registros', vars.cliente_id] });
      queryClient.invalidateQueries({ queryKey: ['trafego-pago-all-registros'] });
      atualizarLTVTrafego(vars.cliente_id).catch(err =>
        console.error('LTV update error (trafego, non-blocking):', err)
      );
    },
  });
}

export function useBatchInsertTrafegoPagoRegistros() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (registros: Array<{ cliente_id: string; mes_ano: string; investimento_gerenciado: number; valor_pago: number; status_pagamento: string; roas_entregue?: number | null; observacao?: string }>) => {
      const payload = registros.map(r => ({
        ...r,
        criado_por: user?.id,
      }));
      const { data, error } = await supabase
        .from('trafego_pago_registros')
        .insert(payload as any)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trafego-pago-registros'] });
      queryClient.invalidateQueries({ queryKey: ['trafego-pago-all-registros'] });
    },
  });
}
