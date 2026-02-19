

# Corrigir acesso do Otto (ANALISTA_CONTEUDO) e alinhar permissoes

## Diagnostico

Otto tem o role `ANALISTA_CONTEUDO` e no banco de dados de teste as permissoes estao corretas (`can_view: true`, `can_edit: true` para `route:conteudo-acompanhamento`). Porem, o botao "Novo registro" na pagina de Acompanhamento Diario nao aparece para ele.

A causa mais provavel e que o banco de dados de producao (live) nao possui os registros de `role_permissions` para o role `ANALISTA_CONTEUDO`, pois esses dados foram inseridos manualmente via Painel Admin e podem nao ter sido replicados ao publicar (a publicacao sincroniza schema, nao dados).

## Solucao

### 1. Migracdo de seed para garantir permissoes padrao

Criar uma migracao SQL que insere as permissoes padrao para todos os roles, usando `ON CONFLICT DO NOTHING` para nao sobrescrever configuracoes existentes. Isso garante que ao publicar, o banco de producao receba as permissoes base.

Permissoes que serao garantidas para `ANALISTA_CONTEUDO`:

| Recurso | can_view | can_edit |
|---|---|---|
| route:conteudo-dashboard | true | true |
| route:conteudo-acompanhamento | true | true |
| route:conteudo-controle | true | true |
| route:conteudo-twitter | true | true |
| route:conteudo-ai | true | true |
| route:marketing-dashboard | true | false |
| Todas as rotas comerciais | false | false |

Tambem serao garantidos os registros para os demais roles (SDR, CLOSER, SOCIAL_SELLING) caso faltem.

### 2. Adicionar fallback de permissao por role no codigo

Atualmente, se a tabela `role_permissions` estiver vazia para um role, o usuario nao ve nada. Vamos adicionar um fallback inteligente no hook `usePermissionChecks`:

- Se as permissoes foram carregadas mas estao vazias para o role, aplicar permissoes padrao baseadas no role do usuario
- `ANALISTA_CONTEUDO` automaticamente tem acesso de visualizacao e edicao a todas as rotas de conteudo
- Isso protege contra o cenario onde os dados de seed nao existem no banco

### 3. Revisao do fluxo completo

Nenhuma alteracao necessaria nos seguintes pontos (ja estao corretos):

- RLS: funcao `can_edit_content()` ja inclui `ANALISTA_CONTEUDO`
- Sidebar: filtra itens via `canView()` que lera as permissoes corretamente
- ProtectedRoute: aguarda carregamento de permissoes antes de renderizar

## Arquivos modificados

| Arquivo | Mudanca |
|---|---|
| Nova migracao SQL | Seed de permissoes padrao para todos os roles com `ON CONFLICT DO NOTHING` |
| `src/hooks/useRolePermissions.ts` | Adicionar mapa de permissoes padrao por role como fallback quando a tabela estiver vazia |

## Detalhes tecnicos do fallback

```text
usePermissionChecks()
    |
    v
Permissoes carregadas do banco?
    |               |
   SIM             NAO (vazio)
    |               |
    v               v
Usar dados       Usar DEFAULT_PERMISSIONS[role]
do banco         como fallback
    |               |
    +------+--------+
           |
           v
    canView / canEdit
```

O mapa `DEFAULT_PERMISSIONS` sera definido no proprio hook, espelhando exatamente a configuracao que ja existe no banco de teste. O Painel Admin continuara podendo sobrescrever qualquer permissao -- o fallback so atua quando nao ha registros na tabela para aquele role.

