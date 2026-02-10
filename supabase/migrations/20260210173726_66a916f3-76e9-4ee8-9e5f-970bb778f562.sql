
-- Allow all authenticated users to SELECT from profiles (closers need to see all users)
DROP POLICY IF EXISTS "Usuários podem ver próprio perfil ou gestores veem todos" ON public.profiles;
CREATE POLICY "Todos autenticados podem ver perfis"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
