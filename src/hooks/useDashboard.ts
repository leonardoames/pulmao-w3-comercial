import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns';

export type DateFilter = 'today' | '7days' | 'month';

function getDateRange(filter: DateFilter) {
  const now = new Date();
  
  switch (filter) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case '7days':
      return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
  }
}

export function useDashboardStats(filter: DateFilter) {
  const { start, end } = getDateRange(filter);

  return useQuery({
    queryKey: ['dashboard-stats', filter],
    queryFn: async () => {
      // Leads novos no período
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id, status_funil')
        .gte('criado_em', start.toISOString())
        .lte('criado_em', end.toISOString());

      if (leadsError) throw leadsError;

      // Calls no período
      const { data: calls, error: callsError } = await supabase
        .from('calls')
        .select('id, status')
        .gte('data_hora', start.toISOString())
        .lte('data_hora', end.toISOString());

      if (callsError) throw callsError;

      // Vendas no período
      const { data: vendas, error: vendasError } = await supabase
        .from('vendas')
        .select('id, valor_total, closer_user_id')
        .gte('data_fechamento', start.toISOString().split('T')[0])
        .lte('data_fechamento', end.toISOString().split('T')[0]);

      if (vendasError) throw vendasError;

      const leadsNovos = leads?.length || 0;
      const callsAgendadas = calls?.filter(c => c.status === 'Agendada').length || 0;
      const callsRealizadas = calls?.filter(c => c.status === 'Realizada').length || 0;
      const noShows = calls?.filter(c => c.status === 'No-show').length || 0;
      const totalVendas = vendas?.length || 0;
      const faturamento = vendas?.reduce((sum, v) => sum + Number(v.valor_total), 0) || 0;
      const ticketMedio = totalVendas > 0 ? faturamento / totalVendas : 0;
      const taxaConversao = callsRealizadas > 0 ? (totalVendas / callsRealizadas) * 100 : 0;
      const taxaNoShow = (callsAgendadas + callsRealizadas + noShows) > 0 
        ? (noShows / (callsAgendadas + callsRealizadas + noShows)) * 100 
        : 0;

      return {
        leadsNovos,
        callsAgendadas,
        callsRealizadas,
        noShows,
        totalVendas,
        faturamento,
        ticketMedio,
        taxaConversao,
        taxaNoShow,
      };
    }
  });
}

export function useCloserRanking(filter: DateFilter) {
  const { start, end } = getDateRange(filter);

  return useQuery({
    queryKey: ['closer-ranking', filter],
    queryFn: async () => {
      const { data: vendas, error } = await supabase
        .from('vendas')
        .select(`
          closer_user_id,
          valor_total,
          closer:profiles!vendas_closer_user_id_fkey(id, nome)
        `)
        .gte('data_fechamento', start.toISOString().split('T')[0])
        .lte('data_fechamento', end.toISOString().split('T')[0]);

      if (error) throw error;

      // Agrupar por closer
      const closerMap = new Map<string, { nome: string; vendas: number; faturamento: number }>();
      
      vendas?.forEach(v => {
        const closerId = v.closer_user_id;
        const closerNome = (v.closer as any)?.nome || 'Desconhecido';
        
        if (!closerMap.has(closerId)) {
          closerMap.set(closerId, { nome: closerNome, vendas: 0, faturamento: 0 });
        }
        
        const current = closerMap.get(closerId)!;
        current.vendas += 1;
        current.faturamento += Number(v.valor_total);
      });

      return Array.from(closerMap.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.faturamento - a.faturamento);
    }
  });
}

export function useFunilStats() {
  return useQuery({
    queryKey: ['funil-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('status_funil');

      if (error) throw error;

      const counts: Record<string, number> = {
        Novo: 0,
        ContatoFeito: 0,
        CallAgendada: 0,
        CallRealizada: 0,
        NoShow: 0,
        Perdido: 0,
        Ganho: 0,
      };

      data?.forEach(lead => {
        counts[lead.status_funil] = (counts[lead.status_funil] || 0) + 1;
      });

      return counts;
    }
  });
}
