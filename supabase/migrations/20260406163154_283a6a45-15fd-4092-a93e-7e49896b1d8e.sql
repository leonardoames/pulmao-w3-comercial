
DROP VIEW IF EXISTS public.rh_colaboradores_safe;

CREATE VIEW public.rh_colaboradores_safe
WITH (security_invoker = true)
AS
SELECT
  id,
  nome,
  cargo,
  setor,
  status,
  foto_url,
  email,
  user_id,
  responsavel_id,
  data_entrada,
  centro_custo,
  created_at,
  updated_at
FROM public.rh_colaboradores;
