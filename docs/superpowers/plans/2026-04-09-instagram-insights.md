# Instagram Insights Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sincronizar métricas das contas Instagram @leonardo_ames e @w3 automaticamente via Instagram Graph API, exibindo insights por post e followers no ConteudoDashboard.

**Architecture:** Edge Function `instagram-sync` busca dados via Meta Graph API v25.0 com System User token (armazenado no Supabase Vault). pg_cron dispara diariamente às 07:00 BRT. Frontend lê de 3 novas tabelas via hooks TanStack Query. Botão manual de sync disponível no dashboard.

**Tech Stack:** Deno (Edge Function), Meta Graph API v25.0, Supabase (pg_cron + pg_net), React 18, TanStack Query v5, TypeScript

---

## File Map

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `supabase/migrations/20260409010000_instagram-integration.sql` | Criar | Tabelas + RLS + seed + pg_cron |
| `supabase/functions/instagram-sync/index.ts` | Criar | Edge function de sync |
| `src/hooks/useInstagram.ts` | Criar | Queries e mutation para tabelas Instagram |
| `src/pages/ConteudoDashboard.tsx` | Modificar | Seção Instagram + botão sync |
| `src/components/conteudos/DailyLogModal.tsx` | Modificar | Auto-fill followers |

---

## Task 1: Migration SQL — tabelas + RLS + seed + cron

**Files:**
- Create: `supabase/migrations/20260409010000_instagram-integration.sql`

- [ ] **Step 1: Criar o arquivo de migration**

```sql
-- =============================================
-- Instagram Integration
-- =============================================

-- Tabela de contas do Instagram
CREATE TABLE public.instagram_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  instagram_user_id TEXT NOT NULL UNIQUE,
  account_label TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de métricas diárias por conta
CREATE TABLE public.instagram_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  followers_count INTEGER NOT NULL DEFAULT 0,
  media_count INTEGER NOT NULL DEFAULT 0,
  reach INTEGER NOT NULL DEFAULT 0,
  profile_views INTEGER NOT NULL DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(account_id, date)
);

-- Tabela de insights por post
CREATE TABLE public.instagram_post_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
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

-- RLS
ALTER TABLE instagram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_post_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_instagram_accounts" ON instagram_accounts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "read_instagram_daily_metrics" ON instagram_daily_metrics
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "read_instagram_post_insights" ON instagram_post_insights
  FOR SELECT TO authenticated USING (true);

-- Service role pode escrever (usado pela edge function)
CREATE POLICY "service_write_instagram_accounts" ON instagram_accounts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_write_instagram_daily_metrics" ON instagram_daily_metrics
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_write_instagram_post_insights" ON instagram_post_insights
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed: preencher instagram_user_id corretos após obter o token
-- Para obter: GET https://graph.facebook.com/v25.0/me/accounts?access_token=TOKEN
-- Depois: GET https://graph.facebook.com/v25.0/{page_id}?fields=instagram_business_account&access_token=TOKEN
INSERT INTO public.instagram_accounts (username, instagram_user_id, account_label)
VALUES
  ('leonardo_ames', 'FILL_IN_INSTAGRAM_USER_ID_LEO', 'Leo'),
  ('FILL_IN_W3_USERNAME', 'FILL_IN_INSTAGRAM_USER_ID_W3', 'W3')
ON CONFLICT (instagram_user_id) DO NOTHING;

-- pg_cron: sync diário às 07:00 BRT (10:00 UTC)
-- ATENÇÃO: Se este cron falhar (current_setting retornar NULL), configure
-- o schedule manualmente via Supabase Dashboard > Edge Functions > instagram-sync > Schedules
-- e defina o cron como "0 10 * * *"
-- ATENÇÃO: Requer extensões pg_cron e pg_net habilitadas no Supabase Dashboard
-- (Database > Extensions > habilitar pg_cron e pg_net)
DO $$
DECLARE
  supabase_url TEXT := current_setting('app.settings.supabase_url', true);
  service_key TEXT := current_setting('app.settings.service_role_key', true);
BEGIN
  IF supabase_url IS NOT NULL AND service_key IS NOT NULL THEN
    PERFORM cron.schedule(
      'instagram-daily-sync',
      '0 10 * * *',
      format(
        $cron$SELECT net.http_post(url := '%s/functions/v1/instagram-sync', headers := '{"Content-Type":"application/json","Authorization":"Bearer %s"}'::jsonb, body := '{}'::jsonb);$cron$,
        supabase_url, service_key
      )
    );
  END IF;
END $$;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260409010000_instagram-integration.sql
git commit -m "feat: add instagram integration tables and cron"
```

---

## Task 2: Edge Function `instagram-sync`

**Files:**
- Create: `supabase/functions/instagram-sync/index.ts`

- [ ] **Step 1: Criar a edge function**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const META_API_BASE = "https://graph.facebook.com/v25.0";

async function fetchMeta(path: string, token: string): Promise<any> {
  const url = `${META_API_BASE}${path}${path.includes("?") ? "&" : "?"}access_token=${token}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(`Meta API error: ${data.error.message}`);
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const token = Deno.env.get("INSTAGRAM_SYSTEM_USER_TOKEN");

  if (!token) {
    return new Response(
      JSON.stringify({ error: "INSTAGRAM_SYSTEM_USER_TOKEN não configurado no Supabase Vault" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const today = new Date().toISOString().split("T")[0];

  // Buscar contas ativas com IDs reais (ignora placeholders)
  const { data: accounts, error: accError } = await supabase
    .from("instagram_accounts")
    .select("*")
    .eq("is_active", true)
    .not("instagram_user_id", "like", "FILL_IN%");

  if (accError) {
    return new Response(
      JSON.stringify({ error: accError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!accounts || accounts.length === 0) {
    return new Response(
      JSON.stringify({ message: "Nenhuma conta configurada ainda. Preencha os instagram_user_id na tabela instagram_accounts." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let totalPostsSynced = 0;

  for (const account of accounts) {
    const igId = account.instagram_user_id;

    // 1. Dados básicos da conta (followers, media_count)
    let followersCount = 0;
    let mediaCount = 0;
    let reach = 0;
    let profileViews = 0;

    try {
      const profileData = await fetchMeta(
        `/${igId}?fields=followers_count,media_count`,
        token
      );
      followersCount = profileData.followers_count ?? 0;
      mediaCount = profileData.media_count ?? 0;
    } catch (e) {
      console.error(`Erro ao buscar perfil ${account.username}:`, e);
    }

    // 2. Insights da conta (reach, profile_views)
    try {
      const insightsData = await fetchMeta(
        `/${igId}/insights?metric=reach,profile_views&period=day&since=${today}&until=${today}`,
        token
      );
      const insightsList = insightsData.data ?? [];
      for (const metric of insightsList) {
        const value = metric.values?.[metric.values.length - 1]?.value ?? 0;
        if (metric.name === "reach") reach = value;
        if (metric.name === "profile_views") profileViews = value;
      }
    } catch (e) {
      console.error(`Erro ao buscar insights da conta ${account.username}:`, e);
    }

    // 3. Upsert métricas diárias
    await supabase
      .from("instagram_daily_metrics")
      .upsert(
        {
          account_id: account.id,
          date: today,
          followers_count: followersCount,
          media_count: mediaCount,
          reach,
          profile_views: profileViews,
          synced_at: new Date().toISOString(),
        },
        { onConflict: "account_id,date" }
      );

    // 4. Posts recentes (últimos 30)
    let mediaList: any[] = [];
    try {
      const mediaData = await fetchMeta(
        `/${igId}/media?fields=id,media_type,timestamp,caption,permalink&limit=30`,
        token
      );
      mediaList = mediaData.data ?? [];
    } catch (e) {
      console.error(`Erro ao buscar media ${account.username}:`, e);
    }

    // 5. Insights por post
    for (const media of mediaList) {
      let likes = 0, comments = 0, shares = 0, saves = 0, reachPost = 0, views = 0, profileVisits = 0;

      try {
        const metricNames = media.media_type === "STORY"
          ? "reach,replies"
          : "likes,comments,shares,saves,reach,views,profile_visits";

        const insightData = await fetchMeta(
          `/${media.id}/insights?metric=${metricNames}`,
          token
        );

        for (const m of insightData.data ?? []) {
          const v = m.values?.[0]?.value ?? m.value ?? 0;
          if (m.name === "likes") likes = v;
          if (m.name === "comments") comments = v;
          if (m.name === "shares") shares = v;
          if (m.name === "saves") saves = v;
          if (m.name === "reach") reachPost = v;
          if (m.name === "views") views = v;
          if (m.name === "profile_visits") profileVisits = v;
        }
      } catch (e) {
        // Insights podem falhar para stories antigos — continua
      }

      await supabase
        .from("instagram_post_insights")
        .upsert(
          {
            account_id: account.id,
            instagram_media_id: media.id,
            media_type: media.media_type ?? "FEED",
            permalink: media.permalink ?? null,
            caption: (media.caption ?? "").slice(0, 500),
            published_at: media.timestamp ?? null,
            likes,
            comments,
            shares,
            saves,
            reach: reachPost,
            views,
            profile_visits: profileVisits,
            synced_at: new Date().toISOString(),
          },
          { onConflict: "instagram_media_id" }
        );

      totalPostsSynced++;
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      accounts_synced: accounts.length,
      posts_synced: totalPostsSynced,
      synced_at: new Date().toISOString(),
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/instagram-sync/index.ts
git commit -m "feat: add instagram-sync edge function"
```

---

## Task 3: Hook `useInstagram.ts`

**Files:**
- Create: `src/hooks/useInstagram.ts`

- [ ] **Step 1: Criar o hook**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';

export interface InstagramDailyMetric {
  id: string;
  account_id: string;
  date: string;
  followers_count: number;
  media_count: number;
  reach: number;
  profile_views: number;
  synced_at: string;
  instagram_accounts: {
    username: string;
    account_label: string;
  };
}

export interface InstagramPostInsight {
  id: string;
  account_id: string;
  instagram_media_id: string;
  media_type: string;
  permalink: string | null;
  caption: string | null;
  published_at: string | null;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  views: number;
  profile_visits: number;
  synced_at: string;
  instagram_accounts: {
    username: string;
    account_label: string;
  };
}

export function useInstagramDailyMetrics(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['instagram-daily-metrics', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('instagram_daily_metrics')
        .select('*, instagram_accounts(username, account_label)')
        .order('date', { ascending: false });

      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);

      const { data, error } = await query;
      if (error) throw error;
      return data as InstagramDailyMetric[];
    },
  });
}

export function useInstagramPostInsights(accountId?: string, limit = 30) {
  return useQuery({
    queryKey: ['instagram-post-insights', accountId, limit],
    queryFn: async () => {
      let query = supabase
        .from('instagram_post_insights')
        .select('*, instagram_accounts(username, account_label)')
        .order('published_at', { ascending: false })
        .limit(limit);

      if (accountId) query = query.eq('account_id', accountId);

      const { data, error } = await query;
      if (error) throw error;
      return data as InstagramPostInsight[];
    },
  });
}

export function useLatestFollowersCount() {
  return useQuery({
    queryKey: ['instagram-latest-followers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_daily_metrics')
        .select('followers_count, date, instagram_accounts(account_label)')
        .order('date', { ascending: false })
        .limit(10);

      if (error) throw error;

      const leo = data?.find(d => (d.instagram_accounts as any)?.account_label === 'Leo');
      const w3 = data?.find(d => (d.instagram_accounts as any)?.account_label === 'W3');

      return {
        leo: leo?.followers_count ?? 0,
        w3: w3?.followers_count ?? 0,
      };
    },
  });
}

export function useInstagramSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('instagram-sync');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['instagram-daily-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['instagram-post-insights'] });
      queryClient.invalidateQueries({ queryKey: ['instagram-latest-followers'] });
      toast.success(`Instagram sincronizado! ${data.posts_synced} posts atualizados.`);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao sincronizar Instagram');
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useInstagram.ts
git commit -m "feat: add useInstagram hooks"
```

---

## Task 4: Atualizar `ConteudoDashboard.tsx`

**Files:**
- Modify: `src/pages/ConteudoDashboard.tsx`

- [ ] **Step 1: Adicionar imports**

No topo do arquivo, após a linha 19 (`import { cn } from '@/lib/utils';`), adicionar:

```typescript
import { RefreshCw, Instagram } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useInstagramDailyMetrics, useInstagramPostInsights, useInstagramSync } from '@/hooks/useInstagram';
```

- [ ] **Step 2: Adicionar hooks no componente**

Dentro de `export default function ConteudoDashboard()`, após a linha `const { data: logs = [] } = useContentDailyLogs(...)` (linha 87), adicionar:

```typescript
  const { data: igMetrics = [] } = useInstagramDailyMetrics(startDate, endDate);
  const { data: igPosts = [] } = useInstagramPostInsights(undefined, 20);
  const syncInstagram = useInstagramSync();
```

- [ ] **Step 3: Calcular stats de engajamento Instagram**

Dentro do bloco `useMemo` de `stats` (após linha 112, antes do `return`), adicionar logo antes do `return`:

```typescript
    const igPostsWithEngagement = igPosts.filter(p => p.media_type !== 'STORY');
    const avgEngagement = igPostsWithEngagement.length > 0
      ? Math.round(igPostsWithEngagement.reduce((s, p) => s + p.likes + p.comments + p.saves, 0) / igPostsWithEngagement.length)
      : 0;

    const leoLatest = [...igMetrics]
      .filter(m => (m.instagram_accounts as any)?.account_label === 'Leo')
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    const w3Latest = [...igMetrics]
      .filter(m => (m.instagram_accounts as any)?.account_label === 'W3')
      .sort((a, b) => b.date.localeCompare(a.date))[0];
```

E no `return` do useMemo (linha com `return { totalPosts, ... }`), incluir:

```typescript
    return { totalPosts, totalStories, totalScheduled, postsMeta, storiesMeta, postsPercent, storiesPercent, totalLeoVar, totalW3Var, avgEngagement, leoLatest, w3Latest };
```

**Nota:** o useMemo de stats (linha 96) não tem acesso a `igPosts` e `igMetrics` pois esses hooks foram declarados fora. Para que o useMemo possa usá-los, remova `igPostsWithEngagement`, `avgEngagement`, `leoLatest`, `w3Latest` do useMemo e declare-os como `useMemo` separados logo após o stats existente:

```typescript
  const avgEngagement = useMemo(() => {
    const posts = igPosts.filter(p => p.media_type !== 'STORY');
    return posts.length > 0
      ? Math.round(posts.reduce((s, p) => s + p.likes + p.comments + p.saves, 0) / posts.length)
      : 0;
  }, [igPosts]);

  const leoLatest = useMemo(() =>
    [...igMetrics]
      .filter(m => (m.instagram_accounts as any)?.account_label === 'Leo')
      .sort((a, b) => b.date.localeCompare(a.date))[0],
    [igMetrics]
  );

  const w3Latest = useMemo(() =>
    [...igMetrics]
      .filter(m => (m.instagram_accounts as any)?.account_label === 'W3')
      .sort((a, b) => b.date.localeCompare(a.date))[0],
    [igMetrics]
  );
```

- [ ] **Step 4: Adicionar botão "Sincronizar Instagram" no PageHeader**

Dentro de `<PageHeader ...>`, antes do `<Select value={responsibleFilter}...>` (linha 174), adicionar:

```tsx
        <Button
          variant="outline"
          size="sm"
          onClick={() => syncInstagram.mutate()}
          disabled={syncInstagram.isPending}
          className="gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', syncInstagram.isPending && 'animate-spin')} />
          {syncInstagram.isPending ? 'Sincronizando...' : 'Sincronizar Instagram'}
        </Button>
```

- [ ] **Step 5: Adicionar seção Instagram após BLOCO 2**

Após o fechamento do BLOCO 2 (`</div>` da linha 378) e antes do `{/* BLOCO 3 — Histórico */}`, adicionar:

```tsx
      {/* BLOCO Instagram — Métricas */}
      <SectionLabel title="Instagram" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardContent className="p-6">
            <p className="section-label-text mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Seguidores @leo</p>
            <p style={{ fontSize: '36px', fontWeight: 700, color: '#F97316' }}>
              {leoLatest ? leoLatest.followers_count.toLocaleString('pt-BR') : '—'}
            </p>
            {leoLatest && (
              <p className="text-xs text-muted-foreground mt-1">
                Atualizado em {format(new Date(leoLatest.date + 'T12:00:00'), 'dd/MM')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="section-label-text mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Seguidores @w3</p>
            <p style={{ fontSize: '36px', fontWeight: 700, color: '#F97316' }}>
              {w3Latest ? w3Latest.followers_count.toLocaleString('pt-BR') : '—'}
            </p>
            {w3Latest && (
              <p className="text-xs text-muted-foreground mt-1">
                Atualizado em {format(new Date(w3Latest.date + 'T12:00:00'), 'dd/MM')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="section-label-text mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Engajamento Médio / Post</p>
            <p style={{ fontSize: '36px', fontWeight: 700, color: '#F97316' }}>
              {avgEngagement > 0 ? avgEngagement.toLocaleString('pt-BR') : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">likes + comentários + salvamentos</p>
          </CardContent>
        </Card>
      </div>

      {/* Posts recentes Instagram */}
      <Card className="mb-8">
        <CardHeader className="pb-2 flex flex-row items-center gap-2">
          <Instagram className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Posts recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {igPosts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Nenhum dado ainda. Clique em "Sincronizar Instagram" após configurar o token.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Conta</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs text-center">Likes</TableHead>
                    <TableHead className="text-xs text-center">Comentários</TableHead>
                    <TableHead className="text-xs text-center">Shares</TableHead>
                    <TableHead className="text-xs text-center">Salvamentos</TableHead>
                    <TableHead className="text-xs text-center">Alcance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {igPosts.map(post => (
                    <TableRow key={post.id}>
                      <TableCell className="text-xs">
                        @{(post.instagram_accounts as any)?.username ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-xs">{post.media_type}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {post.published_at
                          ? format(new Date(post.published_at), 'dd/MM/yyyy')
                          : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-center">{post.likes.toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="text-xs text-center">{post.comments.toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="text-xs text-center">{post.shares.toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="text-xs text-center">{post.saves.toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="text-xs text-center">{post.reach.toLocaleString('pt-BR')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/ConteudoDashboard.tsx
git commit -m "feat: add Instagram metrics section to ConteudoDashboard"
```

---

## Task 5: Auto-fill followers no `DailyLogModal.tsx`

**Files:**
- Modify: `src/components/conteudos/DailyLogModal.tsx`

- [ ] **Step 1: Adicionar import do hook**

Na linha 27 (após os imports de `useContentTracking`), adicionar:

```typescript
import { useLatestFollowersCount } from '@/hooks/useInstagram';
```

- [ ] **Step 2: Adicionar o hook no componente**

Dentro de `export function DailyLogModal(...)`, após a linha `const replaceItems = useReplaceContentPostItems();` (linha 66), adicionar:

```typescript
  const { data: latestFollowers } = useLatestFollowersCount();
```

- [ ] **Step 3: Auto-fill na abertura do modal para novo registro**

No `useEffect` da linha 68 (que trata abertura do modal), substituir o bloco inteiro por:

```typescript
  useEffect(() => {
    if (editLog && open) {
      setDate(new Date(editLog.date + 'T12:00:00'));
      setResponsibleName(editLog.responsible_name || 'Otto');
      setStoriesCount(String(editLog.stories_done_count));
      setYoutubeCount(String(editLog.youtube_videos_published_count));
      setFollowersLeo(String(editLog.followers_leo));
      setFollowersW3(String(editLog.followers_w3));
      setNotes(editLog.notes || '');
    } else if (open) {
      resetForm(latestFollowers);
    }
  }, [editLog, open, latestFollowers]);
```

- [ ] **Step 4: Atualizar `resetForm` para aceitar followers**

Substituir a função `resetForm` atual (linhas 104-114) por:

```typescript
  const resetForm = (followers?: { leo: number; w3: number }) => {
    setDate(new Date());
    setResponsibleName('Otto');
    setRequiredStatuses(DAILY_REQUIRED_TEMPLATE.map(() => 'pendente'));
    setAdditionalPosts([]);
    setStoriesCount('0');
    setYoutubeCount('0');
    setFollowersLeo(String(followers?.leo ?? 0));
    setFollowersW3(String(followers?.w3 ?? 0));
    setNotes('');
  };
```

- [ ] **Step 5: Commit**

```bash
git add src/components/conteudos/DailyLogModal.tsx
git commit -m "feat: auto-fill followers from Instagram in DailyLogModal"
```

---

## Task 6: Push e instruções de ativação

- [ ] **Step 1: Push para GitHub**

```bash
git push
```

- [ ] **Step 2: Ativar extensões no Supabase Dashboard**

No painel do Supabase do projeto:
1. Vá em **Database > Extensions**
2. Habilite **pg_cron**
3. Habilite **pg_net**

- [ ] **Step 3: Adicionar o token no Supabase Vault**

No painel do Supabase:
1. Vá em **Edge Functions > Manage secrets**
2. Clique **"Add new secret"**
3. Nome: `INSTAGRAM_SYSTEM_USER_TOKEN`
4. Valor: seu System User token do Meta Business Manager

- [ ] **Step 4: Atualizar IDs das contas na tabela**

Após ter o token, descubra os IDs rodando no terminal:

```bash
# Passo 1: listar suas Facebook Pages
curl "https://graph.facebook.com/v25.0/me/accounts?access_token=SEU_TOKEN"

# Passo 2: para cada page_id, pegar a conta Instagram vinculada
curl "https://graph.facebook.com/v25.0/PAGE_ID?fields=instagram_business_account&access_token=SEU_TOKEN"
```

Depois, no Supabase **Table Editor > instagram_accounts**, edite as duas linhas e preencha os `instagram_user_id` e `username` corretos.

- [ ] **Step 5: Testar o sync manualmente**

No dashboard do app (após Lovable publicar), clique em **"Sincronizar Instagram"**. Se tudo estiver configurado, aparecerá um toast de sucesso com a contagem de posts sincronizados.
