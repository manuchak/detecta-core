import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { Client, OAuth1 } from "https://esm.sh/@xdevplatform/xdk@0.4.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Fallback keyword queries (si la tabla está vacía) ───────────────
const FALLBACK_KEYWORD_QUERIES = [
  'robo trailer OR robo carga -is:retweet lang:es',
  'bloqueo carretera OR narcobloqueo -is:retweet lang:es',
  'asalto transportista OR secuestro operador -is:retweet lang:es',
];

// ── Helpers ─────────────────────────────────────────────────────────

function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w\u00C0-\u024F]+/g);
  return matches ? matches.map((h) => h.toLowerCase()) : [];
}

function extractMentions(text: string): string[] {
  const matches = text.match(/@[\w]+/g);
  return matches ? matches.map((m) => m.toLowerCase()) : [];
}

function buildTweetUrl(username: string, tweetId: string): string {
  return `https://x.com/${username}/status/${tweetId}`;
}

// ── Main ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const consumerKey = Deno.env.get('TWITTER_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('TWITTER_CONSUMER_SECRET');
    const accessToken = Deno.env.get('TWITTER_ACCESS_TOKEN');
    const accessTokenSecret = Deno.env.get('TWITTER_ACCESS_TOKEN_SECRET');

    if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
      throw new Error('Missing Twitter API credentials in environment');
    }

    // ── XDK OAuth 1.0a client ───────────────────────────────────────
    const oauth1 = new OAuth1({
      apiKey: consumerKey,
      apiSecret: consumerSecret,
      accessToken,
      accessTokenSecret,
    });
    const xClient = new Client({ oauth1 });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let maxResults = 25;
    try {
      const body = await req.json();
      if (body.max_results) maxResults = Math.min(body.max_results, 100);
    } catch { /* no body is fine */ }

    // ── Build queries dynamically from DB ──────────────────────────
    // 1. Read active keywords from DB
    const { data: dbKeywords } = await supabase
      .from('twitter_search_keywords')
      .select('query_text')
      .eq('activa', true);

    const keywordQueries = dbKeywords && dbKeywords.length > 0
      ? dbKeywords.map((k: any) => k.query_text)
      : FALLBACK_KEYWORD_QUERIES;

    // 2. Read active monitored accounts
    const { data: monitoredAccounts } = await supabase
      .from('twitter_monitored_accounts')
      .select('username')
      .eq('activa', true);

    const queriesToRun = [...keywordQueries];

    if (monitoredAccounts && monitoredAccounts.length > 0) {
      const chunks: string[][] = [];
      for (let i = 0; i < monitoredAccounts.length; i += 5) {
        chunks.push(monitoredAccounts.slice(i, i + 5).map((a: any) => a.username));
      }
      for (const chunk of chunks) {
        queriesToRun.push(chunk.map((u) => `from:${u}`).join(' OR '));
      }
    }

    console.log(`📋 Queries a ejecutar: ${queriesToRun.length} (${monitoredAccounts?.length ?? 0} cuentas activas)`);

    const results = {
      total_tweets: 0,
      insertados: 0,
      duplicados: 0,
      errores: 0,
      procesados_ai: 0,
      queries_ejecutadas: 0,
      rate_limited: false,
    };

    for (const query of queriesToRun) {
      console.log(`🔍 Buscando: "${query}"`);

      try {
        const response = await xClient.posts.searchRecent(query, {
          maxResults,
          tweetfields: ['created_at', 'public_metrics', 'geo', 'entities', 'author_id'],
          userfields: ['username', 'name'],
          expansions: ['author_id', 'attachments.media_keys'],
          mediafields: ['url', 'preview_image_url', 'type'],
        });

        results.queries_ejecutadas++;

        if (!response.data || response.data.length === 0) {
          console.log('📭 Sin resultados para esta query');
          continue;
        }

        // Build user lookup map from includes
        const usersMap: Record<string, { username: string; name: string }> = {};
        if (response.includes?.users) {
          for (const u of response.includes.users) {
            usersMap[u.id] = { username: u.username, name: u.name };
          }
        }

        // Build media lookup map from includes
        const mediaMap: Record<string, string> = {};
        if (response.includes?.media) {
          for (const m of response.includes.media) {
            mediaMap[m.media_key] = m.url || m.preview_image_url || '';
          }
        }

        for (const tweet of response.data) {
          results.total_tweets++;

          const user = usersMap[tweet.author_id] || { username: 'unknown', name: 'Unknown' };
          const tweetUrl = buildTweetUrl(user.username, tweet.id);

          const { data: existente } = await supabase
            .from('incidentes_rrss')
            .select('id')
            .eq('url_publicacion', tweetUrl)
            .single();

          if (existente) {
            results.duplicados++;
            continue;
          }

          const mediaUrls: string[] = [];
          if (tweet.attachments?.media_keys) {
            for (const mk of tweet.attachments.media_keys) {
              if (mediaMap[mk]) mediaUrls.push(mediaMap[mk]);
            }
          }

          const metrics = tweet.public_metrics || {};

          const { data: incidente, error } = await supabase
            .from('incidentes_rrss')
            .insert({
              red_social: 'twitter',
              url_publicacion: tweetUrl,
              autor: user.username,
              fecha_publicacion: tweet.created_at,
              texto_original: tweet.text,
              hashtags: extractHashtags(tweet.text),
              menciones: extractMentions(tweet.text),
              media_urls: mediaUrls.length > 0 ? mediaUrls : null,
              engagement_likes: metrics.like_count || 0,
              engagement_shares: metrics.retweet_count || 0,
              engagement_comments: metrics.reply_count || 0,
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
          console.log(`✅ Insertado ${incidente.id} — @${user.username}: ${tweet.text.substring(0, 60)}...`);

          supabase.functions
            .invoke('procesar-incidente-rrss', { body: { incidente_id: incidente.id } })
            .then(({ error: aiError }) => {
              if (aiError) console.error('AI error:', aiError);
              else results.procesados_ai++;
            });
        }
      } catch (err: unknown) {
        // Handle rate limiting from XDK
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate limit')) {
          console.warn('🛑 Rate limited por Twitter API');
          results.rate_limited = true;
          break;
        }
        console.error(`❌ Error en query "${query}":`, errorMessage);
        results.errores++;
        continue;
      }

      if (results.rate_limited) break;
    }

    // ── Register usage in twitter_api_usage ─────────────────────────
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('twitter_api_usage').insert({
      fecha: today,
      tweets_leidos: results.total_tweets,
      queries_ejecutadas: results.queries_ejecutadas,
      tweets_insertados: results.insertados,
      tweets_duplicados: results.duplicados,
      rate_limited: results.rate_limited,
    });

    console.log('📊 Resultados finales:', JSON.stringify(results));

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in twitter-incident-search:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    );
  }
});
