import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-clientes'] });
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
    },
  });
}
