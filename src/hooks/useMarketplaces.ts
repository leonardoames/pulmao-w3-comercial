import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Sincroniza lead na Base Leads W3 após criar/atualizar cliente de Marketplace (non-blocking)
async function sincronizarLeadAposClienteMarketplace(cliente: {
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
          codigo: `MK-${Date.now()}`,
          nome_negocio: cliente.nome_ecommerce,
          nicho: cliente.nicho ?? null,
          cnpj: cliente.cnpj ?? null,
          data_entrada: cliente.data_entrada ?? null,
          is_cliente_marketplace: true,
          is_cliente_educacao: false,
          is_cliente_trafego: false,
        })
        .select('id')
        .single();
      leadId = newLead?.id ?? null;
    }
    // Linka de volta na tabela operacional
    if (leadId) {
      await supabase.from('marketplace_clientes').update({ lead_id: leadId }).eq('id', cliente.id);
    }
  }

  if (leadId) {
    await supabase.from('leads_w3').update({
      is_cliente_marketplace: true,
      ...(cliente.nicho ? { nicho: cliente.nicho } : {}),
    }).eq('id', leadId);
    await supabase.from('leads_w3_produtos').upsert(
      { lead_id: leadId, produto: 'marketplace', status: produtoStatus, data_inicio: cliente.data_entrada ?? null },
      { onConflict: 'lead_id,produto' }
    );
  }
}

// Recalcula e atualiza valor_pago e valor_total em leads_w3_produtos após registro mensal (non-blocking)
async function atualizarLTVMarketplace(clienteId: string) {
  const { data: cliente } = await supabase
    .from('marketplace_clientes').select('lead_id').eq('id', clienteId).maybeSingle();
  if (!cliente?.lead_id) return;

  const { data: regs } = await supabase
    .from('marketplace_registros').select('total_a_receber, status_pagamento').eq('cliente_id', clienteId);

  const valor_total = (regs ?? []).reduce((s, r) => s + Number(r.total_a_receber), 0);
  const valor_pago = (regs ?? [])
    .filter(r => r.status_pagamento === 'Pago')
    .reduce((s, r) => s + Number(r.total_a_receber), 0);

  await supabase.from('leads_w3_produtos').upsert(
    { lead_id: cliente.lead_id, produto: 'marketplace', valor_total, valor_pago },
    { onConflict: 'lead_id,produto' }
  );
}

export interface FaixaPercentual {
  de: number;
  ate: number | null; // null = sem limite
  percentual: number;
}

export interface MarketplaceCliente {
  id: string;
  nome_ecommerce: string;
  site: string;
  nicho: string;
  faturamento_ao_entrar: number;
  data_entrada: string;
  dia_cobranca: number;
  gestor_user_id: string | null;
  marketplaces: string[];
  status: 'Ativo' | 'Pausado' | 'Cancelado' | 'Trial';
  modelo_cobranca: 'percentual_faixas' | 'fixo_percentual' | 'somente_fixo';
  valor_fixo: number;
  faixas_percentual: FaixaPercentual[];
  observacoes: string;
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
  gestor_nome?: string;
  cnpj?: string | null;
  lead_id?: string | null;
}

export interface MarketplaceRegistro {
  id: string;
  cliente_id: string;
  mes_ano: string;
  faturamento_informado: number;
  fixo_cobrado: number;
  percentual_aplicado: number;
  valor_variavel: number;
  total_a_receber: number;
  status_pagamento: 'Pago' | 'Pendente' | 'Atrasado';
  observacao: string;
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
}

export function calcularValorVariavel(faturamento: number, faixas: FaixaPercentual[]): { percentual: number; valor: number } {
  if (!faixas || faixas.length === 0) return { percentual: 0, valor: 0 };

  let totalVariavel = 0;
  let lastPercentual = 0;

  const sorted = [...faixas].sort((a, b) => a.de - b.de);

  for (const faixa of sorted) {
    const teto = faixa.ate ?? Infinity;
    if (faturamento <= faixa.de) break;

    const faixaBase = Math.min(faturamento, teto) - faixa.de;
    if (faixaBase > 0) {
      totalVariavel += faixaBase * (faixa.percentual / 100);
      lastPercentual = faixa.percentual;
    }
  }

  const avgPercentual = faturamento > 0 ? (totalVariavel / faturamento) * 100 : 0;

  return { percentual: Math.round(avgPercentual * 100) / 100, valor: Math.round(totalVariavel * 100) / 100 };
}

export function useMarketplaceClientes(filters?: {
  search?: string;
  status?: string;
  gestor?: string;
  marketplace?: string;
}) {
  return useQuery({
    queryKey: ['marketplace-clientes', filters],
    queryFn: async () => {
      let q = supabase
        .from('marketplace_clientes')
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
      if (filters?.marketplace && filters.marketplace !== 'all') {
        q = q.contains('marketplaces', [filters.marketplace]);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data as any[]).map(d => ({
        ...d,
        faixas_percentual: Array.isArray(d.faixas_percentual) ? d.faixas_percentual : JSON.parse(d.faixas_percentual || '[]'),
      })) as MarketplaceCliente[];
    },
  });
}

export function useMarketplaceRegistros(clienteId?: string) {
  return useQuery({
    queryKey: ['marketplace-registros', clienteId],
    queryFn: async () => {
      if (!clienteId) return [];
      const { data, error } = await supabase
        .from('marketplace_registros')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('mes_ano', { ascending: false });
      if (error) throw error;
      return data as unknown as MarketplaceRegistro[];
    },
    enabled: !!clienteId,
  });
}

export function useMarketplaceAllRegistros(mesAno?: string) {
  return useQuery({
    queryKey: ['marketplace-all-registros', mesAno],
    queryFn: async () => {
      let q = supabase
        .from('marketplace_registros')
        .select('*')
        .order('mes_ano', { ascending: false });
      if (mesAno) q = q.eq('mes_ano', mesAno);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as MarketplaceRegistro[];
    },
  });
}

export function useMarketplaceRegistrosByMonths(months: string[]) {
  return useQuery({
    queryKey: ['marketplace-registros-months', months],
    queryFn: async () => {
      if (months.length === 0) return [];
      const { data, error } = await supabase
        .from('marketplace_registros')
        .select('*')
        .in('mes_ano', months)
        .order('mes_ano', { ascending: false });
      if (error) throw error;
      return data as unknown as MarketplaceRegistro[];
    },
    enabled: months.length > 0,
  });
}

export function useUpsertMarketplaceCliente() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (cliente: Partial<MarketplaceCliente> & { nome_ecommerce: string }) => {
      const payload = {
        ...cliente,
        faixas_percentual: JSON.stringify(cliente.faixas_percentual || []),
        criado_por: cliente.criado_por || user?.id,
      };

      if (cliente.id) {
        const { data, error } = await supabase
          .from('marketplace_clientes')
          .update(payload)
          .eq('id', cliente.id)
          .select()
          .maybeSingle();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('marketplace_clientes')
          .insert(payload as any)
          .select()
          .maybeSingle();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-clientes'] });
      if (data) {
        sincronizarLeadAposClienteMarketplace(data as any).catch((err) => {
          console.error('Lead sync error (marketplace, non-blocking):', err);
        });
      }
    },
  });
}

export function useUpsertMarketplaceRegistro() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (registro: Partial<MarketplaceRegistro> & { cliente_id: string; mes_ano: string }) => {
      const payload = {
        ...registro,
        criado_por: registro.criado_por || user?.id,
      };

      if (registro.id) {
        const { data, error } = await supabase
          .from('marketplace_registros')
          .update(payload)
          .eq('id', registro.id)
          .select()
          .maybeSingle();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('marketplace_registros')
          .insert(payload as any)
          .select()
          .maybeSingle();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-registros', vars.cliente_id] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-all-registros'] });
      atualizarLTVMarketplace(vars.cliente_id).catch(err =>
        console.error('LTV update error (marketplace, non-blocking):', err)
      );
    },
  });
}
