
-- Allow all authenticated users to SELECT from vendas (dashboard needs aggregate data)
DROP POLICY IF EXISTS "Closers veem próprias vendas, gestores veem todas" ON public.vendas;
CREATE POLICY "Todos autenticados podem ver vendas"
  ON public.vendas
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow all authenticated users to SELECT from fechamentos (dashboard needs aggregate data)
DROP POLICY IF EXISTS "Closers veem próprios fechamentos, gestores veem todos" ON public.fechamentos;
CREATE POLICY "Todos autenticados podem ver fechamentos"
  ON public.fechamentos
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
