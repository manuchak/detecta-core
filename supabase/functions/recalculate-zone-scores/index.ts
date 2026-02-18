import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { h3Indices } = await req.json();

    if (!h3Indices || !Array.isArray(h3Indices) || h3Indices.length === 0) {
      return new Response(
        JSON.stringify({ error: 'h3Indices array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Recalculating scores for ${h3Indices.length} zones...`);

    const results = [];
    const errors = [];

    for (const h3Index of h3Indices) {
      try {
        const { error: calcError } = await supabase.rpc('recalculate_zone_score', {
          p_h3_index: h3Index
        });

        if (calcError) {
          console.error(`Error recalculating zone ${h3Index}:`, calcError);
          errors.push({ h3Index, error: calcError.message });
        } else {
          results.push({ h3Index, status: 'success' });
        }
      } catch (error) {
        console.error(`Exception recalculating zone ${h3Index}:`, error);
        errors.push({ h3Index, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    console.log(`Recalculation complete: ${results.length} successful, ${errors.length} errors`);

    return new Response(
      JSON.stringify({ success: results.length, errors: errors.length, results, errorDetails: errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in recalculate-zone-scores:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});