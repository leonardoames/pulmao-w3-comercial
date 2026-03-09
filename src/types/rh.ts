export type SetorRH = 'comercial' | 'conteudo' | 'marketing' | 'operacoes' | 'financeiro' | 'tecnologia' | 'outro';
export type TipoContrato = 'clt' | 'pj' | 'estagio' | 'freelancer';
export type StatusColaborador = 'ativo' | 'inativo' | 'ferias' | 'afastado';
export type TipoFeedback = 'positivo' | 'construtivo' | 'neutro' | 'urgente';
export type VisibilidadeFeedback = 'gestor' | 'admin_only';
export type PeriodoCiclo = 'mensal' | 'trimestral' | 'semestral' | 'anual';
export type StatusCiclo = 'rascunho' | 'aberto' | 'encerrado';
export type StatusAvaliacao = 'pendente' | 'concluida';
export type TipoAvaliador = 'gestor' | 'par' | 'autoavaliacao';

export interface RHColaborador {
  id: string;
  nome: string;
  email: string | null;
  foto_url: string | null;
  cargo: string;
  setor: SetorRH;
  data_entrada: string | null;
  tipo_contrato: TipoContrato;
  salario: number | null;
  status: StatusColaborador;
  responsavel_id: string | null;
  closer_id: string | null;
  user_id: string | null;
  observacoes: string | null;
  cpf_cnpj: string | null;
  telefone: string | null;
  data_termino: string | null;
  ote_comissao: string | null;
  chave_pix: string | null;
  aniversario: string | null;
  centro_custo: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface RHSetorConfig {
  id: string;
  nome: string;
  cor: string;
  icone: string;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface RHFeedback {
  id: string;
  colaborador_id: string;
  autor_id: string;
  tipo: TipoFeedback;
  titulo: string;
  conteudo: string;
  visibilidade: VisibilidadeFeedback;
  created_at: string;
  colaborador?: RHColaborador;
  autor_nome?: string;
}

export interface RHCicloAvaliacao {
  id: string;
  nome: string;
  periodo: PeriodoCiclo;
  data_inicio: string;
  data_fim: string;
  status: StatusCiclo;
  created_at: string;
}

export interface RHAvaliacao {
  id: string;
  ciclo_id: string;
  avaliado_id: string;
  avaliador_id: string;
  tipo_avaliador: TipoAvaliador;
  nota_resultado: number | null;
  nota_atitude: number | null;
  nota_colaboracao: number | null;
  nota_desenvolvimento: number | null;
  pontos_fortes: string | null;
  pontos_melhoria: string | null;
  comentario_geral: string | null;
  status: StatusAvaliacao;
  created_at: string;
  updated_at: string;
  avaliado?: RHColaborador;
  ciclo?: RHCicloAvaliacao;
}

export const SETOR_LABELS: Record<SetorRH, string> = {
  comercial: 'Comercial',
  conteudo: 'Conteúdo',
  marketing: 'Marketing',
  operacoes: 'Operações',
  financeiro: 'Financeiro',
  tecnologia: 'Tecnologia',
  outro: 'Outro',
};

export const TIPO_CONTRATO_LABELS: Record<TipoContrato, string> = {
  clt: 'CLT',
  pj: 'PJ',
  estagio: 'Estágio',
  freelancer: 'Freelancer',
};

export const STATUS_COLABORADOR_LABELS: Record<StatusColaborador, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  ferias: 'Férias',
  afastado: 'Afastado',
};

export const TIPO_FEEDBACK_LABELS: Record<TipoFeedback, string> = {
  positivo: 'Positivo',
  construtivo: 'Construtivo',
  neutro: 'Neutro',
  urgente: 'Urgente',
};

export const TIPO_FEEDBACK_COLORS: Record<TipoFeedback, string> = {
  positivo: '#22C55E',
  construtivo: '#F97316',
  neutro: 'rgba(255,255,255,0.2)',
  urgente: '#EF4444',
};

export const STATUS_COLABORADOR_COLORS: Record<StatusColaborador, string> = {
  ativo: '#22C55E',
  inativo: '#EF4444',
  ferias: '#EAB308',
  afastado: '#6B7280',
};

export const PERIODO_LABELS: Record<PeriodoCiclo, string> = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
};

export const STATUS_CICLO_LABELS: Record<StatusCiclo, string> = {
  rascunho: 'Rascunho',
  aberto: 'Aberto',
  encerrado: 'Encerrado',
};
