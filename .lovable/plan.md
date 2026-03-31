

## Ajuste OTE: Boleto ate 5x conta como 1x

### Regra atual
Todo boleto usa multiplicador 0.5 no calculo de OTE.

### Nova regra
- Boleto com **ate 5 parcelas**: multiplicador **1.0** (mesmo que cartao)
- Boleto com **mais de 5 parcelas**: multiplicador **0.5** (mantém)

### Arquivos a alterar

**1. `src/types/ote.ts`**
- Adicionar constante `OTE_BOLETO_THRESHOLD = 5`
- Alterar `calculateOteRealized` para receber dois parametros de boleto: `boletoShortSum` (<=5x, mult 1.0) e `boletoLongSum` (>5x, mult 0.5)

**2. `src/hooks/useOteGoals.ts`**
- Na agregacao de vendas (linha ~204), separar boleto em dois buckets baseado em `quantidade_parcelas_boleto <= 5`
- Passar os dois valores para `calculateOteRealized`

**3. `src/pages/OteCalculadora.tsx`**
- Ajustar a calculadora para refletir a nova logica (se aplicavel ao simulador)

**4. Corrigir build errors existentes**
- `useCloserNiveis.ts:63` - remover propriedade `nivel_closer` inexistente
- `OteCalculadora.tsx:340` - remover prop `title` do icone Lucide
- `Vendas.tsx:271` - corrigir tipo incompleto no `CreateVendaInput`

