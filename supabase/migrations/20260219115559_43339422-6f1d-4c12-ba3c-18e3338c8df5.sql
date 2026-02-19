
-- Fix 1: conteudos_marketing UPDATE - currently allows ANY authenticated user to update
-- Should be restricted to content editors only (matches UI restriction)
DROP POLICY "Autenticados podem atualizar conteudos" ON public.conteudos_marketing;
CREATE POLICY "Editores conteudo podem atualizar conteudos"
  ON public.conteudos_marketing FOR UPDATE
  USING (can_edit_content());

-- Fix 2: conteudos_marketing INSERT - currently allows ANY authenticated user to insert  
DROP POLICY "Autenticados podem inserir conteudos" ON public.conteudos_marketing;
CREATE POLICY "Editores conteudo podem inserir conteudos"
  ON public.conteudos_marketing FOR INSERT
  WITH CHECK (can_edit_content());

-- Fix 3: tv_settings UPDATE - currently allows ANY authenticated user to update
-- Should be restricted to admin panel users
DROP POLICY "Autenticados podem atualizar tv_settings" ON public.tv_settings;
CREATE POLICY "Gestores podem atualizar tv_settings"
  ON public.tv_settings FOR UPDATE
  USING (can_access_admin_panel());

-- Fix 4: tv_settings INSERT - currently allows ANY authenticated user to insert
DROP POLICY "Autenticados podem inserir tv_settings" ON public.tv_settings;
CREATE POLICY "Gestores podem inserir tv_settings"
  ON public.tv_settings FOR INSERT
  WITH CHECK (can_access_admin_panel());
