import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

    const sb = createClient(supabaseUrl, supabaseKey);

    // Fetch texts from 4 sources (last 90 days)
    const since = new Date(Date.now() - 730 * 86400000).toISOString(); // 2 years

    const [quejas, touchpoints, csat, nps] = await Promise.all([
      sb
        .from("cs_quejas")
        .select("descripcion, causa_raiz, accion_correctiva, cliente:pc_clientes(nombre)")
        .gte("created_at", since)
        .limit(50),
      sb
        .from("cs_touchpoints")
        .select("resumen, cliente_id")
        .gte("created_at", since)
        .limit(100),
      sb
        .from("cs_csat_surveys")
        .select("comentario, score, cliente:pc_clientes(nombre)")
        .gte("created_at", since)
        .not("comentario", "is", null)
        .limit(50),
      sb
        .from("cs_nps_campaigns")
        .select("comentario, score, cliente:pc_clientes(nombre)")
        .gte("created_at", since)
        .not("comentario", "is", null)
        .limit(50),
    ]);

    // Build text corpus
    const texts: string[] = [];
    const sourceMap: { text: string; source: string; cliente: string }[] = [];

    for (const q of quejas.data || []) {
      const parts = [q.descripcion, q.causa_raiz, q.accion_correctiva].filter(Boolean);
      const combined = parts.join(". ");
      if (combined.length > 5) {
        texts.push(combined);
        const clienteName = (q.cliente as any)?.nombre || "Desconocido";
        sourceMap.push({ text: combined, source: "Queja", cliente: clienteName });
      }
    }
    for (const t of touchpoints.data || []) {
      if (t.resumen && t.resumen.length > 5) {
        texts.push(t.resumen);
        sourceMap.push({ text: t.resumen, source: "Touchpoint", cliente: t.cliente_id });
      }
    }
    for (const c of csat.data || []) {
      if (c.comentario && c.comentario.length > 5) {
        texts.push(c.comentario);
        const clienteName = (c.cliente as any)?.nombre || "Desconocido";
        sourceMap.push({ text: c.comentario, source: "CSAT", cliente: clienteName });
      }
    }
    for (const n of nps.data || []) {
      if (n.comentario && n.comentario.length > 5) {
        texts.push(n.comentario);
        const clienteName = (n.cliente as any)?.nombre || "Desconocido";
        sourceMap.push({ text: n.comentario, source: "NPS", cliente: clienteName });
      }
    }

    if (texts.length < 2) {
      return new Response(
        JSON.stringify({ empty: true, total_texts: texts.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build AI prompt
    const systemPrompt = `Eres un analista experto de Customer Success en la industria de custodia y seguridad privada en México. Analiza los siguientes textos de clientes (quejas, touchpoints, encuestas CSAT y NPS) y extrae insights ejecutivos. Los textos provienen de una empresa que ofrece servicios de custodia de valores, monitoreo GPS y seguridad patrimonial. Responde SIEMPRE en español.`;

    const userPrompt = `Analiza estos ${texts.length} textos de clientes y usa la herramienta analyze_customer_voice para devolver el análisis estructurado:\n\n${sourceMap.map((s, i) => `[${s.source}] (${s.cliente}): "${s.text}"`).join("\n\n")}`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "analyze_customer_voice",
                description:
                  "Retorna el análisis estructurado de la voz del cliente incluyendo sentimiento, temas, nube de palabras, verbatims y recomendaciones.",
                parameters: {
                  type: "object",
                  properties: {
                    sentiment_score: {
                      type: "number",
                      description:
                        "Score de sentimiento general de 0 a 100. 0=muy negativo, 50=neutro, 100=muy positivo.",
                    },
                    executive_summary: {
                      type: "string",
                      description:
                        "Resumen ejecutivo de 3-4 oraciones sobre cómo perciben los clientes a la empresa. En español.",
                    },
                    themes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string", description: "Nombre del tema detectado" },
                          count: { type: "number", description: "Frecuencia de mención" },
                          sentiment: {
                            type: "string",
                            enum: ["positivo", "negativo", "neutro"],
                          },
                          keywords: {
                            type: "array",
                            items: { type: "string" },
                            description: "Palabras clave asociadas al tema",
                          },
                        },
                        required: ["name", "count", "sentiment", "keywords"],
                        additionalProperties: false,
                      },
                    },
                    word_cloud: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          word: { type: "string" },
                          frequency: { type: "number" },
                          sentiment: {
                            type: "string",
                            enum: ["positivo", "negativo", "neutro"],
                          },
                        },
                        required: ["word", "frequency", "sentiment"],
                        additionalProperties: false,
                      },
                      description: "20-30 palabras más relevantes excluyendo stopwords en español",
                    },
                    verbatims: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          text: { type: "string", description: "Cita textual relevante del cliente (fragmento corto)" },
                          source: { type: "string", enum: ["Queja", "CSAT", "NPS", "Touchpoint"] },
                          sentiment: { type: "string", enum: ["positivo", "negativo", "neutro"] },
                          cliente: { type: "string" },
                        },
                        required: ["text", "source", "sentiment", "cliente"],
                        additionalProperties: false,
                      },
                    },
                    recommendations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          action: { type: "string", description: "Acción concreta recomendada" },
                          priority: { type: "string", enum: ["alta", "media", "baja"] },
                          context: { type: "string", description: "Contexto breve de por qué se recomienda" },
                        },
                        required: ["action", "priority", "context"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: [
                    "sentiment_score",
                    "executive_summary",
                    "themes",
                    "word_cloud",
                    "verbatims",
                    "recommendations",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "analyze_customer_voice" },
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", status, errorText);
      
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de peticiones excedido. Intenta de nuevo en unos minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes para Lovable AI." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI error ${status}: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call response from AI");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        ...analysis,
        total_texts: texts.length,
        sources: {
          quejas: (quejas.data || []).length,
          touchpoints: (touchpoints.data || []).length,
          csat: (csat.data || []).filter((c: any) => c.comentario).length,
          nps: (nps.data || []).filter((n: any) => n.comentario).length,
        },
        analyzed_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("cs-voc-analysis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
