
# Padronizar KPIs do Dashboard de Conteudo com o estilo do Dashboard Comercial

## Resumo

Substituir os `StatCard` de Posts Publicados e Stories Realizados por cards customizados que seguem exatamente o mesmo padrao visual do `RevenueCard` do Dashboard Comercial, com o valor principal em destaque grande, a meta ao lado em texto menor separado por "/", e a porcentagem abaixo.

---

## Mudanca Visual

**De (atual com StatCard):**
```
Posts Publicados
12 / 180
67% da meta
[Abaixo da meta]
```

**Para (padrao RevenueCard):**
```
POSTS PUBLICADOS
12  / 180 de meta (67%)
[Abaixo da meta]
```

Layout HTML seguindo o padrao do comercial:
```html
<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Posts Publicados</p>
<div class="flex items-baseline gap-3 flex-wrap">
  <p class="text-4xl font-bold tracking-tight text-primary">12</p>
  <span class="text-sm text-muted-foreground font-medium">/ 180 de meta (67%)</span>
</div>
<div class="mt-2">
  <span class="pill...">Abaixo da meta</span>
</div>
```

---

## Arquivo afetado

| Acao | Arquivo |
|------|---------|
| Editar | `src/pages/ConteudoDashboard.tsx` (linhas 306-336) |

---

## Detalhes tecnicos

### Cards de Posts Publicados e Stories Realizados

Substituir os dois `StatCard` por `Card` customizado com a mesma estrutura do `RevenueCard`:

1. Titulo em `text-xs font-semibold uppercase tracking-widest text-muted-foreground`
2. Valor principal em `text-4xl font-bold tracking-tight text-primary`
3. Meta e porcentagem em `text-sm text-muted-foreground font-medium` ao lado do valor, na mesma baseline
4. Pill de status abaixo com `mt-2`
5. Manter borda colorida conforme variant (warning/success/primary) usando classes condicionais no Card

### Card de Posts Agendados

Manter como `StatCard` simples (sem meta, sem pill), apenas o valor.

### Logica de cores da borda do card

Aplicar classes condicionais no `Card` wrapper:
- `border-success/30` se >= 100%
- `border-warning/30` se < 75%
- `border-primary/30` entre 75-99%
