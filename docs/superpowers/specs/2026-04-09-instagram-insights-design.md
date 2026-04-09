# Design: Instagram Graph API — Insights Automáticos

**Data:** 2026-04-09  
**Projeto:** pulmao-w3-comercial  
**Status:** Aprovado

---

## Objetivo

Integrar a Instagram Graph API para sincronizar automaticamente métricas das contas @leo e @w3, eliminando entrada manual de followers e adicionando insights por post ao módulo de conteúdo.

---

## Escopo

### O que será feito
1. 3 novas tabelas no banco: `instagram_accounts`, `instagram_daily_metrics`, `instagram_post_insights`
2. System User token armazenado no Supabase Vault
3. Edge Function `instagram-sync` que busca dados da API e persiste no banco
4. Cron diário às 07:00 (Brasília) via pg_cron
5. Botão "Sincronizar Instagram" no ConteudoDashboard
6. ConteudoDashboard atualizado para ler de `instagram_daily_metrics`
7. Nova seção "Posts Recentes" no ConteudoDashboard com métricas por post
8. ConteudoAcompanhamento: campos de followers preenchidos automaticamente

### O que NÃO será feito
- Publicação de posts
- Gerenciamento de comentários
- Hashtag tracking
- Business Discovery

---

## Pré-requisitos (setup manual, fora do código)

1. **Meta Developer App** criado em developers.facebook.com
2. **Permissões aprovadas:** `instagram_business_basic`, `instagram_business_manage_insights`
3. **System User** criado no Meta Business Manager com acesso às duas contas
4. **System User Access Token** gerado (não expira)
5. **Instagram User IDs** das duas contas (`/<username>?fields=id` via Graph API)

---

## Banco de Dados

### Migration: `20260409010000_instagram-integration.sql`

#### Tabela `instagram_accounts`
```sql
CREATE TABLE public.instagram_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  instagram_user_id TEXT NOT NULL UNIQUE,
  account_label TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed das duas contas (IDs obtidos via GET /<username>?fields=id após setup do token)
-- Preencher os instagram_user_id corretos antes de rodar esta migration
INSERT INTO instagram_accounts (username, instagram_user_id, account_label)
VALUES
  ('CONFIRMAR_USERNAME_LEO', 'CONFIRMAR_ID_LEO', 'Leo'),
  ('CONFIRMAR_USERNAME_W3', 'CONFIRMAR_ID_W3', 'W3');
```

#### Tabela `instagram_daily_metrics`
```sql
CREATE TABLE public.instagram_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES instagram_accounts(id),
  date DATE NOT NULL,
  followers_count INTEGER NOT NULL DEFAULT 0,
  media_count INTEGER NOT NULL DEFAULT 0,
  reach INTEGER NOT NULL DEFAULT 0,
  profile_views INTEGER NOT NULL DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(account_id, date)
);
```

#### Tabela `instagram_post_insights`
```sql
CREATE TABLE public.instagram_post_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES instagram_accounts(id),
  instagram_media_id TEXT NOT NULL UNIQUE,
  media_type TEXT NOT NULL,
  permalink TEXT,
  caption TEXT,
  published_at TIMESTAMPTZ,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  reach INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  profile_visits INTEGER NOT NULL DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### RLS
```sql
ALTER TABLE instagram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_post_insights ENABLE ROW LEVEL SECURITY;

-- Leitura para todos autenticados
CREATE POLICY "read_instagram_accounts" ON instagram_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_instagram_daily_metrics" ON instagram_daily_metrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_instagram_post_insights" ON instagram_post_insights FOR SELECT TO authenticated USING (true);

-- Write apenas via service_role (edge function)
```

#### Cron
```sql
SELECT cron.schedule(
  'instagram-daily-sync',
  '0 10 * * *',  -- 07:00 Brasília = 10:00 UTC
  $$SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/instagram-sync',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  )$$
);
```

---

## Edge Function: `instagram-sync`

### Localização
`supabase/functions/instagram-sync/index.ts`

### Fluxo
1. Busca System User token do Supabase Vault (`INSTAGRAM_SYSTEM_USER_TOKEN`)
2. Busca contas ativas de `instagram_accounts`
3. Para cada conta:
   a. `GET /<IG_USER_ID>?fields=followers_count,media_count` → upsert em `instagram_daily_metrics`
   b. `GET /<IG_USER_ID>/insights?metric=reach,profile_views&period=day` → complementa `instagram_daily_metrics`
   c. `GET /<IG_USER_ID>/media?fields=id,media_type,timestamp,caption,permalink&limit=30` → lista posts recentes
   d. Para cada post: `GET /<IG_MEDIA_ID>/insights?metric=likes,comments,shares,saves,reach,views,profile_visits` → upsert em `instagram_post_insights`
4. Retorna `{ success: true, accounts_synced: N, posts_synced: N }`

### Variáveis de ambiente necessárias
- `INSTAGRAM_SYSTEM_USER_TOKEN` — no Supabase Vault
- Versão da API hardcoded na edge function: `v25.0`

---

## Frontend

### Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/pages/ConteudoDashboard.tsx` | Ler de `instagram_daily_metrics`, adicionar botão sync e seção Posts Recentes |
| `src/components/conteudos/DailyLogModal.tsx` | Auto-preencher followers_leo e followers_w3 |
| `src/hooks/useInstagram.ts` | Novo hook para queries das tabelas Instagram |

### Novos hooks em `useInstagram.ts`
```typescript
useInstagramDailyMetrics(startDate, endDate)  // Query instagram_daily_metrics
useInstagramPostInsights(accountId?, limit?)   // Query instagram_post_insights
useInstagramSync()                             // Mutation: invoke edge function
useLatestFollowersCount()                      // Última contagem por conta (para DailyLogModal)
```

### ConteudoDashboard — mudanças
- Cards `followers_leo` e `followers_w3` leem de `instagram_daily_metrics` (mais recente)
- Novo card: **Engajamento médio** = (likes + comments + saves) / total posts no período
- Botão **"Sincronizar Instagram"** — chama `useInstagramSync()`, mostra spinner, toast de resultado
- Nova seção **"Posts Recentes"** — tabela: thumbnail via permalink, tipo, data, likes, comentários, alcance, salvamentos

### DailyLogModal — mudanças
- Ao abrir, `useLatestFollowersCount()` preenche automaticamente os campos de followers com o valor mais recente do Instagram
- Usuário ainda pode editar manualmente se necessário

---

## Fluxo Completo

```
Meta Business Manager → System User Token
                              ↓
                    Supabase Vault (INSTAGRAM_SYSTEM_USER_TOKEN)
                              ↓
pg_cron (07:00 diário) → instagram-sync Edge Function
                              ↓
                    instagram_accounts (quais contas buscar)
                              ↓
                    Instagram Graph API v25.0
                              ↓
          ┌─────────────────────────────────────┐
          ↓                                     ↓
instagram_daily_metrics              instagram_post_insights
          ↓                                     ↓
          └──────────────────┬──────────────────┘
                             ↓
                   ConteudoDashboard (leitura)
                   DailyLogModal (auto-fill)
```
