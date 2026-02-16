

# Correcao: Trigger de updated_at incompativel

## Problema

O erro ao salvar/editar registros e causado por um trigger no banco de dados. A funcao `update_updated_at_column()` tenta definir `NEW.atualizado_em = NOW()`, mas as tabelas `content_daily_logs` e `content_post_items` usam a coluna `updated_at` (em ingles), nao `atualizado_em`.

Isso faz com que **qualquer** operacao de INSERT ou UPDATE nessas tabelas falhe silenciosamente com o erro interno:
```
record "new" has no field "atualizado_em"
```

## Solucao

Criar uma nova funcao de trigger especifica para tabelas que usam `updated_at` e reatribuir os triggers das duas tabelas.

### Migracao SQL

1. Criar funcao `update_updated_at_column_en()` que faz `NEW.updated_at = NOW()`
2. Remover os triggers existentes das duas tabelas
3. Recriar os triggers apontando para a nova funcao

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column_en()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_content_daily_logs_updated_at ON content_daily_logs;
DROP TRIGGER IF EXISTS update_content_post_items_updated_at ON content_post_items;

CREATE TRIGGER update_content_daily_logs_updated_at
  BEFORE UPDATE ON content_daily_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_en();

CREATE TRIGGER update_content_post_items_updated_at
  BEFORE UPDATE ON content_post_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_en();
```

### Melhoria no frontend

Atualizar o `DailyLogModal.tsx` para mostrar a mensagem de erro real no toast em vez de uma mensagem generica, facilitando diagnosticos futuros:

```typescript
} catch (err: any) {
  toast.error(err?.message || 'Erro ao salvar registro');
}
```

### Arquivos afetados

| Acao | Arquivo |
|------|---------|
| Migracao SQL | Nova migracao (nova funcao + recriar triggers) |
| Editar | `src/components/conteudos/DailyLogModal.tsx` (melhorar mensagem de erro) |

Nenhuma outra alteracao e necessaria. Apos a migracao, salvar e editar registros funcionara normalmente.

