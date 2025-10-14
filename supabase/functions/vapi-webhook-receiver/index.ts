import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const payload = await req.json()
    console.log('VAPI Webhook received:', JSON.stringify(payload, null, 2))

    // Extract call information from VAPI webhook payload
    const {
      call,
      type,
      transcript,
      summary,
      analysis,
      structuredData,
      recordingUrl,
      phoneNumber,
      customer,
      metadata
    } = payload

    if (type === 'end-of-call-report') {
      // Extract structured interview data and scoring
      const interviewData = {
        candidato_info: structuredData?.candidato_info || {},
        evaluacion: structuredData?.evaluacion || {},
        decision_recomendada: structuredData?.decision_recomendada || {}
      }

      // Calculate analysis score based on VAPI's analysis
      const analysisScore = structuredData?.evaluacion?.confianza_score || 
                           (analysis?.sentiment === 'positive' ? 8 : 
                            analysis?.sentiment === 'neutral' ? 6 : 4)

      // Determine auto-decision based on scoring and red flags
      let autoDecision = 'segunda_entrevista' // Default
      const redFlags = structuredData?.decision_recomendada?.red_flags || []

      if (redFlags.length > 0 || analysisScore < 5) {
        autoDecision = 'rechazar'
      } else if (analysisScore >= 8.5 && 
                 structuredData?.evaluacion?.aptitud_general === 'excelente') {
        autoDecision = 'aprobar'
      }

      // 🔒 SEGURIDAD: Obtener is_test del call log para validar ambiente
      const { data: callLog, error: fetchError } = await supabase
        .from('vapi_call_logs')
        .select('is_test, lead_id')
        .eq('vapi_call_id', call.id)
        .single()

      if (fetchError || !callLog) {
        console.error('❌ Call log not found:', fetchError)
        return new Response(
          JSON.stringify({ error: 'Call log not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`📊 Processing ${callLog.is_test ? 'TEST' : 'PRODUCTION'} call for lead ${callLog.lead_id}`)

      // Update VAPI call log with complete results (con validación de ambiente)
      const { error: updateError } = await supabase.rpc('update_vapi_call_with_results', {
        p_vapi_call_id: call.id,
        p_call_status: call.status || 'completed',
        p_duration_seconds: call.duration || 0,
        p_transcript: transcript || '',
        p_summary: summary || '',
        p_structured_data: {
          ...interviewData,
          auto_decision: autoDecision,
          vapi_analysis: analysis,
          raw_payload: payload,
          is_test: callLog.is_test // ⚠️ Propagar flag para auditoría
        },
        p_analysis_score: analysisScore,
        p_recording_url: recordingUrl || null,
        p_cost_usd: call.cost || null
      })

      if (updateError) {
        console.error('Error updating VAPI call log:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update call log', details: updateError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Log successful processing
      console.log(`Successfully processed VAPI webhook for call ${call.id}:`, {
        autoDecision,
        analysisScore,
        redFlagsCount: redFlags.length,
        candidatePhone: phoneNumber
      })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Webhook processed successfully',
          autoDecision,
          analysisScore
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle other webhook types (call-started, etc.)
    console.log(`Received VAPI webhook type: ${type}, no processing needed`)
    
    return new Response(
      JSON.stringify({ success: true, message: 'Webhook received' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in vapi-webhook-receiver:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})