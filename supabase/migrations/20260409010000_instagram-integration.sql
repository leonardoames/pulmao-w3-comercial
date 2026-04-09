-- =============================================
-- Instagram Integration
-- =============================================

-- Tabela de contas do Instagram
CREATE TABLE public.instagram_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  instagram_user_id TEXT NOT NULL UNIQUE,
  account_label TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de métricas diárias por conta
CREATE TABLE public.instagram_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  followers_count INTEGER NOT NULL DEFAULT 0,
  media_count INTEGER NOT NULL DEFAULT 0,
  reach INTEGER NOT NULL DEFAULT 0,
  profile_views INTEGER NOT NULL DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(account_id, date)
);

-- Tabela de insights por post
CREATE TABLE public.instagram_post_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  instagram_media_id TEXT NOT NULL UNIQUE,
  media_type TEXT NOT NULL,
  permalink TEXT,
  caption TEXT,
  published_at TIMESTAMPTZ,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  reach INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  profile_visits INTEGER NOT NULL DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE instagram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_post_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_instagram_accounts" ON instagram_accounts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "read_instagram_daily_metrics" ON instagram_daily_metrics
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "read_instagram_post_insights" ON instagram_post_insights
  FOR SELECT TO authenticated USING (true);

-- Service role pode escrever (usado pela edge function)
CREATE POLICY "service_write_instagram_accounts" ON instagram_accounts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_write_instagram_daily_metrics" ON instagram_daily_metrics
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_write_instagram_post_insights" ON instagram_post_insights
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- pg_cron: sync diário às 07:00 BRT (10:00 UTC)
-- Se falhar, configure via Supabase Dashboard > Edge Functions > instagram-sync > Schedules
-- Requer extensões pg_cron e pg_net habilitadas (Database > Extensions)
DO $$
DECLARE
  supabase_url TEXT := current_setting('app.settings.supabase_url', true);
  service_key TEXT := current_setting('app.settings.service_role_key', true);
BEGIN
  IF supabase_url IS NOT NULL AND service_key IS NOT NULL THEN
    PERFORM cron.schedule(
      'instagram-daily-sync',
      '0 10 * * *',
      format(
        $cron$SELECT net.http_post(url := '%s/functions/v1/instagram-sync', headers := '{"Content-Type":"application/json","Authorization":"Bearer %s"}'::jsonb, body := '{}'::jsonb);$cron$,
        supabase_url, service_key
      )
    );
  END IF;
END $$;
