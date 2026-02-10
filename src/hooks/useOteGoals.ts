import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OteGoal, OteRealized, calculateOteRealized, getOteBadge } from '@/types/ote';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, parse } from 'date-fns';
import { oteGoalSchema, updateOteGoalSchema } from '@/schemas/validation';

// Hook para buscar metas OTE
export function useOteGoals(monthRef?: string, closerId?: string) {
  return useQuery({
    queryKey: ['ote-goals', monthRef, closerId],
    queryFn: async () => {
      let query = supabase
        .from('ote_goals')
        .select(`
          *,
          closer:profiles!ote_goals_closer_user_id_fkey(id, nome)
        `)
        .order('month_ref', { ascending: false });

      if (monthRef) {
        query = query.eq('month_ref', monthRef);
      }
      if (closerId) {
        query = query.eq('closer_user_id', closerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as OteGoal[];
    }
  });
}

// Hook para buscar uma meta específica
export function useOteGoal(monthRef: string, closerId: string) {
  return useQuery({
    queryKey: ['ote-goal', monthRef, closerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ote_goals')
        .select(`
          *,
          closer:profiles!ote_goals_closer_user_id_fkey(id, nome)
        `)
        .eq('month_ref', monthRef)
        .eq('closer_user_id', closerId)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as OteGoal | null;
    },
    enabled: !!monthRef && !!closerId
  });
}

interface CreateOteGoalInput {
  month_ref: string;
  closer_user_id: string;
  ote_target_value: number;
  created_by_user_id: string;
}

export function useCreateOteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: CreateOteGoalInput) => {
      oteGoalSchema.parse(goal);
      const { data, error } = await supabase
        .from('ote_goals')
        .insert([goal])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ote-goals'] });
      queryClient.invalidateQueries({ queryKey: ['ote-goal'] });
      queryClient.invalidateQueries({ queryKey: ['ote-realized'] });
      toast.success('Meta OTE cadastrada com sucesso!');
    },
    onError: (error: any) => {
      if (error?.code === '23505') {
        toast.error('Já existe uma meta para este closer neste mês');
      } else {
        toast.error('Erro ao cadastrar meta: ' + error.message);
      }
    }
  });
}

interface UpdateOteGoalInput {
  id: string;
  ote_target_value: number;
}

export function useUpdateOteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ote_target_value }: UpdateOteGoalInput) => {
      updateOteGoalSchema.parse({ id, ote_target_value });
      const { data, error } = await supabase
        .from('ote_goals')
        .update({ ote_target_value })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Meta não encontrada');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ote-goals'] });
      queryClient.invalidateQueries({ queryKey: ['ote-goal'] });
      queryClient.invalidateQueries({ queryKey: ['ote-realized'] });
      toast.success('Meta OTE atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar meta: ' + error.message);
    }
  });
}

export function useDeleteOteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ote_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ote-goals'] });
      queryClient.invalidateQueries({ queryKey: ['ote-goal'] });
      queryClient.invalidateQueries({ queryKey: ['ote-realized'] });
      toast.success('Meta OTE removida com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao remover meta: ' + error.message);
    }
  });
}

// Hook para calcular OTE Realizado
export function useOteRealized(monthRef: string, closerId?: string) {
  return useQuery({
    queryKey: ['ote-realized', monthRef, closerId],
    queryFn: async () => {
      // Parse month to get start/end dates
      const monthDate = parse(monthRef, 'yyyy-MM', new Date());
      const startDate = format(startOfMonth(monthDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(monthDate), 'yyyy-MM-dd');

      // Get all goals for the month
      let goalsQuery = supabase
        .from('ote_goals')
        .select(`
          *,
          closer:profiles!ote_goals_closer_user_id_fkey(id, nome)
        `)
        .eq('month_ref', monthRef);

      if (closerId) {
        goalsQuery = goalsQuery.eq('closer_user_id', closerId);
      }

      const { data: goals, error: goalsError } = await goalsQuery;
      if (goalsError) throw goalsError;

      // Get sales for the month
      let salesQuery = supabase
        .from('vendas')
        .select('closer_user_id, valor_pix, valor_cartao, valor_boleto_parcela, quantidade_parcelas_boleto')
        .gte('data_fechamento', startDate)
        .lte('data_fechamento', endDate);

      if (closerId) {
        salesQuery = salesQuery.eq('closer_user_id', closerId);
      }

      const { data: sales, error: salesError } = await salesQuery;
      if (salesError) throw salesError;

      // Aggregate sales by closer
      const salesByCloser = new Map<string, { pixSum: number; cardSum: number; boletoSum: number }>();
      
      sales?.forEach(sale => {
        const id = sale.closer_user_id;
        const current = salesByCloser.get(id) || { pixSum: 0, cardSum: 0, boletoSum: 0 };
        current.pixSum += Number(sale.valor_pix) || 0;
        current.cardSum += Number(sale.valor_cartao) || 0;
        current.boletoSum += (Number(sale.valor_boleto_parcela) || 0) * (Number(sale.quantidade_parcelas_boleto) || 0);
        salesByCloser.set(id, current);
      });

      // Build results
      const results: OteRealized[] = [];

      (goals || []).forEach((goal: any) => {
        const closerId = goal.closer_user_id;
        const closerNome = goal.closer?.nome || 'Desconhecido';
        const salesData = salesByCloser.get(closerId) || { pixSum: 0, cardSum: 0, boletoSum: 0 };
        
        const oteRealized = calculateOteRealized(salesData.pixSum, salesData.cardSum, salesData.boletoSum);
        const oteTarget = Number(goal.ote_target_value) || 0;
        const percentAchieved = oteTarget > 0 ? (oteRealized / oteTarget) * 100 : 0;
        const remaining = Math.max(0, oteTarget - oteRealized);

        results.push({
          closerId,
          closerNome,
          pixSum: salesData.pixSum,
          cardSum: salesData.cardSum,
          boletoSum: salesData.boletoSum,
          oteRealized,
          oteTarget,
          percentAchieved,
          remaining,
          badge: getOteBadge(percentAchieved),
        });
      });

      // Sort by percentage achieved descending
      results.sort((a, b) => b.percentAchieved - a.percentAchieved);

      return results;
    },
    enabled: !!monthRef
  });
}

// Hook para estatísticas totais do time
export function useOteTeamStats(monthRef: string) {
  const { data: realized, isLoading } = useOteRealized(monthRef);

  const stats = {
    totalTarget: 0,
    totalRealized: 0,
    percentAchieved: 0,
    badge: null as OteRealized['badge'],
    closersCount: 0,
    closersWithGoals: 0,
  };

  if (realized && realized.length > 0) {
    stats.totalTarget = realized.reduce((sum, r) => sum + r.oteTarget, 0);
    stats.totalRealized = realized.reduce((sum, r) => sum + r.oteRealized, 0);
    stats.percentAchieved = stats.totalTarget > 0 ? (stats.totalRealized / stats.totalTarget) * 100 : 0;
    stats.badge = getOteBadge(stats.percentAchieved);
    stats.closersCount = realized.length;
    stats.closersWithGoals = realized.filter(r => r.oteTarget > 0).length;
  }

  return { data: stats, isLoading };
}
