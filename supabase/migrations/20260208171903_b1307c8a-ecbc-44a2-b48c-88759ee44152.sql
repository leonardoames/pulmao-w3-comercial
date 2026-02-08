-- Tabela para metas OTE mensais por closer
CREATE TABLE public.ote_goals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    month_ref VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    closer_user_id UUID NOT NULL,
    ote_target_value NUMERIC NOT NULL DEFAULT 0,
    created_by_user_id UUID NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (month_ref, closer_user_id)
);

-- Enable RLS
ALTER TABLE public.ote_goals ENABLE ROW LEVEL SECURITY;

-- Function to check if user can manage OTE goals
CREATE OR REPLACE FUNCTION public.can_manage_ote_goals()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role IN ('MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL')
    )
$$;

-- RLS Policies for ote_goals
-- Everyone authenticated can read
CREATE POLICY "Todos podem ver metas OTE"
ON public.ote_goals
FOR SELECT
TO authenticated
USING (true);

-- Only managers can insert
CREATE POLICY "Gestores podem inserir metas OTE"
ON public.ote_goals
FOR INSERT
TO authenticated
WITH CHECK (can_manage_ote_goals());

-- Only managers can update
CREATE POLICY "Gestores podem atualizar metas OTE"
ON public.ote_goals
FOR UPDATE
TO authenticated
USING (can_manage_ote_goals());

-- Only managers can delete
CREATE POLICY "Gestores podem deletar metas OTE"
ON public.ote_goals
FOR DELETE
TO authenticated
USING (can_manage_ote_goals());

-- Trigger for updated_at
CREATE TRIGGER update_ote_goals_updated_at
BEFORE UPDATE ON public.ote_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();