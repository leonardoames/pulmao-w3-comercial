-- 1. Drop RLS policies that depend on is_master()
DROP POLICY IF EXISTS "Apenas MASTER pode inserir roles" ON public.user_roles;
DROP POLICY IF EXISTS "Apenas MASTER pode atualizar roles" ON public.user_roles;
DROP POLICY IF EXISTS "Apenas MASTER pode deletar roles" ON public.user_roles;
DROP POLICY IF EXISTS "Usuários podem editar perfis" ON public.profiles;
DROP POLICY IF EXISTS "MASTER pode inserir perfis" ON public.profiles;

-- 2. Drop all dependent functions
DROP FUNCTION IF EXISTS public.is_master() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_manage_users() CASCADE;
DROP FUNCTION IF EXISTS public.can_edit_any_fechamento() CASCADE;
DROP FUNCTION IF EXISTS public.can_edit_vendas() CASCADE;

-- 3. Drop old enum types if they exist
DROP TYPE IF EXISTS public.app_role_new CASCADE;

-- 4. Create new app_role enum with updated values
CREATE TYPE public.app_role_new AS ENUM ('MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL', 'CLOSER');

-- 5. Alter the column to use the new enum FIRST with USING clause to map old values
ALTER TABLE public.user_roles 
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN role TYPE public.app_role_new USING (
    CASE role::text
      WHEN 'CEO' THEN 'DIRETORIA'::public.app_role_new
      WHEN 'SDR' THEN 'CLOSER'::public.app_role_new
      ELSE role::text::public.app_role_new
    END
  ),
  ALTER COLUMN role SET DEFAULT 'CLOSER'::public.app_role_new;

-- 6. Drop old enum and rename new one
DROP TYPE public.app_role;
ALTER TYPE public.app_role_new RENAME TO app_role;

-- 7. Recreate has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- 8. Recreate get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM public.user_roles
    WHERE user_id = _user_id
    LIMIT 1
$$;

-- 9. Recreate is_master function
CREATE OR REPLACE FUNCTION public.is_master()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(auth.uid(), 'MASTER')
$$;

-- 10. Recreate can_manage_users function (only MASTER can manage)
CREATE OR REPLACE FUNCTION public.can_manage_users()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(auth.uid(), 'MASTER')
$$;

-- 11. Recreate can_edit_any_fechamento function
CREATE OR REPLACE FUNCTION public.can_edit_any_fechamento()
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

-- 12. Recreate can_edit_vendas function
CREATE OR REPLACE FUNCTION public.can_edit_vendas()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role IN ('MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL', 'CLOSER')
    )
$$;

-- 13. Create function to check if user can access admin panel
CREATE OR REPLACE FUNCTION public.can_access_admin_panel()
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

-- 14. Create function to check if user is a closer
CREATE OR REPLACE FUNCTION public.is_closer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(auth.uid(), 'CLOSER')
$$;

-- 15. Recreate RLS policies for user_roles
CREATE POLICY "Apenas MASTER pode inserir roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (is_master());

CREATE POLICY "Apenas MASTER pode atualizar roles" 
ON public.user_roles 
FOR UPDATE 
USING (is_master());

CREATE POLICY "Apenas MASTER pode deletar roles" 
ON public.user_roles 
FOR DELETE 
USING (is_master());

-- 16. Recreate RLS policies for profiles
CREATE POLICY "Usuários podem editar perfis" 
ON public.profiles 
FOR UPDATE 
USING ((auth.uid() = id) OR is_master());

CREATE POLICY "MASTER pode inserir perfis" 
ON public.profiles 
FOR INSERT 
WITH CHECK (is_master());

-- 17. Update trigger for new profiles
CREATE OR REPLACE FUNCTION public.handle_new_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'CLOSER')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$function$;