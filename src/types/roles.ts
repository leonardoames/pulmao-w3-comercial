export type AppRole = 'MASTER' | 'CEO' | 'GESTOR_COMERCIAL' | 'SDR' | 'CLOSER';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  criado_em: string;
  atualizado_em: string;
}

export const ROLE_LABELS_NEW: Record<AppRole, string> = {
  MASTER: 'Master',
  CEO: 'CEO',
  GESTOR_COMERCIAL: 'Gestor Comercial',
  SDR: 'SDR',
  CLOSER: 'Closer',
};

export const ALL_ROLES: AppRole[] = ['MASTER', 'CEO', 'GESTOR_COMERCIAL', 'SDR', 'CLOSER'];
