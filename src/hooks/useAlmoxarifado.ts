import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface AlmoxarifadoItem {
  id: string;
  nome: string;
  categoria: string;
  unidade_medida: string;
  quantidade_atual: number;
  estoque_minimo: number;
  estoque_maximo: number;
  ultimo_preco: number;
  fornecedor_habitual: string;
  observacoes: string;
  ativo: boolean;
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
}

export interface AlmoxarifadoMovimentacao {
  id: string;
  item_id: string;
  tipo: 'Entrada' | 'Saida';
  quantidade: number;
  valor_unitario: number;
  data_movimentacao: string;
  observacao: string;
  responsavel_user_id: string;
  criado_em: string;
}

export const CATEGORIAS_ALMOXARIFADO = [
  'Material de Limpeza',
  'Material de Escritório',
  'Copa e Cozinha',
  'Higiene',
  'Informática',
  'Outros',
];

export const UNIDADES_MEDIDA = [
  'Unidade', 'Pacote', 'Caixa', 'Rolo', 'Litro', 'Kg', 'Resma',
];

export const SUGESTOES_ITENS: Record<string, string[]> = {
  'Material de Limpeza': ['Detergente', 'Desinfetante', 'Álcool 70%', 'Papel toalha', 'Pano de limpeza', 'Luva descartável', 'Saco de lixo P', 'Saco de lixo M', 'Saco de lixo G', 'Sabão em pó', 'Água sanitária'],
  'Higiene': ['Papel higiênico', 'Sabonete líquido', 'Papel para banheiro'],
  'Copa e Cozinha': ['Café', 'Açúcar', 'Copo descartável', 'Colher descartável', 'Prato descartável', 'Filtro de café', 'Água mineral'],
  'Material de Escritório': ['Papel A4 (resma)', 'Caneta', 'Lápis', 'Grampeador', 'Grampo', 'Clipe', 'Post-it', 'Envelope', 'Etiqueta', 'Durex', 'Tesoura'],
  'Informática': ['Cartucho de tinta', 'Toner', 'Cabo USB', 'Pilha AA', 'Pilha AAA', 'Mouse pad'],
};

export function useAlmoxarifadoItens() {
  return useQuery({
    queryKey: ['almoxarifado-itens'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('almoxarifado_itens')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data as AlmoxarifadoItem[];
    },
  });
}

export function useAlmoxarifadoMovimentacoes(itemId?: string) {
  return useQuery({
    queryKey: ['almoxarifado-movimentacoes', itemId],
    queryFn: async () => {
      let query = (supabase as any)
        .from('almoxarifado_movimentacoes')
        .select('*')
        .order('data_movimentacao', { ascending: false })
        .order('criado_em', { ascending: false });
      if (itemId) query = query.eq('item_id', itemId);
      const { data, error } = await query;
      if (error) throw error;
      return data as AlmoxarifadoMovimentacao[];
    },
  });
}

export function useCreateAlmoxarifadoItem() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (item: Partial<AlmoxarifadoItem>) => {
      const { data, error } = await (supabase as any)
        .from('almoxarifado_itens')
        .insert({ ...item, criado_por: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['almoxarifado-itens'] });
      toast.success('Item cadastrado!');
    },
    onError: () => toast.error('Erro ao cadastrar item'),
  });
}

export function useUpdateAlmoxarifadoItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AlmoxarifadoItem> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('almoxarifado_itens')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['almoxarifado-itens'] });
      toast.success('Item atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar item'),
  });
}

export function useRegistrarMovimentacao() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (mov: { item_id: string; tipo: 'Entrada' | 'Saida'; quantidade: number; valor_unitario?: number; data_movimentacao?: string; observacao?: string }) => {
      // Insert movimentacao
      const { error: movError } = await (supabase as any)
        .from('almoxarifado_movimentacoes')
        .insert({
          ...mov,
          responsavel_user_id: user?.id,
          valor_unitario: mov.valor_unitario || 0,
          data_movimentacao: mov.data_movimentacao || new Date().toISOString().split('T')[0],
          observacao: mov.observacao || '',
        });
      if (movError) throw movError;

      // Get current item
      const { data: item, error: getErr } = await (supabase as any)
        .from('almoxarifado_itens')
        .select('quantidade_atual, ultimo_preco')
        .eq('id', mov.item_id)
        .single();
      if (getErr) throw getErr;

      const novaQtd = mov.tipo === 'Entrada'
        ? item.quantidade_atual + mov.quantidade
        : item.quantidade_atual - mov.quantidade;

      const updates: any = { quantidade_atual: novaQtd };
      if (mov.tipo === 'Entrada' && mov.valor_unitario) {
        updates.ultimo_preco = mov.valor_unitario;
      }

      const { error: updErr } = await (supabase as any)
        .from('almoxarifado_itens')
        .update(updates)
        .eq('id', mov.item_id);
      if (updErr) throw updErr;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['almoxarifado-itens'] });
      qc.invalidateQueries({ queryKey: ['almoxarifado-movimentacoes'] });
      toast.success(vars.tipo === 'Entrada' ? 'Entrada registrada!' : 'Retirada registrada!');
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao registrar movimentação'),
  });
}
