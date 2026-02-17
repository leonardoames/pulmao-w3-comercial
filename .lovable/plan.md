

# Corrigir carregamento infinito do app

## Problema
O `ProtectedRoute` em `App.tsx` aguarda tres flags: `loading`, `roleLoading`, e `permLoading`. O `permLoading` vem de `usePermissionChecks()` (linha 140):

```text
isLoading: !permissions && !isMaster
```

O bug: quando a sessao do usuario esta expirada/invalida (token stale no localStorage), o Supabase retorna o `user` do cache local (nao-nulo), mas as queries ao banco falham. Isso causa:

1. `user` nao e nulo -- ProtectedRoute NAO redireciona para /auth
2. Query `user_roles` falha ou retorna null -- `role = undefined`
3. `useMyPermissions` fica desabilitada (`enabled: !!role` = false) -- `permissions = undefined`
4. `isMaster = false`
5. `isLoading = !undefined && !false = true` -- PARA SEMPRE

Mesmo sem sessao expirada, qualquer falha na query de roles causa o mesmo efeito.

## Solucao

### Arquivo: `src/hooks/useRolePermissions.ts`

Alterar `usePermissionChecks` para usar os estados reais do react-query (`isFetched`, `isError`) em vez de verificar apenas se `data` existe:

```typescript
export function usePermissionChecks() {
  const myPerms = useMyPermissions();
  const roleQuery = useCurrentUserRole();
  const isMaster = roleQuery.data?.role === 'MASTER';

  const permissions = myPerms.data;

  const canView = (resourceKey: string): boolean => {
    if (isMaster) return true;
    if (!permissions) return false;
    const perm = permissions.find(p => p.resource_key === resourceKey);
    return perm?.can_view ?? false;
  };

  const canEdit = (resourceKey: string): boolean => {
    if (isMaster) return true;
    if (!permissions) return false;
    const perm = permissions.find(p => p.resource_key === resourceKey);
    return perm?.can_edit ?? false;
  };

  // Carregando somente enquanto queries estao realmente em progresso
  // Se role nao carregou ainda -> loading
  // Se role carregou e e MASTER -> pronto
  // Se role carregou, nao e MASTER, e permissions ainda nao carregou -> loading
  // Se role falhou ou retornou null (sem role) -> pronto (sem permissoes)
  const isLoading =
    roleQuery.isLoading ||
    (!isMaster && !!roleQuery.data?.role && !myPerms.isFetched);

  return { canView, canEdit, isLoading };
}
```

### Logica explicada:

- `roleQuery.isLoading` -- esperando a role do usuario
- Quando role carregou:
  - Se MASTER: `isLoading = false` (acesso total)
  - Se tem outra role: espera `myPerms.isFetched` (query completou, com sucesso ou erro)
  - Se role e null (usuario sem role): `!!null?.role = false`, `isLoading = false` (sem permissoes, app redireciona para /auth ou mostra sem acesso)

Nenhum outro arquivo precisa ser alterado.
