

# Nova Seção: Social Selling

## Resumo
Criar uma nova página completa de **Social Selling** com formulário diário, histórico filtrado, gráfico de evolução e indicadores de meta. A estrutura segue os mesmos padrões já usados em "Meu Fechamento" e "Dashboard".

---

## 1. Banco de Dados

Criar a tabela `social_selling` com as seguintes colunas:

| Coluna | Tipo | Detalhes |
|--------|------|----------|
| id | uuid | PK, default gen_random_uuid() |
| data | date | NOT NULL |
| closer_user_id | uuid | NOT NULL |
| conversas_iniciadas | integer | NOT NULL, default 0 |
| convites_enviados | integer | NOT NULL, default 0 |
| agendamentos | integer | NOT NULL, default 0 |
| observacoes | text | nullable |
| criado_em | timestamptz | default now() |
| atualizado_em | timestamptz | default now() |

- Constraint UNIQUE em (data, closer_user_id) para upsert
- Trigger de update em `atualizado_em`
- RLS: mesmas políticas de `fechamentos` (SELECT para todos autenticados, INSERT/UPDATE restrito ao próprio closer ou gestores)

---

## 2. Metas Diárias (fixas)

| Métrica | Meta/dia |
|---------|----------|
| Conversas Iniciadas | 100 |
| Convites Enviados | 30 |
| Agendamentos | 10 |

Serão constantes no código (sem tabela extra).

---

## 3. Arquivos a Criar/Editar

### Novos arquivos:
- **`src/pages/SocialSelling.tsx`** -- Página principal com:
  - Formulário de registro diário (data picker, 3 campos numéricos, observações, botão salvar)
  - Filtros de período (hoje, ontem, 7 dias, este mês, 30 dias, personalizado) reutilizando o padrão do Dashboard
  - Tabela de histórico filtrado por período
  - Cards de resumo com progresso vs meta (total no período / dias no período vs meta diária)
  - Gráfico de linha (recharts) mostrando as 3 métricas dia a dia com linhas de meta

- **`src/hooks/useSocialSelling.ts`** -- Hook com:
  - `useSocialSellingEntries(filters)` -- busca registros filtrados
  - `useSocialSellingEntry(userId, date)` -- busca registro específico para o form
  - `useUpsertSocialSelling()` -- mutation de upsert

### Arquivos editados:
- **`src/components/layout/AppSidebar.tsx`** -- Adicionar item "Social Selling" na navegação
- **`src/App.tsx`** -- Adicionar rota `/social-selling`
- **`src/types/crm.ts`** -- Adicionar interface `SocialSelling`
- **`src/schemas/validation.ts`** -- Adicionar schema zod para validação

---

## 4. Layout da Página

```text
+--------------------------------------------------+
| Social Selling         [Seletor Closer] (gestores)|
|                                                    |
| [Hoje] [Ontem] [7 dias] [Este mês] [30d] [Custom] |
+--------------------------------------------------+
|                                                    |
| +-- Formulário ------+  +-- Resumo do Período ---+ |
| | Data: [dd/mm/yyyy]  |  | Conversas: 450/500    | |
| | Conversas:  [___]   |  | ████████░░ 90%        | |
| | Convites:   [___]   |  | Convites:  120/150    | |
| | Agendamentos:[___]  |  | ████████░░ 80%        | |
| | Obs: [__________]   |  | Agendamentos: 40/50   | |
| | [Salvar]            |  | ████████░░ 80%        | |
| +---------------------+  +-----------------------+ |
|                                                    |
| +-- Gráfico de Evolução -------------------------+ |
| | (LineChart com 3 séries + 3 linhas de meta)     | |
| +------------------------------------------------+ |
|                                                    |
| +-- Histórico ------------------------------------+ |
| | Data | Conversas | Convites | Agendamentos      | |
| | ...                                             | |
| +------------------------------------------------+ |
+--------------------------------------------------+
```

---

## 5. Detalhes Técnicos

- **Upsert** com `onConflict: 'data,closer_user_id'` (mesmo padrão de fechamentos)
- **Permissões**: Closer registra apenas para si; gestores/MASTER podem selecionar qualquer closer
- **Gráfico**: Recharts `LineChart` com 3 `Line` (conversas, convites, agendamentos) + 3 `ReferenceLine` horizontais nas metas (100, 30, 10)
- **Filtros**: Reutilizar `DateFilter` e `getDateRange` de `useDashboard.ts`
- **Cards de meta**: Calculam a média diária no período e comparam com a meta fixa

