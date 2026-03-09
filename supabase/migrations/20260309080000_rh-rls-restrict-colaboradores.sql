-- Restringe SELECT de rh_colaboradores a gestores/admins apenas.
-- Antes: qualquer usuário autenticado podia ler CPF, salário, chave Pix.
-- Depois: só quem tem role MASTER, DIRETORIA ou GESTOR_COMERCIAL (can_edit_rh()).

DROP POLICY IF EXISTS "Todos autenticados podem ver rh_colaboradores"
  ON public.rh_colaboradores;

CREATE POLICY "Gestores podem ver rh_colaboradores"
  ON public.rh_colaboradores
  FOR SELECT
  USING (can_edit_rh());
