export type UserRole = 'CEO' | 'Founder' | 'GestorComercial' | 'Closer' | 'SDR' | 'CS' | 'Mentor' | 'Financeiro' | 'Marketing';
export type UserArea = 'Comercial' | 'CS' | 'Financeiro' | 'Marketing' | 'Diretoria';
export type VendaStatus = 'Ativo' | 'Congelado' | 'Cancelado' | 'Finalizado' | 'Reembolsado';
export type OrigemLead = 'Tráfego Pago' | 'Formulário Direto' | 'Bio' | 'SDR' | 'Social Selling';

export const ORIGEM_LEAD_OPTIONS: OrigemLead[] = [
  'Tráfego Pago',
  'Formulário Direto',
  'Bio',
  'SDR',
  'Social Selling',
];

export interface Profile {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  area_deprecated?: UserArea | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
  avatar_url?: string | null;
  centro_custo?: string | null;
  nivel_closer?: string | null;
  rampagem?: 'none' | 'ramp1' | 'ramp2' | null;
}

export interface Venda {
  id: string;
  data_fechamento: string;
  closer_user_id: string;
  nome_lead: string;
  nome_empresa: string;
  duracao_contrato_meses: number;
  valor_pix: number;
  valor_cartao: number;
  valor_boleto_parcela: number;
  quantidade_parcelas_boleto: number;
  valor_total: number;
  pago: boolean;
  contrato_assinado: boolean;
  status: VendaStatus;
  enviado_financeiro: boolean;
  enviado_cs: boolean;
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
  atualizado_por?: string;
  motivo_reembolso?: string;
  reembolsado_por?: string;
  reembolsado_em?: string;
  origem_lead?: OrigemLead | null;
  link_contrato?: string | null;
  link_comprovante?: string | null;
  closer?: Profile;
}

export interface Fechamento {
  id: string;
  data: string;
  closer_user_id: string;
  calls_realizadas: number;
  reagendado: number;
  no_show: number;
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
  calls_agendadas?: number;
  closer?: Profile;
}

export const VENDA_STATUS_LABELS: Record<VendaStatus, string> = {
  Ativo: 'Ativo',
  Congelado: 'Congelado',
  Cancelado: 'Cancelado',
  Finalizado: 'Finalizado',
  Reembolsado: 'Reembolsado',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  CEO: 'CEO',
  Founder: 'Founder',
  GestorComercial: 'Gestor Comercial',
  Closer: 'Closer',
  SDR: 'SDR',
  CS: 'Customer Success',
  Mentor: 'Mentor',
  Financeiro: 'Financeiro',
  Marketing: 'Marketing',
};

export const AREA_LABELS: Record<UserArea, string> = {
  Comercial: 'Comercial',
  CS: 'Customer Success',
  Financeiro: 'Financeiro',
  Marketing: 'Marketing',
  Diretoria: 'Diretoria',
};
