import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const { agent_id, request_id, inputs_json } = await req.json();

    if (!agent_id || !inputs_json) {
      return new Response(JSON.stringify({ error: "agent_id and inputs_json are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch agent prompt
    const { data: agent, error: agentErr } = await supabase
      .from("ai_agents")
      .select("*")
      .eq("id", agent_id)
      .single();

    if (agentErr || !agent) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update request status to processing
    if (request_id) {
      await supabase
        .from("ai_requests")
        .update({ status: "processing" })
        .eq("id", request_id);
    }

    // Build the user prompt from inputs
    const inputs = inputs_json;
    let userPrompt = `TIPO: ${inputs.tipo || agent.type}\n`;
    userPrompt += `PLATAFORMA: ${inputs.platform || "instagram"}\n`;
    if (inputs.tema) userPrompt += `TEMA/ASSUNTO: ${inputs.tema}\n`;
    if (inputs.objetivo) userPrompt += `OBJETIVO: ${inputs.objetivo}\n`;
    if (inputs.publico) userPrompt += `PÚBLICO-ALVO: ${inputs.publico}\n`;
    if (inputs.tom) userPrompt += `TOM DE VOZ: ${inputs.tom}\n`;
    if (inputs.gancho) userPrompt += `GANCHO OBRIGATÓRIO: ${inputs.gancho}\n`;
    if (inputs.cta) userPrompt += `CTA: ${inputs.cta}\n`;
    if (inputs.palavras_proibidas) userPrompt += `PALAVRAS PROIBIDAS: ${inputs.palavras_proibidas}\n`;
    if (inputs.referencia) userPrompt += `REFERÊNCIA: ${inputs.referencia}\n`;
    if (inputs.duracao) userPrompt += `DURAÇÃO DO VÍDEO: ${inputs.duracao}\n`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: agent.prompt_base },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);

      if (request_id) {
        await supabase.from("ai_requests").update({ status: "error" }).eq("id", request_id);
      }

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Erro ao gerar conteúdo" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const outputText = aiData.choices?.[0]?.message?.content || "";

    // Get next version number
    let version = 1;
    if (request_id) {
      const { data: existingOutputs } = await supabase
        .from("ai_outputs")
        .select("version")
        .eq("request_id", request_id)
        .order("version", { ascending: false })
        .limit(1);

      if (existingOutputs && existingOutputs.length > 0) {
        version = existingOutputs[0].version + 1;
      }
    }

    // Save output
    const outputType = agent.type === "caption" ? "caption" : "script";
    const actualRequestId = request_id;

    if (actualRequestId) {
      const { error: outputErr } = await supabase.from("ai_outputs").insert({
        request_id: actualRequestId,
        version,
        output_type: outputType,
        output_text: outputText,
        meta_json: { char_count: outputText.length },
      });

      if (outputErr) {
        console.error("Error saving output:", outputErr);
      }

      // Update request status to done
      await supabase.from("ai_requests").update({ status: "done" }).eq("id", actualRequestId);
    }

    return new Response(
      JSON.stringify({ output_text: outputText, version }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-content error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
