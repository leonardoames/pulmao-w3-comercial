

# Reorganizar seção de Destaques

## Layout proposto

```text
+------------------------------+------------------------------+
|                              |  Destaques (Top Closer Dia,  |
|   Ranking de Closers         |  Semana, Conversao, NoShow)  |
|   (50% da largura)           +------------------------------+
|                              |  No-Show por Closer          |
|                              |  (condicional)               |
+------------------------------+------------------------------+
```

- Grid principal `lg:grid-cols-2` com gap
- Coluna esquerda: Card "Ranking de Closers" (aparece primeiro)
- Coluna direita: dois cards empilhados verticalmente
  - Card "Destaques" (Top Closer Dia, Semana, Top Conversao, Menor No-Show)
  - Card "No-Show por Closer" (condicional, so aparece quando selectedCloser === 'all')

## Detalhes tecnicos

### Arquivo: `src/pages/Dashboard.tsx`

Substituir as 3 secoes separadas (Destaques card, No-Show card, Ranking card) por um unico grid de 2 colunas:

1. Mover o card "Ranking de Closers" (linhas 292-340) para a **primeira posicao** (coluna esquerda)
2. Criar uma `div` na coluna direita contendo:
   - Card "Destaques" (linhas 204-252) -- ajustar grid interno de 2x2 para caber na metade da largura
   - Card "No-Show por Closer" (linhas 256-289, condicional) -- ajustar grid interno para `grid-cols-1` ja que o espaco sera menor
3. Remover o wrapper `grid grid-cols-1 gap-6 mb-6` do card de destaques atual
4. Manter o `SectionLabel title="Destaques"` acima de tudo

