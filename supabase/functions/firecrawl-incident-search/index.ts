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
];

function detectRedSocial(url: string): string {
  const u = url.toLowerCase();
  if (u.includes('twitter.com') || u.includes('x.com')) return 'twitter';
  if (u.includes('facebook.com') || u.includes('fb.com')) return 'facebook';
  if (u.includes('instagram.com')) return 'instagram';
  if (u.includes('tiktok.com')) return 'tiktok';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('reddit.com')) return 'reddit';
  if (u.includes('gob.mx') || u.includes('gobierno')) return 'gobierno';
  if (u.includes('eluniversal') || u.includes('milenio') || u.includes('reforma') || u.includes('jornada') || u.includes('excelsior') || u.includes('proceso') || u.includes('informador') || u.includes('noticias') || u.includes('heraldo') || u.includes('sdpnoticias')) return 'noticias';
  return 'web';
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
    const limit = body.limit || 20;
    const totalSteps = SEARCH_QUERIES.length;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const emit = (event: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
        };

        const globalStats = { insertados: 0, duplicados: 0, errores: 0, total_resultados: 0 };

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

            // Prepare batch insert
            const registros: any[] = [];
            for (const result of results) {
              const url = result.url;
              if (!url) continue;
              if (existingUrls.has(url)) {
                globalStats.duplicados++;
                continue;
              }

              const textoOriginal = result.markdown || result.description || result.title || '';
              if (!textoOriginal.trim()) continue;

              // Extract real publication date from metadata
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
                } catch { /* fallback to current date */ }
              }

              registros.push({
                red_social: detectRedSocial(url),
                texto_original: `${result.title || ''}\n\n${textoOriginal}`.trim(),
                url_publicacion: url,
                autor: result.title || 'Firecrawl Search',
                fecha_publicacion: fechaPublicacion,
                apify_actor_id: 'firecrawl',
                procesado: false,
              });
            }

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
              dupes: results.length - insertedIds.length - (registros.length - insertedIds.length),
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
