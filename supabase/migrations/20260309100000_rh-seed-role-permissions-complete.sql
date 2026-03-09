-- Seed completo de role_permissions para todos os roles e recursos.
-- Cobre: (1) roles novos sem entrada (GESTOR_TRAFEGO, GESTOR_MARKETPLACE, ADMINISTRATIVO)
--        (2) resource_keys novos ausentes nos roles já existentes
--            (trafego-pago, marketplaces, admin, rh routes)
-- ON CONFLICT DO NOTHING: não sobrescreve configurações existentes.

-- ─── DIRETORIA — recursos novos ────────────────────────────────────────────
INSERT INTO public.role_permissions (role, resource_key, can_view, can_edit) VALUES
  ('DIRETORIA', 'route:trafego-pago-dashboard',  true,  false),
  ('DIRETORIA', 'route:trafego-pago-clientes',   true,  false),
  ('DIRETORIA', 'route:marketplaces-dashboard',  true,  false),
  ('DIRETORIA', 'route:marketplaces-clientes',   true,  false),
  ('DIRETORIA', 'route:admin-dashboard',         true,  true),
  ('DIRETORIA', 'route:admin-almoxarifado',      true,  false),
  ('DIRETORIA', 'route:admin-patrimonio',        true,  false),
  ('DIRETORIA', 'route:rh-colaboradores',        true,  true),
  ('DIRETORIA', 'route:rh-feedbacks',            true,  true),
  ('DIRETORIA', 'route:rh-avaliacoes',           true,  true),
  ('DIRETORIA', 'route:rh-setores',              true,  true)
ON CONFLICT (role, resource_key) DO NOTHING;

-- ─── GESTOR_COMERCIAL — recursos novos ─────────────────────────────────────
INSERT INTO public.role_permissions (role, resource_key, can_view, can_edit) VALUES
  ('GESTOR_COMERCIAL', 'route:trafego-pago-dashboard',  false, false),
  ('GESTOR_COMERCIAL', 'route:trafego-pago-clientes',   false, false),
  ('GESTOR_COMERCIAL', 'route:marketplaces-dashboard',  false, false),
  ('GESTOR_COMERCIAL', 'route:marketplaces-clientes',   false, false),
  ('GESTOR_COMERCIAL', 'route:admin-dashboard',         false, false),
  ('GESTOR_COMERCIAL', 'route:admin-almoxarifado',      false, false),
  ('GESTOR_COMERCIAL', 'route:admin-patrimonio',        false, false),
  ('GESTOR_COMERCIAL', 'route:rh-colaboradores',        true,  true),
  ('GESTOR_COMERCIAL', 'route:rh-feedbacks',            true,  true),
  ('GESTOR_COMERCIAL', 'route:rh-avaliacoes',           true,  true),
  ('GESTOR_COMERCIAL', 'route:rh-setores',              true,  true)
ON CONFLICT (role, resource_key) DO NOTHING;

-- ─── SDR — recursos novos (sem acesso) ─────────────────────────────────────
INSERT INTO public.role_permissions (role, resource_key, can_view, can_edit) VALUES
  ('SDR', 'route:trafego-pago-dashboard',  false, false),
  ('SDR', 'route:trafego-pago-clientes',   false, false),
  ('SDR', 'route:marketplaces-dashboard',  false, false),
  ('SDR', 'route:marketplaces-clientes',   false, false),
  ('SDR', 'route:admin-dashboard',         false, false),
  ('SDR', 'route:admin-almoxarifado',      false, false),
  ('SDR', 'route:admin-patrimonio',        false, false),
  ('SDR', 'route:rh-colaboradores',        false, false),
  ('SDR', 'route:rh-feedbacks',            false, false),
  ('SDR', 'route:rh-avaliacoes',           false, false),
  ('SDR', 'route:rh-setores',              false, false)
ON CONFLICT (role, resource_key) DO NOTHING;

-- ─── CLOSER — recursos novos (sem acesso) ──────────────────────────────────
INSERT INTO public.role_permissions (role, resource_key, can_view, can_edit) VALUES
  ('CLOSER', 'route:trafego-pago-dashboard',  false, false),
  ('CLOSER', 'route:trafego-pago-clientes',   false, false),
  ('CLOSER', 'route:marketplaces-dashboard',  false, false),
  ('CLOSER', 'route:marketplaces-clientes',   false, false),
  ('CLOSER', 'route:admin-dashboard',         false, false),
  ('CLOSER', 'route:admin-almoxarifado',      false, false),
  ('CLOSER', 'route:admin-patrimonio',        false, false),
  ('CLOSER', 'route:rh-colaboradores',        false, false),
  ('CLOSER', 'route:rh-feedbacks',            false, false),
  ('CLOSER', 'route:rh-avaliacoes',           false, false),
  ('CLOSER', 'route:rh-setores',              false, false)
ON CONFLICT (role, resource_key) DO NOTHING;

-- ─── SOCIAL_SELLING — recursos novos (sem acesso) ──────────────────────────
INSERT INTO public.role_permissions (role, resource_key, can_view, can_edit) VALUES
  ('SOCIAL_SELLING', 'route:trafego-pago-dashboard',  false, false),
  ('SOCIAL_SELLING', 'route:trafego-pago-clientes',   false, false),
  ('SOCIAL_SELLING', 'route:marketplaces-dashboard',  false, false),
  ('SOCIAL_SELLING', 'route:marketplaces-clientes',   false, false),
  ('SOCIAL_SELLING', 'route:admin-dashboard',         false, false),
  ('SOCIAL_SELLING', 'route:admin-almoxarifado',      false, false),
  ('SOCIAL_SELLING', 'route:admin-patrimonio',        false, false),
  ('SOCIAL_SELLING', 'route:rh-colaboradores',        false, false),
  ('SOCIAL_SELLING', 'route:rh-feedbacks',            false, false),
  ('SOCIAL_SELLING', 'route:rh-avaliacoes',           false, false),
  ('SOCIAL_SELLING', 'route:rh-setores',              false, false)
ON CONFLICT (role, resource_key) DO NOTHING;

-- ─── ANALISTA_CONTEUDO — recursos novos (sem acesso) ───────────────────────
INSERT INTO public.role_permissions (role, resource_key, can_view, can_edit) VALUES
  ('ANALISTA_CONTEUDO', 'route:trafego-pago-dashboard',  false, false),
  ('ANALISTA_CONTEUDO', 'route:trafego-pago-clientes',   false, false),
  ('ANALISTA_CONTEUDO', 'route:marketplaces-dashboard',  false, false),
  ('ANALISTA_CONTEUDO', 'route:marketplaces-clientes',   false, false),
  ('ANALISTA_CONTEUDO', 'route:admin-dashboard',         false, false),
  ('ANALISTA_CONTEUDO', 'route:admin-almoxarifado',      false, false),
  ('ANALISTA_CONTEUDO', 'route:admin-patrimonio',        false, false),
  ('ANALISTA_CONTEUDO', 'route:rh-colaboradores',        false, false),
  ('ANALISTA_CONTEUDO', 'route:rh-feedbacks',            false, false),
  ('ANALISTA_CONTEUDO', 'route:rh-avaliacoes',           false, false),
  ('ANALISTA_CONTEUDO', 'route:rh-setores',              false, false)
ON CONFLICT (role, resource_key) DO NOTHING;

-- ─── GESTOR_TRAFEGO — seed completo ────────────────────────────────────────
INSERT INTO public.role_permissions (role, resource_key, can_view, can_edit) VALUES
  ('GESTOR_TRAFEGO', 'route:dashboard',               false, false),
  ('GESTOR_TRAFEGO', 'route:vendas',                  false, false),
  ('GESTOR_TRAFEGO', 'route:meu-fechamento',           false, false),
  ('GESTOR_TRAFEGO', 'route:meta-ote',                false, false),
  ('GESTOR_TRAFEGO', 'route:social-selling',          false, false),
  ('GESTOR_TRAFEGO', 'route:trafego-pago-dashboard',  true,  true),
  ('GESTOR_TRAFEGO', 'route:trafego-pago-clientes',   true,  true),
  ('GESTOR_TRAFEGO', 'route:marketplaces-dashboard',  false, false),
  ('GESTOR_TRAFEGO', 'route:marketplaces-clientes',   false, false),
  ('GESTOR_TRAFEGO', 'route:conteudo-dashboard',      false, false),
  ('GESTOR_TRAFEGO', 'route:conteudo-acompanhamento', false, false),
  ('GESTOR_TRAFEGO', 'route:conteudo-controle',       false, false),
  ('GESTOR_TRAFEGO', 'route:conteudo-twitter',        false, false),
  ('GESTOR_TRAFEGO', 'route:conteudo-ai',             false, false),
  ('GESTOR_TRAFEGO', 'route:marketing-dashboard',     false, false),
  ('GESTOR_TRAFEGO', 'route:painel-admin',            false, false),
  ('GESTOR_TRAFEGO', 'route:admin-dashboard',         false, false),
  ('GESTOR_TRAFEGO', 'route:admin-almoxarifado',      false, false),
  ('GESTOR_TRAFEGO', 'route:admin-patrimonio',        false, false),
  ('GESTOR_TRAFEGO', 'route:rh-colaboradores',        false, false),
  ('GESTOR_TRAFEGO', 'route:rh-feedbacks',            false, false),
  ('GESTOR_TRAFEGO', 'route:rh-avaliacoes',           false, false),
  ('GESTOR_TRAFEGO', 'route:rh-setores',              false, false),
  ('GESTOR_TRAFEGO', 'section:dashboard:receita',     false, false),
  ('GESTOR_TRAFEGO', 'section:dashboard:performance', false, false),
  ('GESTOR_TRAFEGO', 'section:dashboard:destaques',   false, false),
  ('GESTOR_TRAFEGO', 'section:dashboard:ote',         false, false),
  ('GESTOR_TRAFEGO', 'section:vendas:criar',          false, false),
  ('GESTOR_TRAFEGO', 'section:vendas:exportar',       false, false),
  ('GESTOR_TRAFEGO', 'section:vendas:editar',         false, false)
ON CONFLICT (role, resource_key) DO NOTHING;

-- ─── GESTOR_MARKETPLACE — seed completo ────────────────────────────────────
INSERT INTO public.role_permissions (role, resource_key, can_view, can_edit) VALUES
  ('GESTOR_MARKETPLACE', 'route:dashboard',               false, false),
  ('GESTOR_MARKETPLACE', 'route:vendas',                  false, false),
  ('GESTOR_MARKETPLACE', 'route:meu-fechamento',           false, false),
  ('GESTOR_MARKETPLACE', 'route:meta-ote',                false, false),
  ('GESTOR_MARKETPLACE', 'route:social-selling',          false, false),
  ('GESTOR_MARKETPLACE', 'route:trafego-pago-dashboard',  false, false),
  ('GESTOR_MARKETPLACE', 'route:trafego-pago-clientes',   false, false),
  ('GESTOR_MARKETPLACE', 'route:marketplaces-dashboard',  true,  true),
  ('GESTOR_MARKETPLACE', 'route:marketplaces-clientes',   true,  true),
  ('GESTOR_MARKETPLACE', 'route:conteudo-dashboard',      false, false),
  ('GESTOR_MARKETPLACE', 'route:conteudo-acompanhamento', false, false),
  ('GESTOR_MARKETPLACE', 'route:conteudo-controle',       false, false),
  ('GESTOR_MARKETPLACE', 'route:conteudo-twitter',        false, false),
  ('GESTOR_MARKETPLACE', 'route:conteudo-ai',             false, false),
  ('GESTOR_MARKETPLACE', 'route:marketing-dashboard',     false, false),
  ('GESTOR_MARKETPLACE', 'route:painel-admin',            false, false),
  ('GESTOR_MARKETPLACE', 'route:admin-dashboard',         false, false),
  ('GESTOR_MARKETPLACE', 'route:admin-almoxarifado',      false, false),
  ('GESTOR_MARKETPLACE', 'route:admin-patrimonio',        false, false),
  ('GESTOR_MARKETPLACE', 'route:rh-colaboradores',        false, false),
  ('GESTOR_MARKETPLACE', 'route:rh-feedbacks',            false, false),
  ('GESTOR_MARKETPLACE', 'route:rh-avaliacoes',           false, false),
  ('GESTOR_MARKETPLACE', 'route:rh-setores',              false, false),
  ('GESTOR_MARKETPLACE', 'section:dashboard:receita',     false, false),
  ('GESTOR_MARKETPLACE', 'section:dashboard:performance', false, false),
  ('GESTOR_MARKETPLACE', 'section:dashboard:destaques',   false, false),
  ('GESTOR_MARKETPLACE', 'section:dashboard:ote',         false, false),
  ('GESTOR_MARKETPLACE', 'section:vendas:criar',          false, false),
  ('GESTOR_MARKETPLACE', 'section:vendas:exportar',       false, false),
  ('GESTOR_MARKETPLACE', 'section:vendas:editar',         false, false)
ON CONFLICT (role, resource_key) DO NOTHING;

-- ─── ADMINISTRATIVO — seed completo ────────────────────────────────────────
INSERT INTO public.role_permissions (role, resource_key, can_view, can_edit) VALUES
  ('ADMINISTRATIVO', 'route:dashboard',               false, false),
  ('ADMINISTRATIVO', 'route:vendas',                  false, false),
  ('ADMINISTRATIVO', 'route:meu-fechamento',           false, false),
  ('ADMINISTRATIVO', 'route:meta-ote',                false, false),
  ('ADMINISTRATIVO', 'route:social-selling',          false, false),
  ('ADMINISTRATIVO', 'route:trafego-pago-dashboard',  false, false),
  ('ADMINISTRATIVO', 'route:trafego-pago-clientes',   false, false),
  ('ADMINISTRATIVO', 'route:marketplaces-dashboard',  false, false),
  ('ADMINISTRATIVO', 'route:marketplaces-clientes',   false, false),
  ('ADMINISTRATIVO', 'route:conteudo-dashboard',      false, false),
  ('ADMINISTRATIVO', 'route:conteudo-acompanhamento', false, false),
  ('ADMINISTRATIVO', 'route:conteudo-controle',       false, false),
  ('ADMINISTRATIVO', 'route:conteudo-twitter',        false, false),
  ('ADMINISTRATIVO', 'route:conteudo-ai',             false, false),
  ('ADMINISTRATIVO', 'route:marketing-dashboard',     false, false),
  ('ADMINISTRATIVO', 'route:painel-admin',            false, false),
  ('ADMINISTRATIVO', 'route:admin-dashboard',         true,  true),
  ('ADMINISTRATIVO', 'route:admin-almoxarifado',      true,  true),
  ('ADMINISTRATIVO', 'route:admin-patrimonio',        true,  true),
  ('ADMINISTRATIVO', 'route:rh-colaboradores',        false, false),
  ('ADMINISTRATIVO', 'route:rh-feedbacks',            false, false),
  ('ADMINISTRATIVO', 'route:rh-avaliacoes',           false, false),
  ('ADMINISTRATIVO', 'route:rh-setores',              false, false),
  ('ADMINISTRATIVO', 'section:dashboard:receita',     false, false),
  ('ADMINISTRATIVO', 'section:dashboard:performance', false, false),
  ('ADMINISTRATIVO', 'section:dashboard:destaques',   false, false),
  ('ADMINISTRATIVO', 'section:dashboard:ote',         false, false),
  ('ADMINISTRATIVO', 'section:vendas:criar',          false, false),
  ('ADMINISTRATIVO', 'section:vendas:exportar',       false, false),
  ('ADMINISTRATIVO', 'section:vendas:editar',         false, false)
ON CONFLICT (role, resource_key) DO NOTHING;
