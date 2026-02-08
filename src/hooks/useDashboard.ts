import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subWeeks } from 'date-fns';

export type DateFilter = 'today' | 'yesterday' | '7days' | 'month' | '30days' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export function getDateRange(filter: DateFilter, customRange?: DateRange): DateRange {
  const now = new Date();
  
  switch (filter) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'yesterday':
      const yesterday = subDays(now, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    case '7days':
      return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case '30days':
      return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) };
    case 'custom':
      return customRange || { start: startOfDay(now), end: endOfDay(now) };
  }
}

export function useDashboardStats(filter: DateFilter, customRange?: DateRange) {
  const { start, end } = getDateRange(filter, customRange);

  return useQuery({
    queryKey: ['dashboard-stats', filter, customRange?.start?.toISOString(), customRange?.end?.toISOString()],
    queryFn: async () => {
      // Fechamentos no período
      const { data: fechamentos, error: fechamentosError } = await supabase
        .from('fechamentos')
        .select('calls_realizadas, no_show')
        .gte('data', start.toISOString().split('T')[0])
        .lte('data', end.toISOString().split('T')[0]);

      if (fechamentosError) throw fechamentosError;

      // Vendas no período
      const { data: vendas, error: vendasError } = await supabase
        .from('vendas')
        .select('id, valor_total, valor_pix, valor_cartao, valor_boleto_parcela, quantidade_parcelas_boleto, closer_user_id')
        .gte('data_fechamento', start.toISOString().split('T')[0])
        .lte('data_fechamento', end.toISOString().split('T')[0]);

      if (vendasError) throw vendasError;

      const callsRealizadas = fechamentos?.reduce((sum, f) => sum + f.calls_realizadas, 0) || 0;
      const noShows = fechamentos?.reduce((sum, f) => sum + f.no_show, 0) || 0;
      const callsAgendadas = callsRealizadas + noShows;
      const percentNoShow = callsAgendadas > 0 ? (noShows / callsAgendadas) * 100 : 0;
      
      const totalVendas = vendas?.length || 0;
      const volumeVendas = vendas?.reduce((sum, v) => sum + Number(v.valor_total), 0) || 0;
      const valorPix = vendas?.reduce((sum, v) => sum + Number(v.valor_pix), 0) || 0;
      const valorCartao = vendas?.reduce((sum, v) => sum + Number(v.valor_cartao), 0) || 0;
      const valorBoleto = vendas?.reduce((sum, v) => sum + (Number(v.valor_boleto_parcela) * Number(v.quantidade_parcelas_boleto)), 0) || 0;
      const caixaDoMes = valorPix + valorCartao;
      const proporcaoCaixa = volumeVendas > 0 ? (caixaDoMes / volumeVendas) * 100 : 0;
      
      const ticketMedio = totalVendas > 0 ? volumeVendas / totalVendas : 0;
      const taxaConversao = callsRealizadas > 0 ? (totalVendas / callsRealizadas) * 100 : 0;
      const faturamentoPorCall = callsRealizadas > 0 ? volumeVendas / callsRealizadas : 0;

      return {
        callsRealizadas,
        noShows,
        callsAgendadas,
        percentNoShow,
        totalVendas,
        volumeVendas,
        valorPix,
        valorCartao,
        valorBoleto,
        caixaDoMes,
        proporcaoCaixa,
        ticketMedio,
        taxaConversao,
        faturamentoPorCall,
      };
    }
  });
}

export function useCloserRankings(filter: DateFilter, customRange?: DateRange) {
  const { start, end } = getDateRange(filter, customRange);
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  return useQuery({
    queryKey: ['closer-rankings', filter, customRange?.start?.toISOString(), customRange?.end?.toISOString()],
    queryFn: async () => {
      // Vendas do dia
      const { data: vendasDia } = await supabase
        .from('vendas')
        .select(`
          closer_user_id,
          valor_total,
          closer:profiles!vendas_closer_user_id_fkey(id, nome)
        `)
        .gte('data_fechamento', todayStart.toISOString().split('T')[0])
        .lte('data_fechamento', todayEnd.toISOString().split('T')[0]);

      // Vendas da semana
      const { data: vendasSemana } = await supabase
        .from('vendas')
        .select(`
          closer_user_id,
          valor_total,
          closer:profiles!vendas_closer_user_id_fkey(id, nome)
        `)
        .gte('data_fechamento', weekStart.toISOString().split('T')[0])
        .lte('data_fechamento', weekEnd.toISOString().split('T')[0]);

      // Fechamentos para cálculo de conversão e no-show (período selecionado)
      const { data: fechamentos } = await supabase
        .from('fechamentos')
        .select(`
          closer_user_id,
          calls_realizadas,
          no_show,
          closer:profiles!fechamentos_closer_user_id_fkey(id, nome)
        `)
        .gte('data', start.toISOString().split('T')[0])
        .lte('data', end.toISOString().split('T')[0]);

      // Vendas do período para conversão
      const { data: vendasPeriodo } = await supabase
        .from('vendas')
        .select(`
          closer_user_id,
          valor_total,
          closer:profiles!vendas_closer_user_id_fkey(id, nome)
        `)
        .gte('data_fechamento', start.toISOString().split('T')[0])
        .lte('data_fechamento', end.toISOString().split('T')[0]);

      // Agregar top closer do dia
      const closerDiaMap = new Map<string, { nome: string; volume: number }>();
      vendasDia?.forEach(v => {
        const id = v.closer_user_id;
        const nome = (v.closer as any)?.nome || 'Desconhecido';
        const current = closerDiaMap.get(id) || { nome, volume: 0 };
        current.volume += Number(v.valor_total);
        closerDiaMap.set(id, current);
      });
      const topCloserDia = Array.from(closerDiaMap.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.volume - a.volume)[0] || null;

      // Agregar top closer da semana
      const closerSemanaMap = new Map<string, { nome: string; volume: number }>();
      vendasSemana?.forEach(v => {
        const id = v.closer_user_id;
        const nome = (v.closer as any)?.nome || 'Desconhecido';
        const current = closerSemanaMap.get(id) || { nome, volume: 0 };
        current.volume += Number(v.valor_total);
        closerSemanaMap.set(id, current);
      });
      const topCloserSemana = Array.from(closerSemanaMap.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.volume - a.volume)[0] || null;

      // Agregar métricas por closer para conversão e no-show
      const closerMetricsMap = new Map<string, { 
        nome: string; 
        callsRealizadas: number; 
        noShow: number; 
        vendas: number;
        volume: number;
      }>();

      fechamentos?.forEach(f => {
        const id = f.closer_user_id;
        const nome = (f.closer as any)?.nome || 'Desconhecido';
        const current = closerMetricsMap.get(id) || { nome, callsRealizadas: 0, noShow: 0, vendas: 0, volume: 0 };
        current.callsRealizadas += f.calls_realizadas;
        current.noShow += f.no_show;
        closerMetricsMap.set(id, current);
      });

      vendasPeriodo?.forEach(v => {
        const id = v.closer_user_id;
        const nome = (v.closer as any)?.nome || 'Desconhecido';
        const current = closerMetricsMap.get(id) || { nome, callsRealizadas: 0, noShow: 0, vendas: 0, volume: 0 };
        current.vendas += 1;
        current.volume += Number(v.valor_total);
        closerMetricsMap.set(id, current);
      });

      // Top conversão
      const closersConversao = Array.from(closerMetricsMap.entries())
        .map(([id, data]) => ({ 
          id, 
          ...data, 
          taxaConversao: data.callsRealizadas > 0 ? (data.vendas / data.callsRealizadas) * 100 : 0 
        }))
        .filter(c => c.callsRealizadas > 0)
        .sort((a, b) => b.taxaConversao - a.taxaConversao);
      const topConversao = closersConversao[0] || null;

      // Menor no-show
      const closersNoShow = Array.from(closerMetricsMap.entries())
        .map(([id, data]) => ({ 
          id, 
          ...data, 
          percentNoShow: (data.callsRealizadas + data.noShow) > 0 
            ? (data.noShow / (data.callsRealizadas + data.noShow)) * 100 
            : 0 
        }))
        .filter(c => (c.callsRealizadas + c.noShow) > 0)
        .sort((a, b) => a.percentNoShow - b.percentNoShow);
      const menorNoShow = closersNoShow[0] || null;

      // Ranking geral por volume
      const rankingGeral = Array.from(closerMetricsMap.entries())
        .map(([id, data]) => ({ 
          id, 
          ...data,
          taxaConversao: data.callsRealizadas > 0 ? (data.vendas / data.callsRealizadas) * 100 : 0,
          percentNoShow: (data.callsRealizadas + data.noShow) > 0 
            ? (data.noShow / (data.callsRealizadas + data.noShow)) * 100 
            : 0
        }))
        .sort((a, b) => b.volume - a.volume);

      return {
        topCloserDia,
        topCloserSemana,
        topConversao,
        menorNoShow,
        rankingGeral,
      };
    }
  });
}
