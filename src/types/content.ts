export type ContentItemType = 'reels' | 'feed' | 'stories' | 'youtube' | 'other';
export type ContentItemStatus = 'pendente' | 'feito' | 'agendado';
export type ContentItemPlatform = 'instagram' | 'tiktok' | 'youtube' | 'other';

export interface ContentDailyLog {
  id: string;
  date: string;
  responsible_user_id: string;
  responsible_name: string;
  followers_gained: number;
  followers_leo: number;
  followers_w3: number;
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
  pendente: 'Não fez',
  feito: 'Publicado',
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
  { type: 'reels', label: 'Post 1 Léo: Corte do podcast — Autoridade/viral', platform: 'instagram' },
  { type: 'reels', label: 'Post 2 Léo: Viral', platform: 'instagram' },
  { type: 'feed', label: 'Post 3 Léo: Frase Twitter — Viral/Educativo', platform: 'instagram' },
  { type: 'feed', label: 'Post 4 Léo: Frase Twitter — Viral/Educativo', platform: 'instagram' },
  { type: 'reels', label: 'Post 5 Léo: Documentário dia a dia do ecomm', platform: 'instagram' },
  { type: 'feed', label: 'Post 6 W3: Institucional ou Depoimento', platform: 'instagram' },
];

export const RESPONSIBLE_OPTIONS = ['Otto'];

export function getDailyTemplate(): RequiredTemplate[] {
  return [...DAILY_REQUIRED_TEMPLATE];
}
