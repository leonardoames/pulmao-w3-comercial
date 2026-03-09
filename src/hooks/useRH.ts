import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { RHColaborador, RHFeedback, RHCicloAvaliacao, RHAvaliacao, RHSetorConfig } from '@/types/rh';

// ── Colaboradores ──
export function useRHColaboradores() {
  return useQuery({
    queryKey: ['rh-colaboradores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rh_colaboradores')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data as RHColaborador[];
    },
  });
}

export function useRHColaborador(id?: string) {
  return useQuery({
    queryKey: ['rh-colaborador', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('rh_colaboradores')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as RHColaborador;
    },
    enabled: !!id,
  });
}

export function useCreateColaborador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (colab: Partial<RHColaborador>) => {
      const { data, error } = await supabase
        .from('rh_colaboradores')
        .insert(colab as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rh-colaboradores'] });
      toast.success('Colaborador cadastrado!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao cadastrar'),
  });
}

export function useUpdateColaborador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RHColaborador> & { id: string }) => {
      const { data, error } = await supabase
        .from('rh_colaboradores')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rh-colaboradores'] });
      qc.invalidateQueries({ queryKey: ['rh-colaborador'] });
      toast.success('Colaborador atualizado!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao atualizar'),
  });
}

export function useImportClosers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (closers: { id: string; nome: string }[]) => {
      const rows = closers.map(c => ({
        nome: c.nome,
        cargo: 'Closer',
        setor: 'comercial',
        status: 'ativo',
        closer_id: c.id,
      }));
      const { error } = await supabase
        .from('rh_colaboradores')
        .insert(rows as any);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ['rh-colaboradores'] });
      toast.success(`${count} colaboradores importados com sucesso`);
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao importar'),
  });
}

// ── Feedbacks ──
export function useRHFeedbacks() {
  return useQuery({
    queryKey: ['rh-feedbacks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rh_feedbacks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as RHFeedback[];
    },
  });
}

export function useCreateFeedback() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (fb: Omit<RHFeedback, 'id' | 'created_at' | 'autor_id' | 'colaborador' | 'autor_nome'>) => {
      const { data, error } = await supabase
        .from('rh_feedbacks')
        .insert({ ...fb, autor_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rh-feedbacks'] });
      toast.success('Feedback registrado!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao registrar feedback'),
  });
}

// ── Ciclos de Avaliação ──
export function useRHCiclos() {
  return useQuery({
    queryKey: ['rh-ciclos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rh_ciclos_avaliacao')
        .select('*')
        .order('data_inicio', { ascending: false });
      if (error) throw error;
      return data as RHCicloAvaliacao[];
    },
  });
}

export function useCreateCiclo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ciclo: Omit<RHCicloAvaliacao, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('rh_ciclos_avaliacao')
        .insert(ciclo as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rh-ciclos'] });
      toast.success('Ciclo criado!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao criar ciclo'),
  });
}

export function useUpdateCiclo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RHCicloAvaliacao> & { id: string }) => {
      const { data, error } = await supabase
        .from('rh_ciclos_avaliacao')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rh-ciclos'] });
      toast.success('Ciclo atualizado!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao atualizar ciclo'),
  });
}

// ── Avaliações ──
export function useRHAvaliacoes(cicloId?: string) {
  return useQuery({
    queryKey: ['rh-avaliacoes', cicloId],
    queryFn: async () => {
      let q = supabase.from('rh_avaliacoes').select('*').order('created_at', { ascending: false });
      if (cicloId) q = q.eq('ciclo_id', cicloId);
      const { data, error } = await q;
      if (error) throw error;
      return data as RHAvaliacao[];
    },
  });
}

export function useAvaliacoesByColaborador(colaboradorId?: string) {
  return useQuery({
    queryKey: ['rh-avaliacoes-colab', colaboradorId],
    queryFn: async () => {
      if (!colaboradorId) return [];
      const { data, error } = await supabase
        .from('rh_avaliacoes')
        .select('*')
        .eq('avaliado_id', colaboradorId)
        .eq('status', 'concluida')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as RHAvaliacao[];
    },
    enabled: !!colaboradorId,
  });
}

export function useCreateAvaliacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (av: Omit<RHAvaliacao, 'id' | 'created_at' | 'updated_at' | 'avaliado' | 'ciclo'>) => {
      const { data, error } = await supabase
        .from('rh_avaliacoes')
        .insert(av as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rh-avaliacoes'] });
      qc.invalidateQueries({ queryKey: ['rh-avaliacoes-colab'] });
      toast.success('Avaliação salva!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao salvar avaliação'),
  });
}

export function useUpdateAvaliacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RHAvaliacao> & { id: string }) => {
      const { data, error } = await supabase
        .from('rh_avaliacoes')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rh-avaliacoes'] });
      qc.invalidateQueries({ queryKey: ['rh-avaliacoes-colab'] });
      toast.success('Avaliação atualizada!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao atualizar'),
  });
}

// ── Feedbacks by colaborador ──
export function useFeedbacksByColaborador(colaboradorId?: string) {
  return useQuery({
    queryKey: ['rh-feedbacks-colab', colaboradorId],
    queryFn: async () => {
      if (!colaboradorId) return [];
      const { data, error } = await supabase
        .from('rh_feedbacks')
        .select('*')
        .eq('colaborador_id', colaboradorId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as RHFeedback[];
    },
    enabled: !!colaboradorId,
  });
}
