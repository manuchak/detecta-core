import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload = await req.json();
    console.log('Received Dialfire webhook:', JSON.stringify(payload, null, 2));

    // Parse Dialfire payload (ajustar según formato real)
    const {
      call_id,
      campaign_id,
      phone_number,
      call_status,
      call_duration,
      agent_id,
      agent_notes,
      started_at,
      ended_at,
      recording_url,
      custom_data,
    } = payload;

    // Determinar si es test mode
    const isTest = custom_data?.is_test === true || campaign_id?.includes('test');

    // Buscar candidato por teléfono
    const { data: candidato } = await supabase
      .from('candidatos_custodios')
      .select('id')
      .eq('telefono', phone_number)
      .maybeSingle();

    // Insertar log de Dialfire
    const { data: callLog, error } = await supabase
      .from('dialfire_call_logs')
      .insert({
        dialfire_call_id: call_id,
        candidato_id: candidato?.id || null,
        campaign_id,
        phone_number,
        call_outcome: call_status,
        call_duration: call_duration || 0,
        agent_id,
        agent_notes,
        call_started_at: started_at,
        call_ended_at: ended_at,
        recording_url,
        metadata: custom_data || {},
        is_test: isTest,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting Dialfire log:', error);
      throw error;
    }

    console.log('Dialfire call log created:', callLog.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        call_log_id: callLog.id,
        is_test: isTest,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in dialfire-webhook:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check edge function logs for more info',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
