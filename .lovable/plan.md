# Atualizacao do Dashboard de Conteudo

## Resumo

Refatorar `ConteudoDashboard.tsx` com 6 mudancas: graficos no topo com linhas de meta, grafico de seguidores mostrando variacao diaria, alertas visuais nos KPIs, e remocao de redundancias.

---

## 1. Novo layout (ordem dos blocos)

1. **Resultado** (movidos para o topo)
2. **Operacional**
3. **Historico** (tabela)

---

## 2. Grafico de Posts e Stories (linha, nao barras)

- Trocar `BarChart` por `LineChart`
- 3 linhas: Posts publicados, Stories, Posts agendados
- Gerar dados para **todos os dias do periodo** (preencher dias sem registro com 0)
- Adicionar 2 linhas tracejadas horizontais de meta:
  - Meta posts/dia = 6 (usando `ReferenceLine`)
  - Meta stories/dia = 10 (usando `ReferenceLine`)

### Geracao de todos os dias

```typescript
// Iterar do startDate ao endDate, para cada dia buscar log ou usar 0
const allDays = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) });
const logMap = new Map(sortedLogs.map(l => [l.date, l]));
const chartData = allDays.map(day => {
  const key = format(day, 'yyyy-MM-dd');
  const log = logMap.get(key);
  return {
    date: format(day, 'dd/MM'),
    posts: log?.posts_published_count ?? 0,
    stories: log?.stories_done_count ?? 0,
    agendados: log?.posts_scheduled_count ?? 0,
  };
});
```

---

## 3. Grafico de Seguidores (variacao diaria, nao total)

- Mostrar **variacao dia a dia** (diferenca em relacao ao dia anterior)
- Duas linhas no mesmo grafico: Leo e W3
- Primeiro dia do periodo mostra 0 (sem referencia anterior)
- Remover dados de seguidores do card de KPIs (evitar redundancia)

```typescript
const followersChartData = allDays.map((day, i) => {
  const key = format(day, 'yyyy-MM-dd');
  const log = logMap.get(key);
  const prevLog = i > 0 ? logMap.get(format(allDays[i-1], 'yyyy-MM-dd')) : null;
  return {
    date: format(day, 'dd/MM'),
    leo: log && prevLog ? log.followers_leo - prevLog.followers_leo : 0,
    w3: log && prevLog ? log.followers_w3 - prevLog.followers_w3 : 0,
  };
});
```

---

## 4. KPI Cards (3 cards, sem seguidores)

Remover o 4o card de "Seguidores Ganhos" (informacao ja esta no grafico).

Cards restantes:

1. **Posts Publicados** - valor, meta do periodo, % atingido
2. **Stories Realizados** - valor, meta do periodo, % atingido
3. **Posts Agendados** - apenas valor

---

## 5. Alertas visuais nos KPIs


| Condicao                  | Estilo                                       |
| ------------------------- | -------------------------------------------- |
| Resultado < 75% da meta   | `variant="warning"` + borda laranja/vermelha |
| Resultado >= 100% da meta | `variant="success"` + badge verde            |
| Entre 75% e 99%           | `variant="primary"` (padrao)                 |


Logica para escolher variant:

```typescript
const getVariant = (percent: number) => {
  if (percent >= 100) return 'success';
  if (percent < 75) return 'warning';
  return 'primary';
};
```

Adicionar badge textual no subtitle:

- "Abaixo da meta" (< 75%)
- "Meta atingida!" (>= 100%)

---

## 6. Detalhes tecnicos

### Importacoes adicionais

- `ReferenceLine` de recharts
- `eachDayOfInterval` de date-fns

### Arquivo afetado


| Acao   | Arquivo                           |
| ------ | --------------------------------- |
| Editar | `src/pages/ConteudoDashboard.tsx` |


Nenhum outro arquivo precisa ser alterado.