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

    // LOGGING EXTENSIVO: Mostrar estructura del primer item
    if (items.length > 0) {
      console.log('📋 ===== ESTRUCTURA DE ITEMS =====');
      console.log(`📋 Keys del primer item: ${JSON.stringify(Object.keys(items[0]))}`);
      console.log(`📋 Ejemplo item (primeros 1000 chars): ${JSON.stringify(items[0]).substring(0, 1000)}`);
      
      // Buscar campos de URL disponibles
      const urlFields = ['url', 'postUrl', 'tweetUrl', 'twitterUrl', 'link', 'permalink'];
      const foundUrlFields = urlFields.filter(field => items[0][field] !== undefined);
      console.log(`📋 Campos de URL encontrados: ${foundUrlFields.length > 0 ? foundUrlFields.join(', ') : 'NINGUNO'}`);
      
      // Buscar campos de texto disponibles
      const textFields = ['text', 'caption', 'full_text', 'content', 'body', 'description'];
      const foundTextFields = textFields.filter(field => items[0][field] !== undefined);
      console.log(`📋 Campos de texto encontrados: ${foundTextFields.length > 0 ? foundTextFields.join(', ') : 'NINGUNO'}`);
      
      // Buscar campos de autor disponibles
      console.log(`📋 Campo author: ${JSON.stringify(items[0].author || 'NO EXISTE')}`);
      console.log(`📋 Campo user: ${JSON.stringify(items[0].user || 'NO EXISTE')}`);
      console.log(`📋 Campo username: ${items[0].username || 'NO EXISTE'}`);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results = {
      total: items.length,
      insertados: 0,
      duplicados: 0,
      errores: 0,
      sin_url: 0,
      sin_texto: 0,
      procesados_ai: 0
    };

    for (const item of items) {
      try {
        // Buscar URL en múltiples campos posibles
        const url = item.url || item.postUrl || item.tweetUrl || item.twitterUrl || item.link || item.permalink;
        
        if (!url) {
          results.sin_url++;
          console.warn(`⚠️ Item #${results.sin_url} sin URL. Keys disponibles: ${Object.keys(item).slice(0, 10).join(', ')}`);
          continue;
        }

        // Buscar texto en múltiples campos posibles
        const texto = item.text || item.caption || item.full_text || item.content || item.body || item.description || '';
        
        if (!texto) {
          results.sin_texto++;
          console.warn(`⚠️ Item sin texto pero con URL: ${url.substring(0, 50)}`);
        }

        // Buscar autor de forma flexible
        const autor = item.author?.userName || 
                     item.author?.name || 
                     item.author?.username ||
                     item.user?.screen_name || 
                     item.user?.name ||
                     item.username || 
                     item.userName ||
                     'Desconocido';

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
            red_social: detectRedSocial(url, item),
            apify_actor_id: ACTOR_ID,
            url_publicacion: url,
            autor: autor,
            fecha_publicacion: item.createdAt || item.created_at || item.timestamp || new Date().toISOString(),
            texto_original: texto,
            hashtags: extractHashtags(texto),
            menciones: extractMentions(texto),
            media_urls: extractMediaUrls(item),
            engagement_likes: item.likeCount || item.likes || item.favoriteCount || 0,
            engagement_shares: item.retweetCount || item.shareCount || item.retweets || 0,
            engagement_comments: item.replyCount || item.commentCount || item.replies || 0,
            tipo_incidente: 'sin_clasificar',
            procesado: false
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Error insertando:', error.message);
          results.errores++;
          continue;
        }

        results.insertados++;
        console.log(`✅ Insertado incidente ${incidente.id} - ${autor}`);

        // Invocar procesamiento AI de forma asíncrona
        supabase.functions.invoke('procesar-incidente-rrss', {
          body: { incidente_id: incidente.id }
        }).then(({ data, error }) => {
          if (error) {
            console.error('Error en procesamiento AI:', error);
          } else {
            console.log(`🤖 Incidente ${incidente.id} procesado por AI`);
            results.procesados_ai++;
          }
        });

      } catch (itemError) {
        console.error('❌ Error procesando item:', itemError);
        results.errores++;
      }
    }

    console.log('📊 ===== RESULTADOS FINALES =====');
    console.log(`📊 Total items: ${results.total}`);
    console.log(`📊 Insertados: ${results.insertados}`);
    console.log(`📊 Duplicados: ${results.duplicados}`);
    console.log(`📊 Sin URL: ${results.sin_url}`);
    console.log(`📊 Sin texto: ${results.sin_texto}`);
    console.log(`📊 Errores: ${results.errores}`);

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

function detectRedSocial(url: string, item: any): string {
  if (url?.includes('twitter.com') || url?.includes('x.com')) return 'twitter';
  if (url?.includes('facebook.com') || url?.includes('fb.com')) return 'facebook';
  if (url?.includes('instagram.com')) return 'instagram';
  if (url?.includes('tiktok.com')) return 'tiktok';
  // Fallback basado en estructura del item
  if (item.retweetCount !== undefined || item.tweetId) return 'twitter';
  if (item.fbId || item.facebookId) return 'facebook';
  return 'desconocido';
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
  if (item.media) urls.push(...(Array.isArray(item.media) ? item.media.map((m: any) => m.url || m) : [item.media]));
  if (item.images) urls.push(...(Array.isArray(item.images) ? item.images : [item.images]));
  return urls.filter(Boolean);
}
