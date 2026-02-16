
-- Enums
CREATE TYPE public.content_item_type AS ENUM ('reels', 'feed', 'stories', 'youtube', 'other');
CREATE TYPE public.content_item_status AS ENUM ('pendente', 'feito', 'agendado');
CREATE TYPE public.content_item_platform AS ENUM ('instagram', 'tiktok', 'youtube', 'other');

-- Table: content_daily_logs
CREATE TABLE public.content_daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  responsible_user_id uuid NOT NULL,
  followers_gained integer NOT NULL DEFAULT 0,
  posts_published_count integer NOT NULL DEFAULT 0,
  posts_scheduled_count integer NOT NULL DEFAULT 0,
  stories_done_count integer NOT NULL DEFAULT 0,
  youtube_videos_published_count integer NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(date)
);

ALTER TABLE public.content_daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver content_daily_logs"
  ON public.content_daily_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Gestores podem inserir content_daily_logs"
  ON public.content_daily_logs FOR INSERT
  WITH CHECK (can_access_admin_panel());

CREATE POLICY "Gestores podem atualizar content_daily_logs"
  ON public.content_daily_logs FOR UPDATE
  USING (can_access_admin_panel());

CREATE POLICY "Master pode deletar content_daily_logs"
  ON public.content_daily_logs FOR DELETE
  USING (is_master());

CREATE TRIGGER update_content_daily_logs_updated_at
  BEFORE UPDATE ON public.content_daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Table: content_post_items
CREATE TABLE public.content_post_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  type public.content_item_type NOT NULL DEFAULT 'other',
  label text NOT NULL DEFAULT '',
  status public.content_item_status NOT NULL DEFAULT 'pendente',
  platform public.content_item_platform NOT NULL DEFAULT 'instagram',
  is_required boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_post_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver content_post_items"
  ON public.content_post_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Gestores podem inserir content_post_items"
  ON public.content_post_items FOR INSERT
  WITH CHECK (can_access_admin_panel());

CREATE POLICY "Gestores podem atualizar content_post_items"
  ON public.content_post_items FOR UPDATE
  USING (can_access_admin_panel());

CREATE POLICY "Gestores podem deletar content_post_items"
  ON public.content_post_items FOR DELETE
  USING (can_access_admin_panel());

CREATE TRIGGER update_content_post_items_updated_at
  BEFORE UPDATE ON public.content_post_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
