
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
        source: 'lead_approval_system',
        interviewType: 'custodian_screening'
      },
      // Configure assistant for structured data collection
      assistantOverrides: {
        model: {
          provider: "openai",
          model: "gpt-4",
          temperature: 0.7,
          maxTokens: 1000
        },
        voice: {
          provider: "11labs",
          voiceId: "21m00Tcm4TlvDq8ikWAM" // Rachel voice
        },
        // Structured data schema for interview results
        analysisPlan: {
          summaryPrompt: "Resumir la entrevista destacando aptitudes, experiencia y disponibilidad del candidato custodio para trabajo de seguridad personal.",
          structuredDataPrompt: "Extraer información estructurada de la entrevista de custodio",
          structuredDataSchema: {
            type: "object",
            properties: {
              candidato_info: {
                type: "object",
                properties: {
                  experiencia_custodia: { type: "string", description: "Años de experiencia en custodia o seguridad" },
                  experiencia_ninos: { type: "boolean", description: "¿Tiene experiencia cuidando niños?" },
                  disponibilidad_horaria: { type: "string", description: "Horarios disponibles para trabajar" },
                  referencias_verificables: { type: "boolean", description: "¿Proporcionó referencias verificables?" },
                  vehiculo_propio: { type: "boolean", description: "¿Tiene vehículo propio?" },
                  zona_preferida: { type: "string", description: "Zona de la ciudad donde prefiere trabajar" }
                }
              },
              evaluacion: {
                type: "object",
                properties: {
                  confianza_score: { type: "number", minimum: 1, maximum: 10, description: "Nivel de confianza del candidato (1-10)" },
                  comunicacion_score: { type: "number", minimum: 1, maximum: 10, description: "Calidad de comunicación (1-10)" },
                  responsabilidad_score: { type: "number", minimum: 1, maximum: 10, description: "Percepción de responsabilidad (1-10)" },
                  aptitud_general: { type: "string", enum: ["excelente", "buena", "regular", "deficiente"] },
                  recommendation: { type: "string", description: "Recomendación detallada del entrevistador AI" }
                }
              },
              decision_recomendada: {
                type: "object",
                properties: {
                  tipo: { type: "string", enum: ["aprobar", "segunda_entrevista", "rechazar"] },
                  razon: { type: "string", description: "Justificación de la decisión" },
                  red_flags: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Señales de alerta detectadas durante la entrevista" 
                  }
                }
              }
            }
          }
        },
        // Enhanced system message for custodian interviews
        firstMessage: `¡Hola ${leadName}! Soy el asistente virtual de Detecta Security. Te voy a hacer algunas preguntas para conocerte mejor como candidato a custodio. La entrevista tomará aproximadamente 10 minutos. ¿Estás listo para comenzar?`,
        systemMessage: `Eres un entrevistador profesional especializado en selección de custodios para Detecta Security. 

OBJETIVO: Realizar una entrevista estructurada para evaluar candidatos a custodio/guardaespaldas.

INSTRUCCIONES IMPORTANTES:
1. Mantén un tono profesional pero cálido
2. Haz preguntas claras y específicas
3. Escucha atentamente las respuestas
4. Identifica red flags de seguridad
5. Evalúa experiencia, confiabilidad y aptitudes

ÁREAS A EVALUAR:
- Experiencia previa en seguridad/custodia
- Disponibilidad horaria y geográfica
- Responsabilidad y confiabilidad
- Capacidad de comunicación
- Referencias verificables
- Antecedentes y historial

RED FLAGS A DETECTAR:
- Inconsistencias en respuestas
- Falta de experiencia relevante
- Problemas de disponibilidad
- Actitudes sospechosas
- Falta de referencias

La entrevista debe durar 8-12 minutos. Al final, proporciona una evaluación completa usando el esquema de datos estructurados.`
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
    console.log('VAPI Call created:', callData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        callId: callData.id,
        status: callData.status,
        message: 'Call initiated successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in vapi-call function:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
