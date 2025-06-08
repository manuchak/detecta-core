
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { AnalisisRiesgo, CriterioEvaluacionFinanciera, RespuestaAnalisisRiesgo } from '@/types/serviciosMonitoreo';

export const useAnalisisRiesgo = (servicioId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener análisis existente
  const { data: analisis, isLoading } = useQuery({
    queryKey: ['analisis-riesgo', servicioId],
    queryFn: async () => {
      if (!servicioId) return null;
      
      const { data, error } = await supabase
        .from('analisis_riesgo')
        .select('*')
        .eq('servicio_id', servicioId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as AnalisisRiesgo | null;
    },
    enabled: !!servicioId
  });

  // Obtener criterios de evaluación
  const { data: criterios } = useQuery({
    queryKey: ['criterios-evaluacion-financiera'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('criterios_evaluacion_financiera')
        .select('*')
        .eq('activo', true)
        .order('categoria', { ascending: true })
        .order('peso_score', { ascending: true });

      if (error) throw error;
      return data as CriterioEvaluacionFinanciera[];
    }
  });

  // Obtener respuestas del análisis
  const { data: respuestas } = useQuery({
    queryKey: ['respuestas-analisis', analisis?.id],
    queryFn: async () => {
      if (!analisis?.id) return [];
      
      const { data, error } = await supabase
        .from('respuestas_analisis_riesgo')
        .select(`
          *,
          criterio:criterios_evaluacion_financiera(*)
        `)
        .eq('analisis_id', analisis.id);

      if (error) throw error;
      return data as (RespuestaAnalisisRiesgo & { criterio: CriterioEvaluacionFinanciera })[];
    },
    enabled: !!analisis?.id
  });

  // Función mejorada para calcular el score de riesgo
  const calculateAdvancedRiskScore = (data: Partial<AnalisisRiesgo>, respuestas: RespuestaAnalisisRiesgo[] = []) => {
    let score = 50; // Score base

    // Aplicar respuestas de criterios específicos
    respuestas.forEach(respuesta => {
      if (respuesta.valor_numerico !== undefined) {
        score += respuesta.valor_numerico;
      }
    });

    // Factores adicionales basados en datos del análisis
    
    // Tipo de cliente (peso 15%)
    if (data.tipo_cliente === 'referido') score -= 15;
    else if (data.tipo_cliente === 'recurrente') score -= 8;
    else if (data.tipo_cliente === 'nuevo') score += 5;

    // Tiempo en actividad (peso 10%)
    if (data.tiempo_en_actividad) {
      if (data.tiempo_en_actividad >= 24) score -= 10; // 2+ años
      else if (data.tiempo_en_actividad >= 12) score -= 5; // 1+ año
      else if (data.tiempo_en_actividad < 6) score += 15; // Menos de 6 meses
    }

    // Comprobantes de ingresos (peso 12%)
    if (data.comprobantes_ingresos) score -= 12;
    else score += 15;

    // Historial crediticio (peso 15%)
    if (data.historial_crediticio) {
      if (data.historial_crediticio === 'excelente') score -= 15;
      else if (data.historial_crediticio === 'bueno') score -= 8;
      else if (data.historial_crediticio === 'regular') score += 5;
      else if (data.historial_crediticio === 'malo') score += 20;
    }

    // Riesgo del cliente (peso 20%)
    const clientRiskWeights = {
      'bajo': -10,
      'medio': 5,
      'alto': 15,
      'muy_alto': 25
    };
    score += clientRiskWeights[data.nivel_riesgo_cliente as keyof typeof clientRiskWeights] || 5;
    
    // Riesgo de zona (peso 15%)
    const zoneRiskWeights = {
      'bajo': -5,
      'medio': 5,
      'alto': 12,
      'muy_alto': 20
    };
    score += zoneRiskWeights[data.nivel_riesgo_zona as keyof typeof zoneRiskWeights] || 5;
    
    // Verificaciones (peso 8%)
    if (data.antecedentes_verificados) score -= 4;
    if (data.referencias_comerciales) score -= 4;
    
    return Math.min(100, Math.max(0, score));
  };

  // Función para determinar recomendación automática mejorada
  const getAdvancedRecommendation = (score: number, data: Partial<AnalisisRiesgo>) => {
    // Factores que pueden anular la recomendación automática
    const hasRedFlags = 
      data.historial_crediticio === 'malo' ||
      (data.tiempo_en_actividad && data.tiempo_en_actividad < 3) ||
      data.nivel_riesgo_cliente === 'muy_alto' ||
      data.nivel_riesgo_zona === 'muy_alto';

    if (hasRedFlags && score > 70) return 'rechazar';
    
    if (score <= 20) return 'aprobar';
    if (score <= 40) return 'aprobar_con_condiciones';
    if (score <= 65) return 'requiere_revision';
    return 'rechazar';
  };

  const saveAnalisis = useMutation({
    mutationFn: async (data: { 
      analisisData: Partial<AnalisisRiesgo> & { servicio_id: string; zona_operacion: string },
      respuestas: { criterio_id: string; respuesta: string; valor_numerico?: number; observaciones?: string }[]
    }) => {
      const currentUser = await supabase.auth.getUser();
      
      // Calcular score automáticamente con el nuevo método
      const calculatedScore = calculateAdvancedRiskScore(data.analisisData, 
        data.respuestas.map(r => ({ ...r, analisis_id: '', id: '', created_at: '' }))
      );
      const autoRecommendation = getAdvancedRecommendation(calculatedScore, data.analisisData);
      
      const analisisData = {
        ...data.analisisData,
        evaluado_por: currentUser.data.user?.id,
        score_riesgo: calculatedScore,
        recomendacion: data.analisisData.recomendacion || autoRecommendation,
        fecha_evaluacion: new Date().toISOString(),
        metodo_evaluacion: 'mixto' as const
      };

      // Guardar el análisis
      const { data: analisisResult, error: analisisError } = await supabase
        .from('analisis_riesgo')
        .upsert(analisisData)
        .select()
        .single();

      if (analisisError) throw analisisError;

      // Guardar las respuestas
      if (data.respuestas.length > 0) {
        // Primero eliminar respuestas existentes
        await supabase
          .from('respuestas_analisis_riesgo')
          .delete()
          .eq('analisis_id', analisisResult.id);

        // Insertar nuevas respuestas
        const respuestasConAnalisis = data.respuestas.map(respuesta => ({
          ...respuesta,
          analisis_id: analisisResult.id
        }));

        const { error: respuestasError } = await supabase
          .from('respuestas_analisis_riesgo')
          .insert(respuestasConAnalisis);

        if (respuestasError) throw respuestasError;
      }

      return analisisResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analisis-riesgo'] });
      queryClient.invalidateQueries({ queryKey: ['respuestas-analisis'] });
      queryClient.invalidateQueries({ queryKey: ['servicios-monitoreo'] });
      toast({
        title: "Análisis guardado",
        description: "El análisis de riesgo ha sido guardado y calculado automáticamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo guardar el análisis de riesgo.",
        variant: "destructive",
      });
      console.error('Error saving analysis:', error);
    }
  });

  return {
    analisis,
    isLoading,
    saveAnalisis,
    criterios: criterios || [],
    respuestas: respuestas || [],
    calculateAdvancedRiskScore,
    getAdvancedRecommendation
  };
};
