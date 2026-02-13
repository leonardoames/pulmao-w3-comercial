import { z } from 'zod';

export const vendaSchema = z.object({
  closer_user_id: z.string().uuid('ID do closer inválido'),
  data_fechamento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  nome_lead: z.string().trim().min(1, 'Nome do lead é obrigatório').max(200, 'Nome muito longo'),
  nome_empresa: z.string().trim().min(1, 'Nome da empresa é obrigatório').max(200, 'Nome muito longo'),
  duracao_contrato_meses: z.number().int().min(1).max(120),
  valor_pix: z.number().min(0, 'Valor não pode ser negativo').max(10_000_000),
  valor_cartao: z.number().min(0, 'Valor não pode ser negativo').max(10_000_000),
  valor_boleto_parcela: z.number().min(0, 'Valor não pode ser negativo').max(10_000_000),
  quantidade_parcelas_boleto: z.number().int().min(0).max(120),
  pago: z.boolean().optional(),
  contrato_assinado: z.boolean().optional(),
  observacoes: z.string().max(2000, 'Observações muito longas').optional().nullable(),
});

export const updateVendaSchema = vendaSchema.partial().extend({
  id: z.string().uuid('ID da venda inválido'),
  status: z.enum(['Ativo', 'Congelado', 'Cancelado', 'Finalizado']).optional(),
});

export const fechamentoSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  closer_user_id: z.string().uuid('ID do closer inválido'),
  calls_realizadas: z.number().int().min(0, 'Valor não pode ser negativo').max(1000),
  no_show: z.number().int().min(0, 'Valor não pode ser negativo').max(1000),
  observacoes: z.string().max(2000, 'Observações muito longas').optional().nullable(),
});

export const oteGoalSchema = z.object({
  month_ref: z.string().regex(/^\d{4}-\d{2}$/, 'Mês inválido'),
  closer_user_id: z.string().uuid('ID do closer inválido'),
  ote_target_value: z.number().min(0, 'Valor não pode ser negativo').max(10_000_000),
  created_by_user_id: z.string().uuid('ID do criador inválido'),
});

export const updateOteGoalSchema = z.object({
  id: z.string().uuid('ID da meta inválido'),
  ote_target_value: z.number().min(0, 'Valor não pode ser negativo').max(10_000_000),
});

export const socialSellingSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  closer_user_id: z.string().uuid('ID do closer inválido'),
  conversas_iniciadas: z.number().int().min(0, 'Valor não pode ser negativo').max(10_000),
  convites_enviados: z.number().int().min(0, 'Valor não pode ser negativo').max(10_000),
  agendamentos: z.number().int().min(0, 'Valor não pode ser negativo').max(10_000),
  observacoes: z.string().max(2000, 'Observações muito longas').optional().nullable(),
});
