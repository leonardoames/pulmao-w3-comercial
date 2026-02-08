export type UserRole = 'CEO' | 'Founder' | 'GestorComercial' | 'Closer' | 'SDR' | 'CS' | 'Mentor' | 'Financeiro' | 'Marketing';
export type UserArea = 'Comercial' | 'CS' | 'Financeiro' | 'Marketing' | 'Diretoria';
export type LeadOrigem = 'Formulario' | 'Instagram' | 'WhatsApp' | 'Indicacao' | 'TrafegoPago';
export type LeadStatusFunil = 'Novo' | 'ContatoFeito' | 'CallAgendada' | 'CallRealizada' | 'NoShow' | 'Perdido' | 'Ganho';
export type CallPlataforma = 'GoogleMeet' | 'Zoom' | 'Outro';
export type CallStatus = 'Agendada' | 'Realizada' | 'No-show' | 'Remarcada' | 'Cancelada';
export type VendaFormaPagamento = 'Pix' | 'Cartao' | 'Boleto';
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

export interface Lead {
  id: string;
  nome_pessoa: string;
  telefone: string;
  email: string;
  instagram?: string;
  nome_empresa: string;
  cnpj?: string;
  cidade?: string;
  estado?: string;
  origem: LeadOrigem;
  closer_responsavel_user_id?: string;
  sdr_responsavel_user_id?: string;
  status_funil: LeadStatusFunil;
  motivo_perda?: string;
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
  atualizado_por?: string;
  // Relations
  closer_responsavel?: Profile;
  sdr_responsavel?: Profile;
  calls?: Call[];
  venda?: Venda;
}

export interface Call {
  id: string;
  lead_id: string;
  data_hora: string;
  plataforma: CallPlataforma;
  link_reuniao?: string;
  status: CallStatus;
  closer_user_id: string;
  sdr_user_id?: string;
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
  atualizado_por?: string;
  // Relations
  lead?: Lead;
  closer?: Profile;
  sdr?: Profile;
}

export interface Venda {
  id: string;
  lead_id: string;
  closer_user_id: string;
  data_fechamento: string;
  plano_nome: string;
  valor_total: number;
  entrada_valor: number;
  forma_pagamento: VendaFormaPagamento;
  detalhes_pagamento?: string;
  data_inicio: string;
  data_fim: string;
  status: VendaStatus;
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
  atualizado_por?: string;
  // Relations
  lead?: Lead;
  closer?: Profile;
}

export const STATUS_FUNIL_LABELS: Record<LeadStatusFunil, string> = {
  Novo: 'Novo',
  ContatoFeito: 'Contato Feito',
  CallAgendada: 'Call Agendada',
  CallRealizada: 'Call Realizada',
  NoShow: 'No-Show',
  Perdido: 'Perdido',
  Ganho: 'Ganho',
};

export const ORIGEM_LABELS: Record<LeadOrigem, string> = {
  Formulario: 'Formulário',
  Instagram: 'Instagram',
  WhatsApp: 'WhatsApp',
  Indicacao: 'Indicação',
  TrafegoPago: 'Tráfego Pago',
};

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  Agendada: 'Agendada',
  Realizada: 'Realizada',
  'No-show': 'No-Show',
  Remarcada: 'Remarcada',
  Cancelada: 'Cancelada',
};

export const VENDA_STATUS_LABELS: Record<VendaStatus, string> = {
  Ativo: 'Ativo',
  Congelado: 'Congelado',
  Cancelado: 'Cancelado',
  Finalizado: 'Finalizado',
};

export const FORMA_PAGAMENTO_LABELS: Record<VendaFormaPagamento, string> = {
  Pix: 'Pix',
  Cartao: 'Cartão',
  Boleto: 'Boleto',
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
