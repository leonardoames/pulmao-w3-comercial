-- Fase B: Renomear profiles.area -> area_deprecated.
-- Remove todas as dependências da coluna area antes de renomeá-la.

-- 1. Recriar can_edit_comercial() sem referência a profiles.area
--    (era: v_area = 'Comercial' OR v_role IN ('CEO','Founder'))
--    Agora usa user_roles como todo o resto do sistema.
CREATE OR REPLACE FUNCTION public.can_edit_comercial()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role IN ('MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL', 'CLOSER', 'SDR', 'SOCIAL_SELLING')
    )
$$;

-- 2. Renomear coluna (a constraint NOT NULL e o DEFAULT 'Comercial' são preservados)
ALTER TABLE public.profiles
  RENAME COLUMN area TO area_deprecated;

-- 3. Recriar profiles_safe view (referenciava a coluna pelo nome antigo)
CREATE OR REPLACE VIEW public.profiles_safe
WITH (security_invoker = on) AS
SELECT
  id,
  nome,
  CASE
    WHEN id = auth.uid() THEN email
    WHEN public.can_access_admin_panel() THEN email
    ELSE '***@***.***'
  END AS email,
  role,
  area_deprecated,
  ativo,
  criado_em,
  atualizado_em
FROM public.profiles;
