

# Corrigir tela de alteracao de senha travada para Otto

## Problema

Quando o administrador reseta a senha do Otto, ele faz login com a senha temporaria e o sistema redireciona para `/alterar-senha`. Porem, o componente `ProtectedRoute` que envolve essa rota exige que **role e permissoes** sejam carregados antes de renderizar qualquer coisa. Isso causa um travamento na tela de loading porque:

1. O `ProtectedRoute` espera `roleLoading` e `permLoading` finalizarem
2. Essas queries dependem de dados do banco (`user_roles`, `role_permissions`)
3. Se houver qualquer lentidao ou falha nessas queries, o usuario fica preso no spinner
4. A tela de troca de senha nao precisa de nenhuma verificacao de permissao -- so precisa saber que o usuario esta autenticado

## Solucao

Criar um `ProtectedRoute` simplificado para a rota `/alterar-senha` que **so verifica autenticacao** (se existe `user`), sem esperar role ou permissoes.

## Mudancas

### `src/App.tsx`

- Trocar o `ProtectedRoute` da rota `/alterar-senha` por uma verificacao simplificada que so checa se o usuario esta logado
- Pode ser feito de duas formas:
  - Criar um componente `AuthOnlyRoute` que so espera `loading` do `useAuth` e verifica `user`
  - Ou remover o `routePath` e adicionar logica no `ProtectedRoute` para pular a espera de role/permissoes quando `routePath === '/alterar-senha'`

A abordagem escolhida sera criar um pequeno componente `AuthOnlyRoute` inline no `App.tsx`:

```text
AuthOnlyRoute
  |
  v
useAuth() -> loading? -> spinner
  |
  v
user existe? -> NAO -> redireciona /auth
  |
  v
SIM -> renderiza children (ChangePassword)
```

Nenhuma consulta a `user_roles` ou `role_permissions` sera feita. A tela carrega imediatamente apos o login.

### Arquivo modificado

| Arquivo | Mudanca |
|---|---|
| `src/App.tsx` | Criar componente `AuthOnlyRoute` e usar na rota `/alterar-senha` no lugar de `ProtectedRoute` |

## Por que isso resolve

- Otto faz login com senha temporaria
- JWT contem `must_change_password: true`
- `ProtectedRoute` de qualquer outra rota redireciona para `/alterar-senha`
- `/alterar-senha` agora usa `AuthOnlyRoute` que so verifica `user` -- renderiza imediatamente
- Otto troca a senha, o flag e removido, e ele segue para o dashboard normalmente

