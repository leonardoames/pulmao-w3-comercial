export type AppRole = 'MASTER' | 'DIRETORIA' | 'GESTOR_COMERCIAL' | 'CLOSER';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  criado_em: string;
  atualizado_em: string;
}

export const ROLE_LABELS_NEW: Record<AppRole, string> = {
  MASTER: 'Master',
  DIRETORIA: 'Diretoria',
  GESTOR_COMERCIAL: 'Gestor Comercial',
  CLOSER: 'Closer',
};

export const ALL_ROLES: AppRole[] = ['MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL', 'CLOSER'];

// Check if role can manage closers (select any closer for fechamento/vendas)
export const canRoleManageClosers = (role: AppRole): boolean => {
  return ['MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL'].includes(role);
};

// Check if role can access admin panel
export const canRoleAccessAdminPanel = (role: AppRole): boolean => {
  return ['MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL'].includes(role);
};
