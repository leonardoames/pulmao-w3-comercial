

# Modulo Conteudo -- Novo Menu, Dashboard e Acompanhamento Diario

## Resumo

Criar uma nova secao "Conteudo" na sidebar, mover paginas existentes do Marketing para la, e implementar duas novas paginas completas: **Dashboard de Conteudo** (KPIs + graficos) e **Acompanhamento Diario** (checklist operacional com template pre-populado). Requer duas novas tabelas no banco de dados, novos tipos, hooks e paginas.

---

## 1. Banco de Dados -- Novas Tabelas e Enums

### 1.1 Enums

```sql
CREATE TYPE public.content_item_type AS ENUM ('reels', 'feed', 'stories', 'youtube', 'other');
CREATE TYPE public.content_item_status AS ENUM ('pendente', 'feito', 'agendado');
CREATE TYPE public.content_item_platform AS ENUM ('instagram', 'tiktok', 'youtube', 'other');
```

### 1.2 Tabela `content_daily_logs`

Registro diario agregado de metricas de conteudo. Uma linha por dia.

```sql
CREATE TABLE public.content_daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  responsible_user_id uuid NOT NULL,
  followers_gained integer NOT NULL DEFAULT 0,
  posts_published_count integer NOT NULL DEFAULT 0,
  posts_scheduled_count integer NOT NULL DEFAULT 0,
  stories_done_count integer NOT NULL DEFAULT 0,
  youtube_videos_published_count integer NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(date)
);

ALTER TABLE public.content_daily_logs ENABLE ROW LEVEL SECURITY;
```

RLS:
- SELECT: todos autenticados
- INSERT/UPDATE: apenas roles MASTER, DIRETORIA, GESTOR_COMERCIAL (gestores) -- usando `can_access_admin_panel()`
- DELETE: apenas MASTER

### 1.3 Tabela `content_post_items`

Itens granulares do checklist diario.

```sql
CREATE TABLE public.content_post_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  type content_item_type NOT NULL DEFAULT 'other',
  label text NOT NULL DEFAULT '',
  status content_item_status NOT NULL DEFAULT 'pendente',
  platform content_item_platform NOT NULL DEFAULT 'instagram',
  is_required boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_post_items ENABLE ROW LEVEL SECURITY;
```

RLS:
- SELECT: todos autenticados
- INSERT/UPDATE: gestores (can_access_admin_panel())
- DELETE: gestores

### 1.4 Trigger para updated_at

Reutilizar a funcao `update_updated_at_column()` existente, criando triggers para ambas as tabelas.

---

## 2. Sidebar -- Reorganizacao

### Arquivo: `src/components/layout/AppSidebar.tsx`

Reorganizar `navGroups` para ter 3 grupos:

**Comercial** (sem mudanca):
- Dashboard `/`
- Vendas `/vendas`
- Meu Fechamento `/meu-fechamento`
- Meta OTE `/meta-ote`
- Social Selling `/social-selling`

**Conteudo** (novo grupo, absorve itens do Marketing):
- Dashboard de Conteudo `/conteudo/dashboard` (NOVO)
- Acompanhamento Diario `/conteudo/acompanhamento` (NOVO)
- Controle de Conteudos `/conteudo/controle` (movido de `/marketing/conteudos`)
- Gerador Twitter `/conteudo/twitter` (movido de `/marketing/twitter`)
- Agentes IA `/conteudo/ai` (movido de `/marketing/ai`)

**Marketing** (reduzido):
- Dashboard `/marketing/dashboard` (permanece)

Icones minimalistas: `BarChart3`, `CalendarCheck`, `FileText`, `PenTool`, `Sparkles`.

---

## 3. Rotas -- App.tsx

### Arquivo: `src/App.tsx`

- Adicionar imports das novas paginas
- Adicionar rotas `/conteudo/dashboard`, `/conteudo/acompanhamento`
- Adicionar redirects das rotas antigas `/marketing/conteudos` -> `/conteudo/controle`, `/marketing/twitter` -> `/conteudo/twitter`, `/marketing/ai/*` -> `/conteudo/ai/*`
- Mover rotas existentes para novos paths

---

## 4. Tipos TypeScript

### Novo arquivo: `src/types/content.ts`

```typescript
export type ContentItemType = 'reels' | 'feed' | 'stories' | 'youtube' | 'other';
export type ContentItemStatus = 'pendente' | 'feito' | 'agendado';
export type ContentItemPlatform = 'instagram' | 'tiktok' | 'youtube' | 'other';

export interface ContentDailyLog {
  id: string;
  date: string;
  responsible_user_id: string;
  followers_gained: number;
  posts_published_count: number;
  posts_scheduled_count: number;
  stories_done_count: number;
  youtube_videos_published_count: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ContentPostItem {
  id: string;
  date: string;
  type: ContentItemType;
  label: string;
  status: ContentItemStatus;
  platform: ContentItemPlatform;
  is_required: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

Incluir tambem constantes para labels em portugues e o template de itens obrigatorios diarios.

---

## 5. Hooks

### Novo arquivo: `src/hooks/useContentTracking.ts`

- `useContentDailyLogs(startDate, endDate)` -- busca logs diarios
- `useUpsertContentDailyLog()` -- insert/update log
- `useContentPostItems(date)` -- busca itens de um dia
- `useCreateContentPostItem()` -- cria item
- `useUpdateContentPostItem()` -- atualiza status/label
- `useDeleteContentPostItem()` -- remove item adicional
- `useAutoGenerateRequiredItems(date, userId)` -- gera itens obrigatorios para um dia se ainda nao existem

Todos os hooks usam `supabase.from('content_daily_logs' as any)` e `supabase.from('content_post_items' as any)` para contornar tipagem ate a regeneracao automatica.

---

## 6. Pagina: Dashboard de Conteudo

### Novo arquivo: `src/pages/ConteudoDashboard.tsx`

**Layout de cima para baixo:**

1. **Header + Filtros**: Titulo "Dashboard de Conteudo", subtitulo, e botoes de periodo (7D, 30D, Mes, Personalizado) no estilo laranja ja usado no Marketing Dashboard
2. **KPI Cards** (grid 3x2):
   - Publicacoes no mes
   - Seguidores ganhos
   - Publicacoes agendadas
   - Stories realizados
   - Meta de publicacoes (6/dia com media e % da meta)
   - Videos no YouTube publicados
3. **Grafico de Crescimento** (Recharts LineChart, largura total) -- "Crescimento de Seguidores"
4. **Graficos lado a lado** (grid 2 colunas):
   - "Publicacoes por dia" (BarChart)
   - "Stories por dia" (BarChart)
5. **Lista compacta** (opcional) -- ultimas entradas do log

Metricas calculadas via aggregacao dos `content_daily_logs` no periodo selecionado.

---

## 7. Pagina: Acompanhamento Diario

### Novo arquivo: `src/pages/ConteudoAcompanhamento.tsx`

**Layout de cima para baixo:**

1. **Header**: Titulo "Acompanhamento Diario", subtitulo, seletor de data (default hoje), botao "Adicionar conteudo" (laranja)
2. **Contadores resumo** (linha horizontal compacta): Posts feitos hoje, Stories feitos hoje, YouTube hoje, Agendados hoje
3. **Secao "Obrigatorios do dia"**: Card com os itens do template pre-populados. Cada linha:
   - Badge de tipo (Reels/Feed/Stories/YouTube)
   - Label editavel
   - Tag de plataforma
   - Toggle de status (Pendente -> Feito -> Agendado) com cores
   - Indicador "Obrigatorio"
4. **Secao "Conteudo adicional"**: Mesmo estilo, com botao "Adicionar item" que abre um form inline ou modal simples
5. **Campos de metricas manuais**: Seguidores ganhos, notas do dia -- salvos no `content_daily_logs`

**Template obrigatorio diario** (auto-gerado):
- Perfil Leonardo Ames:
  - Post 1 (Reels): Corte do podcast -- Autoridade/viral
  - Post 2 (Reels): Viral
  - Post 3 (Feed estatico ou carrossel): Frase estilo Twitter -- Viral/Educativo
  - Post 4 (Reels): Documentario dia a dia do e-comm (bastidores)
  - Post 5 (Feed estatico ou carrossel): Frase estilo Twitter -- Viral/Educativo
  - Stories: Min 10x/dia (Lifestyle + e-commerce)
- Perfil W3 Educacao:
  - Post dia par: Generico
  - Post dia impar: Depoimento (cliente ou Leo)

**Permissoes**: Gestores/Admin podem editar. Outros visualizam em modo somente leitura (campos desabilitados visualmente).

---

## 8. Permissoes

- Leitura (SELECT) em ambas as tabelas: todos autenticados
- Escrita (INSERT/UPDATE/DELETE): apenas MASTER, DIRETORIA, GESTOR_COMERCIAL via `can_access_admin_panel()`
- No frontend: hook `useCanAccessAdminPanel()` controla se campos sao editaveis ou read-only

---

## 9. Arquivos Afetados (Resumo)

| Acao | Arquivo |
|------|---------|
| Migracao SQL | `supabase/migrations/...` (enums + 2 tabelas + RLS + triggers) |
| Novo tipo | `src/types/content.ts` |
| Novo hook | `src/hooks/useContentTracking.ts` |
| Nova pagina | `src/pages/ConteudoDashboard.tsx` |
| Nova pagina | `src/pages/ConteudoAcompanhamento.tsx` |
| Editar sidebar | `src/components/layout/AppSidebar.tsx` |
| Editar rotas | `src/App.tsx` |

---

## 10. Sequencia de Implementacao

1. Migracao SQL (tabelas, enums, RLS, triggers)
2. Tipos TypeScript (`src/types/content.ts`)
3. Hooks de dados (`src/hooks/useContentTracking.ts`)
4. Sidebar reorganizada (`AppSidebar.tsx`)
5. Rotas atualizadas (`App.tsx`)
6. Pagina Dashboard de Conteudo (`ConteudoDashboard.tsx`)
7. Pagina Acompanhamento Diario (`ConteudoAcompanhamento.tsx`)

