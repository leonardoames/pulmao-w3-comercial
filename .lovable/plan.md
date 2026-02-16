

# Integrar Caixa do Mes dentro do RevenueCard

## O que muda

No header do RevenueCard, ao lado do valor de Receita Total, sera adicionada uma informacao secundaria mostrando o valor em caixa e o percentual que ele representa do faturamento. O layout sera algo como:

```text
Receita Total
R$ 292.208,00  /  R$ 110.400,00 em caixa (38%)
12 vendas no periodo
```

O valor de caixa e o percentual terao hierarquia menor (fonte menor, cor mais discreta) para nao competir com o destaque principal.

## Detalhes tecnicos

### Arquivo: `src/components/dashboard/RevenueCard.tsx`
- Adicionar duas novas props: `caixaDoMes` (number) e `proporcaoCaixa` (number)
- No header, apos o valor principal (text-4xl), adicionar na mesma linha um separador `/` e o valor de caixa com percentual em tipografia menor (text-lg ou text-base, text-muted-foreground)
- Layout flexbox com `items-baseline` para alinhar os dois valores

### Arquivo: `src/pages/Dashboard.tsx`
- Passar as novas props `caixaDoMes` e `proporcaoCaixa` ao RevenueCard usando `stats?.caixaDoMes` e `stats?.proporcaoCaixa`
- Remover o Bloco 3 "Metas e Caixa" (SectionLabel + grid com StatCard de Caixa e OteDashboardCard)
- Mover o OteDashboardCard para dentro do Bloco 1, ao lado dos cards de Ticket Medio e Faturamento por Call (empilhados na coluna lateral)

