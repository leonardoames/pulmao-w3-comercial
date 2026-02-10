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
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(JSON.stringify({ error: "Token é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token)) {
      return new Response(JSON.stringify({ error: "Link indisponível" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate token
    const { data: link, error: linkError } = await supabaseAdmin
      .from("shared_links")
      .select("*")
      .eq("token", token)
      .eq("is_active", true)
      .maybeSingle();

    if (linkError || !link) {
      return new Response(
        JSON.stringify({ error: "Link inválido ou desativado" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check expiration
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Link expirado" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get current month range
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    // Fetch fechamentos
    const { data: fechamentos } = await supabaseAdmin
      .from("fechamentos")
      .select("calls_realizadas, no_show, closer_user_id")
      .gte("data", monthStart)
      .lte("data", monthEnd);

    // Fetch vendas
    const { data: vendas } = await supabaseAdmin
      .from("vendas")
      .select(
        "id, valor_total, valor_pix, valor_cartao, valor_boleto_parcela, quantidade_parcelas_boleto, closer_user_id"
      )
      .gte("data_fechamento", monthStart)
      .lte("data_fechamento", monthEnd);

    // Fetch profiles (only id and nome - no emails)
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, nome")
      .eq("ativo", true);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.id, p.nome])
    );

    // Calculate stats
    const callsRealizadas =
      fechamentos?.reduce((sum, f) => sum + f.calls_realizadas, 0) || 0;
    const noShows =
      fechamentos?.reduce((sum, f) => sum + f.no_show, 0) || 0;
    const callsAgendadas = callsRealizadas + noShows;
    const percentNoShow =
      callsAgendadas > 0 ? (noShows / callsAgendadas) * 100 : 0;

    const totalVendas = vendas?.length || 0;
    const volumeVendas =
      vendas?.reduce((sum, v) => sum + Number(v.valor_total), 0) || 0;
    const valorPix =
      vendas?.reduce((sum, v) => sum + Number(v.valor_pix), 0) || 0;
    const valorCartao =
      vendas?.reduce((sum, v) => sum + Number(v.valor_cartao), 0) || 0;
    const valorBoleto =
      vendas?.reduce(
        (sum, v) =>
          sum +
          Number(v.valor_boleto_parcela) *
            Number(v.quantidade_parcelas_boleto),
        0
      ) || 0;
    const caixaDoMes = valorPix + valorCartao;
    const proporcaoCaixa =
      volumeVendas > 0 ? (caixaDoMes / volumeVendas) * 100 : 0;
    const ticketMedio = totalVendas > 0 ? volumeVendas / totalVendas : 0;
    const taxaConversao =
      callsRealizadas > 0 ? (totalVendas / callsRealizadas) * 100 : 0;
    const faturamentoPorCall =
      callsRealizadas > 0 ? volumeVendas / callsRealizadas : 0;

    // Build ranking
    const closerMetrics = new Map<
      string,
      {
        nome: string;
        callsRealizadas: number;
        noShow: number;
        vendas: number;
        volume: number;
      }
    >();

    fechamentos?.forEach((f) => {
      const id = f.closer_user_id;
      const nome = profileMap.get(id) || "Closer";
      const current = closerMetrics.get(id) || {
        nome,
        callsRealizadas: 0,
        noShow: 0,
        vendas: 0,
        volume: 0,
      };
      current.callsRealizadas += f.calls_realizadas;
      current.noShow += f.no_show;
      closerMetrics.set(id, current);
    });

    vendas?.forEach((v) => {
      const id = v.closer_user_id;
      const nome = profileMap.get(id) || "Closer";
      const current = closerMetrics.get(id) || {
        nome,
        callsRealizadas: 0,
        noShow: 0,
        vendas: 0,
        volume: 0,
      };
      current.vendas += 1;
      current.volume += Number(v.valor_total);
      closerMetrics.set(id, current);
    });

    const rankingGeral = Array.from(closerMetrics.entries())
      .map(([, data]) => ({
        nome: data.nome,
        vendas: data.vendas,
        volume: data.volume,
        callsRealizadas: data.callsRealizadas,
        taxaConversao:
          data.callsRealizadas > 0
            ? (data.vendas / data.callsRealizadas) * 100
            : 0,
      }))
      .sort((a, b) => b.volume - a.volume);

    // No-show by closer
    const noShowByCloser = Array.from(closerMetrics.entries())
      .map(([, data]) => {
        const agendadas = data.callsRealizadas + data.noShow;
        return {
          nome: data.nome,
          noShow: data.noShow,
          callsAgendadas: agendadas,
          percentNoShow:
            agendadas > 0 ? (data.noShow / agendadas) * 100 : 0,
        };
      })
      .filter((c) => c.callsAgendadas > 0)
      .sort((a, b) => b.percentNoShow - a.percentNoShow);

    const response = {
      periodo: `${monthStart} a ${monthEnd}`,
      stats: {
        callsRealizadas,
        noShows,
        percentNoShow,
        totalVendas,
        volumeVendas,
        valorPix,
        valorCartao,
        valorBoleto,
        caixaDoMes,
        proporcaoCaixa,
        ticketMedio,
        taxaConversao,
        faturamentoPorCall,
      },
      rankingGeral,
      noShowByCloser,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
