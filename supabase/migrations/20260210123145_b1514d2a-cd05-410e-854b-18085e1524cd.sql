
-- Fix #1: Restrict profiles SELECT to own profile + managers
DROP POLICY IF EXISTS "Todos autenticados podem ver perfis" ON public.profiles;

CREATE POLICY "Usuários podem ver próprio perfil ou gestores veem todos"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL')
  )
);

-- Fix #2: Restrict vendas SELECT to own records + managers
DROP POLICY IF EXISTS "Todos autenticados podem ver vendas" ON public.vendas;

CREATE POLICY "Closers veem próprias vendas, gestores veem todas"
ON public.vendas
FOR SELECT
USING (
  closer_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL')
  )
);

-- Fix #2b: Restrict fechamentos SELECT to own records + managers
DROP POLICY IF EXISTS "Todos autenticados podem ver fechamentos" ON public.fechamentos;

CREATE POLICY "Closers veem próprios fechamentos, gestores veem todos"
ON public.fechamentos
FOR SELECT
USING (
  closer_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL')
  )
);
