# Design: Role CS (Customer Success)

**Data:** 2026-04-08  
**Projeto:** pulmao-w3-comercial  
**Status:** Aprovado

---

## Objetivo

Adicionar o role `CS` (Customer Success) ao sistema com acesso somente-leitura ao módulo de Vendas, e criar 5 usuários com esse role usando senha temporária que força troca no primeiro login.

---

## Escopo

### O que será feito
1. Adicionar `CS` ao enum `app_role` no banco de dados
2. Inserir permissões padrão do role CS na tabela `role_permissions`
3. Adicionar `CS` ao tipo `AppRole` em TypeScript
4. Adicionar helper `useIsCS()` em `useUserRoles.ts`
5. Deploy via push para o GitHub (Lovable sincroniza automaticamente)
6. Criação manual dos 5 usuários pelo `/painel-admin` após deploy

### O que NÃO será feito
- CS não acessa painel admin
- CS não cria nem edita vendas
- CS não tem acesso a outros módulos (Tráfego Pago, Marketplaces, RH, Conteúdo, etc.)

---

## Banco de Dados

### Migration: adicionar CS ao enum

```sql
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'CS';
```

### Migration: permissões do role CS

```sql
INSERT INTO role_permissions (role, resource_key, can_view, can_edit)
VALUES
  ('CS', 'route:vendas',              true,  false),
  ('CS', 'section:vendas:exportar',   true,  false),
  ('CS', 'section:vendas:criar',      false, false),
  ('CS', 'section:vendas:editar',     false, false)
ON CONFLICT (role, resource_key) DO UPDATE
  SET can_view = EXCLUDED.can_view,
      can_edit = EXCLUDED.can_edit;
```

Todos os demais resources retornam `can_view: false` pelo fallback de `DEFAULT_PERMISSIONS` já existente no sistema.

---

## Frontend

### `src/types/roles.ts`
- Adicionar `'CS'` ao union type `AppRole`

### `src/hooks/useUserRoles.ts`
- Adicionar hook `useIsCS()` seguindo o padrão dos hooks existentes (`useIsCloser`, `useIsSocialSelling`, etc.)

### Sidebar
Nenhuma alteração necessária. O filtro de rotas por permissão já oculta automaticamente seções sem `can_view: true`. CS verá apenas `/vendas` no menu.

### Botão de criar/editar vendas
Nenhuma alteração necessária. Os botões já são condicionais ao `canEdit('section:vendas:criar')` e `canEdit('section:vendas:editar')`, que retornarão `false` para CS.

---

## Fluxo de Senha Temporária (já existente)

O fluxo já está implementado e funcionará para CS sem modificações:

1. Admin cria usuário no `/painel-admin` com senha temporária
2. Edge function `admin-create-user` seta `user_metadata.must_change_password: true`
3. Usuário faz login → `ProtectedRoute` detecta a flag → redireciona para `/alterar-senha`
4. Usuário define nova senha → flag é removida → acesso liberado

---

## Usuários a Criar (pós-deploy)

| Nome | Email | Role |
|---|---|---|
| Adenaldo | adenaldo@leonardoames.com.br | CS |
| Bernardo Veronezi | bernardo.veronezi@leonardoames.com.br | CS |
| Evelyn Rabelo | evelyn@leonardoames.com.br | CS |
| Taiara Pereira | taiara@leonardoames.com.br | CS |
| Tiago Ripa | tiagoripa@leonardoames.com.br | CS |

---

## Arquivos Modificados

| Arquivo | Tipo de mudança |
|---|---|
| `supabase/migrations/20260408000000_add-cs-role.sql` | Novo — enum + permissões |
| `src/types/roles.ts` | Editar — adicionar `'CS'` ao AppRole |
| `src/hooks/useUserRoles.ts` | Editar — adicionar `useIsCS()` |
