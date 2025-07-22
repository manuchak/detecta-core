import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecruitmentData {
  rotationMetrics: {
    monthlyRate: number;
    predictedNext30Days: number;
    byZone: Record<string, number>;
  };
  financialMetrics: {
    realCPA: number;
    totalInvestment: number;
    monthlyBudgetUtilization: number;
    roiByChannel: Record<string, number>;
  };
  activeCustodians: {
    total: number;
    byZone: Record<string, number>;
    growthRate: number;
  };
  historicalData?: any[];
  marketContext?: any;
}

interface AIInsight {
  category: 'strategic' | 'tactical' | 'operational' | 'predictive';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  confidence: number;
  recommendations: string[];
  dataPoints: string[];
  projectedImpact: {
    financial: number;
    operational: number;
    timeline: string;
  };
  riskFactors: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🤖 AI Recruitment Analysis - Starting request');
    
    const { data: requestData, analysisType = 'comprehensive' } = await req.json();
    
    if (!requestData) {
      throw new Error('No recruitment data provided');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('📊 Processing recruitment data:', {
      rotationRate: requestData.rotationMetrics?.monthlyRate,
      activeCustodians: requestData.activeCustodians?.total,
      cpa: requestData.financialMetrics?.realCPA,
      analysisType
    });

    // Preparar prompt específico para análisis de reclutamiento
    const systemPrompt = `Eres un experto en análisis de datos de reclutamiento y recursos humanos especializado en la industria de servicios de custodia y logística. 

Tu función es analizar métricas complejas de:
- Rotación de personal y retención
- Efectividad financiera (CPA, ROI, utilización de presupuesto)
- Demanda operacional por zonas geográficas
- Correlaciones entre variables de reclutamiento
- Predicciones basadas en tendencias históricas

Debes generar insights accionables, identificar riesgos ocultos y recomendar estrategias optimizadas.

RESPONDE SIEMPRE EN JSON con la siguiente estructura:
{
  "insights": [
    {
      "category": "strategic|tactical|operational|predictive",
      "priority": "critical|high|medium|low", 
      "title": "Título conciso del insight",
      "description": "Descripción detallada del hallazgo",
      "confidence": 0.0-1.0,
      "recommendations": ["acción 1", "acción 2", "acción 3"],
      "dataPoints": ["dato que sustenta 1", "dato 2"],
      "projectedImpact": {
        "financial": impacto_financiero_estimado_en_pesos,
        "operational": porcentaje_mejora_operacional,
        "timeline": "corto|mediano|largo plazo"
      },
      "riskFactors": ["riesgo 1", "riesgo 2"]
    }
  ],
  "summary": {
    "overallHealth": "excellent|good|concerning|critical",
    "topPriorities": ["prioridad 1", "prioridad 2", "prioridad 3"],
    "predictedTrends": {
      "rotation": "increasing|stable|decreasing",
      "demand": "increasing|stable|decreasing", 
      "efficiency": "improving|stable|declining"
    }
  }
}`;

    const analysisPrompt = `
Analiza los siguientes datos de reclutamiento y operaciones de custodios:

MÉTRICAS ACTUALES:
- Tasa de rotación mensual: ${requestData.rotationMetrics?.monthlyRate}%
- Custodios activos totales: ${requestData.activeCustodians?.total}
- CPA real: $${requestData.financialMetrics?.realCPA}
- Inversión total: $${requestData.financialMetrics?.totalInvestment}
- Utilización de presupuesto: ${requestData.financialMetrics?.monthlyBudgetUtilization}%

DISTRIBUCIÓN POR ZONAS:
${JSON.stringify(requestData.activeCustodians?.byZone || {}, null, 2)}

ROI POR CANAL:
${JSON.stringify(requestData.financialMetrics?.roiByChannel || {}, null, 2)}

CONTEXTO ADICIONAL:
${requestData.marketContext ? JSON.stringify(requestData.marketContext, null, 2) : 'No disponible'}

Genera un análisis profundo identificando:
1. Patrones ocultos en la rotación por zona
2. Eficiencia de canales de reclutamiento
3. Oportunidades de optimización financiera
4. Riesgos emergentes y estrategias de mitigación
5. Predicciones de demanda y capacidad
6. Recomendaciones estratégicas prioritarias

Enfócate especialmente en correlaciones no obvias y en identificar factores predictivos de éxito.
`;

    console.log('🧠 Enviando request a OpenAI...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ OpenAI API Error:', errorData);
      
      // Manejar errores específicos de OpenAI
      if (response.status === 429) {
        const error = JSON.parse(errorData);
        if (error.error?.code === 'insufficient_quota') {
          throw new Error('La API key de OpenAI ha excedido su cuota. Por favor revisa tu plan de facturación en OpenAI.');
        }
        throw new Error('Se han excedido los límites de uso de la API de OpenAI. Intenta nuevamente en unos minutos.');
      }
      
      if (response.status === 401) {
        throw new Error('API key de OpenAI inválida o no configurada correctamente.');
      }
      
      throw new Error(`Error en la API de OpenAI: ${response.status} - ${errorData}`);
    }

    const aiResponse = await response.json();
    console.log('✅ OpenAI Response received');

    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(aiResponse.choices[0].message.content);
      console.log('🎯 AI Analysis parsed successfully:', {
        insightsCount: aiAnalysis.insights?.length,
        overallHealth: aiAnalysis.summary?.overallHealth
      });
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      throw new Error('Invalid AI response format');
    }

    // Enriquecer insights con metadata del sistema
    const enrichedInsights = aiAnalysis.insights.map((insight: AIInsight, index: number) => ({
      ...insight,
      id: `ai-insight-${Date.now()}-${index}`,
      timestamp: new Date().toISOString(),
      source: 'ai-analysis',
      model: 'gpt-4.1',
      confidence: Math.min(Math.max(insight.confidence || 0.8, 0.1), 1.0)
    }));

    const finalResult = {
      ...aiAnalysis,
      insights: enrichedInsights,
      metadata: {
        analysisType,
        processedAt: new Date().toISOString(),
        dataQuality: requestData.activeCustodians?.total > 0 ? 'good' : 'limited',
        model: 'gpt-4.1-2025-04-14'
      }
    };

    console.log('🎉 Analysis completed successfully');

    return new Response(JSON.stringify(finalResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error in AI analysis:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString(),
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});