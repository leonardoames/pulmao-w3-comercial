
ALTER TABLE public.content_daily_logs
  ADD COLUMN followers_leo integer NOT NULL DEFAULT 0,
  ADD COLUMN followers_w3 integer NOT NULL DEFAULT 0,
  ADD COLUMN responsible_name text NOT NULL DEFAULT 'Otto';
