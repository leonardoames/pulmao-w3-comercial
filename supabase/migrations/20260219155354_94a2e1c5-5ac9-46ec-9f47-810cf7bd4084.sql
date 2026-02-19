
-- Seed default role_permissions for all roles
-- Uses ON CONFLICT DO NOTHING to not overwrite existing configurations

-- DIRETORIA: full access to everything
INSERT INTO public.role_permissions (role, resource_key, can_view, can_edit) VALUES
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
  ('DIRETORIA', 'section:vendas:editar', true, true)
ON CONFLICT (role, resource_key) DO NOTHING;

-- GESTOR_COMERCIAL: full access to commercial + admin
INSERT INTO public.role_permissions (role, resource_key, can_view, can_edit) VALUES
  ('GESTOR_COMERCIAL', 'route:dashboard', true, true),
  ('GESTOR_COMERCIAL', 'route:vendas', true, true),
  ('GESTOR_COMERCIAL', 'route:meu-fechamento', true, true),
  ('GESTOR_COMERCIAL', 'route:meta-ote', true, true),
  ('GESTOR_COMERCIAL', 'route:social-selling', true, true),
  ('GESTOR_COMERCIAL', 'route:conteudo-dashboard', true, false),
  ('GESTOR_COMERCIAL', 'route:conteudo-acompanhamento', true, false),
  ('GESTOR_COMERCIAL', 'route:conteudo-controle', true, false),
  ('GESTOR_COMERCIAL', 'route:conteudo-twitter', true, false),
  ('GESTOR_COMERCIAL', 'route:conteudo-ai', true, false),
  ('GESTOR_COMERCIAL', 'route:marketing-dashboard', true, true),
  ('GESTOR_COMERCIAL', 'route:painel-admin', true, true),
  ('GESTOR_COMERCIAL', 'section:dashboard:receita', true, true),
  ('GESTOR_COMERCIAL', 'section:dashboard:performance', true, true),
  ('GESTOR_COMERCIAL', 'section:dashboard:destaques', true, true),
  ('GESTOR_COMERCIAL', 'section:dashboard:ote', true, true),
  ('GESTOR_COMERCIAL', 'section:vendas:criar', true, true),
  ('GESTOR_COMERCIAL', 'section:vendas:exportar', true, true),
  ('GESTOR_COMERCIAL', 'section:vendas:editar', true, true)
ON CONFLICT (role, resource_key) DO NOTHING;

-- SDR: commercial access + admin
INSERT INTO public.role_permissions (role, resource_key, can_view, can_edit) VALUES
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
  ('SDR', 'route:marketing-dashboard', true, true),
  ('SDR', 'route:painel-admin', true, true),
  ('SDR', 'section:dashboard:receita', true, true),
  ('SDR', 'section:dashboard:performance', true, true),
  ('SDR', 'section:dashboard:destaques', true, true),
  ('SDR', 'section:dashboard:ote', true, true),
  ('SDR', 'section:vendas:criar', true, true),
  ('SDR', 'section:vendas:exportar', true, true),
  ('SDR', 'section:vendas:editar', true, true)
ON CONFLICT (role, resource_key) DO NOTHING;

-- CLOSER: commercial routes, no admin
INSERT INTO public.role_permissions (role, resource_key, can_view, can_edit) VALUES
  ('CLOSER', 'route:dashboard', true, true),
  ('CLOSER', 'route:vendas', true, true),
  ('CLOSER', 'route:meu-fechamento', true, true),
  ('CLOSER', 'route:meta-ote', true, true),
  ('CLOSER', 'route:social-selling', true, true),
  ('CLOSER', 'route:conteudo-dashboard', false, false),
  ('CLOSER', 'route:conteudo-acompanhamento', false, false),
  ('CLOSER', 'route:conteudo-controle', false, false),
  ('CLOSER', 'route:conteudo-twitter', false, false),
  ('CLOSER', 'route:conteudo-ai', false, false),
  ('CLOSER', 'route:marketing-dashboard', false, false),
  ('CLOSER', 'route:painel-admin', false, false),
  ('CLOSER', 'section:dashboard:receita', true, true),
  ('CLOSER', 'section:dashboard:performance', true, true),
  ('CLOSER', 'section:dashboard:destaques', true, true),
  ('CLOSER', 'section:dashboard:ote', true, true),
  ('CLOSER', 'section:vendas:criar', true, true),
  ('CLOSER', 'section:vendas:exportar', true, true),
  ('CLOSER', 'section:vendas:editar', true, true)
ON CONFLICT (role, resource_key) DO NOTHING;

-- SOCIAL_SELLING: only social selling route
INSERT INTO public.role_permissions (role, resource_key, can_view, can_edit) VALUES
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
  ('SOCIAL_SELLING', 'section:vendas:editar', false, false)
ON CONFLICT (role, resource_key) DO NOTHING;

-- ANALISTA_CONTEUDO: content routes with edit, marketing view-only, no commercial
INSERT INTO public.role_permissions (role, resource_key, can_view, can_edit) VALUES
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
  ('ANALISTA_CONTEUDO', 'section:vendas:editar', false, false)
ON CONFLICT (role, resource_key) DO NOTHING;
