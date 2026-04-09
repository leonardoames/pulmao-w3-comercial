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
      JSON.stringify({
        error: "INSTAGRAM_SYSTEM_USER_TOKEN não configurado. Adicione em Supabase > Edge Functions > Manage secrets.",
      }),
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
      JSON.stringify({
        message: "Nenhuma conta configurada ainda. Preencha os instagram_user_id na tabela instagram_accounts.",
        accounts_synced: 0,
        posts_synced: 0,
      }),
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
      } catch (_e) {
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
