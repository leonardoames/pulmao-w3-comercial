import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check secrets
    const fbToken = Deno.env.get("FB_ACCESS_TOKEN");
    const fbAccountId = Deno.env.get("FB_AD_ACCOUNT_ID");

    if (!fbToken || !fbAccountId) {
      return new Response(
        JSON.stringify({ error: "not_configured" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse body
    const { date_start, date_end } = await req.json();
    if (!date_start || !date_end) {
      return new Response(
        JSON.stringify({ error: "date_start and date_end are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Call Facebook API
    const timeRange = JSON.stringify({ since: date_start, until: date_end });
    const fields = "spend,impressions,clicks,ctr,actions";
    const url = `https://graph.facebook.com/v24.0/act_${fbAccountId}/insights?fields=${fields}&time_range=${encodeURIComponent(timeRange)}&access_token=${fbToken}`;

    const fbRes = await fetch(url);
    const fbData = await fbRes.json();

    // Check for Facebook errors
    if (fbData.error) {
      const code = fbData.error.code;
      if (code === 190) {
        return new Response(
          JSON.stringify({ error: "token_expired" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      return new Response(
        JSON.stringify({ error: "fb_api_error", message: fbData.error.message }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse data
    const row = fbData.data?.[0];
    if (!row) {
      return new Response(
      JSON.stringify({
          spend: 0,
          impressions: 0,
          clicks: 0,
          ctr: 0,
          leads: 0,
          scheduled: 0,
          conversions: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const actions: { action_type: string; value: string }[] =
      row.actions || [];

    console.log("FB actions:", JSON.stringify(actions));

    const leads = actions
      .filter((a) => a.action_type === "lead")
      .reduce((s, a) => s + parseInt(a.value, 10), 0);

    const scheduled = actions
      .filter((a) => a.action_type === "schedule")
      .reduce((s, a) => s + parseInt(a.value, 10), 0);

    const conversions = actions
      .filter((a) => a.action_type.startsWith("offsite_conversion"))
      .reduce((s, a) => s + parseInt(a.value, 10), 0);

    return new Response(
      JSON.stringify({
        spend: parseFloat(row.spend || "0"),
        impressions: parseInt(row.impressions || "0", 10),
        clicks: parseInt(row.clicks || "0", 10),
        ctr: parseFloat(row.ctr || "0"),
        leads,
        scheduled,
        conversions,
        _debug_actions: actions,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "internal_error", message: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
