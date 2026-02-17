
# Revisao Completa de Acessos por Role

## Problemas Identificados

### Problema 1: ANALISTA_CONTEUDO nao consegue editar no Acompanhamento Diario

**Frontend**: `ConteudoAcompanhamento.tsx` (linha 25) usa `useCanAccessAdminPanel()` que so retorna `true` para MASTER, DIRETORIA, GESTOR_COMERCIAL e SDR. O ANALISTA_CONTEUDO fica sem botao "Novo registro" e sem botoes de editar/excluir.

**Backend (RLS)**: As policies de INSERT/UPDATE em `content_daily_logs` e `content_post_items` usam `can_access_admin_panel()` -- mesma restricao. Mesmo que o frontend mostrasse os botoes, o banco bloquearia a operacao.

**Correcao**:
- Criar funcao SQL `can_edit_content()` incluindo ANALISTA_CONTEUDO
- Atualizar 5 RLS policies (INSERT/UPDATE de `content_daily_logs`, INSERT/UPDATE/DELETE de `content_post_items`)
- Trocar `useCanAccessAdminPanel()` por `useCanEdit('route:conteudo-acompanhamento')` no frontend

---

### Problema 2: ANALISTA_CONTEUDO ve rotas que nao deveria (loop de redirecionamento)

O `ProtectedRoute` em `App.tsx` redireciona para `/` quando a rota e bloqueada. ANALISTA_CONTEUDO nao tem acesso a `/` (dashboard comercial), criando um loop infinito.

**Correcao**: Quando uma rota e bloqueada, calcular a primeira rota acessivel do usuario a partir de `ROUTE_TO_RESOURCE` e redirecionar para la. Se nenhuma rota estiver acessivel, redirecionar para `/auth`.

---

### Problema 3: SOCIAL_SELLING preso em loop

SOCIAL_SELLING so tem acesso a `route:social-selling`. Como a rota padrao `/` e bloqueada e o redirect vai para `/`, ocorre o mesmo loop.

**Correcao**: Mesmo fix do Problema 2 resolve este caso. O SOCIAL_SELLING sera redirecionado automaticamente para `/social-selling`.

---

### Problema 4: Hardcoded role checks inconsistentes com a matriz de permissoes

Varias paginas usam hooks de role hardcoded em vez do sistema RBAC (`role_permissions`):

| Pagina | Hook usado | Problema |
|---|---|---|
| `Dashboard.tsx` | `useCanAccessAdminPanel()` | Controla "compartilhar dashboard" -- OK pra agora, mas deveria usar permissao |
| `MarketingDashboard.tsx` | `useCanAccessAdminPanel()` | Controla edicao de investimentos -- nao respeita RBAC |
| `Vendas.tsx` | `useCanEditAnyFechamento()` + `useIsCloser()` | Funciona mas nao consulta `section:vendas:criar/editar` |
| `MeuFechamento.tsx` | `useCanEditAnyFechamento()` | OK - logica de negocio (quem pode ver closers de terceiros) |
| `SocialSelling.tsx` | `useCanEditAnyFechamento()` + `useIsSocialSelling()` | Funciona mas nao consulta RBAC |
| `OteTracking.tsx` | Hardcoded role check | Nao consulta RBAC |
| `ConteudoAcompanhamento.tsx` | `useCanAccessAdminPanel()` | **Bloqueio principal do analista** |

**Correcao prioritaria**: Alinhar `ConteudoAcompanhamento.tsx` e `MarketingDashboard.tsx` ao RBAC. As demais paginas comerciais funcionam corretamente com os hooks atuais porque as regras de negocio (quem pode ver closers, quem pode editar vendas) sao intrinsecas ao dominio e coincidem com as roles.

---

### Problema 5: RLS do `conteudos_marketing` permite DELETE somente para MASTER/DIRETORIA/GESTOR_COMERCIAL

O ANALISTA_CONTEUDO tem `can_edit: true` para `route:conteudo-controle` mas a policy de DELETE nao o inclui. Se o analista precisar deletar conteudos no Kanban, sera bloqueado.

**Correcao**: Atualizar policy de DELETE para incluir ANALISTA_CONTEUDO (usando `can_edit_content()`).

---

## Plano de Implementacao

### Etapa 1: Migration SQL

```sql
-- 1. Criar funcao can_edit_content()
CREATE OR REPLACE FUNCTION public.can_edit_content()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('MASTER','DIRETORIA','GESTOR_COMERCIAL','SDR','ANALISTA_CONTEUDO')
  )
$$;

-- 2. content_daily_logs: trocar INSERT policy
DROP POLICY "Gestores podem inserir content_daily_logs" ON content_daily_logs;
CREATE POLICY "Editores conteudo podem inserir content_daily_logs"
  ON content_daily_logs FOR INSERT
  WITH CHECK (can_edit_content());

-- 3. content_daily_logs: trocar UPDATE policy
DROP POLICY "Gestores podem atualizar content_daily_logs" ON content_daily_logs;
CREATE POLICY "Editores conteudo podem atualizar content_daily_logs"
  ON content_daily_logs FOR UPDATE
  USING (can_edit_content());

-- 4. content_post_items: trocar INSERT policy
DROP POLICY "Gestores podem inserir content_post_items" ON content_post_items;
CREATE POLICY "Editores conteudo podem inserir content_post_items"
  ON content_post_items FOR INSERT
  WITH CHECK (can_edit_content());

-- 5. content_post_items: trocar UPDATE policy
DROP POLICY "Gestores podem atualizar content_post_items" ON content_post_items;
CREATE POLICY "Editores conteudo podem atualizar content_post_items"
  ON content_post_items FOR UPDATE
  USING (can_edit_content());

-- 6. content_post_items: trocar DELETE policy
DROP POLICY "Gestores podem deletar content_post_items" ON content_post_items;
CREATE POLICY "Editores conteudo podem deletar content_post_items"
  ON content_post_items FOR DELETE
  USING (can_edit_content());

-- 7. conteudos_marketing: atualizar DELETE policy
DROP POLICY "Gestores podem deletar conteudos" ON conteudos_marketing;
CREATE POLICY "Editores conteudo podem deletar conteudos"
  ON conteudos_marketing FOR DELETE
  USING (can_edit_content());
```

### Etapa 2: Frontend - ConteudoAcompanhamento.tsx

- Remover import de `useCanAccessAdminPanel`
- Importar `usePermissionChecks` de `useRolePermissions`
- Trocar `const canEdit = useCanAccessAdminPanel()` por:
  ```typescript
  const { canEdit: canEditPerm } = usePermissionChecks();
  const canEdit = canEditPerm('route:conteudo-acompanhamento');
  ```

### Etapa 3: Frontend - App.tsx (ProtectedRoute)

Corrigir o redirecionamento quando rota e bloqueada:

- Em vez de `<Navigate to="/" replace />`, calcular a primeira rota acessivel:
  ```typescript
  const firstAccessible = Object.entries(ROUTE_TO_RESOURCE)
    .find(([path, key]) => canView(key));
  return <Navigate to={firstAccessible?.[0] || '/auth'} replace />;
  ```

### Etapa 4: Frontend - MarketingDashboard.tsx

- Trocar `useCanAccessAdminPanel()` por `useCanEdit('route:marketing-dashboard')` para controle de edicao de investimentos.

---

## Resumo de impacto por role apos as correcoes

| Role | Acesso esperado | Status atual | Apos correcao |
|---|---|---|---|
| MASTER | Tudo | OK | OK |
| DIRETORIA | Tudo | OK | OK |
| GESTOR_COMERCIAL | Tudo | OK | OK |
| SDR | Tudo (view conteudo, edit comercial) | OK | OK |
| CLOSER | Dashboard + Vendas + Fechamento + OTE + Social | OK | OK |
| SOCIAL_SELLING | Apenas Social Selling | Loop infinito no `/` | Redirecionado para `/social-selling` |
| ANALISTA_CONTEUDO | Apenas modulo Conteudo + Marketing Dashboard (view) | Nao edita, loop no `/` | Edita conteudo, redirecionado para `/conteudo/dashboard` |
