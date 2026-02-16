

# Adicionar flags "Enviado ao Financeiro" e "Enviado ao CS" nas Vendas

## Resumo

Dois novos campos booleanos serao adicionados a tabela `vendas` e refletidos no formulario de cadastro/edicao e na listagem com icones que exibem tooltip ao passar o mouse.

## 1. Banco de dados

Migracao SQL para adicionar as duas colunas:

```sql
ALTER TABLE public.vendas
ADD COLUMN enviado_financeiro boolean NOT NULL DEFAULT false,
ADD COLUMN enviado_cs boolean NOT NULL DEFAULT false;
```

## 2. Tipos e validacao

### `src/types/crm.ts`
- Adicionar `enviado_financeiro: boolean` e `enviado_cs: boolean` na interface `Venda`

### `src/schemas/validation.ts`
- Adicionar `enviado_financeiro: z.boolean().optional()` e `enviado_cs: z.boolean().optional()` ao `vendaSchema` e campos opcionais que ja existem

### `src/hooks/useVendas.ts`
- Adicionar `enviado_financeiro` e `enviado_cs` nas interfaces `CreateVendaInput` e `UpdateVendaInput` como campos opcionais booleanos

## 3. Formulario de cadastro/edicao

### `src/pages/Vendas.tsx`

Na secao de checkboxes (linha ~320), adicionar dois novos checkboxes ao lado de "Pago" e "Contrato Assinado":

- "Enviado ao Financeiro"
- "Enviado ao CS"

Incluir os valores no objeto `data` do `handleSubmit`.

## 4. Flags na tabela com Tooltip

Na coluna "Flags" da listagem (linha ~489), adicionar dois novos icones com `Tooltip` do Radix:

- **Enviado ao Financeiro**: icone `Banknote` (ou `Landmark`) com tooltip "Enviado ao Financeiro"
- **Enviado ao CS**: icone `HeadphonesIcon` (ou `UserCheck`) com tooltip "Enviado ao CS"

Os icones existentes de "Pago" e "Contrato Assinado" tambem serao convertidos para usar `Tooltip` ao inves de `title` nativo, mantendo consistencia.

Cada flag tera um circulo de fundo sutil com cor diferenciada (usar variacoes de cor neutras conforme paleta atual).

## Arquivos afetados

1. Migracao SQL (2 colunas novas)
2. `src/types/crm.ts`
3. `src/schemas/validation.ts`
4. `src/hooks/useVendas.ts`
5. `src/pages/Vendas.tsx`

