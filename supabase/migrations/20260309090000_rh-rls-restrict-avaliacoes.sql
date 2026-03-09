-- Restringe SELECT de rh_avaliacoes e rh_ciclos_avaliacao a gestores/admins.
-- Antes: qualquer usuário autenticado podia ler notas e avaliações de desempenho.
-- Depois: só quem tem role MASTER, DIRETORIA ou GESTOR_COMERCIAL (can_edit_rh()).

DROP POLICY IF EXISTS "Todos autenticados podem ver rh_avaliacoes"
  ON public.rh_avaliacoes;

CREATE POLICY "Gestores podem ver rh_avaliacoes"
  ON public.rh_avaliacoes
  FOR SELECT
  USING (can_edit_rh());

DROP POLICY IF EXISTS "Todos autenticados podem ver rh_ciclos"
  ON public.rh_ciclos_avaliacao;

CREATE POLICY "Gestores podem ver rh_ciclos"
  ON public.rh_ciclos_avaliacao
  FOR SELECT
  USING (can_edit_rh());
