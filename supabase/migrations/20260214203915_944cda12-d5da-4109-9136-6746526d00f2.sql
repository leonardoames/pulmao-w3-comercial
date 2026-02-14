
-- Create helper function to check if user is social selling
CREATE OR REPLACE FUNCTION public.is_social_selling()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(auth.uid(), 'SOCIAL_SELLING')
$$;

-- Update social_selling INSERT policy to also allow SOCIAL_SELLING role
DROP POLICY IF EXISTS "Usuários podem inserir social_selling" ON public.social_selling;
CREATE POLICY "Usuários podem inserir social_selling"
ON public.social_selling
FOR INSERT
WITH CHECK (
  (is_social_selling() AND closer_user_id = auth.uid())
  OR (is_closer() AND closer_user_id = auth.uid())
  OR can_edit_any_fechamento()
);

-- Update social_selling UPDATE policy to also allow SOCIAL_SELLING role
DROP POLICY IF EXISTS "Usuários podem atualizar social_selling" ON public.social_selling;
CREATE POLICY "Usuários podem atualizar social_selling"
ON public.social_selling
FOR UPDATE
USING (
  (is_social_selling() AND closer_user_id = auth.uid())
  OR (is_closer() AND closer_user_id = auth.uid())
  OR can_edit_any_fechamento()
);
