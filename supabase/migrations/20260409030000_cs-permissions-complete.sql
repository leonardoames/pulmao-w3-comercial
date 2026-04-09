-- Remove registros antigos do CS para recriar completo e correto
DELETE FROM role_permissions WHERE role = 'CS';

-- Insere permissões completas do CS
-- Apenas route:vendas (view) e section:vendas:exportar (view) liberados
-- Todo o resto bloqueado explicitamente
INSERT INTO role_permissions (role, resource_key, can_view, can_edit) VALUES
  ('CS', 'route:dashboard',               false, false),
  ('CS', 'route:vendas',                  true,  false),
  ('CS', 'route:meu-fechamento',          false, false),
  ('CS', 'route:meta-ote',                false, false),
  ('CS', 'route:ote-calculadora',         false, false),
  ('CS', 'route:social-selling',          false, false),
  ('CS', 'route:leads',                   false, false),
  ('CS', 'route:trafego-pago-dashboard',  false, false),
  ('CS', 'route:trafego-pago-clientes',   false, false),
  ('CS', 'route:marketplaces-dashboard',  false, false),
  ('CS', 'route:marketplaces-clientes',   false, false),
  ('CS', 'route:conteudo-dashboard',      false, false),
  ('CS', 'route:conteudo-acompanhamento', false, false),
  ('CS', 'route:conteudo-controle',       false, false),
  ('CS', 'route:conteudo-twitter',        false, false),
  ('CS', 'route:conteudo-ai',             false, false),
  ('CS', 'route:marketing-dashboard',     false, false),
  ('CS', 'route:painel-admin',            false, false),
  ('CS', 'route:admin-dashboard',         false, false),
  ('CS', 'route:admin-almoxarifado',      false, false),
  ('CS', 'route:admin-patrimonio',        false, false),
  ('CS', 'route:rh-colaboradores',        false, false),
  ('CS', 'route:rh-feedbacks',            false, false),
  ('CS', 'route:rh-avaliacoes',           false, false),
  ('CS', 'route:rh-setores',             false, false),
  ('CS', 'section:dashboard:receita',     false, false),
  ('CS', 'section:dashboard:performance', false, false),
  ('CS', 'section:dashboard:destaques',   false, false),
  ('CS', 'section:dashboard:ote',         false, false),
  ('CS', 'section:vendas:criar',          false, false),
  ('CS', 'section:vendas:exportar',       true,  false),
  ('CS', 'section:vendas:editar',         false, false)
ON CONFLICT (role, resource_key) DO UPDATE
  SET can_view = EXCLUDED.can_view,
      can_edit = EXCLUDED.can_edit;
