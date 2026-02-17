
-- 1. Criar funcao can_edit_content()
CREATE OR REPLACE FUNCTION public.can_edit_content()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('MASTER','DIRETORIA','GESTOR_COMERCIAL','SDR','ANALISTA_CONTEUDO')
  )
$$;

-- 2. content_daily_logs: trocar INSERT policy
DROP POLICY "Gestores podem inserir content_daily_logs" ON content_daily_logs;
CREATE POLICY "Editores conteudo podem inserir content_daily_logs"
  ON content_daily_logs FOR INSERT
  WITH CHECK (can_edit_content());

-- 3. content_daily_logs: trocar UPDATE policy
DROP POLICY "Gestores podem atualizar content_daily_logs" ON content_daily_logs;
CREATE POLICY "Editores conteudo podem atualizar content_daily_logs"
  ON content_daily_logs FOR UPDATE
  USING (can_edit_content());

-- 4. content_post_items: trocar INSERT policy
DROP POLICY "Gestores podem inserir content_post_items" ON content_post_items;
CREATE POLICY "Editores conteudo podem inserir content_post_items"
  ON content_post_items FOR INSERT
  WITH CHECK (can_edit_content());

-- 5. content_post_items: trocar UPDATE policy
DROP POLICY "Gestores podem atualizar content_post_items" ON content_post_items;
CREATE POLICY "Editores conteudo podem atualizar content_post_items"
  ON content_post_items FOR UPDATE
  USING (can_edit_content());

-- 6. content_post_items: trocar DELETE policy
DROP POLICY "Gestores podem deletar content_post_items" ON content_post_items;
CREATE POLICY "Editores conteudo podem deletar content_post_items"
  ON content_post_items FOR DELETE
  USING (can_edit_content());

-- 7. conteudos_marketing: atualizar DELETE policy
DROP POLICY "Gestores podem deletar conteudos" ON conteudos_marketing;
CREATE POLICY "Editores conteudo podem deletar conteudos"
  ON conteudos_marketing FOR DELETE
  USING (can_edit_content());
