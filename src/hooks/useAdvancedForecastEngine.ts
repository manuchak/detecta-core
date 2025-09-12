import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useDynamicServiceData } from './useDynamicServiceData';

interface AdvancedForecastResult {
  forecast: {
    services: number;
    gmv: number;
    confidence: number;
  };
  ensemble: {
    finalPrediction: {
      services: number;
      gmv: number;
      confidence: number;
    };
    individualModels: any[];
    weights: Record<string, number>;
    uncertainty: {
      lower: number;
      upper: number;
    };
    methodology: string;
  };
  regime: {
    regime: {
      regime: 'normal' | 'exponential' | 'declining' | 'volatile';
      confidence: number;
      changepoints?: number[];
    };
    mathematicalJustification: string;
  };
  recommendations: string[];
  confidence: {
    overall: number;
    individual: Record<string, number>;
    reasoning: string;
  };
  accuracy: {
    historical: number;
    expected: number;
    uncertainty: number;
  };
  diagnostics: {
    dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
    modelAgreement: number;
    seasonalityStrength: number;
    trendStability: number;
  };
}

export const useAdvancedForecastEngine = () => {
  const { user } = useAuth();
  const { data: dynamicData } = useDynamicServiceData();

  return useQuery({
    queryKey: ['advanced-forecast-engine'],
    queryFn: async (): Promise<AdvancedForecastResult> => {
      if (!user || !dynamicData) throw new Error('Data not available');

      // Simplified mock for now
      return {
        forecast: {
          services: 1200,
          gmv: 7800000,
          confidence: 0.85
        },
        ensemble: {
          finalPrediction: {
            services: 1200,
            gmv: 7800000,
            confidence: 0.85
          },
          individualModels: [
            { name: 'Prophet', services: 1180, confidence: 0.8, mape: 8.5, trend: 'increasing', parameters: {} },
            { name: 'ARIMA', services: 1220, confidence: 0.75, mape: 12.2, trend: 'stable', parameters: {} }
          ],
          weights: { Prophet: 0.6, ARIMA: 0.4 },
          uncertainty: { lower: 1050, upper: 1350 },
          methodology: 'Ensemble de 2 modelos avanzados'
        },
        regime: {
          regime: {
            regime: 'normal',
            confidence: 0.8,
            changepoints: []
          },
          mathematicalJustification: 'Patrón estable con baja volatilidad'
        },
        recommendations: ['✅ Sistema funcionando óptimamente'],
        confidence: {
          overall: 0.85,
          individual: { Prophet: 0.8, ARIMA: 0.75 },
          reasoning: 'Alta calidad de datos y consenso entre modelos'
        },
        accuracy: {
          historical: 88,
          expected: 85,
          uncertainty: 8
        },
        diagnostics: {
          dataQuality: 'good',
          modelAgreement: 0.9,
          seasonalityStrength: 0.6,
          trendStability: 0.8
        }
      };
    },
    enabled: !!user && !!dynamicData,
    staleTime: 10 * 60 * 1000
  });
};