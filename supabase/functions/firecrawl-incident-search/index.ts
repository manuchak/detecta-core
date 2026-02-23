import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SEARCH_QUERIES = [
  '"robo trailer" OR "robo carga" Mexico',
  '"bloqueo carretera" OR "bloqueo autopista" Mexico',
  '"asalto transportista" OR "secuestro operador" Mexico',
  '"accidente trailer" OR "volcadura" carretera Mexico',
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
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured. Enable it in Project Settings > Connectors.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const timeFilter = body.time_filter || 'qdr:w'; // default: last week
    const limit = body.limit || 20;

    const stats = { insertados: 0, duplicados: 0, errores: 0, total_resultados: 0 };

    for (const query of SEARCH_QUERIES) {
      console.log(`Searching: ${query}`);

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
          stats.errores++;
          continue;
        }

        const results = searchData.data || [];
        stats.total_resultados += results.length;
        console.log(`Got ${results.length} results for: ${query}`);

        for (const result of results) {
          const url = result.url;
          if (!url) continue;

          // Dedup by URL
          const { data: existing } = await supabase
            .from('incidentes_rrss')
            .select('id')
            .eq('url_publicacion', url)
            .limit(1);

          if (existing && existing.length > 0) {
            stats.duplicados++;
            continue;
          }

          const textoOriginal = result.markdown || result.description || result.title || '';
          if (!textoOriginal.trim()) continue;

          const redSocial = detectRedSocial(url);

          const { data: inserted, error: insertError } = await supabase
            .from('incidentes_rrss')
            .insert({
              red_social: redSocial,
              texto_original: `${result.title || ''}\n\n${textoOriginal}`.trim(),
              url_publicacion: url,
              autor: result.title || 'Firecrawl Search',
              fecha_publicacion: new Date().toISOString(),
              apify_actor_id: 'firecrawl',
              procesado: false,
            })
            .select('id')
            .single();

          if (insertError) {
            console.error(`Insert error for ${url}:`, insertError);
            stats.errores++;
            continue;
          }

          stats.insertados++;

          // Trigger AI processing
          try {
            await supabase.functions.invoke('procesar-incidente-rrss', {
              body: { incidente_id: inserted.id },
            });
          } catch (procError) {
            console.error(`Processing error for ${inserted.id}:`, procError);
          }
        }
      } catch (queryError) {
        console.error(`Error processing query "${query}":`, queryError);
        stats.errores++;
      }
    }

    console.log('Final stats:', stats);

    return new Response(
      JSON.stringify({ success: true, stats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in firecrawl-incident-search:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
