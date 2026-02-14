import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ConteudoMarketing, ConteudoComentario, ConteudoStatus } from '@/types/conteudo';

export function useConteudos() {
  return useQuery({
    queryKey: ['conteudos_marketing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conteudos_marketing' as any)
        .select('*')
        .order('ordem', { ascending: true });
      if (error) throw error;
      return (data as any[]) as ConteudoMarketing[];
    },
  });
}

export function useCreateConteudo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ConteudoMarketing> & { titulo: string; criado_por: string }) => {
      const { data, error } = await supabase
        .from('conteudos_marketing' as any)
        .insert(input as any)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as unknown as ConteudoMarketing;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conteudos_marketing'] }),
  });
}

export function useUpdateConteudo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ConteudoMarketing> & { id: string }) => {
      const { error } = await supabase
        .from('conteudos_marketing' as any)
        .update(updates as any)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conteudos_marketing'] }),
  });
}

export function useDeleteConteudo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('conteudos_marketing' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conteudos_marketing'] }),
  });
}

export function useConteudoComentarios(conteudoId: string | null) {
  return useQuery({
    queryKey: ['conteudo_comentarios', conteudoId],
    enabled: !!conteudoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conteudo_comentarios' as any)
        .select('*')
        .eq('conteudo_id', conteudoId!)
        .order('criado_em', { ascending: true });
      if (error) throw error;
      return (data as any[]) as ConteudoComentario[];
    },
  });
}

export function useAddComentario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { conteudo_id: string; user_id: string; texto: string }) => {
      const { error } = await supabase
        .from('conteudo_comentarios' as any)
        .insert(input as any)
        .maybeSingle();
      if (error) throw error;
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ['conteudo_comentarios', vars.conteudo_id] }),
  });
}
