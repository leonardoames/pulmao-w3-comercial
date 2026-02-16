

# Refatoracao: Dashboard de Conteudo -- Novas Metas, Seguidores Calculados e Layout Operacional

## Resumo

Reescrever a pagina `ConteudoDashboard.tsx` com novo layout em 3 linhas, logica de metas por periodo (posts 6/dia, stories 10/dia), calculo de seguidores ganhos por diferenca (ultimo - primeiro registro), e tabela resumo com filtro por responsavel.

---

## 1. Logica de Calculo (mudancas principais)

### Metas por periodo
- Meta de Posts = dias_no_periodo x 6
- Meta de Stories = dias_no_periodo x 10
- Realizado = soma dos valores no periodo
- % atingido = (realizado / meta) x 100
- Post agendado NAO conta como realizado

### Seguidores ganhos (calculados, nao manuais)
- Seguidores @leo ganhos = `followers_leo` do ultimo registro - `followers_leo` do primeiro registro do periodo
- Seguidores @w3 ganhos = idem com `followers_w3`
- Se faltar registro no primeiro dia, usar o primeiro registro disponivel no periodo

### Dias no periodo
- Contar dias entre startDate e endDate (inclusive), nao apenas dias com registros

---

## 2. Layout -- 3 Linhas

### Linha 1 -- KPIs principais (grid 4 colunas)

**Card 1: Posts publicados**
- Valor principal: total de `posts_published_count` no periodo
- Subtexto: "Meta: {meta} | {percent}% atingido"

**Card 2: Stories realizados**
- Valor principal: total de `stories_done_count`
- Subtexto: "Meta: {meta} | {percent}% atingido"

**Card 3: Posts agendados**
- Apenas valor total de `posts_scheduled_count`
- Sem meta

**Card 4: Seguidores ganhos**
- Dois mini-cards internos lado a lado:
  - "@leo: +{valor}"
  - "@w3: +{valor}"

Remover: card "Meta de publicacoes 6/dia" isolado, card "Seguidores ganhos" com valor manual, card "Videos no YouTube" como KPI principal.

### Linha 2 -- Graficos (grid 2 colunas)

**Esquerda: Posts e Stories por dia**
- Grafico de barras com duas series (posts e stories) lado a lado

**Direita: Crescimento de seguidores**
- Grafico de linhas com duas series: Leo e W3
- Mostrando `followers_leo` e `followers_w3` ao longo dos dias

### Linha 3 -- Tabela resumo

Tabela com historico do periodo filtrado:
| Data | Posts publicados | Posts agendados | Stories | YouTube | Seguidores Leo | Seguidores W3 | Responsavel |

- Filtro por responsavel (Select dropdown)
- Ordenacao por data decrescente
- Dados vindos dos mesmos `content_daily_logs`

---

## 3. Detalhes Tecnicos

### Arquivo: `src/pages/ConteudoDashboard.tsx`

Reescrever completamente com:

1. Hook `useContentDailyLogs(startDate, endDate, responsibleFilter)` ja existente
2. Adicionar state para `responsibleFilter` (dropdown na topbar ou na tabela)
3. Calcular `daysInPeriod` usando `differenceInDays(endDate, startDate) + 1`
4. Calcular seguidores ganhos por diferenca entre primeiro e ultimo log (ordenados por data)
5. Manter filtros de periodo (7D, 30D, Mes) na topbar
6. Graficos com Recharts (BarChart para posts/stories, LineChart para seguidores)
7. Tabela usando componentes `Table` existentes
8. Importar `RESPONSIBLE_OPTIONS` de `types/content.ts`

### Estilo visual
- Cards minimalistas (sem icones grandes, numeros dominantes)
- Paleta: fundo preto, cards com bg-card, laranja para destaques
- Subtextos em muted-foreground
- Tabela com bordas sutis, sem peso visual

---

## 4. Arquivos Afetados

| Acao | Arquivo |
|------|---------|
| Reescrever | `src/pages/ConteudoDashboard.tsx` |

Nenhum outro arquivo precisa ser alterado. Os hooks e tipos existentes ja suportam os dados necessarios.

