

# Refinamento Visual Premium do Dashboard Comercial

## Escopo

Aplicar a paleta oficial da marca (#000000, #f47a14, #ffffff, #FEAC69, #FFDCB9) ao dashboard, criando uma experiencia dark elegante com hierarquia visual clara e reducao de ruido.

---

## 1. Paleta de cores (dark mode)

### Arquivo: `src/index.css` -- secao `.dark`

Ajustar as variaveis CSS do dark mode para alinhar com a paleta oficial:

- `--background`: preto puro `0 0% 0%` (#000000)
- `--card`: preto levemente elevado `0 0% 6%` (~#0F0F0F) -- contraste sutil contra o fundo
- `--card-foreground`: branco `0 0% 100%`
- `--foreground`: branco `0 0% 100%`
- `--primary`: laranja #f47a14 convertido para HSL `27 91% 52%`
- `--secondary` e `--muted`: preto elevado `0 0% 10%` -- neutro, sem ruido
- `--muted-foreground`: branco com opacidade simulada `0 0% 55%`
- `--border`: `0 0% 12%` -- bordas muito discretas
- `--accent`: `0 0% 14%`
- `--success`: verde suave e dessaturado `142 50% 40%`
- `--destructive`: vermelho discreto `0 50% 48%`
- `--warning`: substituir amarelo vibrante por laranja secundario #FEAC69 -> `30 98% 71%`
- `--info`: substituir azul vibrante por #FFDCB9 -> `27 100% 87%` (laranja claro)

Isso elimina verde/azul/amarelo vibrantes, priorizando monocromia com variacoes do laranja.

---

## 2. RevenueCard -- card dominante premium

### Arquivo: `src/components/dashboard/RevenueCard.tsx`

- Adicionar classe especial ao Card: `border-primary/30` e um box-shadow sutil em laranja (`shadow-[0_0_20px_rgba(244,122,20,0.08)]`)
- Aumentar padding interno de `p-6` para `p-8`
- Titulo "Receita Total" com `text-xs uppercase tracking-widest` (label discreto)
- Valor principal: manter `text-4xl font-bold` mas adicionar `text-primary` para destacar em laranja
- Separar visualmente titulo/valor/subtexto/barra/breakdown com espacamentos maiores (`mt-2`, `mt-6`, `mt-5`)
- Barra de distribuicao: substituir cores `bg-success`/`bg-info`/`bg-warning` por variacoes do laranja:
  - Pix: `bg-[#f47a14]` (laranja principal)
  - Cartao: `bg-[#FEAC69]` (laranja secundario)
  - Boleto: `bg-[#FFDCB9]` (laranja claro)
- Barra: reduzir altura de `h-3` para `h-2` e aumentar border-radius
- Breakdown: melhorar alinhamento com grid `grid-cols-3` e dots usando as mesmas cores do laranja
- Remover gap-0.5 entre segmentos da barra para visual mais limpo

---

## 3. StatCard -- cards secundarios elegantes

### Arquivo: `src/components/ui/stat-card.tsx`

- Classe `.stat-card` no CSS: remover `border` visivel, usar `border-border/50` mais sutil
- Reduzir sombra para quase imperceptivel: `shadow-none hover:shadow-sm`
- Manter `rounded-xl` consistente
- Variantes de cor: reduzir saturacao dos backgrounds (de `bg-success/5` para `bg-success/[0.03]`, etc.)
- Icone: background mais sutil (`bg-muted/50` ao inves de `bg-muted`)

---

## 4. Cards gerais e tipografia

### Arquivo: `src/components/ui/card.tsx`

- Reduzir borda: `border-border/50` ao inves de `border`
- Sombra: `shadow-none` (dark mode nao precisa de sombra forte)

### Arquivo: `src/components/dashboard/SectionLabel.tsx`

- Adicionar um pequeno indicador laranja antes do titulo: `before:content-[''] before:w-1 before:h-4 before:bg-primary before:rounded-full`
- Linha divisoria: `bg-border/50` mais sutil

### Arquivo: `src/pages/Dashboard.tsx`

- Cards de destaques (Top Closer Dia, etc.): substituir `bg-primary/10 border-primary/20` por `bg-muted/50 border-border/50` -- visual neutro
- Manter apenas o Top Closer do Dia com sutil destaque laranja
- Cards de No-Show: badges de porcentagem com cores mais suaves
- Ranking: manter medal colors mas reduzir backgrounds para `bg-muted/30`

---

## 5. Regra de hierarquia

A unica metrica com destaque visual forte (cor laranja no valor + borda glow) sera a **Receita Total**. Todos os demais cards terao fundo neutro, bordas discretas e valores em branco. Labels sempre menores e com menor opacidade que os numeros.

---

## Arquivos afetados

1. `src/index.css` -- paleta dark mode
2. `src/components/dashboard/RevenueCard.tsx` -- card premium dominante
3. `src/components/ui/stat-card.tsx` -- cards secundarios refinados
4. `src/components/ui/card.tsx` -- base de card mais limpa
5. `src/components/dashboard/SectionLabel.tsx` -- indicador visual
6. `src/pages/Dashboard.tsx` -- ajustes de cor nos destaques

