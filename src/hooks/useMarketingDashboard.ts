import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DateFilter, DateRange, getDateRange } from '@/hooks/useDashboard';

// Fetch investimentos for a date range
export function useMarketingInvestimentos(filter: DateFilter, customRange?: DateRange) {
  const { start, end } = getDateRange(filter, customRange);

  return useQuery({
    queryKey: ['marketing-investimentos', filter, customRange?.start?.toISOString(), customRange?.end?.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_investimentos')
        .select('*')
        .gte('data', start.toISOString().split('T')[0])
        .lte('data', end.toISOString().split('T')[0]);

      if (error) throw error;
      return data;
    },
  });
}

// Fetch single day investimento for the form
export function useMarketingInvestimentoDia(date: string) {
  return useQuery({
    queryKey: ['marketing-investimento-dia', date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_investimentos')
        .select('*')
        .eq('data', date)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!date,
  });
}

// Upsert investimento
export function useUpsertInvestimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ data, valor }: { data: string; valor: number }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Não autenticado');

      const { data: existing } = await supabase
        .from('marketing_investimentos')
        .select('id')
        .eq('data', data)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('marketing_investimentos')
          .update({ valor })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('marketing_investimentos')
          .insert({ data, valor, criado_por: user.user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-investimentos'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-investimento-dia'] });
    },
  });
}

// Main marketing dashboard stats
export function useMarketingStats(filter: DateFilter, customRange?: DateRange, closerId?: string, fbSpend?: number | null) {
  const { start, end } = getDateRange(filter, customRange);

  return useQuery({
    queryKey: ['marketing-stats', filter, customRange?.start?.toISOString(), customRange?.end?.toISOString(), closerId, fbSpend],
    queryFn: async () => {
      // 1. Investimento total do período (always ALL closers)
      const { data: investimentos } = await supabase
        .from('marketing_investimentos')
        .select('valor')
        .gte('data', start.toISOString().split('T')[0])
        .lte('data', end.toISOString().split('T')[0]);

      const investimentoManual = investimentos && investimentos.length > 0
        ? investimentos.reduce((sum, i) => sum + Number(i.valor), 0)
        : null;

      // Use Facebook Ads spend as primary source, fallback to manual
      const investimentoTotal = (fbSpend != null && fbSpend > 0) ? fbSpend : investimentoManual;

      // 2. Fechamentos GERAL (all closers) for CPA geral
      const { data: fechamentosGeral } = await supabase
        .from('fechamentos')
        .select('calls_realizadas, no_show')
        .gte('data', start.toISOString().split('T')[0])
        .lte('data', end.toISOString().split('T')[0]);

      const callsRealizadasGeral = fechamentosGeral?.reduce((s, f) => s + f.calls_realizadas, 0) || 0;
      const noShowGeral = fechamentosGeral?.reduce((s, f) => s + f.no_show, 0) || 0;
      const callsAgendadasGeral = callsRealizadasGeral + noShowGeral;

      // CPA Geral (never changes by closer)
      const cpaGeral = investimentoTotal !== null && callsAgendadasGeral > 0
        ? investimentoTotal / callsAgendadasGeral
        : null;

      // 3. Fechamentos filtered by closer
      let fechamentosQuery = supabase
        .from('fechamentos')
        .select('calls_realizadas, no_show')
        .gte('data', start.toISOString().split('T')[0])
        .lte('data', end.toISOString().split('T')[0]);

      if (closerId && closerId !== 'all') {
        fechamentosQuery = fechamentosQuery.eq('closer_user_id', closerId);
      }

      const { data: fechamentos } = await fechamentosQuery;

      const callsRealizadas = fechamentos?.reduce((s, f) => s + f.calls_realizadas, 0) || 0;
      const noShows = fechamentos?.reduce((s, f) => s + f.no_show, 0) || 0;
      const callsAgendadas = callsRealizadas + noShows;

      // 4. Vendas filtered by closer
      let vendasQuery = supabase
        .from('vendas')
        .select('id, valor_total, valor_pix, valor_cartao')
        .gte('data_fechamento', start.toISOString().split('T')[0])
        .lte('data_fechamento', end.toISOString().split('T')[0]);

      if (closerId && closerId !== 'all') {
        vendasQuery = vendasQuery.eq('closer_user_id', closerId);
      }

      const { data: vendas } = await vendasQuery;

      const volumeVendas = vendas?.reduce((s, v) => s + Number(v.valor_total), 0) || 0;
      const qtdVendas = vendas?.length || 0;
      const valorPix = vendas?.reduce((s, v) => s + Number(v.valor_pix), 0) || 0;
      const valorCartao = vendas?.reduce((s, v) => s + Number(v.valor_cartao), 0) || 0;
      const receitaImediata = valorPix + valorCartao;

      // 5. Calculate investment-dependent metrics
      const isCloserFilter = closerId && closerId !== 'all';

      // Investimento atribuído ao closer
      const investimentoAtribuido = isCloserFilter && cpaGeral !== null
        ? callsAgendadas * cpaGeral
        : investimentoTotal;

      // D) Custo por agendamento
      const custoAgendamento = investimentoTotal !== null && callsAgendadas > 0
        ? (isCloserFilter ? (cpaGeral !== null ? cpaGeral : null) : investimentoTotal / callsAgendadas)
        : null;

      // E) Custo por call realizada
      const custoCallRealizada = investimentoTotal !== null && callsRealizadas > 0
        ? (isCloserFilter
          ? (investimentoAtribuido !== null ? investimentoAtribuido / callsRealizadas : null)
          : investimentoTotal / callsRealizadas)
        : null;

      // H) CAC
      const cac = investimentoAtribuido !== null && qtdVendas > 0
        ? investimentoAtribuido / qtdVendas
        : null;

      // I) ROAS Global
      const roasGlobal = investimentoAtribuido !== null && investimentoAtribuido > 0
        ? volumeVendas / investimentoAtribuido
        : null;

      // J) ROAS Imediato
      const roasImediato = investimentoAtribuido !== null && investimentoAtribuido > 0
        ? receitaImediata / investimentoAtribuido
        : null;

      return {
        investimentoTotal,
        callsAgendadas,
        callsRealizadas,
        custoAgendamento,
        custoCallRealizada,
        volumeVendas,
        qtdVendas,
        cac,
        roasGlobal,
        roasImediato,
      };
    },
  });
}
