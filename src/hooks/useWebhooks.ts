import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Webhook {
  id: string;
  nome: string;
  url: string;
  ambiente: 'teste' | 'producao';
  evento: string;
  ativo: boolean;
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
}

export function useWebhooks() {
  return useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhooks' as any)
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as Webhook[];
    }
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (webhook: { nome: string; url: string; ambiente: string; evento: string; criado_por: string }) => {
      const { data, error } = await supabase
        .from('webhooks' as any)
        .insert([webhook] as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook criado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar webhook: ' + error.message);
    }
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; nome?: string; url?: string; ambiente?: string; ativo?: boolean }) => {
      const { data, error } = await supabase
        .from('webhooks' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook atualizado');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar webhook: ' + error.message);
    }
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('webhooks' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook removido');
    },
    onError: (error) => {
      toast.error('Erro ao remover webhook: ' + error.message);
    }
  });
}
