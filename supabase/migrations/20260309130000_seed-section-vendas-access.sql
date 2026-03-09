-- Seed section:vendas permissions para roles com acesso a vendas.
-- MASTER é sempre true (bypass no código). CLOSER, DIRETORIA, GESTOR_COMERCIAL recebem acesso total.
-- GESTOR_TRAFEGO, GESTOR_MARKETPLACE e ADMINISTRATIVO já foram semeados com false no migration anterior.

INSERT INTO public.role_permissions (role, resource_key, can_view, can_edit)
VALUES
  ('CLOSER',           'section:vendas:criar',    true, true),
  ('CLOSER',           'section:vendas:exportar', true, true),
  ('CLOSER',           'section:vendas:editar',   true, true),
  ('DIRETORIA',        'section:vendas:criar',    true, true),
  ('DIRETORIA',        'section:vendas:exportar', true, true),
  ('DIRETORIA',        'section:vendas:editar',   true, true),
  ('GESTOR_COMERCIAL', 'section:vendas:criar',    true, true),
  ('GESTOR_COMERCIAL', 'section:vendas:exportar', true, true),
  ('GESTOR_COMERCIAL', 'section:vendas:editar',   true, true)
ON CONFLICT (role, resource_key) DO NOTHING;
