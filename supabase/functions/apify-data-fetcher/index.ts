import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const APIFY_API_KEY = Deno.env.get('APIFY_API_KEY');
    if (!APIFY_API_KEY) {
      throw new Error('APIFY_API_KEY no configurada');
    }

    const { actor_id, force_run = false } = await req.json().catch(() => ({}));
    
    // Obtener Actor ID con fallback por defecto
    const envActorId = Deno.env.get('APIFY_DEFAULT_ACTOR_ID');
    let ACTOR_ID = actor_id || envActorId || 'apidojo~tweet-scraper';
    
    // Validar que el Actor ID no sea una URL (error común de configuración)
    if (ACTOR_ID.includes('http://') || ACTOR_ID.includes('https://')) {
      console.error(`❌ ACTOR_ID inválido (contiene URL): "${ACTOR_ID}"`);
      console.log('🔄 Usando fallback: apidojo~tweet-scraper');
      ACTOR_ID = 'apidojo~tweet-scraper';
    }
    
    // Validar formato correcto (username~actor-name)
    if (!ACTOR_ID.includes('~') && !ACTOR_ID.includes('/')) {
      console.warn(`⚠️ ACTOR_ID podría tener formato incorrecto: "${ACTOR_ID}"`);
    }

    console.log(`🔄 Iniciando fetch de Apify Actor: ${ACTOR_ID}`);
    console.log(`📡 Env APIFY_DEFAULT_ACTOR_ID: ${envActorId ? envActorId.substring(0, 20) + '...' : 'no configurado'}`);

    let datasetId: string;

    if (force_run) {
      console.log('🚀 Ejecutando Actor...');
      const runResponse = await fetch(
        `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            search: [
              'robo tráiler OR robo camión OR robo tractocamión',
              'roban carga OR roban mercancía',
              'ordeña OR robo combustible OR robo diésel',
              'asalto transportista OR asaltan chofer',
              'bloqueo carretera OR bloqueo autopista',
              'secuestro operador OR secuestro chofer',
              'accidente tráiler OR volcadura',
              'robo autopartes camión',
              '#AlertaCarretera OR #SeguridadVial'
            ].join(' OR '),
            maxTweets: 100,
            language: 'es',
            country: 'MX'
          })
        }
      );

      if (!runResponse.ok) {
        throw new Error(`Error ejecutando Actor: ${runResponse.statusText}`);
      }

      const runData = await runResponse.json();
      datasetId = runData.data.defaultDatasetId;
      
      console.log('⏳ Esperando a que termine la ejecución...');
      await waitForRun(runData.data.id, APIFY_API_KEY);
      
    } else {
      console.log('📥 Obteniendo último dataset...');
      const runsResponse = await fetch(
        `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_API_KEY}&limit=1&status=SUCCEEDED`
      );
      
      if (!runsResponse.ok) {
        throw new Error(`Error obteniendo runs: ${runsResponse.statusText}`);
      }
      
      const runsData = await runsResponse.json();
      if (!runsData.data.items || runsData.data.items.length === 0) {
        throw new Error('No hay runs exitosos del Actor');
      }
      
      datasetId = runsData.data.items[0].defaultDatasetId;
    }

    console.log(`📦 Descargando items del dataset ${datasetId}...`);
    const itemsResponse = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_KEY}&clean=true`
    );

    if (!itemsResponse.ok) {
      throw new Error(`Error obteniendo items: ${itemsResponse.statusText}`);
    }

    const items = await itemsResponse.json();
    console.log(`✅ Descargados ${items.length} items`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results = {
      total: items.length,
      insertados: 0,
      duplicados: 0,
      errores: 0,
      procesados_ai: 0
    };

    for (const item of items) {
      try {
        const url = item.url || item.postUrl;
        if (!url) continue;

        const { data: existente } = await supabase
          .from('incidentes_rrss')
          .select('id')
          .eq('url_publicacion', url)
          .single();

        if (existente) {
          results.duplicados++;
          continue;
        }

        const { data: incidente, error } = await supabase
          .from('incidentes_rrss')
          .insert({
            red_social: detectRedSocial(item),
            apify_actor_id: ACTOR_ID,
            url_publicacion: url,
            autor: item.author?.userName || item.username || 'Desconocido',
            fecha_publicacion: item.createdAt || new Date().toISOString(),
            texto_original: item.text || item.caption || '',
            hashtags: extractHashtags(item.text || item.caption),
            menciones: extractMentions(item.text || item.caption),
            media_urls: extractMediaUrls(item),
            engagement_likes: item.likeCount || 0,
            engagement_shares: item.retweetCount || item.shareCount || 0,
            engagement_comments: item.replyCount || item.commentCount || 0,
            tipo_incidente: 'sin_clasificar',
            procesado: false
          })
          .select()
          .single();

        if (error) {
          console.error('Error insertando:', error);
          results.errores++;
          continue;
        }

        results.insertados++;

        supabase.functions.invoke('procesar-incidente-rrss', {
          body: { incidente_id: incidente.id }
        }).then(({ data, error }) => {
          if (error) {
            console.error('Error en procesamiento AI:', error);
          } else {
            console.log(`✅ Incidente ${incidente.id} procesado`);
            results.procesados_ai++;
          }
        });

      } catch (itemError) {
        console.error('Error procesando item:', itemError);
        results.errores++;
      }
    }

    console.log('📊 Resultados:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Procesamiento completado',
        stats: results,
        dataset_id: datasetId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function waitForRun(runId: string, apiKey: string, maxWait = 120000) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWait) {
    const response = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`
    );
    const data = await response.json();
    
    if (data.data.status === 'SUCCEEDED') {
      return;
    } else if (data.data.status === 'FAILED') {
      throw new Error('Actor run failed');
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  throw new Error('Timeout esperando Actor run');
}

function detectRedSocial(item: any): string {
  if (item.url?.includes('twitter.com') || item.url?.includes('x.com')) return 'twitter';
  if (item.url?.includes('facebook.com')) return 'facebook';
  return 'twitter';
}

function extractHashtags(text: string): string[] {
  if (!text) return [];
  return (text.match(/#[\w\u00C0-\u017F]+/g) || []).map(h => h.toLowerCase());
}

function extractMentions(text: string): string[] {
  if (!text) return [];
  return (text.match(/@[\w\u00C0-\u017F]+/g) || []).map(m => m.toLowerCase());
}

function extractMediaUrls(item: any): string[] {
  const urls: string[] = [];
  if (item.photos) urls.push(...(Array.isArray(item.photos) ? item.photos : [item.photos]));
  if (item.videos) urls.push(...(Array.isArray(item.videos) ? item.videos : [item.videos]));
  return urls.filter(Boolean);
}
