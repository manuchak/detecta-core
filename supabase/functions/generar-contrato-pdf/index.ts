import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contrato_id, firma_data_url, firma_ip, firma_user_agent } = await req.json();
    
    console.log(`[CONTRATO-PDF] Procesando contrato: ${contrato_id}`);

    if (!contrato_id) {
      throw new Error('contrato_id es requerido');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Obtener datos del contrato
    const { data: contrato, error: contratoError } = await supabase
      .from('contratos_candidato')
      .select(`
        *,
        candidato:candidatos_custodios(nombre, email, telefono)
      `)
      .eq('id', contrato_id)
      .single();

    if (contratoError || !contrato) {
      throw new Error('Contrato no encontrado');
    }

    console.log(`[CONTRATO-PDF] Contrato encontrado: ${contrato.tipo_contrato}`);

    // Generar hash de integridad
    const encoder = new TextEncoder();
    const data = encoder.encode(`${contrato.contenido_html}${firma_data_url}${new Date().toISOString()}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const firmaHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const firmaTimestamp = new Date().toISOString();

    // Actualizar contrato con datos de firma
    const { error: updateError } = await supabase
      .from('contratos_candidato')
      .update({
        firmado: true,
        firma_data_url: firma_data_url,
        firma_ip: firma_ip,
        firma_user_agent: firma_user_agent,
        firma_timestamp: firmaTimestamp,
        firma_hash: firmaHash,
        estado: 'firmado',
        updated_at: new Date().toISOString()
      })
      .eq('id', contrato_id);

    if (updateError) {
      console.error('[CONTRATO-PDF] Error actualizando contrato:', updateError);
      throw updateError;
    }

    // Nota: La generación del PDF se haría con una librería como puppeteer o similar
    // Por ahora, guardamos el HTML firmado y los datos de la firma
    // El PDF se puede generar en el frontend con jspdf si es necesario

    console.log(`[CONTRATO-PDF] Contrato ${contrato_id} firmado con éxito`);

    return new Response(JSON.stringify({
      success: true,
      contrato_id,
      firma_hash: firmaHash,
      firma_timestamp: firmaTimestamp,
      message: 'Contrato firmado correctamente'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[CONTRATO-PDF] Error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
