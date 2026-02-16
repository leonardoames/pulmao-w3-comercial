

# Social Selling: Popup de Registro, Novo Campo "Formularios" e Grafico Funil

## Resumo das mudancas

### 1. Novo campo: `formularios_preenchidos`

Um novo campo numerico sera adicionado a tabela `social_selling` no banco de dados, posicionado logicamente entre "Convites Enviados" e "Agendamentos" no funil.

**Migracao SQL:**
```sql
ALTER TABLE public.social_selling
ADD COLUMN formularios_preenchidos integer NOT NULL DEFAULT 0;
```

### 2. Registro do Dia vira Dialog (popup)

O card "Registro do Dia" sera substituido por um botao na area do PageHeader que abre um Dialog modal. O formulario dentro do dialog tera os mesmos campos atuais + o novo campo "Formularios", com o seletor de data no topo do popup.

### 3. Dashboard superior ganha novo StatCard + taxas atualizadas

O grid de stats passara de 5 para 6 colunas (ou 3x2 em telas menores):

```text
Conversas | Convites | Formularios | Agendamentos | Conv. Form->Agend | Conv. Conversas->Agend
```

### 4. Grafico de Funil global

Abaixo do dashboard e acima do historico, sera adicionado um grafico tipo funil usando Recharts (BarChart horizontal ou vertical) mostrando as etapas:

```text
Conversas Iniciadas -> Convites Enviados -> Formularios Preenchidos -> Agendamentos
```

O grafico respeitara os filtros de periodo e vendedor selecionados.

### 5. Historico ganha coluna "Formularios"

A tabela de historico recebera uma nova coluna entre "Convites" e "Agendamentos".

---

## Detalhes tecnicos

### Banco de dados
- Migracao: `ALTER TABLE public.social_selling ADD COLUMN formularios_preenchidos integer NOT NULL DEFAULT 0;`
- Atualizar CHECK constraint se existente

### Arquivo: `src/schemas/validation.ts`
- Adicionar `formularios_preenchidos` ao `socialSellingSchema` com `z.number().int().min(0).max(10_000)`

### Arquivo: `src/hooks/useSocialSelling.ts`
- Adicionar `formularios_preenchidos` ao interface `SocialSellingEntry`
- Adicionar ao `UpsertSocialSellingInput`
- Adicionar meta diaria ao `SOCIAL_SELLING_GOALS`: `formularios_preenchidos: 20`

### Arquivo: `src/pages/SocialSelling.tsx`
- **Registro do Dia**: Substituir o Card por um `<Dialog>` com botao trigger no PageHeader
  - Mover todo o formulario (inputs + textarea + botao salvar) para dentro do `<DialogContent>`
  - Adicionar campo "Formularios" entre Convites e Agendamentos
  - Manter o seletor de data dentro do dialog
- **Dashboard**: Adicionar StatCard "Formularios" e atualizar calculo de `totalFormularios`
- **Funil**: Adicionar componente de grafico funil usando `BarChart` do Recharts com barras horizontais decrescentes representando cada etapa
- **Historico**: Adicionar coluna "Formularios" na tabela, ajustar colSpan do estado vazio

### Arquivos afetados
1. Migracao SQL (novo campo)
2. `src/schemas/validation.ts`
3. `src/hooks/useSocialSelling.ts`
4. `src/pages/SocialSelling.tsx`

