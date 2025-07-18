import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'OPENAI_API_KEY no configurada',
          connected: false 
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { action, data } = await req.json();

    switch (action) {
      case 'validate_connection':
        return await validateConnection();
      
      case 'analyze_responses':
        return await analyzeResponses(data);
      
      case 'generate_insights':
        return await generateInsights(data);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Acción no válida' }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

  } catch (error) {
    console.error('Error en SIERCP AI Assistant:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        connected: false 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function validateConnection() {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return new Response(
        JSON.stringify({ 
          connected: true,
          message: 'Conexión exitosa con OpenAI',
          models_available: data.data.length
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      throw new Error(`Error de API: ${response.status}`);
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        connected: false,
        error: `Error de conexión: ${error.message}`
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function analyzeResponses(evaluationData: any) {
  try {
    const { responses, currentModule } = evaluationData;

    const prompt = `
Como experto en psicología forense y evaluación de riesgo, analiza las siguientes respuestas del módulo "${currentModule}" del sistema SIERCP:

${JSON.stringify(responses, null, 2)}

Proporciona:
1. Un análisis breve de las respuestas (máximo 100 palabras)
2. Indicadores de riesgo identificados
3. Recomendaciones específicas para profundizar en la evaluación
4. Nivel de consistencia en las respuestas (1-10)

Responde en formato JSON con la estructura:
{
  "analysis": "...",
  "risk_indicators": ["..."],
  "recommendations": ["..."],
  "consistency_level": number
}
`;

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
            content: 'Eres un psicólogo forense especializado en evaluación de riesgo psico-criminológica. Proporciona análisis profesionales y objetivos.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }),
    });

    const data = await response.json();
    const aiAnalysis = JSON.parse(data.choices[0].message.content);

    return new Response(
      JSON.stringify({ 
        success: true,
        analysis: aiAnalysis
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `Error en análisis: ${error.message}`
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function generateInsights(evaluationData: any) {
  try {
    const { results, modules } = evaluationData;

    const prompt = `
Como experto en psicología forense, analiza estos resultados completos de la evaluación SIERCP:

Resultados por módulo:
${JSON.stringify(results, null, 2)}

Módulos evaluados: ${modules.join(', ')}

Genera insights profesionales que incluyan:
1. Interpretación clínica de los resultados
2. Factores de protección identificados
3. Áreas de preocupación específicas
4. Recomendaciones de intervención
5. Sugerencias para seguimiento

Mantén un enfoque científico y objetivo. Responde en formato JSON:
{
  "clinical_interpretation": "...",
  "protective_factors": ["..."],
  "areas_of_concern": ["..."],
  "intervention_recommendations": ["..."],
  "follow_up_suggestions": ["..."]
}
`;

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
            content: 'Eres un psicólogo forense con especialización en evaluación de riesgo y confiabilidad psico-criminológica. Genera insights profesionales basados en evidencia científica.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1500
      }),
    });

    const data = await response.json();
    const insights = JSON.parse(data.choices[0].message.content);

    return new Response(
      JSON.stringify({ 
        success: true,
        insights: insights
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `Error generando insights: ${error.message}`
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}