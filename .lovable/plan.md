

# Melhorias no Historico de Meu Fechamento

## Resumo

Reformular o card de historico para: (1) mostrar No-Show tambem em porcentagem, (2) exibir todos os dias do periodo com "Sem informacao" quando nao houver registro, (3) adicionar linha de totalizacao/somatorio no final, (4) implementar filtros de periodo (Esta Semana, Este Mes, Ultimos 30 Dias, Ultimo Mes, Todo o Periodo).

---

## 1. Filtros de periodo no historico

Adicionar um `Select` no header do card de historico com as opcoes:

- **Esta Semana**: segunda-feira da semana atual ate hoje
- **Este Mes**: dia 1 do mes atual ate hoje
- **Ultimos 30 Dias**: hoje - 30 dias ate hoje (padrao atual)
- **Ultimo Mes**: dia 1 ao ultimo dia do mes anterior
- **Todo o Periodo**: sem filtro de data (busca tudo)

O estado `periodFilter` controla qual intervalo e passado para o hook `useFechamentos`. As datas `startDate` e `endDate` serao calculadas com `useMemo` baseado no filtro selecionado, usando funcoes do `date-fns` (`startOfWeek`, `startOfMonth`, `subMonths`, `endOfMonth`).

---

## 2. Preencher todos os dias do periodo

Apos receber os dados do hook, gerar um array com **todos os dias** entre `startDate` e `endDate` usando `eachDayOfInterval` do `date-fns`. Para cada dia:

- Se existe um fechamento registrado: exibir os dados normais
- Se nao existe: exibir a linha com "Sem informacao" em texto cinza (`text-muted-foreground`) nas colunas de dados

Dias futuros nao serao incluidos (limitar ao dia atual).

---

## 3. Coluna de No-Show com porcentagem

Alterar a celula de No-Show para exibir o valor absoluto seguido da porcentagem entre parenteses:

```
3 (25%)
```

A porcentagem e calculada como: `no_show / calls_agendadas * 100`. Quando `calls_agendadas` for 0, exibir apenas "0".

---

## 4. Linha de somatorio (totais)

Adicionar um `TableFooter` com uma linha de totais que soma:

- **Realizadas**: soma de todas as `calls_realizadas` do periodo
- **No-Show**: soma de todos os `no_show` + porcentagem geral
- **Agendadas**: soma de todas as `calls_agendadas`

A linha tera fundo diferenciado (`bg-muted/30 font-bold`) e o label "Total" na primeira coluna.

---

## 5. Ordenacao

Manter a ordenacao decrescente (dia mais recente no topo) para facilitar a visualizacao dos registros mais recentes.

---

## Detalhes tecnicos

### Arquivo: `src/pages/MeuFechamento.tsx`

- Novo estado: `periodFilter` (string, default `'ultimos30'`)
- Novo `useMemo` para calcular `startDate`/`endDate` com base no filtro
- Novo `useMemo` para gerar array de todos os dias do intervalo e fazer merge com os fechamentos existentes
- Novo `useMemo` para calcular totais (soma de realizadas, no_show, agendadas)
- Adicionar `Select` no `CardHeader` do historico
- Atualizar `TableHeader` para incluir "No-Show (%)"
- Adicionar `TableFooter` com linha de totais
- Importar `eachDayOfInterval`, `startOfWeek`, `startOfMonth`, `subMonths`, `endOfMonth`, `isFuture`, `isAfter`, `isBefore` do `date-fns`

### Arquivo: `src/hooks/useFechamentos.ts`

- Ajustar para aceitar `endDate` como undefined (sem limite superior) no caso de "Todo o Periodo"

