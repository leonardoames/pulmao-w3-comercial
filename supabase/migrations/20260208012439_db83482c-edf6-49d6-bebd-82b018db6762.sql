-- Create app_role enum for the new roles system
CREATE TYPE public.app_role AS ENUM ('MASTER', 'CEO', 'GESTOR_COMERCIAL', 'SDR', 'CLOSER');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'CLOSER',
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
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

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
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

-- Create function to check if user is MASTER
CREATE OR REPLACE FUNCTION public.is_master()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(auth.uid(), 'MASTER')
$$;

-- Create function to check if user can manage users (only MASTER)
CREATE OR REPLACE FUNCTION public.can_manage_users()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(auth.uid(), 'MASTER')
$$;

-- Create function to check if user can edit fechamentos for others (SDR, GESTOR_COMERCIAL, CEO, MASTER)
CREATE OR REPLACE FUNCTION public.can_edit_any_fechamento()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role IN ('MASTER', 'CEO', 'GESTOR_COMERCIAL', 'SDR')
    )
$$;

-- Create function to check if user can edit vendas (Comercial area or CEO/Founder roles or MASTER)
CREATE OR REPLACE FUNCTION public.can_edit_vendas()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role IN ('MASTER', 'CEO', 'GESTOR_COMERCIAL')
    ) OR EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.area = 'Comercial'
    )
$$;

-- RLS policies for user_roles table
-- Everyone can view roles
CREATE POLICY "Todos podem ver roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- Only MASTER can insert roles
CREATE POLICY "Apenas MASTER pode inserir roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_master());

-- Only MASTER can update roles
CREATE POLICY "Apenas MASTER pode atualizar roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.is_master());

-- Only MASTER can delete roles
CREATE POLICY "Apenas MASTER pode deletar roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.is_master());

-- Update fechamentos policies to use new role system
DROP POLICY IF EXISTS "Closers podem editar próprio fechamento" ON public.fechamentos;
DROP POLICY IF EXISTS "Closers podem inserir próprio fechamento" ON public.fechamentos;

-- New fechamentos policies
CREATE POLICY "Usuários podem inserir fechamentos"
ON public.fechamentos
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = closer_user_id 
    OR public.can_edit_any_fechamento()
);

CREATE POLICY "Usuários podem editar fechamentos"
ON public.fechamentos
FOR UPDATE
TO authenticated
USING (
    auth.uid() = closer_user_id 
    OR public.can_edit_any_fechamento()
);

-- Update vendas policies
DROP POLICY IF EXISTS "Comercial pode atualizar vendas" ON public.vendas;
DROP POLICY IF EXISTS "Comercial pode deletar vendas" ON public.vendas;
DROP POLICY IF EXISTS "Comercial pode inserir vendas" ON public.vendas;

CREATE POLICY "Usuários autorizados podem inserir vendas"
ON public.vendas
FOR INSERT
TO authenticated
WITH CHECK (public.can_edit_vendas());

CREATE POLICY "Usuários autorizados podem atualizar vendas"
ON public.vendas
FOR UPDATE
TO authenticated
USING (public.can_edit_vendas());

CREATE POLICY "Usuários autorizados podem deletar vendas"
ON public.vendas
FOR DELETE
TO authenticated
USING (public.can_edit_vendas());

-- Update profiles policies to allow MASTER to update any profile
DROP POLICY IF EXISTS "Usuários podem editar próprio perfil" ON public.profiles;

CREATE POLICY "Usuários podem editar perfis"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    auth.uid() = id 
    OR public.is_master()
);

-- Allow MASTER to insert profiles
CREATE POLICY "MASTER pode inserir perfis"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.is_master());

-- Insert Leonardo Ames as MASTER
INSERT INTO public.user_roles (user_id, role)
VALUES ('55b5f498-2b57-48b1-b684-dde3da67bc48', 'MASTER')
ON CONFLICT (user_id) DO UPDATE SET role = 'MASTER';

-- Create trigger for updated_at on user_roles
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-create user_role on new profile
CREATE OR REPLACE FUNCTION public.handle_new_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'CLOSER')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_add_role
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_profile_role();