
# Corrigir erro ao desativar usuarios no Painel Admin

## Problema

O erro `PGRST116: The result contains 0 rows` ocorre porque:

1. A politica RLS da tabela `profiles` para UPDATE permite apenas `auth.uid() = id OR is_master()` -- ou seja, somente o proprio usuario ou um MASTER pode atualizar perfis.
2. Roles como SDR, GESTOR_COMERCIAL e DIRETORIA agora acessam o painel admin, mas nao tem permissao RLS para editar perfis de outros usuarios.
3. O codigo usa `.select().single()` apos o update, que falha quando nenhuma linha e retornada.

## Solucao

### 1. Atualizar politica RLS da tabela `profiles` (migracao SQL)

Alterar a politica de UPDATE para permitir que roles administrativos (MASTER, DIRETORIA, GESTOR_COMERCIAL, SDR) possam editar perfis:

```sql
DROP POLICY "Usuários podem editar perfis" ON public.profiles;

CREATE POLICY "Usuários podem editar perfis"
ON public.profiles
FOR UPDATE
USING (
  (auth.uid() = id) OR can_access_admin_panel()
);
```

### 2. Corrigir o codigo do hook (`src/hooks/useUserManagement.ts`)

Trocar `.select().single()` por `.select().maybeSingle()` no `useUpdateProfile` para evitar o erro PGRST116 quando o resultado e vazio por qualquer motivo.

```typescript
const { data, error } = await supabase
  .from('profiles')
  .update({ nome, email, area, ativo })
  .eq('id', id)
  .select()
  .maybeSingle();
```

---

## Arquivos afetados

| Acao | Arquivo |
|------|---------|
| Criar | Migracao SQL para atualizar RLS de `profiles` |
| Editar | `src/hooks/useUserManagement.ts` (linha 63-68) |
