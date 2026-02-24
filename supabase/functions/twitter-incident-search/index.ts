import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TWITTER_API_BASE = 'https://api.x.com/2';

// ── OAuth 1.0a helpers ──────────────────────────────────────────────

function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

function generateNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  for (const byte of arr) {
    result += chars[byte % chars.length];
  }
  return result;
}

async function hmacSha1(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function buildOAuthHeader(
  method: string,
  url: string,
  queryParams: Record<string, string>,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessTokenSecret: string,
): Promise<string> {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: generateNonce(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: '1.0',
  };

  const allParams: Record<string, string> = { ...oauthParams, ...queryParams };
  const paramString = Object.keys(allParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join('&');

  const signatureBase = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(paramString)}`;
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(accessTokenSecret)}`;
  const signature = await hmacSha1(signingKey, signatureBase);

  oauthParams['oauth_signature'] = signature;

  const headerParts = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(', ');

  return `OAuth ${headerParts}`;
}

// ── Keyword queries (siempre se ejecutan) ───────────────────────────

const KEYWORD_QUERIES = [
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let maxResults = 25;
    try {
      const body = await req.json();
      if (body.max_results) maxResults = Math.min(body.max_results, 100);
    } catch { /* no body is fine */ }

    // ── Build queries dynamically from DB ──────────────────────────
    const { data: monitoredAccounts } = await supabase
      .from('twitter_monitored_accounts')
      .select('username')
      .eq('activa', true);

    const queriesToRun = [...KEYWORD_QUERIES];

    if (monitoredAccounts && monitoredAccounts.length > 0) {
      // Split into chunks of 5 accounts per query (Twitter OR limit)
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

      const searchUrl = `${TWITTER_API_BASE}/tweets/search/recent`;
      const queryParams: Record<string, string> = {
        query,
        max_results: maxResults.toString(),
        'tweet.fields': 'created_at,public_metrics,geo,entities,author_id',
        'user.fields': 'username,name',
        expansions: 'author_id,attachments.media_keys',
        'media.fields': 'url,preview_image_url,type',
      };

      const authHeader = await buildOAuthHeader(
        'GET', searchUrl, queryParams,
        consumerKey, consumerSecret, accessToken, accessTokenSecret,
      );

      const qs = Object.entries(queryParams)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');

      const response = await fetch(`${searchUrl}?${qs}`, {
        method: 'GET',
        headers: { Authorization: authHeader },
      });

      const remaining = response.headers.get('x-rate-limit-remaining');
      if (remaining && parseInt(remaining) <= 2) {
        console.warn('⚠️ Rate limit casi agotado');
        results.rate_limited = true;
      }

      if (response.status === 429) {
        console.warn('🛑 Rate limited por Twitter API');
        results.rate_limited = true;
        break;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Twitter API error [${response.status}]: ${errorText}`);
        results.errores++;
        continue;
      }

      const data = await response.json();
      results.queries_ejecutadas++;

      if (!data.data || data.data.length === 0) {
        console.log('📭 Sin resultados para esta query');
        continue;
      }

      const usersMap: Record<string, { username: string; name: string }> = {};
      if (data.includes?.users) {
        for (const u of data.includes.users) {
          usersMap[u.id] = { username: u.username, name: u.name };
        }
      }

      const mediaMap: Record<string, string> = {};
      if (data.includes?.media) {
        for (const m of data.includes.media) {
          mediaMap[m.media_key] = m.url || m.preview_image_url || '';
        }
      }

      for (const tweet of data.data) {
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
