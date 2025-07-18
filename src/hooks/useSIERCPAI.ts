import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AIAnalysis {
  analysis: string;
  risk_indicators: string[];
  recommendations: string[];
  consistency_level: number;
}

interface AIInsights {
  clinical_interpretation: string;
  protective_factors: string[];
  areas_of_concern: string[];
  intervention_recommendations: string[];
  follow_up_suggestions: string[];
}

export const useSIERCPAI = () => {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);

  const validateConnection = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('siercp-ai-assistant', {
        body: { action: 'validate_connection' }
      });

      if (error) throw error;

      setConnected(data.connected);
      
      if (data.connected) {
        toast({
          title: "✅ Conexión exitosa",
          description: `ChatGPT está conectado. Modelos disponibles: ${data.models_available}`,
        });
      } else {
        toast({
          title: "❌ Conexión fallida",
          description: data.error || "No se pudo conectar con ChatGPT",
          variant: "destructive"
        });
      }

      return data.connected;
    } catch (error) {
      console.error('Error validating connection:', error);
      setConnected(false);
      toast({
        title: "❌ Error de conexión",
        description: "Error al validar la conexión con ChatGPT",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const analyzeResponses = async (responses: any[], currentModule: string): Promise<AIAnalysis | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('siercp-ai-assistant', {
        body: { 
          action: 'analyze_responses',
          data: { responses, currentModule }
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "🤖 Análisis completado",
          description: "ChatGPT ha analizado las respuestas del módulo",
        });
        return data.analysis;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error analyzing responses:', error);
      toast({
        title: "❌ Error en análisis",
        description: "No se pudo analizar las respuestas",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async (results: any, modules: string[]): Promise<AIInsights | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('siercp-ai-assistant', {
        body: { 
          action: 'generate_insights',
          data: { results, modules }
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "🧠 Insights generados",
          description: "ChatGPT ha generado insights profesionales de la evaluación",
        });
        return data.insights;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: "❌ Error generando insights",
        description: "No se pudieron generar los insights",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Validar conexión automáticamente al inicializar el hook
  useEffect(() => {
    if (connected === null) {
      validateConnection();
    }
  }, [connected]); // Include connected as dependency

  return {
    loading,
    connected,
    validateConnection,
    analyzeResponses,
    generateInsights
  };
};