
-- Table to store configurable permissions per role
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  resource_key text NOT NULL,
  can_view boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role, resource_key)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read permissions (needed for UI filtering)
CREATE POLICY "Todos autenticados podem ver role_permissions"
ON public.role_permissions FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only MASTER can manage permissions
CREATE POLICY "MASTER pode inserir role_permissions"
ON public.role_permissions FOR INSERT
WITH CHECK (public.is_master());

CREATE POLICY "MASTER pode atualizar role_permissions"
ON public.role_permissions FOR UPDATE
USING (public.is_master());

CREATE POLICY "MASTER pode deletar role_permissions"
ON public.role_permissions FOR DELETE
USING (public.is_master());

-- Trigger for updated_at
CREATE TRIGGER update_role_permissions_updated_at
BEFORE UPDATE ON public.role_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column_en();

-- Seed default permissions for all roles
-- Resource keys follow pattern: route:<path> for navigation, section:<page>:<section> for page sections
INSERT INTO public.role_permissions (role, resource_key, can_view, can_edit) VALUES
-- MASTER: full access
('MASTER', 'route:dashboard', true, true),
('MASTER', 'route:vendas', true, true),
('MASTER', 'route:meu-fechamento', true, true),
('MASTER', 'route:meta-ote', true, true),
('MASTER', 'route:social-selling', true, true),
('MASTER', 'route:conteudo-dashboard', true, true),
('MASTER', 'route:conteudo-acompanhamento', true, true),
('MASTER', 'route:conteudo-controle', true, true),
('MASTER', 'route:conteudo-twitter', true, true),
('MASTER', 'route:conteudo-ai', true, true),
('MASTER', 'route:marketing-dashboard', true, true),
('MASTER', 'route:painel-admin', true, true),
('MASTER', 'section:dashboard:receita', true, true),
('MASTER', 'section:dashboard:performance', true, true),
('MASTER', 'section:dashboard:destaques', true, true),
('MASTER', 'section:dashboard:ote', true, true),
('MASTER', 'section:vendas:criar', true, true),
('MASTER', 'section:vendas:exportar', true, true),
('MASTER', 'section:vendas:editar', true, true),

-- DIRETORIA: full access
('DIRETORIA', 'route:dashboard', true, true),
('DIRETORIA', 'route:vendas', true, true),
('DIRETORIA', 'route:meu-fechamento', true, true),
('DIRETORIA', 'route:meta-ote', true, true),
('DIRETORIA', 'route:social-selling', true, true),
('DIRETORIA', 'route:conteudo-dashboard', true, true),
('DIRETORIA', 'route:conteudo-acompanhamento', true, true),
('DIRETORIA', 'route:conteudo-controle', true, true),
('DIRETORIA', 'route:conteudo-twitter', true, true),
('DIRETORIA', 'route:conteudo-ai', true, true),
('DIRETORIA', 'route:marketing-dashboard', true, true),
('DIRETORIA', 'route:painel-admin', true, true),
('DIRETORIA', 'section:dashboard:receita', true, true),
('DIRETORIA', 'section:dashboard:performance', true, true),
('DIRETORIA', 'section:dashboard:destaques', true, true),
('DIRETORIA', 'section:dashboard:ote', true, true),
('DIRETORIA', 'section:vendas:criar', true, true),
('DIRETORIA', 'section:vendas:exportar', true, true),
('DIRETORIA', 'section:vendas:editar', true, true),

-- GESTOR_COMERCIAL: full access
('GESTOR_COMERCIAL', 'route:dashboard', true, true),
('GESTOR_COMERCIAL', 'route:vendas', true, true),
('GESTOR_COMERCIAL', 'route:meu-fechamento', true, true),
('GESTOR_COMERCIAL', 'route:meta-ote', true, true),
('GESTOR_COMERCIAL', 'route:social-selling', true, true),
('GESTOR_COMERCIAL', 'route:conteudo-dashboard', true, true),
('GESTOR_COMERCIAL', 'route:conteudo-acompanhamento', true, true),
('GESTOR_COMERCIAL', 'route:conteudo-controle', true, true),
('GESTOR_COMERCIAL', 'route:conteudo-twitter', true, true),
('GESTOR_COMERCIAL', 'route:conteudo-ai', true, true),
('GESTOR_COMERCIAL', 'route:marketing-dashboard', true, true),
('GESTOR_COMERCIAL', 'route:painel-admin', true, true),
('GESTOR_COMERCIAL', 'section:dashboard:receita', true, true),
('GESTOR_COMERCIAL', 'section:dashboard:performance', true, true),
('GESTOR_COMERCIAL', 'section:dashboard:destaques', true, true),
('GESTOR_COMERCIAL', 'section:dashboard:ote', true, true),
('GESTOR_COMERCIAL', 'section:vendas:criar', true, true),
('GESTOR_COMERCIAL', 'section:vendas:exportar', true, true),
('GESTOR_COMERCIAL', 'section:vendas:editar', true, true),

-- SDR: commercial + content access
('SDR', 'route:dashboard', true, true),
('SDR', 'route:vendas', true, true),
('SDR', 'route:meu-fechamento', true, true),
('SDR', 'route:meta-ote', true, true),
('SDR', 'route:social-selling', true, true),
('SDR', 'route:conteudo-dashboard', true, false),
('SDR', 'route:conteudo-acompanhamento', true, false),
('SDR', 'route:conteudo-controle', true, false),
('SDR', 'route:conteudo-twitter', true, false),
('SDR', 'route:conteudo-ai', true, false),
('SDR', 'route:marketing-dashboard', true, false),
('SDR', 'route:painel-admin', true, true),
('SDR', 'section:dashboard:receita', true, false),
('SDR', 'section:dashboard:performance', true, false),
('SDR', 'section:dashboard:destaques', true, false),
('SDR', 'section:dashboard:ote', true, false),
('SDR', 'section:vendas:criar', true, true),
('SDR', 'section:vendas:exportar', true, false),
('SDR', 'section:vendas:editar', true, true),

-- CLOSER: commercial focus
('CLOSER', 'route:dashboard', true, false),
('CLOSER', 'route:vendas', true, true),
('CLOSER', 'route:meu-fechamento', true, true),
('CLOSER', 'route:meta-ote', true, false),
('CLOSER', 'route:social-selling', true, true),
('CLOSER', 'route:conteudo-dashboard', false, false),
('CLOSER', 'route:conteudo-acompanhamento', false, false),
('CLOSER', 'route:conteudo-controle', false, false),
('CLOSER', 'route:conteudo-twitter', false, false),
('CLOSER', 'route:conteudo-ai', false, false),
('CLOSER', 'route:marketing-dashboard', false, false),
('CLOSER', 'route:painel-admin', false, false),
('CLOSER', 'section:dashboard:receita', true, false),
('CLOSER', 'section:dashboard:performance', true, false),
('CLOSER', 'section:dashboard:destaques', true, false),
('CLOSER', 'section:dashboard:ote', true, false),
('CLOSER', 'section:vendas:criar', true, true),
('CLOSER', 'section:vendas:exportar', false, false),
('CLOSER', 'section:vendas:editar', true, true),

-- SOCIAL_SELLING: only social selling
('SOCIAL_SELLING', 'route:dashboard', false, false),
('SOCIAL_SELLING', 'route:vendas', false, false),
('SOCIAL_SELLING', 'route:meu-fechamento', false, false),
('SOCIAL_SELLING', 'route:meta-ote', false, false),
('SOCIAL_SELLING', 'route:social-selling', true, true),
('SOCIAL_SELLING', 'route:conteudo-dashboard', false, false),
('SOCIAL_SELLING', 'route:conteudo-acompanhamento', false, false),
('SOCIAL_SELLING', 'route:conteudo-controle', false, false),
('SOCIAL_SELLING', 'route:conteudo-twitter', false, false),
('SOCIAL_SELLING', 'route:conteudo-ai', false, false),
('SOCIAL_SELLING', 'route:marketing-dashboard', false, false),
('SOCIAL_SELLING', 'route:painel-admin', false, false),
('SOCIAL_SELLING', 'section:dashboard:receita', false, false),
('SOCIAL_SELLING', 'section:dashboard:performance', false, false),
('SOCIAL_SELLING', 'section:dashboard:destaques', false, false),
('SOCIAL_SELLING', 'section:dashboard:ote', false, false),
('SOCIAL_SELLING', 'section:vendas:criar', false, false),
('SOCIAL_SELLING', 'section:vendas:exportar', false, false),
('SOCIAL_SELLING', 'section:vendas:editar', false, false),

-- ANALISTA_CONTEUDO: content focus
('ANALISTA_CONTEUDO', 'route:dashboard', false, false),
('ANALISTA_CONTEUDO', 'route:vendas', false, false),
('ANALISTA_CONTEUDO', 'route:meu-fechamento', false, false),
('ANALISTA_CONTEUDO', 'route:meta-ote', false, false),
('ANALISTA_CONTEUDO', 'route:social-selling', false, false),
('ANALISTA_CONTEUDO', 'route:conteudo-dashboard', true, true),
('ANALISTA_CONTEUDO', 'route:conteudo-acompanhamento', true, true),
('ANALISTA_CONTEUDO', 'route:conteudo-controle', true, true),
('ANALISTA_CONTEUDO', 'route:conteudo-twitter', true, true),
('ANALISTA_CONTEUDO', 'route:conteudo-ai', true, true),
('ANALISTA_CONTEUDO', 'route:marketing-dashboard', true, false),
('ANALISTA_CONTEUDO', 'route:painel-admin', false, false),
('ANALISTA_CONTEUDO', 'section:dashboard:receita', false, false),
('ANALISTA_CONTEUDO', 'section:dashboard:performance', false, false),
('ANALISTA_CONTEUDO', 'section:dashboard:destaques', false, false),
('ANALISTA_CONTEUDO', 'section:dashboard:ote', false, false),
('ANALISTA_CONTEUDO', 'section:vendas:criar', false, false),
('ANALISTA_CONTEUDO', 'section:vendas:exportar', false, false),
('ANALISTA_CONTEUDO', 'section:vendas:editar', false, false);
