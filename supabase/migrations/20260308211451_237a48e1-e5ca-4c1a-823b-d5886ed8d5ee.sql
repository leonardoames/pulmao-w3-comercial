-- Add new roles to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'GESTOR_TRAFEGO';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'GESTOR_MARKETPLACE';