-- Fase A: adicionar centro_custo em profiles sem remover area.
-- Os dois campos coexistem durante a transição.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS centro_custo text;

-- Sem default, sem NOT NULL: todos os usuários existentes ficam NULL
-- e o sistema continua funcionando com area como antes.
