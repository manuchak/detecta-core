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
    const { phoneNumber, leadId, leadName, assistantId } = await req.json()

    if (!phoneNumber || !leadId || !assistantId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // VAPI API configuration
    const VAPI_API_KEY = '4e1d9a9c-de28-4e68-926c-3b5ca5a3ecb9'
    const VAPI_BASE_URL = 'https://api.vapi.ai'

    console.log('🧪 TEST MODE: Iniciando llamada VAPI de prueba')

    // Enhanced VAPI assistant configuration for structured interviews
    const assistantConfig = {
      assistantId: assistantId,
      phoneNumberId: null,
      customer: {
        number: phoneNumber,
        name: leadName,
      },
      metadata: {
        leadId: leadId,
        source: 'sandbox_testing',
        interviewType: 'custodian_screening_test',
        is_test: true // SANDBOX FLAG
      },
      assistantOverrides: {
        model: {
          provider: "openai",
          model: "gpt-4",
          temperature: 0.7,
          maxTokens: 1000
        },
        voice: {
          provider: "11labs",
          voiceId: "21m00Tcm4TlvDq8ikWAM"
        },
        analysisPlan: {
          summaryPrompt: "[TEST MODE] Resumir la entrevista de prueba",
          structuredDataPrompt: "Extraer información estructurada",
          structuredDataSchema: {
            type: "object",
            properties: {
              candidato_info: {
                type: "object",
                properties: {
                  experiencia_custodia: { type: "string" },
                  disponibilidad_horaria: { type: "string" },
                  vehiculo_propio: { type: "boolean" }
                }
              },
              evaluacion: {
                type: "object",
                properties: {
                  confianza_score: { type: "number", minimum: 1, maximum: 10 },
                  comunicacion_score: { type: "number", minimum: 1, maximum: 10 },
                  aptitud_general: { type: "string", enum: ["excelente", "buena", "regular", "deficiente"] }
                }
              },
              decision_recomendada: {
                type: "object",
                properties: {
                  tipo: { type: "string", enum: ["aprobar", "segunda_entrevista", "rechazar"] },
                  razon: { type: "string" },
                  red_flags: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        },
        firstMessage: `[TEST MODE] ¡Hola ${leadName}! Esta es una llamada de prueba del sistema de entrevistas. ¿Estás listo para comenzar?`,
        systemMessage: `[TEST MODE] Entrevistador de prueba para Detecta Security. Realiza una entrevista breve (3-5 min) evaluando experiencia y disponibilidad del candidato.`
      }
    }

    // Create call request to VAPI
    const vapiResponse = await fetch(`${VAPI_BASE_URL}/call`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assistantConfig),
    })

    if (!vapiResponse.ok) {
      const errorText = await vapiResponse.text()
      console.error('VAPI API Error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to initiate VAPI call', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const callData = await vapiResponse.json()
    console.log('🧪 TEST: VAPI Call created:', callData.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        callId: callData.id,
        status: callData.status,
        message: '🧪 Test call initiated successfully',
        is_test: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in vapi-call-test function:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
