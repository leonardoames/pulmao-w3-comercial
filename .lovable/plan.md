
# Ajustes visuais no Dashboard de Conteudo

## Resumo

Tres ajustes no `ConteudoDashboard.tsx` e um no `StatCard`: tags pill para status de meta, formato compacto de meta nos KPIs, legendas com acumulados nos graficos, e correcao de padding.

---

## 1. KPI Cards -- Novo formato

**Valor principal com meta ao lado:**
- Exibir como: `12 / 180` (valor / meta) em tamanho grande
- Posts Agendados: apenas o valor (sem meta)

**Porcentagem abaixo:**
- Linha com `67% da meta`

**Tag pill para status:**
- Pill verde com texto "Meta atingida!" se >= 100%
- Pill laranja/vermelha com texto "Abaixo da meta" se < 75%
- Pill azul/neutra com texto "Dentro da meta" se entre 75% e 99%

Para isso, o `StatCard` precisa aceitar um novo prop `badge` (ReactNode) ou alterar o `subtitle` para receber JSX. A abordagem mais limpa: parar de usar `subtitle` string e montar o conteudo diretamente no `ConteudoDashboard` usando o `children` ou customizando o StatCard para aceitar `badge`.

**Solucao tecnica:** Adicionar prop opcional `badge` ao StatCard que renderiza abaixo do subtitle. No dashboard, passar a pill como badge.

---

## 2. Graficos -- Remover padding excessivo

O `ChartContainer` tem `className="h-48 w-full"` mas o problema de padding vem do `YAxis` padrao do Recharts.

Correcao:
- Adicionar `margin={{ left: -20, right: 10 }}` no `LineChart` para compensar o padding do YAxis
- Ou usar `width` fixo no `YAxis` com valor menor: `<YAxis width={30} />`

---

## 3. Legendas com acumulados nos graficos

### Grafico Posts/Stories
Adicionar legenda customizada abaixo do grafico mostrando:
- Cor + "Posts Publicados: 45 no periodo"
- Cor + "Stories: 120 no periodo"  
- Cor + "Agendados: 15 no periodo"

### Grafico Seguidores
Adicionar legenda customizada abaixo do grafico mostrando:
- Cor + "@leo: +230 no periodo"
- Cor + "@w3: +85 no periodo"

Usar componente customizado de legenda (div com flex, bolinha de cor e texto) em vez do `Legend` padrao do Recharts para ter controle total do conteudo.

---

## 4. Arquivos afetados

| Acao | Arquivo |
|------|---------|
| Editar | `src/components/ui/stat-card.tsx` (adicionar prop `badge`) |
| Editar | `src/pages/ConteudoDashboard.tsx` (KPIs, graficos, legendas) |

---

## 5. Detalhes tecnicos

### StatCard -- nova prop

```typescript
badge?: ReactNode; // Renderiza abaixo do subtitle
```

### KPI no Dashboard

```tsx
<StatCard
  title="Posts Publicados"
  value={`${stats.totalPosts} / ${stats.postsMeta}`}
  subtitle={`${stats.postsPercent.toFixed(0)}% da meta`}
  badge={
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1',
      percent >= 100 ? 'bg-success/15 text-success' :
      percent < 75 ? 'bg-warning/15 text-warning' :
      'bg-primary/15 text-primary'
    )}>
      {percent >= 100 ? 'Meta atingida!' : percent < 75 ? 'Abaixo da meta' : 'Dentro da meta'}
    </span>
  }
/>
```

### Legenda customizada nos graficos

```tsx
<div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
  <div className="flex items-center gap-1.5">
    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
    <span>Posts Publicados: {stats.totalPosts} no período</span>
  </div>
  ...
</div>
```

### Padding do grafico

```tsx
<LineChart data={postsChartData} margin={{ left: -20, right: 10, top: 5, bottom: 5 }}>
  <YAxis width={35} ... />
```
