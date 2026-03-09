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

export const ROLE_COLORS: Record<AppRole, { bg: string; text: string; border: string }> = {
  MASTER:             { bg: 'hsla(0,80%,50%,0.15)',   text: 'hsl(0,80%,70%)',   border: 'hsla(0,80%,50%,0.3)' },
  DIRETORIA:          { bg: 'hsla(270,70%,55%,0.15)', text: 'hsl(270,70%,75%)', border: 'hsla(270,70%,55%,0.3)' },
  GESTOR_COMERCIAL:   { bg: 'hsla(210,80%,50%,0.15)', text: 'hsl(210,80%,70%)', border: 'hsla(210,80%,50%,0.3)' },
  SDR:                { bg: 'hsla(185,70%,45%,0.15)', text: 'hsl(185,70%,65%)', border: 'hsla(185,70%,45%,0.3)' },
  CLOSER:             { bg: 'hsla(140,60%,40%,0.15)', text: 'hsl(140,60%,60%)', border: 'hsla(140,60%,40%,0.3)' },
  SOCIAL_SELLING:     { bg: 'hsla(330,70%,55%,0.15)', text: 'hsl(330,70%,75%)', border: 'hsla(330,70%,55%,0.3)' },
  ANALISTA_CONTEUDO:  { bg: 'hsla(45,80%,50%,0.15)',  text: 'hsl(45,80%,65%)',  border: 'hsla(45,80%,50%,0.3)' },
  GESTOR_TRAFEGO:     { bg: 'hsla(25,80%,50%,0.15)',  text: 'hsl(25,80%,70%)',  border: 'hsla(25,80%,50%,0.3)' },
  GESTOR_MARKETPLACE: { bg: 'hsla(290,60%,55%,0.15)', text: 'hsl(290,60%,75%)', border: 'hsla(290,60%,55%,0.3)' },
  ADMINISTRATIVO:     { bg: 'hsla(220,15%,50%,0.15)', text: 'hsl(220,15%,70%)', border: 'hsla(220,15%,50%,0.3)' },
};
