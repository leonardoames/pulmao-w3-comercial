import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const appId = Deno.env.get("INSTAGRAM_APP_ID");
  const appSecret = Deno.env.get("INSTAGRAM_APP_SECRET");

  if (!appId || !appSecret) {
    return new Response(
      JSON.stringify({ error: "INSTAGRAM_APP_ID ou INSTAGRAM_APP_SECRET não configurados nos secrets." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { code, redirect_uri, account_label } = await req.json();

  if (!code || !redirect_uri) {
    return new Response(
      JSON.stringify({ error: "Parâmetros 'code' e 'redirect_uri' são obrigatórios." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 1. Trocar o code por short-lived token
  const tokenForm = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: "authorization_code",
    redirect_uri,
    code,
  });

  const shortRes = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    body: tokenForm,
  });
  const shortData = await shortRes.json();

  if (shortData.error_type || shortData.error) {
    return new Response(
      JSON.stringify({ error: shortData.error_message || shortData.error?.message || "Erro ao obter token." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const shortToken = shortData.access_token;

  // 2. Trocar por long-lived token (válido 60 dias)
  const longRes = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_id=${appId}&client_secret=${appSecret}&access_token=${shortToken}`
  );
  const longData = await longRes.json();

  if (longData.error) {
    return new Response(
      JSON.stringify({ error: longData.error.message || "Erro ao obter long-lived token." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const accessToken = longData.access_token;
  // expires_in vem em segundos
  const expiresAt = new Date(Date.now() + longData.expires_in * 1000).toISOString();

  // 3. Buscar username e ID da conta
  const profileRes = await fetch(
    `https://graph.instagram.com/v25.0/me?fields=id,username&access_token=${accessToken}`
  );
  const profileData = await profileRes.json();

  if (profileData.error) {
    return new Response(
      JSON.stringify({ error: profileData.error.message || "Erro ao buscar perfil." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const igUserId = profileData.id;
  const username = profileData.username;
  const label = account_label || username;

  // 4. Upsert na tabela instagram_accounts
  const supabase = createClient(supabaseUrl, serviceKey);

  const { error: upsertError } = await supabase
    .from("instagram_accounts")
    .upsert(
      {
        instagram_user_id: igUserId,
        username,
        account_label: label,
        access_token: accessToken,
        token_expires_at: expiresAt,
        is_active: true,
      },
      { onConflict: "instagram_user_id" }
    );

  if (upsertError) {
    return new Response(
      JSON.stringify({ error: upsertError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, username, account_label: label }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
