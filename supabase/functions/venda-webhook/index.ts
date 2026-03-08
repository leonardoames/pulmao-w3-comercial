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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client for data access
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch active webhooks for 'nova_venda' event from the webhooks table
    const { data: webhooks, error: webhooksError } = await serviceClient
      .from("webhooks")
      .select("*")
      .eq("evento", "nova_venda")
      .eq("ativo", true);

    // Fallback to env var if no webhooks in table
    const envWebhookUrl = Deno.env.get("VENDA_WEBHOOK_URL");

    const webhookUrls: string[] = [];
    if (webhooks && webhooks.length > 0) {
      for (const wh of webhooks) {
        webhookUrls.push(wh.url);
      }
    } else if (envWebhookUrl) {
      webhookUrls.push(envWebhookUrl);
    }

    if (webhookUrls.length === 0) {
      return new Response(JSON.stringify({ error: "webhook_not_configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body
    const { venda_id } = await req.json();
    if (!venda_id) {
      return new Response(JSON.stringify({ error: "venda_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch full venda data with closer profile
    const { data: venda, error: vendaError } = await serviceClient
      .from("vendas")
      .select(`
        *,
        closer:profiles!vendas_closer_user_id_fkey(id, nome, email)
      `)
      .eq("id", venda_id)
      .single();

    if (vendaError || !venda) {
      console.error("Error fetching venda:", vendaError);
      return new Response(JSON.stringify({ error: "Venda não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build payload
    const payload = {
      evento: "nova_venda",
      venda: {
        id: venda.id,
        data_fechamento: venda.data_fechamento,
        closer: venda.closer?.nome ?? "Desconhecido",
        closer_email: venda.closer?.email ?? "",
        nome_lead: venda.nome_lead,
        nome_empresa: venda.nome_empresa,
        duracao_contrato_meses: venda.duracao_contrato_meses,
        valor_pix: venda.valor_pix,
        valor_cartao: venda.valor_cartao,
        valor_boleto_parcela: venda.valor_boleto_parcela,
        quantidade_parcelas_boleto: venda.quantidade_parcelas_boleto,
        valor_total: venda.valor_total,
        pago: venda.pago,
        contrato_assinado: venda.contrato_assinado,
        enviado_financeiro: venda.enviado_financeiro,
        enviado_cs: venda.enviado_cs,
        status: venda.status,
        origem_lead: venda.origem_lead ?? null,
        observacoes: venda.observacoes,
      },
    };

    // Send to all active webhooks in parallel
    const encodedPayload = encodeURIComponent(JSON.stringify(payload));
    const results = await Promise.allSettled(
      webhookUrls.map(async (url) => {
        const separator = url.includes("?") ? "&" : "?";
        const res = await fetch(`${url}${separator}data=${encodedPayload}`, {
          method: "GET",
        });
        if (!res.ok) {
          const errText = await res.text();
          console.error(`Webhook error for ${url}:`, res.status, errText);
          return { url, status: res.status, error: errText };
        }
        return { url, status: res.status, success: true };
      })
    );

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "internal_error", message: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
