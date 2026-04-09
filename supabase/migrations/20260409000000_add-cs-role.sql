-- Adiciona CS ao enum app_role
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'CS';

-- Insere permissões do role CS
INSERT INTO role_permissions (role, resource_key, can_view, can_edit)
VALUES
  ('CS', 'route:vendas',            true,  false),
  ('CS', 'section:vendas:exportar', true,  false),
  ('CS', 'section:vendas:criar',    false, false),
  ('CS', 'section:vendas:editar',   false, false)
ON CONFLICT (role, resource_key) DO UPDATE
  SET can_view = EXCLUDED.can_view,
      can_edit = EXCLUDED.can_edit;
