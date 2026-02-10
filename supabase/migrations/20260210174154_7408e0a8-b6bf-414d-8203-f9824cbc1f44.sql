
DROP POLICY IF EXISTS "Gestores podem inserir tv_settings" ON public.tv_settings;
DROP POLICY IF EXISTS "Gestores podem atualizar tv_settings" ON public.tv_settings;

CREATE POLICY "Autenticados podem inserir tv_settings"
  ON public.tv_settings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Autenticados podem atualizar tv_settings"
  ON public.tv_settings FOR UPDATE
  USING (auth.uid() IS NOT NULL);
