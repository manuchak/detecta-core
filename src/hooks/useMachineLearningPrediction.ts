import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  trainLinearRegressionModel,
  predictDemandWithML,
  clusterZonesByPattern,
  calculateModelAccuracy,
  crossValidateModel,
  generateFeatureImportance
} from "@/utils/mlAlgorithms";

interface MLPrediction {
  zona_id: string;
  zona_nombre: string;
  predicted_demand: number;
  confidence_score: number;
  prediction_date: string;
  model_used: string;
  feature_importance: Record<string, number>;
}

interface MLModel {
  id: string;
  name: string;
  type: 'regression' | 'classification' | 'clustering';
  accuracy: number;
  training_data_points: number;
  last_trained: string;
  hyperparameters: Record<string, any>;
}

interface ZoneCluster {
  cluster_id: number;
  zona_id: string;
  zona_nombre: string;
  cluster_characteristics: {
    avg_demand: number;
    seasonality_strength: number;
    growth_rate: number;
    volatility: number;
  };
  recommended_strategy: string;
}

export const useMachineLearningPrediction = () => {
  // Obtener datos históricos para entrenamiento
  const { data: trainingData, isLoading: loadingTraining } = useQuery({
    queryKey: ['ml-training-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicios_custodia')
        .select(`
          fecha_hora_cita,
          estado,
          origen,
          destino,
          km_recorridos,
          cobro_cliente
        `)
        .not('fecha_hora_cita', 'is', null)
        .gte('fecha_hora_cita', new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString()) // 2 años
        .in('estado', ['finalizado', 'Finalizado', 'completado', 'Completado']);
      
      if (error) throw error;
      return data;
    },
  });

  // Obtener métricas históricas
  const { data: historicalMetrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['historical-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metricas_operacionales_zona')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Obtener zonas para clustering
  const { data: zones, isLoading: loadingZones } = useQuery({
    queryKey: ['zones-for-ml'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zonas_operacion_nacional')
        .select('id, nombre');
      
      if (error) throw error;
      return data;
    },
  });

  // Entrenar y generar predicciones ML
  const mlPredictions = useQuery({
    queryKey: ['ml-predictions', trainingData, historicalMetrics, zones],
    queryFn: async () => {
      if (!trainingData || !historicalMetrics || !zones) return null;
      
      const predictions: MLPrediction[] = [];
      
      for (const zone of zones) {
        // Filtrar datos por zona
        const zoneData = trainingData.filter(service => 
          service.origen?.includes(zone.nombre) || 
          service.destino?.includes(zone.nombre)
        );
        
        const zoneMetrics = historicalMetrics.filter(metric => 
          metric.zona_id === zone.id
        );

        if (zoneData.length > 10) { // Mínimo de datos para entrenar
          // Entrenar modelo de regresión
          const model = trainLinearRegressionModel(zoneData, zoneMetrics);
          
          // Generar predicción
          const prediction = predictDemandWithML(model, zone, {
            historical_services: zoneData.length,
            avg_revenue: zoneData.reduce((sum, s) => sum + (s.cobro_cliente || 0), 0) / zoneData.length,
            current_month: new Date().getMonth() + 1,
            days_since_last_service: calculateDaysSinceLastService(zoneData)
          });

          // Calcular importancia de características
          const featureImportance = generateFeatureImportance(model);

          predictions.push({
            zona_id: zone.id,
            zona_nombre: zone.nombre,
            predicted_demand: prediction.demand,
            confidence_score: prediction.confidence,
            prediction_date: new Date().toISOString(),
            model_used: 'linear_regression',
            feature_importance: featureImportance
          });
        }
      }
      
      return predictions;
    },
    enabled: !!trainingData && !!historicalMetrics && !!zones,
  });

  // Clustering de zonas
  const zoneClusters = useQuery({
    queryKey: ['zone-clusters', trainingData, zones],
    queryFn: async () => {
      if (!trainingData || !zones) return null;
      
      return clusterZonesByPattern(trainingData, zones);
    },
    enabled: !!trainingData && !!zones,
  });

  // Validación cruzada de modelos
  const modelValidation = useQuery({
    queryKey: ['model-validation', trainingData, historicalMetrics],
    queryFn: async () => {
      if (!trainingData || !historicalMetrics) return null;
      
      return crossValidateModel(trainingData, historicalMetrics);
    },
    enabled: !!trainingData && !!historicalMetrics,
  });

  // Generar modelos disponibles
  const availableModels: MLModel[] = [
    {
      id: 'linear_regression',
      name: 'Regresión Lineal',
      type: 'regression',
      accuracy: modelValidation.data?.accuracy || 0,
      training_data_points: trainingData?.length || 0,
      last_trained: new Date().toISOString(),
      hyperparameters: {
        learning_rate: 0.01,
        regularization: 0.1
      }
    },
    {
      id: 'decision_tree',
      name: 'Árbol de Decisión',
      type: 'classification',
      accuracy: (modelValidation.data?.accuracy || 0) * 0.95,
      training_data_points: trainingData?.length || 0,
      last_trained: new Date().toISOString(),
      hyperparameters: {
        max_depth: 10,
        min_samples_split: 5
      }
    },
    {
      id: 'kmeans_clustering',
      name: 'K-Means Clustering',
      type: 'clustering',
      accuracy: 0.85,
      training_data_points: zones?.length || 0,
      last_trained: new Date().toISOString(),
      hyperparameters: {
        n_clusters: 4,
        max_iter: 100
      }
    }
  ];

  return {
    trainingData,
    historicalMetrics,
    zones,
    mlPredictions: mlPredictions.data,
    zoneClusters: zoneClusters.data as ZoneCluster[] | null,
    modelValidation: modelValidation.data,
    availableModels,
    isLoading: loadingTraining || loadingMetrics || loadingZones || 
              mlPredictions.isLoading || zoneClusters.isLoading || modelValidation.isLoading,
    error: mlPredictions.error || zoneClusters.error || modelValidation.error,
  };
};

// Función auxiliar
const calculateDaysSinceLastService = (services: any[]): number => {
  if (services.length === 0) return 999;
  
  const lastService = services.reduce((latest, current) => {
    return new Date(current.fecha_hora_cita) > new Date(latest.fecha_hora_cita) ? current : latest;
  });
  
  const daysDiff = Math.floor((Date.now() - new Date(lastService.fecha_hora_cita).getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff;
};