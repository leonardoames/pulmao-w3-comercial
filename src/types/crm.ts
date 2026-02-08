export type UserRole = 'CEO' | 'Founder' | 'GestorComercial' | 'Closer' | 'SDR' | 'CS' | 'Mentor' | 'Financeiro' | 'Marketing';
export type UserArea = 'Comercial' | 'CS' | 'Financeiro' | 'Marketing' | 'Diretoria';
export type VendaStatus = 'Ativo' | 'Congelado' | 'Cancelado' | 'Finalizado';

export interface Profile {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  area: UserArea;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
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
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
  atualizado_por?: string;
  // Relations
  closer?: Profile;
}

export interface Fechamento {
  id: string;
  data: string;
  closer_user_id: string;
  calls_realizadas: number;
  no_show: number;
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
  // Derived
  calls_agendadas?: number;
  // Relations
  closer?: Profile;
}

export const VENDA_STATUS_LABELS: Record<VendaStatus, string> = {
  Ativo: 'Ativo',
  Congelado: 'Congelado',
  Cancelado: 'Cancelado',
  Finalizado: 'Finalizado',
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
