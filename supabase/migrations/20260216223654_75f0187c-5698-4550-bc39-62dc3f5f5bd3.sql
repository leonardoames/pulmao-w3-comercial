
CREATE OR REPLACE FUNCTION public.update_updated_at_column_en()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_content_daily_logs_updated_at ON content_daily_logs;
DROP TRIGGER IF EXISTS update_content_post_items_updated_at ON content_post_items;

CREATE TRIGGER update_content_daily_logs_updated_at
  BEFORE UPDATE ON content_daily_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_en();

CREATE TRIGGER update_content_post_items_updated_at
  BEFORE UPDATE ON content_post_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_en();
