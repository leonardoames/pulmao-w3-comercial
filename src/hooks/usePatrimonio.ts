import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface PatrimonioAmbiente {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface PatrimonioBem {
  id: string;
  tombamento: string;
  descricao: string;
  categoria: string;
  numero_serie: string;
  marca_modelo: string;
  data_aquisicao: string;
  valor_compra: number;
  fornecedor: string;
  nota_fiscal: string;
  vida_util_anos: number;
  valor_residual_pct: number;
  depreciacao_anual: number;
  ambiente_id: string | null;
  responsavel_user_id: string | null;
  estado_conservacao: string;
  foto_url: string;
  observacoes_manutencao: string;
  status: string;
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
}

export interface PatrimonioTransferencia {
  id: string;
  bem_id: string;
  de_responsavel_user_id: string | null;
  para_responsavel_user_id: string | null;
  de_ambiente_id: string | null;
  para_ambiente_id: string | null;
  data_transferencia: string;
  transferido_por: string;
  observacao: string;
  criado_em: string;
}

export interface PatrimonioManutencao {
  id: string;
  bem_id: string;
  descricao: string;
  data_manutencao: string;
  registrado_por: string;
  criado_em: string;
}

export const CATEGORIAS_PATRIMONIO = [
  'TI e Eletrônicos',
  'Mobiliário',
  'Eletrodoméstico',
  'Eletroeletrônico',
  'Veículo',
  'Outros',
];

export const VIDA_UTIL_PADRAO: Record<string, number> = {
  'TI e Eletrônicos': 5,
  'Mobiliário': 10,
  'Eletrodoméstico': 7,
  'Eletroeletrônico': 5,
  'Veículo': 5,
  'Outros': 5,
};

export const ESTADOS_CONSERVACAO = ['Ótimo', 'Bom', 'Regular', 'Ruim'];
export const STATUS_BEM = ['Ativo', 'Em manutenção', 'Baixado', 'Perdido/Furtado'];
export const MOTIVOS_BAIXA = ['Descarte', 'Venda', 'Perda', 'Furto'];

export function calcDepreciacao(valorCompra: number, valorResidualPct: number, vidaUtilAnos: number) {
  const valorResidual = valorCompra * (valorResidualPct / 100);
  const depAnual = vidaUtilAnos > 0 ? (valorCompra - valorResidual) / vidaUtilAnos : 0;
  return { valorResidual, depAnual };
}

export function calcDepreciacaoAcumulada(valorCompra: number, valorResidualPct: number, vidaUtilAnos: number, dataAquisicao: string) {
  const { depAnual } = calcDepreciacao(valorCompra, valorResidualPct, vidaUtilAnos);
  const mesesPassados = Math.max(0, Math.floor((Date.now() - new Date(dataAquisicao).getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
  const depAcumulada = Math.min(depAnual * (mesesPassados / 12), valorCompra * (1 - valorResidualPct / 100));
  const valorAtual = Math.max(0, valorCompra - depAcumulada);
  return { depAcumulada, valorAtual, mesesPassados };
}

// Hooks
export function usePatrimonioAmbientes() {
  return useQuery({
    queryKey: ['patrimonio-ambientes'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('patrimonio_ambientes')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data as PatrimonioAmbiente[];
    },
  });
}

export function usePatrimonioBens() {
  return useQuery({
    queryKey: ['patrimonio-bens'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('patrimonio_bens')
        .select('*')
        .order('tombamento');
      if (error) throw error;
      return data as PatrimonioBem[];
    },
  });
}

export function usePatrimonioTransferencias(bemId?: string) {
  return useQuery({
    queryKey: ['patrimonio-transferencias', bemId],
    queryFn: async () => {
      let q = (supabase as any).from('patrimonio_transferencias').select('*').order('criado_em', { ascending: false });
      if (bemId) q = q.eq('bem_id', bemId);
      const { data, error } = await q;
      if (error) throw error;
      return data as PatrimonioTransferencia[];
    },
  });
}

export function usePatrimonioManutencoes(bemId?: string) {
  return useQuery({
    queryKey: ['patrimonio-manutencoes', bemId],
    queryFn: async () => {
      let q = (supabase as any).from('patrimonio_manutencoes').select('*').order('criado_em', { ascending: false });
      if (bemId) q = q.eq('bem_id', bemId);
      const { data, error } = await q;
      if (error) throw error;
      return data as PatrimonioManutencao[];
    },
  });
}

export function useCreatePatrimonioBem() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (bem: Partial<PatrimonioBem>) => {
      const { depAnual } = calcDepreciacao(bem.valor_compra || 0, bem.valor_residual_pct || 10, bem.vida_util_anos || 5);
      const { data, error } = await (supabase as any)
        .from('patrimonio_bens')
        .insert({ ...bem, tombamento: bem.tombamento || '', depreciacao_anual: depAnual, criado_por: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patrimonio-bens'] });
      toast.success('Bem cadastrado!');
    },
    onError: () => toast.error('Erro ao cadastrar bem'),
  });
}

export function useUpdatePatrimonioBem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PatrimonioBem> & { id: string }) => {
      if (updates.valor_compra !== undefined || updates.valor_residual_pct !== undefined || updates.vida_util_anos !== undefined) {
        const { depAnual } = calcDepreciacao(
          updates.valor_compra ?? 0,
          updates.valor_residual_pct ?? 10,
          updates.vida_util_anos ?? 5
        );
        updates.depreciacao_anual = depAnual;
      }
      const { data, error } = await (supabase as any)
        .from('patrimonio_bens')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patrimonio-bens'] });
      toast.success('Bem atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar bem'),
  });
}

export function useCreateAmbiente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amb: { nome: string; descricao?: string }) => {
      const { data, error } = await (supabase as any)
        .from('patrimonio_ambientes')
        .insert(amb)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patrimonio-ambientes'] });
      toast.success('Ambiente cadastrado!');
    },
    onError: () => toast.error('Erro ao cadastrar ambiente'),
  });
}

export function useUpdateAmbiente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PatrimonioAmbiente> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('patrimonio_ambientes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patrimonio-ambientes'] });
      toast.success('Ambiente atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar ambiente'),
  });
}

export function useRegistrarTransferencia() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (t: Partial<PatrimonioTransferencia> & { bem_id: string }) => {
      const { error } = await (supabase as any)
        .from('patrimonio_transferencias')
        .insert({ ...t, transferido_por: user?.id });
      if (error) throw error;
      // Update bem
      const updates: any = {};
      if (t.para_responsavel_user_id !== undefined) updates.responsavel_user_id = t.para_responsavel_user_id;
      if (t.para_ambiente_id !== undefined) updates.ambiente_id = t.para_ambiente_id;
      if (Object.keys(updates).length > 0) {
        await (supabase as any).from('patrimonio_bens').update(updates).eq('id', t.bem_id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patrimonio-bens'] });
      qc.invalidateQueries({ queryKey: ['patrimonio-transferencias'] });
      toast.success('Transferência registrada!');
    },
    onError: () => toast.error('Erro ao registrar transferência'),
  });
}

export function useRegistrarManutencao() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (m: { bem_id: string; descricao: string; data_manutencao?: string }) => {
      const { error } = await (supabase as any)
        .from('patrimonio_manutencoes')
        .insert({ ...m, registrado_por: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patrimonio-manutencoes'] });
      toast.success('Manutenção registrada!');
    },
    onError: () => toast.error('Erro ao registrar manutenção'),
  });
}
