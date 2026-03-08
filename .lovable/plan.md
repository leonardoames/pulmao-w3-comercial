

# Melhorias na Dashboard Comercial

7 mudanças na Dashboard sem alterar lógica de cálculo nem estrutura de dados.

---

## 1. Unificar Meta OTE + Meta Mensal

**Arquivo:** `src/pages/Dashboard.tsx`

- Remover o `OteDashboardCard` separado (linhas 215-223) e o bloco Meta Mensal (linhas 226-297)
- Criar inline um único card "Metas do Mês" com:
  - Header: título + select de closers (reutilizar o existente do OteDashboardCard)
  - Linha 1: "Meta OTE do Time" — valor/meta + barra 6px com markers 50/70/100/120% + % à direita
  - Linha 2: "Meta Mensal" — volume vendas / meta mensal + barra + % à direita
  - % colorido semanticamente: verde se >= esperado proporcional, amarelo 60-99%, vermelho <60%
  - Micro label "do esperado" (11px, opacity 50%) abaixo do %
  - Rodapé: botão "Ver detalhes" com `border: 1px solid #333, color: #F5F5F5, hover bg #2a2a2a`
- Os hooks `useOteRealized`, `useOteTeamStats`, `useTvMetaMensal` já estão disponíveis; chamar diretamente na Dashboard

## 2. Origem dos Leads — barras de proporção

**Arquivo:** `src/components/dashboard/OrigemLeadCard.tsx`

- Calcular `maxQuantidade = Math.max(...byOrigem.map(o => o.quantidade))`
- Entre o nome e os valores, adicionar barra horizontal:
  - Track: 4px height, border-radius pill, bg `rgba(255,255,255,0.06)`
  - Fill: largura proporcional `(quantidade / maxQuantidade) * 100%`, cor = bullet color
- "Sem origem definida": exibir com bullet cinza + tooltip via `HoverCard` ("Vendas sem canal de origem registrado. Edite as vendas para corrigir")

## 3. Performance Comercial — cores semânticas nos ícones

**Arquivo:** `src/pages/Dashboard.tsx` (linhas 300-330)

Passar `variant` customizado para cada StatCard de performance:
- Taxa de Conversão: `variant="success"` (ícone verde #22C55E)
- Vendas Realizadas: `variant="primary"` (ícone laranja #F97316) — já é default
- Calls Realizadas: ícone azul — passar cor inline via wrapper ou adicionar `variant="info"` ao StatCard
- % No-Show Total: `variant="destructive"` (ícone vermelho #EF4444) — já está

**Arquivo:** `src/components/ui/stat-card.tsx` — adicionar variante `info` com cor `#0EA5E9`

## 4. % das Metas — cor semântica

Incluído no item 1 acima. Helper function:
```ts
function getMetaColor(actual: number, expected: number) {
  const ratio = expected > 0 ? actual / expected : 1;
  if (ratio >= 1) return '#22C55E';
  if (ratio >= 0.6) return '#FBBF24';
  return '#EF4444';
}
```

## 5. Ranking de Closers — corrigir espaço vazio

**Arquivo:** `src/pages/Dashboard.tsx` (linhas 337-520)

- Quando `noShowByCloser` estiver vazio ou closer individual selecionado, o grid de 2 colunas deixa espaço vazio
- Solução: renderizar Ranking em `col-span-2` quando não há coluna 2, ou usar layout condicional `lg:grid-cols-${hasSecondColumn ? 2 : 1}`

## 6. Filtros do Header — reorganizar

**Arquivo:** `src/pages/Dashboard.tsx` (linhas 110-180)

- O `ShareDashboardDialog` já está no children do PageHeader (linha 179), que renderiza em row
- Verificar que o botão Compartilhar é o último item na linha e não aparece abaixo
- O PageHeader já usa `flex-row` em `sm:`, confirmar que todos os elementos ficam em linha única

## 7. Timestamp de Atualização

**Arquivo:** `src/pages/Dashboard.tsx`

- Adicionar estado `lastUpdatedAt` que registra `new Date()` quando queries completam (`dataUpdatedAt` do react-query)
- Renderizar abaixo do PageHeader: `● Atualizado às HH:MM`
- Ponto pulsante: cor baseada em `minutesSinceUpdate`:
  - <5min: verde + `animate-pulse`
  - 5-15min: amarelo
  - >15min: cinza
- onClick: `queryClient.invalidateQueries()` para refetch manual

---

## Arquivos a modificar

| Arquivo | Mudanças |
|---|---|
| `src/pages/Dashboard.tsx` | Items 1, 3, 5, 6, 7 |
| `src/components/ui/stat-card.tsx` | Item 3 (variante info) |
| `src/components/dashboard/OrigemLeadCard.tsx` | Item 2 |

O `OteDashboardCard.tsx` não será mais importado na Dashboard (mas permanece disponível para outras páginas).

