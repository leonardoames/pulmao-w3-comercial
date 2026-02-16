

# Unificacao Visual: Dashboards de Conteudo e Marketing seguindo o padrao Comercial + Ajuste de Cores

## Resumo

Alinhar os 3 dashboards (Comercial, Conteudo, Marketing) com a mesma estrutura de layout, hierarquia visual e componentes. Atualizar a paleta de cores do tema para as cores exatas fornecidas.

---

## 1. Ajuste de Cores no Tema

### Arquivo: `src/index.css`

Atualizar as variaveis CSS `:root` e `.dark` para refletir as cores exatas:

| Token | Cor hex | HSL (aproximado) | Uso |
|-------|---------|-------------------|-----|
| `--primary` | #f57914 | 27 92% 52% | Botoes, destaques |
| `--primary-foreground` | #ffffff | 0 0% 100% | Texto sobre primary (ja correto) |
| `--secondary` | #feab67 | 27 98% 70% | Elementos secundarios |
| `--secondary-foreground` | #000000 | 0 0% 0% | Texto sobre secondary |
| `--accent` | #ffd8b8 | 27 100% 86% | Fundos de destaque suave |
| `--accent-foreground` | #000000 | 0 0% 0% | Texto sobre accent |

Aplicar ajustes equivalentes no modo `.dark` (manter o mesmo hue, ajustar levemente a luminosidade para dark mode).

---

## 2. Padronizar Dashboard de Conteudo

### Arquivo: `src/pages/ConteudoDashboard.tsx`

Alinhar com a estrutura do Dashboard Comercial:

**Header:**
- Usar `PageHeader` com filtros como children (mesmo padrao do Comercial)
- Adicionar filtros completos: Hoje / Ontem / 7 dias / Este mes / 30 dias / Personalizado (usando `DateFilter` de `useDashboard`)
- Adicionar calendar popover para range personalizado
- Mover filtro de responsavel para dentro do PageHeader

**Linha 1 -- KPIs (com SectionLabel):**
- Adicionar `SectionLabel title="Producao"` antes dos KPIs
- Substituir Cards crus por `StatCard` com icones e variants consistentes
- Posts publicados: `StatCard` com subtitle "Meta: X | Y% atingido"
- Stories: idem
- Posts agendados: `StatCard` simples
- Seguidores ganhos: `StatCard` com mini-cards internos (manter logica atual mas usando StatCard como wrapper)

**Linha 2 -- Graficos (com SectionLabel):**
- Adicionar `SectionLabel title="Evolucao"` antes dos graficos
- Manter graficos existentes, ajustar spacing para `gap-6 mb-10`

**Linha 3 -- Tabela (com SectionLabel):**
- Adicionar `SectionLabel title="Historico"` antes da tabela
- Manter tabela existente

**Spacing geral:**
- `gap-6` entre cards (nao `gap-4`)
- `mb-10` entre secoes (nao `mb-0`)

---

## 3. Padronizar Dashboard de Marketing

### Arquivo: `src/pages/MarketingDashboard.tsx`

Ja usa `PageHeader`, `StatCard` e filtros completos. Ajustes:

**Adicionar SectionLabels:**
- `SectionLabel title="Investimento e Agendamentos"` antes da Row 1
- `SectionLabel title="Custos e Vendas"` antes da Row 2
- `SectionLabel title="Retorno"` antes da Row 3

**Spacing:**
- Mudar `mb-6` entre secoes para `mb-10` (consistente com Comercial)

---

## 4. Arquivos Afetados

| Acao | Arquivo |
|------|---------|
| Editar | `src/index.css` (cores do tema) |
| Reescrever | `src/pages/ConteudoDashboard.tsx` (layout + componentes) |
| Editar | `src/pages/MarketingDashboard.tsx` (SectionLabels + spacing) |

---

## 5. Sequencia

1. Atualizar cores em `index.css`
2. Refatorar `ConteudoDashboard.tsx`
3. Ajustar `MarketingDashboard.tsx`

