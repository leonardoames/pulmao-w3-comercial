export type AppRole = 'MASTER' | 'DIRETORIA' | 'GESTOR_COMERCIAL' | 'SDR' | 'CLOSER' | 'SOCIAL_SELLING' | 'ANALISTA_CONTEUDO' | 'GESTOR_TRAFEGO' | 'GESTOR_MARKETPLACE' | 'ADMINISTRATIVO';

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
  SDR: 'SDR',
  CLOSER: 'Closer',
  SOCIAL_SELLING: 'Social Seller',
  ANALISTA_CONTEUDO: 'Analista de Conteúdo',
  GESTOR_TRAFEGO: 'Gestor de Tráfego',
  GESTOR_MARKETPLACE: 'Gestor de Marketplace',
  ADMINISTRATIVO: 'Administrativo',
};

export const ALL_ROLES: AppRole[] = ['MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL', 'SDR', 'CLOSER', 'SOCIAL_SELLING', 'ANALISTA_CONTEUDO', 'GESTOR_TRAFEGO', 'GESTOR_MARKETPLACE', 'ADMINISTRATIVO'];

// Check if role can manage closers (select any closer for fechamento/vendas)
export const canRoleManageClosers = (role: AppRole): boolean => {
  return ['MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL', 'SDR'].includes(role);
};

// Check if role can access admin panel
export const canRoleAccessAdminPanel = (role: AppRole): boolean => {
  return ['MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL', 'SDR'].includes(role);
};

// Check if role is social selling only
export const isRoleSocialSelling = (role: AppRole): boolean => {
  return role === 'SOCIAL_SELLING';
};
