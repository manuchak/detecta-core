import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { origen, destino } = await req.json();
    if (!origen || !destino) throw new Error("origen and destino are required");

    const MAPBOX_TOKEN = Deno.env.get("MAPBOX_ACCESS_TOKEN");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!MAPBOX_TOKEN) throw new Error("MAPBOX_ACCESS_TOKEN not configured");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Geocode origin and destination
    const geocode = async (place: string) => {
      const resp = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(place)}.json?country=MX&limit=1&language=es&access_token=${MAPBOX_TOKEN}`
      );
      const data = await resp.json();
      return data.features?.[0]?.center as [number, number] | undefined;
    };

    const [origenCoords, destinoCoords] = await Promise.all([geocode(origen), geocode(destino)]);
    if (!origenCoords || !destinoCoords) {
      throw new Error(`No se pudo geocodificar: ${!origenCoords ? origen : destino}`);
    }

    // 2. Get driving route
    const routeResp = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${origenCoords.join(",")};${destinoCoords.join(",")}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
    );
    const routeData = await routeResp.json();
    const route = routeData.routes?.[0];
    if (!route) throw new Error("No se encontró ruta entre los puntos");

    const distanceKm = Math.round(route.distance / 1000);
    const durationHours = Math.round(route.duration / 3600 * 10) / 10;
    const routeCoords = route.geometry.coordinates as [number, number][];

    // 3. Query safe points near route (within ~0.05 degrees ≈ 5km)
    const { data: allSafePoints } = await supabase
      .from("safe_points")
      .select("*")
      .eq("is_active", true);

    // Filter safe points near the route
    const nearRouteSafePoints = (allSafePoints || []).filter((sp: any) => {
      return routeCoords.some((coord: [number, number]) => {
        const dlng = Math.abs(coord[0] - sp.lng);
        const dlat = Math.abs(coord[1] - sp.lat);
        return dlng < 0.08 && dlat < 0.08; // ~8km buffer
      });
    });

    // 4. Get dead zones from DB or static
    const { data: deadZones } = await supabase
      .from("risk_zone_scores")
      .select("zone_name, risk_level, final_score, h3_index")
      .in("risk_level", ["extremo", "alto"]);

    // 5. Get recent incidents near route
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
    const { data: incidents } = await supabase
      .from("incidentes_rrss")
      .select("tipo_incidente, municipio, severidad, carretera, fecha_publicacion, resumen_ai")
      .gte("fecha_publicacion", ninetyDaysAgo)
      .limit(200);

    // Filter incidents near route
    const routeTerms = [origen, destino].map(t => t.toLowerCase().split(",")[0].trim());
    const nearIncidents = (incidents || []).filter((i: any) => {
      const text = `${i.carretera || ""} ${i.municipio || ""}`.toLowerCase();
      return routeTerms.some(term => text.includes(term));
    }).slice(0, 15);

    // 6. Call Lovable AI for analysis
    const contextData = {
      origen,
      destino,
      distanciaKm: distanceKm,
      duracionHoras: durationHours,
      puntosSegurosCercanos: nearRouteSafePoints.map((sp: any) => ({
        nombre: sp.name,
        tipo: sp.type,
        km: sp.km_marker,
        certificacion: sp.certification_level,
        corredor: sp.corridor_id,
        tieneGuardia: sp.has_security_guard,
        cctv: sp.has_visible_cctv,
        militar: sp.has_military_nearby,
        señalCelular: sp.has_cell_signal,
        score: sp.total_score,
      })),
      incidentesRecientes: nearIncidents.map((i: any) => ({
        tipo: i.tipo_incidente,
        municipio: i.municipio,
        severidad: i.severidad,
        fecha: i.fecha_publicacion,
        resumen: (i.resumen_ai || "").substring(0, 100),
      })),
      zonasAltoRiesgo: (deadZones || []).length,
    };

    const systemPrompt = `Eres un analista senior de seguridad logística certificado ISO 28000, especializado en transporte de carga terrestre en México. Tu audiencia es el Head de Seguridad de una empresa de custodias y monitoreo vehicular.

Analiza la ruta ${origen} → ${destino} con los datos operativos proporcionados y genera un informe de inteligencia de ruta.

DATOS DE LA RUTA:
${JSON.stringify(contextData, null, 2)}

INSTRUCCIONES:
- Hora de salida sugerida basada en patrones de criminalidad vial en México (evitar 22:00-05:00 en corredores de riesgo)
- Selecciona las mejores paradas de los puntos seguros reales proporcionados (prioriza oro > plata > bronce)
- Identifica zonas sin señal celular basándote en la geografría de la ruta (sierras, cañones, etc.)
- Califica el nivel de riesgo general de la ruta
- Todas las recomendaciones deben citar cláusulas ISO 28000 relevantes
- El briefing operativo debe ser conciso y accionable para el responsable de seguridad`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Genera el informe de inteligencia para la ruta ${origen} → ${destino}.` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_route_intelligence",
              description: "Generate structured route intelligence report for ISO 28000 compliance",
              parameters: {
                type: "object",
                properties: {
                  horaSalidaSugerida: { type: "string", description: "Hora recomendada de salida (formato HH:MM)" },
                  justificacionHorario: { type: "string", description: "Razón por la que se recomienda esa hora" },
                  etaEstimado: { type: "string", description: "Tiempo estimado de arribo" },
                  paradasRecomendadas: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        nombre: { type: "string" },
                        km: { type: "number" },
                        certificacion: { type: "string" },
                        tiempoParada: { type: "string" },
                        razon: { type: "string" },
                      },
                      required: ["nombre", "km", "certificacion", "tiempoParada", "razon"],
                    },
                  },
                  zonasSinSenal: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        nombre: { type: "string" },
                        kmInicio: { type: "number" },
                        kmFin: { type: "number" },
                        duracionMinutos: { type: "number" },
                        protocolo: { type: "string" },
                      },
                      required: ["nombre", "kmInicio", "kmFin", "duracionMinutos", "protocolo"],
                    },
                  },
                  nivelRiesgoGeneral: { type: "string", enum: ["BAJO", "MEDIO", "ALTO", "CRÍTICO"] },
                  recomendacionesISO28000: {
                    type: "array",
                    items: { type: "string" },
                  },
                  protocoloNocturno: { type: "string" },
                  requiereEscolta: { type: "boolean" },
                  briefingOperativo: { type: "string" },
                },
                required: [
                  "horaSalidaSugerida", "justificacionHorario", "etaEstimado",
                  "paradasRecomendadas", "zonasSinSenal", "nivelRiesgoGeneral",
                  "recomendacionesISO28000", "protocoloNocturno", "requiereEscolta",
                  "briefingOperativo",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_route_intelligence" } },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI Gateway error:", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI Gateway error: ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("AI did not return structured output");
    }

    let agentAnalysis: any;
    try {
      agentAnalysis = JSON.parse(toolCall.function.arguments);
    } catch {
      throw new Error("Failed to parse AI structured output");
    }

    // Return combined data
    return new Response(JSON.stringify({
      ruta: { origen, destino, distanciaKm: distanceKm, duracionHoras: durationHours },
      agentAnalysis,
      puntosSegurosCercanos: nearRouteSafePoints.length,
      incidentesRecientes: nearIncidents.length,
      zonasAltoRiesgo: (deadZones || []).length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Route intelligence error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
