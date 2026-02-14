export type ConteudoStatus = 'Ideia' | 'EmGravacao' | 'EmEdicao' | 'EmAprovacao' | 'EmAjuste' | 'Aprovado';

export const CONTEUDO_STATUS_LIST: ConteudoStatus[] = [
  'Ideia', 'EmGravacao', 'EmEdicao', 'EmAprovacao', 'EmAjuste', 'Aprovado'
];

export const CONTEUDO_STATUS_LABELS: Record<ConteudoStatus, string> = {
  Ideia: 'Ideia',
  EmGravacao: 'Em gravação',
  EmEdicao: 'Em edição',
  EmAprovacao: 'Em aprovação',
  EmAjuste: 'Em ajuste',
  Aprovado: 'Aprovado',
};

export const CONTEUDO_STATUS_COLORS: Record<ConteudoStatus, string> = {
  Ideia: 'bg-muted text-muted-foreground',
  EmGravacao: 'bg-warning/15 text-warning',
  EmEdicao: 'bg-[hsl(24,95%,53%)]/15 text-[hsl(24,95%,53%)]',
  EmAprovacao: 'bg-[hsl(270,60%,55%)]/15 text-[hsl(270,60%,55%)]',
  EmAjuste: 'bg-destructive/15 text-destructive',
  Aprovado: 'bg-success/15 text-success',
};

export const CONTEUDO_STATUS_DOT_COLORS: Record<ConteudoStatus, string> = {
  Ideia: 'bg-muted-foreground',
  EmGravacao: 'bg-warning',
  EmEdicao: 'bg-[hsl(24,95%,53%)]',
  EmAprovacao: 'bg-[hsl(270,60%,55%)]',
  EmAjuste: 'bg-destructive',
  Aprovado: 'bg-success',
};

export const TIPO_CONTEUDO_OPTIONS = [
  'Reels Viral',
  'Reels documentário',
  'Post Twitter',
  'Imagem estática',
  'Corte podcast',
  'Carrossel',
];

export const ONDE_POSTAR_OPTIONS = [
  'Instagram',
  'Facebook',
  'Twitter',
  'YouTube',
  'TikTok',
];

export interface ConteudoMarketing {
  id: string;
  titulo: string;
  roteiro: string;
  legenda: string;
  data_publicacao: string | null;
  responsavel_user_id: string | null;
  onde_postar: string[];
  tipo_conteudo: string[];
  status: ConteudoStatus;
  link_drive: string;
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
  ordem: number;
}

export interface ConteudoComentario {
  id: string;
  conteudo_id: string;
  user_id: string;
  texto: string;
  criado_em: string;
}
