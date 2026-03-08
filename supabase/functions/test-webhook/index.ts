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

    // Verify user is MASTER
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

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is MASTER
    const userId = claimsData.claims.sub as string;
    const { data: userRole } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (!userRole || userRole.role !== "MASTER") {
      return new Response(JSON.stringify({ error: "Forbidden: only MASTER can test webhooks" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { webhook_url } = await req.json();
    if (!webhook_url) {
      return new Response(JSON.stringify({ error: "webhook_url is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the most recent venda with closer info
    const { data: venda, error: vendaError } = await serviceClient
      .from("vendas")
      .select(`
        *,
        closer:profiles!vendas_closer_user_id_fkey(id, nome, email)
      `)
      .order("criado_em", { ascending: false })
      .limit(1)
      .single();

    if (vendaError || !venda) {
      return new Response(JSON.stringify({ error: "Nenhuma venda encontrada para usar como teste" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build payload (same format as venda-webhook)
    const payload = {
      evento: "teste_webhook",
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
        observacoes: venda.observacoes,
      },
    };

    // Send to specific webhook URL
    const encodedPayload = encodeURIComponent(JSON.stringify(payload));
    const separator = webhook_url.includes("?") ? "&" : "?";
    const webhookRes = await fetch(`${webhook_url}${separator}data=${encodedPayload}`, {
      method: "GET",
    });

    const responseText = await webhookRes.text();

    return new Response(JSON.stringify({
      success: webhookRes.ok,
      status: webhookRes.status,
      response: responseText.substring(0, 500),
      venda_usada: {
        id: venda.id,
        nome_lead: venda.nome_lead,
        nome_empresa: venda.nome_empresa,
        valor_total: venda.valor_total,
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Test webhook error:", err);
    return new Response(
      JSON.stringify({ error: "internal_error", message: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
