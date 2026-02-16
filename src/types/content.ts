export type ContentItemType = 'reels' | 'feed' | 'stories' | 'youtube' | 'other';
export type ContentItemStatus = 'pendente' | 'feito' | 'agendado';
export type ContentItemPlatform = 'instagram' | 'tiktok' | 'youtube' | 'other';

export interface ContentDailyLog {
  id: string;
  date: string;
  responsible_user_id: string;
  followers_gained: number;
  posts_published_count: number;
  posts_scheduled_count: number;
  stories_done_count: number;
  youtube_videos_published_count: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ContentPostItem {
  id: string;
  date: string;
  type: ContentItemType;
  label: string;
  status: ContentItemStatus;
  platform: ContentItemPlatform;
  is_required: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const CONTENT_ITEM_TYPE_LABELS: Record<ContentItemType, string> = {
  reels: 'Reels',
  feed: 'Feed',
  stories: 'Stories',
  youtube: 'YouTube',
  other: 'Outro',
};

export const CONTENT_ITEM_STATUS_LABELS: Record<ContentItemStatus, string> = {
  pendente: 'Pendente',
  feito: 'Feito',
  agendado: 'Agendado',
};

export const CONTENT_ITEM_STATUS_COLORS: Record<ContentItemStatus, string> = {
  pendente: 'bg-muted text-muted-foreground',
  feito: 'bg-success/15 text-success',
  agendado: 'bg-warning/15 text-warning',
};

export const CONTENT_ITEM_PLATFORM_LABELS: Record<ContentItemPlatform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  other: 'Outro',
};

export const STATUS_CYCLE: ContentItemStatus[] = ['pendente', 'feito', 'agendado'];

export interface RequiredTemplate {
  type: ContentItemType;
  label: string;
  platform: ContentItemPlatform;
}

export const DAILY_REQUIRED_TEMPLATE: RequiredTemplate[] = [
  // Perfil Leonardo Ames
  { type: 'reels', label: 'Post 1 (Reels): Corte do podcast — Autoridade/viral', platform: 'instagram' },
  { type: 'reels', label: 'Post 2 (Reels): Viral', platform: 'instagram' },
  { type: 'feed', label: 'Post 3 (Feed estático ou carrossel): Frase estilo Twitter — Viral/Educativo', platform: 'instagram' },
  { type: 'reels', label: 'Post 4 (Reels): Documentário dia a dia do e-comm (bastidores)', platform: 'instagram' },
  { type: 'feed', label: 'Post 5 (Feed estático ou carrossel): Frase estilo Twitter — Viral/Educativo', platform: 'instagram' },
  { type: 'stories', label: 'Stories: Min 10x/dia (Lifestyle + e-commerce)', platform: 'instagram' },
];

// W3 Educação template varies by even/odd day
export function getW3Template(date: Date): RequiredTemplate {
  const day = date.getDate();
  const isEven = day % 2 === 0;
  return {
    type: 'feed',
    label: isEven ? 'W3 Educação — Post dia par: Genérico' : 'W3 Educação — Post dia ímpar: Depoimento (cliente ou Léo)',
    platform: 'instagram',
  };
}

export function getDailyTemplate(date: Date): RequiredTemplate[] {
  return [...DAILY_REQUIRED_TEMPLATE, getW3Template(date)];
}
