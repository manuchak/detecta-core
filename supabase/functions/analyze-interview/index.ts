import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  responses: {
    questionId: string;
    question: string;
    response: string;
  }[];
}

interface AnalysisResult {
  coherenceScore: number;
  complexityScore: number;
  riskIndicators: number;
  validityScales: {
    infrecuency: number;
    lie: number;
    correction: number;
    inconsistency: number;
  };
  sentimentAnalysis: {
    overall: number;
    emotional_density: number;
    honesty_markers: number;
  };
  overallScore: number;
  classification: string;
  recommendations: string[];
  redFlags: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { responses }: AnalysisRequest = await req.json();

    if (!responses || responses.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No responses provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Crear prompt para análisis completo
    const analysisPrompt = createAnalysisPrompt(responses);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `Eres un experto psicólogo forense especializado en evaluación de riesgo psico-criminológico. 
            Debes analizar respuestas de entrevistas y proporcionar puntuaciones objetivas basadas en criterios científicos.
            
            CRITERIOS DE EVALUACIÓN:
            1. COHERENCIA (0-100): Consistencia lógica y temporal de las respuestas
            2. COMPLEJIDAD (0-100): Profundidad narrativa y elaboración de respuestas
            3. INDICADORES DE RIESGO (0-100): Presencia de factores de riesgo criminológico
            4. ESCALAS DE VALIDEZ:
               - Infrecuencia (0-100): Respuestas estadísticamente raras o improbables
               - Mentira (0-100): Presentación artificialmente positiva
               - Corrección (0-100): Defensividad y negación
               - Inconsistencia (0-100): Contradicciones internas
            5. ANÁLISIS DE SENTIMIENTOS:
               - Overall (0-100): Tono emocional general
               - Densidad emocional (0-100): Riqueza del contenido emocional
               - Marcadores de honestidad (0-100): Indicadores de veracidad
            
            Responde ÚNICAMENTE en formato JSON válido sin texto adicional.`
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid OpenAI response');
    }

    const analysisText = data.choices[0].message.content;
    
    try {
      const analysis: AnalysisResult = JSON.parse(analysisText);
      
      // Validar y ajustar scores
      const validatedAnalysis = validateAndAdjustScores(analysis);
      
      return new Response(
        JSON.stringify(validatedAnalysis),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', analysisText);
      
      // Fallback analysis si el JSON falla
      const fallbackAnalysis = createFallbackAnalysis(responses);
      
      return new Response(
        JSON.stringify(fallbackAnalysis),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in analyze-interview function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function createAnalysisPrompt(responses: AnalysisRequest['responses']): string {
  const responsesText = responses.map((r, index) => 
    `PREGUNTA ${index + 1}: ${r.question}\nRESPUESTA: ${r.response}\n`
  ).join('\n');

  return `Analiza las siguientes respuestas de entrevista psicológica para evaluación de riesgo:

${responsesText}

Proporciona tu análisis en el siguiente formato JSON exacto:
{
  "coherenceScore": [0-100],
  "complexityScore": [0-100], 
  "riskIndicators": [0-100],
  "validityScales": {
    "infrecuency": [0-100],
    "lie": [0-100],
    "correction": [0-100],
    "inconsistency": [0-100]
  },
  "sentimentAnalysis": {
    "overall": [0-100],
    "emotional_density": [0-100],
    "honesty_markers": [0-100]
  },
  "overallScore": [0-100],
  "classification": "Sin riesgo|Riesgo bajo|Riesgo moderado|Riesgo alto",
  "recommendations": ["recomendación1", "recomendación2"],
  "redFlags": ["bandera_roja1", "bandera_roja2"]
}

INSTRUCCIONES ESPECÍFICAS:
- Coherencia: Evalúa consistencia lógica y temporal
- Complejidad: Respuestas muy cortas (< 20 palabras) = puntuación baja
- Indicadores de riesgo: Busca minimización, justificación de violencia, falta de empatía
- Infrecuencia: Respuestas estadísticamente improbables o extremas
- Mentira: Presentación demasiado perfecta o socialmente deseable
- Corrección: Defensividad excesiva o negación de problemas comunes
- Inconsistencia: Contradicciones entre respuestas
- Honestidad: Busca admisiones, autocrítica, matices emocionales

Sé riguroso en la evaluación. Puntuaciones altas solo para respuestas genuinamente apropiadas.`;
}

function validateAndAdjustScores(analysis: any): AnalysisResult {
  const clamp = (value: number, min: number = 0, max: number = 100): number => {
    return Math.max(min, Math.min(max, value || 0));
  };

  return {
    coherenceScore: clamp(analysis.coherenceScore),
    complexityScore: clamp(analysis.complexityScore),
    riskIndicators: clamp(analysis.riskIndicators),
    validityScales: {
      infrecuency: clamp(analysis.validityScales?.infrecuency),
      lie: clamp(analysis.validityScales?.lie),
      correction: clamp(analysis.validityScales?.correction),
      inconsistency: clamp(analysis.validityScales?.inconsistency),
    },
    sentimentAnalysis: {
      overall: clamp(analysis.sentimentAnalysis?.overall),
      emotional_density: clamp(analysis.sentimentAnalysis?.emotional_density),
      honesty_markers: clamp(analysis.sentimentAnalysis?.honesty_markers),
    },
    overallScore: clamp(analysis.overallScore),
    classification: analysis.classification || 'Riesgo moderado',
    recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
    redFlags: Array.isArray(analysis.redFlags) ? analysis.redFlags : []
  };
}

function createFallbackAnalysis(responses: AnalysisRequest['responses']): AnalysisResult {
  // Análisis básico de fallback basado en métricas simples
  const avgLength = responses.reduce((sum, r) => sum + r.response.length, 0) / responses.length;
  const hasVeryShortResponses = responses.some(r => r.response.trim().length < 10);
  const hasEmptyResponses = responses.some(r => r.response.trim().length === 0);

  let complexityScore = Math.min(100, (avgLength / 100) * 100);
  let coherenceScore = hasVeryShortResponses ? 30 : 65;
  let riskScore = hasEmptyResponses ? 80 : 50;

  if (complexityScore < 20) complexityScore = 20;
  if (hasVeryShortResponses) riskScore += 20;

  const overallScore = Math.round((coherenceScore + complexityScore + (100 - riskScore)) / 3);

  return {
    coherenceScore: Math.round(coherenceScore),
    complexityScore: Math.round(complexityScore),
    riskIndicators: Math.round(riskScore),
    validityScales: {
      infrecuency: hasEmptyResponses ? 90 : 45,
      lie: hasVeryShortResponses ? 70 : 40,
      correction: hasVeryShortResponses ? 80 : 35,
      inconsistency: 40,
    },
    sentimentAnalysis: {
      overall: 50,
      emotional_density: Math.round(complexityScore * 0.8),
      honesty_markers: hasVeryShortResponses ? 20 : 60,
    },
    overallScore: overallScore,
    classification: overallScore >= 70 ? 'Riesgo bajo' : overallScore >= 50 ? 'Riesgo moderado' : 'Riesgo alto',
    recommendations: [
      'Evaluación requiere análisis adicional',
      'Considerar entrevista presencial complementaria'
    ],
    redFlags: hasVeryShortResponses ? ['Respuestas extremadamente breves'] : []
  };
}