import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/** Busca a meta de faturamento para um mês (YYYY-MM). Retorna null se não cadastrada. */
export function useMetaMensal(monthRef: string) {
  return useQuery({
    queryKey: ['meta-faturamento', monthRef],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metas_faturamento' as any)
        .select('valor')
        .eq('month_ref', monthRef)
        .maybeSingle();
      if (error) throw error;
      return data ? Number((data as any).valor) : null;
    },
    enabled: !!monthRef,
  });
}

interface UpsertMetaMensalInput {
  monthRef: string;
  valor: number;
}

export function useUpsertMetaMensal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ monthRef, valor }: UpsertMetaMensalInput) => {
      const { error } = await supabase
        .from('metas_faturamento' as any)
        .upsert(
          { month_ref: monthRef, valor, atualizado_em: new Date().toISOString() },
          { onConflict: 'month_ref' }
        );
      if (error) throw error;
    },
    onSuccess: (_, { monthRef }) => {
      queryClient.invalidateQueries({ queryKey: ['meta-faturamento', monthRef] });
      toast.success('Meta de faturamento atualizada!');
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar meta: ' + error.message);
    },
  });
}
