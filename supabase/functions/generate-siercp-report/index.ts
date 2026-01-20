import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

interface ModuleScore {
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
}

interface InterviewResponse {
  questionId: string;
  question: string;
  answer: string;
}

interface ReportRequest {
  globalScore: number;
  moduleScores: ModuleScore[];
  riskFlags: string[];
  candidateName?: string;
  evaluationDate: string;
  interviewResponses?: InterviewResponse[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY no configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { globalScore, moduleScores, riskFlags, candidateName, evaluationDate, interviewResponses }: ReportRequest = await req.json();

    const moduleDetails = moduleScores.map(m => 
      `- ${m.name}: ${m.percentage}% (${m.score}/${m.maxScore})`
    ).join('\n');

    const flagsDetails = riskFlags.length > 0 
      ? `Banderas de riesgo identificadas:\n${riskFlags.map(f => `- ${f}`).join('\n')}`
      : 'No se identificaron banderas de riesgo críticas.';

    // Build interview responses section for AI analysis
    const interviewSection = interviewResponses && interviewResponses.length > 0
      ? `\n## RESPUESTAS DE ENTREVISTA ESTRUCTURADA (Módulo 7)

Analiza las siguientes respuestas del candidato buscando:
- Señales de deshonestidad, evasión o respuestas superficiales
- Indicadores de impulsividad, agresividad o falta de autocontrol
- Coherencia y consistencia entre respuestas
- Capacidad de autocrítica y reflexión genuina
- Banderas rojas específicas para el puesto de custodio de mercancía

${interviewResponses.map(r => `### ${r.questionId}: ${r.question}
**Respuesta del candidato:** "${r.answer}"
`).join('\n')}`
      : '';

    const prompt = `Como experto en psicología forense y evaluación de personal de seguridad, genera un informe profesional COMPLETO para evaluar la aptitud de un candidato para el puesto de CUSTODIO DE MERCANCÍA.

## CONTEXTO DEL PUESTO: CUSTODIO DE MERCANCÍA

El custodio debe:
- Transportar mercancía de alto valor (joyería, electrónicos, valores)
- Mantener integridad absoluta ante presiones externas y ofertas indebidas
- Manejar situaciones de estrés intenso sin recurrir a violencia
- Actuar con honestidad y transparencia en todo momento
- Resistir intentos de corrupción o soborno
- Tomar decisiones rápidas bajo presión
- Mantener la confidencialidad de rutas y operaciones

## RESULTADOS DE LA EVALUACIÓN SIERCP

**Score Global:** ${globalScore}/100

**Scores por Módulo:**
${moduleDetails}

**${flagsDetails}**
${interviewSection}

## INSTRUCCIONES

Genera un informe en formato JSON con la siguiente estructura exacta:

{
  "resumen_ejecutivo": "3-4 oraciones que resuman la aptitud general del candidato para ser custodio de mercancía, mencionando fortalezas y áreas de atención principales.",
  
  "analisis_modulos": [
    {
      "modulo": "Nombre del módulo",
      "score": número,
      "nivel": "Alto/Medio/Bajo",
      "interpretacion": "2-3 oraciones explicando qué significa este puntaje en términos psicológicos",
      "implicacion_custodio": "2-3 oraciones sobre cómo este resultado impacta específicamente su desempeño como custodio de mercancía"
    }
  ],
  
  "factores_riesgo": [
    "Factor de riesgo 1 con explicación breve",
    "Factor de riesgo 2 con explicación breve"
  ],
  
  "factores_proteccion": [
    "Factor de protección 1 con explicación breve",
    "Factor de protección 2 con explicación breve"
  ],
  
  "fit_custodio": {
    "nivel": "Alta/Media/Baja/No apto",
    "porcentaje_confianza": número del 0 al 100,
    "justificacion": "2-3 oraciones justificando el nivel de aptitud para el puesto específico de custodio"
  },
  
  "recomendaciones": [
    "Recomendación específica 1 para el proceso de contratación",
    "Recomendación específica 2",
    "Recomendación específica 3"
  ],
  
  "areas_seguimiento": [
    "Área que requiere monitoreo post-contratación 1",
    "Área que requiere monitoreo post-contratación 2"
  ],
  
  "conclusion_profesional": "1 párrafo con la conclusión final y recomendación de contratación (Contratar/Contratar con reservas/No contratar)"
}

IMPORTANTE:
- Sé específico y profesional en el lenguaje
- Relaciona cada análisis con el puesto de CUSTODIO DE MERCANCÍA
- Los scores van de 0-100, donde 70+ es bueno, 50-69 es moderado, <50 es bajo
- Si hay banderas de riesgo, dales peso importante en el análisis
- El informe será usado por equipos de RRHH y Seguridad para tomar decisiones de contratación`;

    console.log('Calling Lovable AI Gateway for SIERCP report generation...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: 'Eres un psicólogo forense especializado en evaluación de personal de seguridad y custodia. Respondes ÚNICAMENTE con JSON válido, sin texto adicional antes o después del JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI Response received, parsing JSON...');

    // Extract JSON from the response (handle markdown code blocks)
    let jsonContent = content;
    if (content.includes('```json')) {
      jsonContent = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('```')) {
      jsonContent = content.split('```')[1].split('```')[0].trim();
    }

    const report = JSON.parse(jsonContent);

    // Add metadata
    report.metadata = {
      fecha_generacion: new Date().toISOString(),
      fecha_evaluacion: evaluationDate,
      candidato: candidateName || 'No especificado',
      score_global: globalScore,
      generado_por: 'SIERCP AI Assistant'
    };

    console.log('Report generated successfully');

    return new Response(
      JSON.stringify({ success: true, report }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating SIERCP report:', error);
    return new Response(
      JSON.stringify({ 
        error: `Error generando informe: ${(error as Error).message}`,
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
