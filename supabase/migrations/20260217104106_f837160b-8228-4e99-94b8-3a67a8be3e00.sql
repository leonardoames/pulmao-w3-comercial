-- Add new roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'SDR';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ANALISTA_CONTEUDO';