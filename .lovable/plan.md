
# Versão Responsiva para Mobile — Pulmão W3

## Diagnóstico

O app usa um layout fixo com sidebar lateral de 256px (`w-64`) e um `main` com `pl-64` hardcoded. Em telas menores que esse tamanho, todo o conteúdo fica escondido atrás da sidebar ou cortado. Além disso, `PageHeader` empilha título e ações de forma que em mobile os filtros de data ficam apertados ou somem para fora da tela.

---

## Estratégia geral

A abordagem mais limpa é transformar a sidebar em um **menu hamburger deslizante** no mobile, mantendo o comportamento de sidebar fixa no desktop. Isso é feito em 3 camadas:

1. **`AppSidebar`** — esconder em mobile, mostrar como overlay quando aberto
2. **`AppLayout`** — remover o `pl-64` fixo em mobile, adicionar topbar mobile com botão hamburger
3. **`PageHeader`** — empilhar título e ações verticalmente em mobile

---

## Mudanças detalhadas

### 1. `src/components/layout/AppSidebar.tsx`

- Receber uma prop `isOpen` e `onClose` para controle externo no mobile
- No mobile (`md` breakpoint): sidebar usa `translate-x` para deslizar por cima do conteúdo como overlay
- No desktop: comportamento atual mantido (`fixed left-0`)
- Adicionar overlay escuro clicável para fechar no mobile

```text
Mobile:  [hamburger topbar] → [sidebar overlay desliza da esquerda]
Desktop: [sidebar fixa 256px à esquerda] → sem alteração
```

### 2. `src/components/layout/AppLayout.tsx`

- Gerenciar estado `sidebarOpen` (useState)
- No mobile: mostrar **topbar** no topo com logo + botão hamburger (Menu icon)
- No desktop: topbar não aparece, sidebar fixa como antes
- `main`: trocar `pl-64` por `md:pl-64` para que em mobile ocupe tela cheia
- `p-8` do conteúdo vira `p-4 md:p-8` para respeitar margens menores

### 3. `src/components/ui/page-header.tsx`

- Trocar `flex items-center justify-between` por `flex flex-col gap-4 md:flex-row md:items-center md:justify-between`
- Isso faz título e ações empilharem verticalmente em mobile

### 4. `src/pages/Dashboard.tsx`

- A barra de filtros de data (botões Hoje/Ontem/7dias…) já tem `flex-wrap`, mas o `PageHeader` precisa ser responsivo primeiro
- Adicionar `overflow-x-auto` na div dos filtros para que em mobile role horizontalmente

### 5. `src/pages/Vendas.tsx`

- A tabela usa colunas fixas: adicionar `overflow-x-auto` no wrapper do `Card` que contém a `Table`
- Cards de KPI já usam `grid-cols-1 md:grid-cols-3` — OK

### 6. `src/pages/MeuFechamento.tsx`

- Já corrigido com `grid-cols-1 sm:grid-cols-3` — OK

### 7. `src/pages/MarketingDashboard.tsx`

- Os filtros no `PageHeader` precisam do fix do PageHeader
- A seção de investimento (`flex items-end gap-4 flex-wrap`) já funciona razoavelmente

### 8. `src/pages/SocialSelling.tsx` / `ConteudoDashboard.tsx`

- Beneficiam automaticamente do fix do `PageHeader` e `AppLayout`

---

## Arquivos a modificar

| Arquivo | Mudança principal |
|---|---|
| `src/components/layout/AppLayout.tsx` | Adicionar topbar mobile + gerenciar estado sidebar + ajustar padding |
| `src/components/layout/AppSidebar.tsx` | Suportar prop `isOpen`/`onClose` + comportamento overlay mobile |
| `src/components/ui/page-header.tsx` | Layout empilhado em mobile |
| `src/pages/Vendas.tsx` | Scroll horizontal na tabela |
| `src/pages/Dashboard.tsx` | Scroll horizontal nos filtros |
| `src/pages/MarketingDashboard.tsx` | Scroll horizontal nos filtros |
| `src/pages/ConteudoDashboard.tsx` | Scroll horizontal nos filtros |
| `src/pages/SocialSelling.tsx` | Scroll horizontal nos filtros |

---

## Resultado esperado

- Em telas ≥ 768px (md): comportamento atual preservado, sem alteração visual
- Em telas < 768px: topbar com hamburger no topo, sidebar abre como gaveta sobreposta, conteúdo ocupa 100% da largura, filtros roláveis horizontalmente
- Formulários (MeuFechamento, Vendas) já empilham corretamente em mobile

---

## Ponto de atenção

As tabelas grandes (Vendas, histórico de fechamento) não podem ser comprimidas — serão envoltas em `overflow-x-auto` para rolar horizontalmente, que é o padrão esperado em mobile.
