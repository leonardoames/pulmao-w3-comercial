
-- Create a secure view that masks email for non-admin users
-- Admins and the user themselves can see the real email
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
  area,
  ativo,
  criado_em,
  atualizado_em
FROM public.profiles;
