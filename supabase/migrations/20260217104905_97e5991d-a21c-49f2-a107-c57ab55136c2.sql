DROP POLICY IF EXISTS "Usuários podem editar perfis" ON public.profiles;

CREATE POLICY "Usuários podem editar perfis"
ON public.profiles
FOR UPDATE
USING (
  (auth.uid() = id) OR can_access_admin_panel()
);