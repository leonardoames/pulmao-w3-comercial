export type AppRole = 'MASTER' | 'DIRETORIA' | 'GESTOR_COMERCIAL' | 'CLOSER' | 'SOCIAL_SELLING';

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
  SOCIAL_SELLING: 'Social Seller',
};

export const ALL_ROLES: AppRole[] = ['MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL', 'CLOSER', 'SOCIAL_SELLING'];

// Check if role can manage closers (select any closer for fechamento/vendas)
export const canRoleManageClosers = (role: AppRole): boolean => {
  return ['MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL'].includes(role);
};

// Check if role can access admin panel
export const canRoleAccessAdminPanel = (role: AppRole): boolean => {
  return ['MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL'].includes(role);
};

// Check if role is social selling only
export const isRoleSocialSelling = (role: AppRole): boolean => {
  return role === 'SOCIAL_SELLING';
};
