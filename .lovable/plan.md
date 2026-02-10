

## Enriquecer Cards do Dashboard com Meta OTE e Percentuais

### O que muda

**1. Card "Volume de Vendas"** -- adicionar meta OTE e barra de progresso

Abaixo do valor principal de volume, vai aparecer em texto menor:
- "Meta: R$ XX.XXX" (valor da meta OTE do mes)
- Uma barra de progresso visual (reutilizando o componente `OteProgressBar` ja existente) mostrando o percentual atingido
- Se nao houver meta cadastrada, nao mostra nada extra

**2. Cards "Valor em Pix", "Valor em Cartao", "Valor em Boleto"** -- mostrar % do total

Cada card vai exibir no subtitle qual percentual aquele valor representa do Volume Total de Vendas. Exemplo:
- "42% do volume total"

---

### Detalhes Tecnicos

**Arquivo: `src/components/ui/stat-card.tsx`**
- Adicionar prop opcional `children?: ReactNode` ao componente `StatCard`
- Renderizar `{children}` abaixo do conteudo principal (depois de subtitle/trend) quando fornecido
- Isso permite inserir conteudo customizado (meta + progress bar) sem quebrar os outros cards

**Arquivo: `src/pages/Dashboard.tsx`**
- Importar `useOteRealized` ou `useOteTeamStats` de `@/hooks/useOteGoals` para buscar a meta do mes atual
- Importar `OteProgressBar` de `@/components/ote/OteProgressBar`
- No card "Volume de Vendas": passar como `children` um bloco com:
  - Texto "Meta: R$ XX.XXX" em tamanho menor (`text-xs text-muted-foreground`)
  - Componente `OteProgressBar` com `height="sm"` e `showMarkers={false}`
  - O calculo de progresso usara: `percentAchieved` vindo do hook OTE (que ja leva em conta os multiplicadores PIX*1.2, CARD*1.0, BOLETO*0.5)
- Nos cards "Valor em Pix", "Valor em Cartao", "Valor em Boleto": calcular o percentual como `(valor / volumeVendas) * 100` e passar como `subtitle` (ex: `"42.3% do volume total"`)

**Nenhuma alteracao no banco de dados** -- os dados de meta OTE ja existem na tabela `ote_goals` e os hooks ja estao implementados.

### Logica de exibicao da meta

- Quando `selectedCloser === 'all'`: mostra a meta total do time (soma de todas as metas) via `useOteTeamStats`
- Quando um closer especifico esta selecionado: mostra a meta individual daquele closer via `useOteRealized`
- Quando nao ha meta cadastrada para o periodo: o card "Volume de Vendas" permanece como esta, sem a secao extra

### Arquivos modificados

1. `src/components/ui/stat-card.tsx` -- adicionar prop `children`
2. `src/pages/Dashboard.tsx` -- integrar meta OTE no card de volume e percentuais nos cards de pagamento

