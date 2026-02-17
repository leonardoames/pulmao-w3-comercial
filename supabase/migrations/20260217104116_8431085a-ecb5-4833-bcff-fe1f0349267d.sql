-- Update can_edit_any_fechamento to include SDR
CREATE OR REPLACE FUNCTION public.can_edit_any_fechamento()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role IN ('MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL', 'SDR')
    )
$$;

-- Update can_edit_vendas to include SDR
CREATE OR REPLACE FUNCTION public.can_edit_vendas()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role IN ('MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL', 'CLOSER', 'SDR')
    )
$$;

-- Update can_access_admin_panel to include SDR
CREATE OR REPLACE FUNCTION public.can_access_admin_panel()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role IN ('MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL', 'SDR')
    )
$$;

-- Update can_manage_ote_goals to include SDR
CREATE OR REPLACE FUNCTION public.can_manage_ote_goals()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role IN ('MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL', 'SDR')
    )
$$;