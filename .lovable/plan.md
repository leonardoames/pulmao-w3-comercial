
# Redesign do Dashboard Comercial

## Objetivo
Reorganizar o dashboard em 3 blocos logicos com hierarquia visual clara, card de Receita Total dominante com grafico de distribuicao, e visual de SaaS moderno.

---

## Estrutura Final do Dashboard

### Header (mantido como esta)
- Titulo, filtros de data, filtro de closer, botoes TV/Compartilhar

### BLOCO 1 -- Receita (destaque visual)

**Card "Receita Total" (largura total ou 2/3)**
- Valor total em destaque grande (text-4xl ou maior)
- Subtitulo com quantidade de vendas
- Barra segmentada horizontal mostrando proporcao Pix / Cartao / Boleto com cores distintas (verde, azul, amber)
- Abaixo da barra: 3 colunas inline mostrando cada meio de pagamento com valor + percentual
- Sem icones redundantes neste card

**Ao lado (1/3 da linha), 2 cards empilhados:**
- Ticket Medio
- Faturamento por Call

Layout: `grid lg:grid-cols-3`, card principal com `lg:col-span-2`

### BLOCO 2 -- Performance Comercial

Grid 4 colunas com cards menores e limpos:
- Taxa de Conversao (variant success se > 15%, default caso contrario)
- Vendas Realizadas
- Calls Realizadas
- % No-Show (variant destructive)

Titulo de secao "Performance Comercial" acima do grid.

### BLOCO 3 -- Metas e Caixa

Grid 2 colunas:
- Caixa do Mes (card com subtitulo mostrando % do volume)
- Meta OTE (componente OteDashboardCard existente)

Titulo de secao "Metas e Caixa" acima do grid.

### Secao inferior (mantida)
- Destaques (rankings rapidos)
- No-Show por Closer (condicional)
- Ranking de Closers

---

## Detalhes Tecnicos

### Arquivos a criar
1. **`src/components/dashboard/RevenueCard.tsx`** -- Novo componente para o card dominante de Receita Total
   - Props: volumeVendas, totalVendas, valorPix, valorCartao, valorBoleto
   - Barra segmentada customizada (div com 3 segmentos coloridos proporcionais)
   - 3 sub-items com icone de bolinha colorida + label + valor + percentual
   - Tipografia maior para o valor principal (text-4xl font-bold)

2. **`src/components/dashboard/SectionLabel.tsx`** -- Componente simples para titulos de secao
   - Texto em caps ou semibold com separador visual sutil

### Arquivos a editar
3. **`src/pages/Dashboard.tsx`** -- Reescrita da area de KPIs
   - Remover as 3 rows atuais de StatCards (linhas 134-210)
   - Substituir pelos 3 blocos logicos descritos acima
   - Mover OteDashboardCard do bloco inferior para o Bloco 3
   - Manter secao de Destaques, No-Show e Ranking como estao

4. **`src/index.css`** -- Adicionar classe `.revenue-bar-segment` para a barra segmentada (transicoes suaves)

### Cores da barra segmentada
- Pix: `bg-success` (verde -- dinheiro na conta)
- Cartao: `bg-info` (azul)
- Boleto: `bg-warning` (amber -- pendente)

### Mudancas de UX
- Remover icones repetitivos de DollarSign dos cards individuais de pagamento (agora estao dentro do card unificado)
- Reduzir variantes de cor nos StatCards -- usar `default` para a maioria, cor apenas onde indica status
- Adicionar labels de secao para separar visualmente os 3 blocos
- Melhorar espacamento com `mb-10` entre blocos em vez de `mb-6`
