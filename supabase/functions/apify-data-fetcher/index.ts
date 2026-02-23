import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================
// ACTOR SCHEMA REGISTRY
// Maps known Apify actors to their input schema and result parser
// ============================================================

interface ActorSchema {
  buildInput: (searchQueries: string[]) => Record<string, unknown>;
  parseItem: (item: Record<string, unknown>) => ParsedTweet | null;
}

interface ParsedTweet {
  url: string;
  text: string;
  author: string;
  createdAt: string;
  likes: number;
  shares: number;
  comments: number;
  media: string[];
  redSocial: string;
}

const SEARCH_QUERIES = [
  'robo tráiler OR robo camión OR robo tractocamión',
  'roban carga OR roban mercancía',
  'ordeña OR robo combustible OR robo diésel',
  'asalto transportista OR asaltan chofer',
  'bloqueo carretera OR bloqueo autopista',
  'secuestro operador OR secuestro chofer',
  'accidente tráiler OR volcadura',
  '#AlertaCarretera OR #SeguridadVial',
  // Handles se separan automáticamente en twitterHandles por buildInput
  'from:monitorcarrete1',
  'from:jaliscorojo',
  'from:mimorelia',
  'from:GN_Carreteras',
  'from:ABORDOMX',
];

// ---------- scraper_one/x-posts-search (PAY PER EVENT, rating 5.0) ----------
const scraperOneSchema: ActorSchema = {
  buildInput: (queries) => {
    // Este actor acepta UN solo query string. Combinamos todo con OR.
    // Los "from:handle" se incluyen directamente (Twitter search syntax)
    const combinedQuery = queries.join(' OR ');
    return {
      query: combinedQuery,
      resultsCount: 200,
      timeWindow: 7,
      searchType: 'latest',
    };
  },
  parseItem: (item: any) => {
    if (item.noResults) return null;
    const url = item.postUrl || item.url;
    if (!url) return null;
    // timestamp viene como epoch millis (1743097211000)
    const createdAt = item.timestamp
      ? new Date(item.timestamp).toISOString()
      : new Date().toISOString();
    return {
      url,
      text: item.postText || item.text || '',
      author: item.author?.screenName || item.author?.name || 'Desconocido',
      createdAt,
      likes: item.favouriteCount || item.likeCount || 0,
      shares: item.repostCount || item.retweetCount || 0,
      comments: item.replyCount || 0,
      media: (item.media || []).map((m: any) => m.mediaUrlHttps || m.url || '').filter(Boolean),
      redSocial: 'twitter',
    };
  },
};

// ---------- web.harvester/easy-twitter-search-scraper ----------
const webHarvesterSearchSchema: ActorSchema = {
  buildInput: (queries) => ({
    searchQueries: queries,
    tweetsDesired: 200,
    includeUserInfo: true,
  }),
  parseItem: (item: any) => {
    if (item.noResults) return null;
    const url = item.url || item.tweetUrl;
    if (!url) return null;
    return {
      url,
      text: item.text || '',
      author: item.username?.replace('@', '') || item.user?.username || item.fullname || 'Desconocido',
      createdAt: item.timestamp || item.createdAt || new Date().toISOString(),
      likes: item.likes || 0,
      shares: item.retweets || 0,
      comments: item.replies || 0,
      media: extractMediaUrls(item),
      redSocial: 'twitter',
    };
  },
};

// ---------- quacker/twitter-scraper ----------
const quackerSchema: ActorSchema = {
  buildInput: (queries) => ({
    searchTerms: queries,
    maxTweets: 100,
    tweetLanguage: 'es',
    addUserInfo: true,
    scrapeTweetReplies: false,
  }),
  parseItem: (item: any) => {
    const url = item.url || item.tweetUrl || item.link;
    if (!url || item.noResults) return null;
    return {
      url,
      text: item.text || item.full_text || item.content || '',
      author: item.author?.userName || item.author?.name || item.username || item.user?.screen_name || 'Desconocido',
      createdAt: item.createdAt || item.created_at || item.timestamp || new Date().toISOString(),
      likes: item.likeCount || item.likes || item.favoriteCount || 0,
      shares: item.retweetCount || item.shareCount || item.retweets || 0,
      comments: item.replyCount || item.commentCount || item.replies || 0,
      media: extractMediaUrls(item),
      redSocial: 'twitter',
    };
  },
};

// ---------- apidojo~tweet-scraper ----------
const apidojoSchema: ActorSchema = {
  buildInput: (queries) => {
    const searchTerms: string[] = [];
    const twitterHandles: string[] = [];
    for (const q of queries) {
      if (q.startsWith('from:')) {
        twitterHandles.push(q.replace('from:', '').trim());
      } else {
        searchTerms.push(q);
      }
    }
    return {
      searchTerms,
      twitterHandles,
      maxItems: 200,
      sort: 'Latest',
      tweetLanguage: 'es',
      includeSearchTerms: true,
    };
  },
  parseItem: (item: any) => {
    if (item.noResults) return null;
    const url = item.url || item.tweetUrl || item.link;
    if (!url) return null;
    return {
      url,
      text: item.full_text || item.text || item.content || '',
      author: item.user?.screen_name || item.user?.name || item.username || 'Desconocido',
      createdAt: item.created_at || item.createdAt || item.timestamp || new Date().toISOString(),
      likes: item.favorite_count || item.likeCount || 0,
      shares: item.retweet_count || item.retweetCount || 0,
      comments: item.reply_count || item.replyCount || 0,
      media: extractMediaUrls(item),
      redSocial: 'twitter',
    };
  },
};

// ---------- Generic / unknown actor fallback ----------
const genericSchema: ActorSchema = {
  buildInput: (queries) => ({
    search: queries.join(' OR '),
    searchTerms: queries,
    maxTweets: 100,
    maxItems: 100,
    language: 'es',
    country: 'MX',
  }),
  parseItem: (item: any) => {
    if (item.noResults) return null;
    const url = item.url || item.postUrl || item.tweetUrl || item.twitterUrl || item.link || item.permalink;
    if (!url) return null;
    return {
      url,
      text: item.text || item.postText || item.full_text || item.content || item.body || item.description || '',
      author: item.author?.screenName || item.author?.userName || item.author?.name || item.user?.screen_name || item.username || 'Desconocido',
      createdAt: item.createdAt || item.created_at || item.timestamp ? new Date(item.timestamp).toISOString() : new Date().toISOString(),
      likes: item.favouriteCount || item.likeCount || item.likes || 0,
      shares: item.repostCount || item.retweetCount || item.retweets || 0,
      comments: item.replyCount || item.commentCount || item.replies || 0,
      media: extractMediaUrls(item),
      redSocial: detectRedSocial(url, item),
    };
  },
};

function getActorSchema(actorId: string): ActorSchema {
  const id = actorId.toLowerCase();
  if (id.includes('scraper_one') || id.includes('x-posts-search')) {
    console.log('🔧 Usando schema: scraper_one/x-posts-search');
    return scraperOneSchema;
  }
  if (id.includes('easy-twitter-search-scraper') || (id.includes('web.harvester') && id.includes('search'))) {
    console.log('🔧 Usando schema: web.harvester/easy-twitter-search-scraper');
    return webHarvesterSearchSchema;
  }
  if (id.includes('quacker')) {
    console.log('🔧 Usando schema: quacker/twitter-scraper');
    return quackerSchema;
  }
  if (id.includes('apidojo') || id.includes('tweet-scraper')) {
    console.log('🔧 Usando schema: apidojo~tweet-scraper');
    return apidojoSchema;
  }
  console.log('🔧 Usando schema: genérico (actor desconocido)');
  return genericSchema;
}

// ============================================================
// MAIN HANDLER
// ============================================================

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

    // Obtener Actor ID con fallback
    const envActorId = Deno.env.get('APIFY_DEFAULT_ACTOR_ID');
    let ACTOR_ID = actor_id || envActorId || 'scraper_one/x-posts-search';

    // Validar que el Actor ID no sea una URL
    if (ACTOR_ID.includes('http://') || ACTOR_ID.includes('https://')) {
      console.error(`❌ ACTOR_ID inválido (contiene URL): "${ACTOR_ID}"`);
      // Intentar extraer token para usarlo si APIFY_API_KEY falla
      console.log('🔄 Usando fallback: scraper_one/x-posts-search');
      ACTOR_ID = 'scraper_one/x-posts-search';
    }

    // Normalizar separadores: "/" → "~" para la API de Apify
    const ACTOR_ID_API = ACTOR_ID.replace('/', '~');

    console.log(`🔄 Iniciando fetch de Apify Actor: ${ACTOR_ID}`);
    console.log(`📡 Env APIFY_DEFAULT_ACTOR_ID: ${envActorId ? envActorId.substring(0, 30) + '...' : 'no configurado'}`);

    // Seleccionar schema correcto
    const schema = getActorSchema(ACTOR_ID);

    let datasetId: string;

    if (force_run) {
      const inputBody = schema.buildInput(SEARCH_QUERIES);
      console.log('🚀 Ejecutando Actor con input:', JSON.stringify(inputBody).substring(0, 500));

      const runResponse = await fetch(
        `https://api.apify.com/v2/acts/${ACTOR_ID_API}/runs?token=${APIFY_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inputBody),
        }
      );

      if (!runResponse.ok) {
        const errorBody = await runResponse.text();
        console.error(`❌ Error ejecutando Actor (${runResponse.status}): ${errorBody.substring(0, 500)}`);
        throw new Error(`Error ejecutando Actor: ${runResponse.status} ${runResponse.statusText}`);
      }

      const runData = await runResponse.json();
      datasetId = runData.data.defaultDatasetId;

      console.log(`⏳ Run ID: ${runData.data.id}, Dataset: ${datasetId}`);
      await waitForRun(runData.data.id, APIFY_API_KEY);
    } else {
      console.log('📥 Obteniendo último dataset...');
      const runsResponse = await fetch(
        `https://api.apify.com/v2/acts/${ACTOR_ID_API}/runs?token=${APIFY_API_KEY}&limit=1&status=SUCCEEDED`
      );

      if (!runsResponse.ok) {
        throw new Error(`Error obteniendo runs: ${runsResponse.statusText}`);
      }

      const runsData = await runsResponse.json();
      if (!runsData.data.items || runsData.data.items.length === 0) {
        throw new Error('No hay runs exitosos del Actor. Usa force_run=true para ejecutar uno nuevo.');
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

    // Log estructura del primer item para diagnóstico
    if (items.length > 0) {
      console.log('📋 ===== ESTRUCTURA DE ITEMS =====');
      console.log(`📋 Keys: ${JSON.stringify(Object.keys(items[0]))}`);
      console.log(`📋 Primer item (500 chars): ${JSON.stringify(items[0]).substring(0, 500)}`);
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
      no_results_skipped: 0,
      procesados_ai: 0,
    };

    for (const item of items) {
      try {
        // Parse con el schema del actor
        const parsed = schema.parseItem(item);

        if (!parsed) {
          if (item.noResults) {
            results.no_results_skipped++;
          } else {
            results.sin_url++;
            console.warn(`⚠️ Item sin URL parseable. Keys: ${Object.keys(item).slice(0, 8).join(', ')}`);
          }
          continue;
        }

        if (!parsed.text) {
          results.sin_texto++;
        }

        // Check duplicado
        const { data: existente } = await supabase
          .from('incidentes_rrss')
          .select('id')
          .eq('url_publicacion', parsed.url)
          .single();

        if (existente) {
          results.duplicados++;
          continue;
        }

        const { data: incidente, error } = await supabase
          .from('incidentes_rrss')
          .insert({
            red_social: parsed.redSocial,
            apify_actor_id: ACTOR_ID,
            url_publicacion: parsed.url,
            autor: parsed.author,
            fecha_publicacion: parsed.createdAt,
            texto_original: parsed.text,
            hashtags: extractHashtags(parsed.text),
            menciones: extractMentions(parsed.text),
            media_urls: parsed.media,
            engagement_likes: parsed.likes,
            engagement_shares: parsed.shares,
            engagement_comments: parsed.comments,
            tipo_incidente: 'sin_clasificar',
            procesado: false,
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Error insertando:', error.message);
          results.errores++;
          continue;
        }

        results.insertados++;
        console.log(`✅ Insertado ${incidente.id} — @${parsed.author}`);

        // AI processing async
        supabase.functions
          .invoke('procesar-incidente-rrss', {
            body: { incidente_id: incidente.id },
          })
          .then(({ error }) => {
            if (error) console.error('AI error:', error);
            else results.procesados_ai++;
          });
      } catch (itemError) {
        console.error('❌ Error procesando item:', itemError);
        results.errores++;
      }
    }

    console.log('📊 ===== RESULTADOS FINALES =====');
    console.log(`📊 Total: ${results.total} | Insertados: ${results.insertados} | Duplicados: ${results.duplicados}`);
    console.log(`📊 Sin URL: ${results.sin_url} | noResults: ${results.no_results_skipped} | Errores: ${results.errores}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Procesamiento completado',
        stats: results,
        dataset_id: datasetId,
        actor_used: ACTOR_ID,
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

// ============================================================
// HELPERS
// ============================================================

async function waitForRun(runId: string, apiKey: string, maxWait = 120000) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWait) {
    const response = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`);
    const data = await response.json();

    if (data.data.status === 'SUCCEEDED') return;
    if (data.data.status === 'FAILED' || data.data.status === 'ABORTED') {
      throw new Error(`Actor run ${data.data.status}: ${JSON.stringify(data.data.statusMessage || '')}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error('Timeout esperando Actor run');
}

function detectRedSocial(url: string, item: any): string {
  if (url?.includes('twitter.com') || url?.includes('x.com')) return 'twitter';
  if (url?.includes('facebook.com') || url?.includes('fb.com')) return 'facebook';
  if (url?.includes('instagram.com')) return 'instagram';
  if (url?.includes('tiktok.com')) return 'tiktok';
  if (item.retweetCount !== undefined || item.tweetId) return 'twitter';
  return 'desconocido';
}

function extractHashtags(text: string): string[] {
  if (!text) return [];
  return (text.match(/#[\w\u00C0-\u017F]+/g) || []).map((h) => h.toLowerCase());
}

function extractMentions(text: string): string[] {
  if (!text) return [];
  return (text.match(/@[\w\u00C0-\u017F]+/g) || []).map((m) => m.toLowerCase());
}

function extractMediaUrls(item: any): string[] {
  const urls: string[] = [];
  if (item.photos) urls.push(...(Array.isArray(item.photos) ? item.photos : [item.photos]));
  if (item.videos) urls.push(...(Array.isArray(item.videos) ? item.videos : [item.videos]));
  if (item.media)
    urls.push(...(Array.isArray(item.media) ? item.media.map((m: any) => m.url || m) : [item.media]));
  if (item.images) urls.push(...(Array.isArray(item.images) ? item.images : [item.images]));
  return urls.filter(Boolean);
}
