import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SEARCH_QUERIES = [
  '"robo trailer" OR "robo carga" Mexico',
  '"bloqueo carretera" OR "bloqueo autopista" Mexico',
  '"asalto transportista" OR "secuestro operador" Mexico',
  '"accidente trailer" OR "volcadura" carretera Mexico',
  '"robo combustible" OR "ordeña diesel" Mexico',
  '"extorsion transportista" OR "cobro piso" carretera Mexico',
  '"inseguridad autopista" OR "zona peligrosa" transporte Mexico',
  // Fuentes especializadas en transporte y logística
  'site:t21.com.mx robo OR asalto OR bloqueo OR inseguridad',
  'site:tyt.com.mx OR site:canacar.com.mx robo carga inseguridad',
  'site:elfinanciero.com.mx robo transporte carga carretera Mexico',
  '"secretariado ejecutivo" robo transporte OR "incidencia delictiva" carretera',
  '"alerta vial" OR "cierre carretero" OR "peligro carretera" transporte carga Mexico',
  // Narcobloqueos y violencia regional
  '"narcobloqueo" OR "narco bloqueo" Jalisco OR Michoacan OR Tamaulipas OR Guanajuato',
  '"quema vehiculos" OR "jornada violencia" OR "quema de vehiculos" carretera Mexico',
  '"cierre autopista" OR "cierre carretera" OR "paro transportistas" Mexico',
  // Menciones web de cuentas Twitter especializadas
  '"@monitorcarrete1" OR "Monitor Carretero" bloqueo OR cierre carretera Mexico',
  '"@jaliscorojo" OR "@mimorelia" bloqueo OR narcobloqueo carretera',
];

function detectRedSocial(url: string): string {
  const u = url.toLowerCase();
  if (u.includes('twitter.com') || u.includes('x.com')) return 'twitter';
  if (u.includes('facebook.com') || u.includes('fb.com')) return 'facebook';
  if (u.includes('instagram.com')) return 'instagram';
  if (u.includes('tiktok.com')) return 'tiktok';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('reddit.com')) return 'reddit';
  if (u.includes('t21.com.mx') || u.includes('tyt.com.mx') || u.includes('canacar.com.mx')) return 'transporte';
  if (u.includes('elfinanciero') || u.includes('abordo')) return 'logistica';
  if (u.includes('gob.mx') || u.includes('gobierno')) return 'gobierno';
  if (u.includes('eluniversal') || u.includes('milenio') || u.includes('reforma') || u.includes('jornada') || u.includes('excelsior') || u.includes('proceso') || u.includes('informador') || u.includes('noticias') || u.includes('heraldo') || u.includes('sdpnoticias')) return 'noticias';
  return 'web';
}

// ── AI Relevance Filter ──────────────────────────────────────────────
async function filtrarRelevanciaAI(
  textos: { idx: number; texto: string }[],
  apiKey: string
): Promise<Map<number, { es_real: boolean; score: number; motivo: string }>> {
  const results = new Map<number, { es_real: boolean; score: number; motivo: string }>();

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    // If no AI key, let everything through with neutral score
    textos.forEach(t => results.set(t.idx, { es_real: true, score: 50, motivo: '' }));
    return results;
  }

  // Process in batches of 5
  for (let i = 0; i < textos.length; i += 5) {
    const batch = textos.slice(i, i + 5);
    const batchPrompt = batch.map((t, j) => `[${j}] "${t.texto.substring(0, 500)}"`).join('\n\n');

    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          temperature: 0.1,
          messages: [
            {
              role: 'system',
              content: `Eres un filtro de calidad para inteligencia de seguridad en transporte de carga en México.
Tu trabajo es determinar si cada texto describe un INCIDENTE REAL que afecta al transporte de carga.

ACEPTAR (es_incidente_real=true):
- Robos de carga, tráileres, combustible
- Asaltos a transportistas/operadores
- Bloqueos de carreteras que afectan logística
- Secuestros de operadores
- Extorsión a transportistas
- Accidentes de tráileres/camiones de carga
- Alertas viales de seguridad en rutas de transporte

RECHAZAR (es_incidente_real=false):
- Artículos de opinión sin incidente específico
- Noticias de otros países (no México)
- Contenido publicitario
- Incidentes que NO involucran transporte de carga (robos a casa habitación, delitos comunes urbanos)
- Noticias repetitivas sin datos nuevos o específicos
- Contenido irrelevante para seguridad en transporte`
            },
            {
              role: 'user',
              content: `Evalúa estos ${batch.length} textos. Para CADA uno, llama la función con el índice correspondiente:\n\n${batchPrompt}`
            }
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'filtrar_relevancia_incidentes',
              description: 'Evalúa la relevancia de múltiples textos para inteligencia de transporte de carga',
              parameters: {
                type: 'object',
                properties: {
                  evaluaciones: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        indice: { type: 'integer', description: 'Índice del texto [0], [1], etc.' },
                        es_incidente_real: { type: 'boolean', description: 'Es un incidente real de transporte de carga en México?' },
                        relevancia_score: { type: 'integer', description: 'Score de relevancia 0-100 para inteligencia de seguridad en transporte' },
                        motivo_descarte: { type: 'string', description: 'Si se descarta, razón breve' }
                      },
                      required: ['indice', 'es_incidente_real', 'relevancia_score']
                    }
                  }
                },
                required: ['evaluaciones']
              }
            }
          }],
          tool_choice: { type: 'function', function: { name: 'filtrar_relevancia_incidentes' } }
        }),
      });

      if (!response.ok) {
        await response.text();
        batch.forEach(t => results.set(t.idx, { es_real: true, score: 50, motivo: '' }));
        continue;
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const parsed = JSON.parse(toolCall.function.arguments);
        const evaluaciones = parsed.evaluaciones || [];
        evaluaciones.forEach((ev: any) => {
          const realIdx = batch[ev.indice]?.idx;
          if (realIdx !== undefined) {
            results.set(realIdx, {
              es_real: ev.es_incidente_real,
              score: ev.relevancia_score,
              motivo: ev.motivo_descarte || '',
            });
          }
        });
      }
      // Fill missing with defaults
      batch.forEach(t => {
        if (!results.has(t.idx)) results.set(t.idx, { es_real: true, score: 50, motivo: '' });
      });

    } catch (err) {
      console.error('AI filter batch error:', err);
      batch.forEach(t => results.set(t.idx, { es_real: true, score: 50, motivo: '' }));
    }
  }

  return results;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const timeFilter = body.time_filter || 'qdr:w';
    const limit = body.limit || 50;
    const totalSteps = SEARCH_QUERIES.length;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const emit = (event: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
        };

        const globalStats = { insertados: 0, duplicados: 0, errores: 0, total_resultados: 0, descartados_ai: 0 };

        for (let i = 0; i < SEARCH_QUERIES.length; i++) {
          const query = SEARCH_QUERIES[i];
          const step = i + 1;

          emit({ step, total_steps: totalSteps, query, status: 'searching' });

          try {
            const response = await fetch('https://api.firecrawl.dev/v1/search', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                query,
                limit,
                lang: 'es',
                country: 'MX',
                tbs: timeFilter,
                scrapeOptions: { formats: ['markdown'] },
              }),
            });

            const searchData = await response.json();

            if (!response.ok) {
              console.error(`Firecrawl error for query "${query}":`, searchData);
              globalStats.errores++;
              emit({ step, total_steps: totalSteps, query, status: 'error', error: searchData.error || 'API error' });
              continue;
            }

            const results = searchData.data || [];
            globalStats.total_resultados += results.length;

            emit({ step, total_steps: totalSteps, query, status: 'inserting', found: results.length });

            // Batch dedup
            const urls = results.map((r: any) => r.url).filter(Boolean);
            let existingUrls: Set<string> = new Set();
            if (urls.length > 0) {
              const { data: existing } = await supabase
                .from('incidentes_rrss')
                .select('url_publicacion')
                .in('url_publicacion', urls);
              existingUrls = new Set((existing || []).map((e: any) => e.url_publicacion));
            }

            // Build candidate list (non-dupe, non-empty)
            const candidates: { idx: number; result: any; texto: string }[] = [];
            for (let j = 0; j < results.length; j++) {
              const result = results[j];
              const url = result.url;
              if (!url) continue;
              if (existingUrls.has(url)) {
                globalStats.duplicados++;
                continue;
              }
              const textoOriginal = result.markdown || result.description || result.title || '';
              if (!textoOriginal.trim()) continue;
              candidates.push({ idx: j, result, texto: `${result.title || ''}\n${textoOriginal}`.substring(0, 600) });
            }

            // ── AI Relevance Filter ──
            let relevanciaMap = new Map<number, { es_real: boolean; score: number; motivo: string }>();
            if (candidates.length > 0) {
              relevanciaMap = await filtrarRelevanciaAI(
                candidates.map(c => ({ idx: c.idx, texto: c.texto })),
                apiKey
              );
            }

            // Prepare batch insert (only relevant ones)
            const registros: any[] = [];
            let descartados = 0;
            for (const candidate of candidates) {
              const rel = relevanciaMap.get(candidate.idx);
              if (rel && (!rel.es_real || rel.score < 40)) {
                descartados++;
                console.log(`🚫 Descartado (score=${rel.score}): ${candidate.result.title?.substring(0, 60) || candidate.result.url}`);
                continue;
              }

              const result = candidate.result;
              const meta = result.metadata || {};
              const rawDate = meta.publishedTime || meta.published_time || meta.datePublished
                || meta.date_published || meta.article_published_time || meta.ogArticlePublishedTime
                || meta.modifiedTime || meta.dateModified || null;

              let fechaPublicacion = new Date().toISOString();
              if (rawDate) {
                try {
                  const parsed = new Date(rawDate);
                  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000) {
                    fechaPublicacion = parsed.toISOString();
                  }
                } catch { /* fallback */ }
              }

              registros.push({
                red_social: detectRedSocial(result.url),
                texto_original: `${result.title || ''}\n\n${result.markdown || result.description || ''}`.trim(),
                url_publicacion: result.url,
                autor: result.title || 'Firecrawl Search',
                fecha_publicacion: fechaPublicacion,
                apify_actor_id: 'firecrawl',
                procesado: false,
                relevancia_score: rel?.score ?? null,
              });
            }

            globalStats.descartados_ai += descartados;

            let insertedIds: string[] = [];
            if (registros.length > 0) {
              const { data: inserted, error: insertError } = await supabase
                .from('incidentes_rrss')
                .insert(registros)
                .select('id');

              if (insertError) {
                console.error(`Batch insert error for query "${query}":`, insertError);
                globalStats.errores += registros.length;
              } else {
                insertedIds = (inserted || []).map((r: any) => r.id);
                globalStats.insertados += insertedIds.length;
              }
            }

            // Fire-and-forget AI processing
            for (const id of insertedIds) {
              supabase.functions.invoke('procesar-incidente-rrss', {
                body: { incidente_id: id },
              }).catch((err: any) => console.error(`AI processing error for ${id}:`, err));
            }

            emit({
              step,
              total_steps: totalSteps,
              query,
              status: 'done',
              found: results.length,
              inserted: insertedIds.length,
              dupes: globalStats.duplicados,
              descartados_ai: descartados,
              errors: 0,
            });
          } catch (queryError) {
            console.error(`Error processing query "${query}":`, queryError);
            globalStats.errores++;
            emit({ step, total_steps: totalSteps, query, status: 'error', error: String(queryError) });
          }
        }

        emit({ done: true, stats: globalStats });
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Error in firecrawl-incident-search:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
