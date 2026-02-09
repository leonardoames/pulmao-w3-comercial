
-- Fix profiles: require authentication for SELECT
DROP POLICY IF EXISTS "Todos podem ver perfis" ON public.profiles;
CREATE POLICY "Todos autenticados podem ver perfis"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fix vendas: require authentication for SELECT
DROP POLICY IF EXISTS "Todos podem ver vendas" ON public.vendas;
CREATE POLICY "Todos autenticados podem ver vendas"
ON public.vendas
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fix fechamentos too (same issue)
DROP POLICY IF EXISTS "Todos podem ver fechamentos" ON public.fechamentos;
CREATE POLICY "Todos autenticados podem ver fechamentos"
ON public.fechamentos
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fix ote_goals too
DROP POLICY IF EXISTS "Todos podem ver metas OTE" ON public.ote_goals;
CREATE POLICY "Todos autenticados podem ver metas OTE"
ON public.ote_goals
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fix user_roles too
DROP POLICY IF EXISTS "Todos podem ver roles" ON public.user_roles;
CREATE POLICY "Todos autenticados podem ver roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() IS NOT NULL);
