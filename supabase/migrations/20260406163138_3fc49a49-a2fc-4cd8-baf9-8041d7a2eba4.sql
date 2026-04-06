
-- 1. Fix OTE goals: restrict SELECT to owner + managers
DROP POLICY IF EXISTS "Todos autenticados podem ver metas OTE" ON public.ote_goals;

CREATE POLICY "Users see own goals, managers see all"
ON public.ote_goals FOR SELECT
USING (
  closer_user_id = auth.uid()
  OR public.can_manage_ote_goals()
);

-- 2. Fix rh_colaboradores: restrict SELECT to HR managers, create safe view for others
DROP POLICY IF EXISTS "Todos autenticados podem ver rh_colaboradores" ON public.rh_colaboradores;

CREATE POLICY "HR managers can view all rh_colaboradores"
ON public.rh_colaboradores FOR SELECT
USING (can_edit_rh());

CREATE POLICY "Users can view own rh_colaboradores record"
ON public.rh_colaboradores FOR SELECT
USING (user_id = auth.uid());

-- Create safe view without sensitive fields for all authenticated users
CREATE OR REPLACE VIEW public.rh_colaboradores_safe AS
SELECT
  id,
  nome,
  cargo,
  setor,
  status,
  foto_url,
  email,
  user_id,
  responsavel_id,
  data_entrada,
  centro_custo,
  created_at,
  updated_at
FROM public.rh_colaboradores;

-- 3. Fix avatar storage policies: add ownership checks
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
