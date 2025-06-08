
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { AnalisisRiesgo } from '@/types/serviciosMonitoreo';

export const useAnalisisRiesgo = (servicioId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Función para calcular el score de riesgo automáticamente
  const calculateRiskScore = (data: Partial<AnalisisRiesgo>) => {
    let score = 0;
    
    // Riesgo del cliente (peso 30%)
    const clientRiskWeights = {
      'bajo': 0,
      'medio': 15,
      'alto': 25,
      'muy_alto': 30
    };
    score += clientRiskWeights[data.nivel_riesgo_cliente as keyof typeof clientRiskWeights] || 15;
    
    // Riesgo de zona (peso 25%)
    const zoneRiskWeights = {
      'bajo': 0,
      'medio': 10,
      'alto': 20,
      'muy_alto': 25
    };
    score += zoneRiskWeights[data.nivel_riesgo_zona as keyof typeof zoneRiskWeights] || 10;
    
    // Situación financiera (peso 20%)
    const financialWeights = {
      'estable': 0,
      'regular': 5,
      'inestable': 15,
      'desconocida': 20
    };
    score += financialWeights[data.situacion_financiera as keyof typeof financialWeights] || 20;
    
    // Verificaciones (peso 25%)
    let verificationPenalty = 25;
    if (data.antecedentes_verificados) verificationPenalty -= 12.5;
    if (data.referencias_comerciales) verificationPenalty -= 12.5;
    score += verificationPenalty;
    
    return Math.min(100, Math.max(0, score));
  };

  // Función para determinar recomendación automática
  const getAutoRecommendation = (score: number) => {
    if (score <= 25) return 'aprobar';
    if (score <= 45) return 'aprobar_con_condiciones';
    if (score <= 70) return 'requiere_revision';
    return 'rechazar';
  };

  const saveAnalisis = useMutation({
    mutationFn: async (data: Partial<AnalisisRiesgo> & { servicio_id: string; zona_operacion: string }) => {
      const currentUser = await supabase.auth.getUser();
      
      // Calcular score automáticamente
      const calculatedScore = calculateRiskScore(data);
      const autoRecommendation = getAutoRecommendation(calculatedScore);
      
      const analisisData = {
        ...data,
        evaluado_por: currentUser.data.user?.id,
        score_riesgo: calculatedScore,
        recomendacion: data.recomendacion || autoRecommendation,
        fecha_evaluacion: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from('analisis_riesgo')
        .upsert(analisisData)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analisis-riesgo'] });
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
    calculateRiskScore,
    getAutoRecommendation
  };
};
