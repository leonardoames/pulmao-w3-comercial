-- Adiciona colunas de OAuth na tabela instagram_accounts
ALTER TABLE public.instagram_accounts
  ADD COLUMN IF NOT EXISTS access_token TEXT,
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;
