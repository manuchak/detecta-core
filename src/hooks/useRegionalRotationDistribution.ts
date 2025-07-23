import { useState, useEffect } from 'react';
import { useCohortAnalytics } from './useCohortAnalytics';

export interface RegionalRotationData {
  region: string;
  custodiosRotados: number;
  tasaRotacionRegional: number;
  porcentajeDistribucion: number;
}

export interface RegionalRotationMetrics {
  rotacionTotal: {
    currentMonthRate: number;
    retiredCustodiansCount: number;
    activeCustodiansBase: number;
  };
  distribucionRegional: RegionalRotationData[];
  timestamp: string;
}

// Nueva redistribución regional: Centro MX 55%, Bajío 30%, Pacífico 13%, Golfo 2%
const REGIONAL_DISTRIBUTION = {
  'Centro de México': 0.55,
  'Bajío': 0.30,
  'Pacífico': 0.13,
  'Golfo': 0.02
};

export const useRegionalRotationDistribution = () => {
  const [regionalData, setRegionalData] = useState<RegionalRotationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { realRotation, realRotationLoading } = useCohortAnalytics();

  useEffect(() => {
    if (!realRotationLoading && realRotation) {
      // Calcular distribución regional usando datos reales de rotación
      const distribucionRegional = Object.entries(REGIONAL_DISTRIBUTION).map(([region, porcentaje]) => ({
        region,
        custodiosRotados: Math.round(realRotation.retiredCustodiansCount * porcentaje),
        tasaRotacionRegional: Math.round(realRotation.currentMonthRate * porcentaje * 100) / 100,
        porcentajeDistribucion: porcentaje
      }));

      setRegionalData({
        rotacionTotal: {
          currentMonthRate: realRotation.currentMonthRate,
          retiredCustodiansCount: realRotation.retiredCustodiansCount,
          activeCustodiansBase: realRotation.activeCustodiansBase
        },
        distribucionRegional,
        timestamp: new Date().toISOString()
      });
      
      setLoading(false);
    }
  }, [realRotation, realRotationLoading]);

  return {
    regionalData,
    loading: loading || realRotationLoading,
    distribution: REGIONAL_DISTRIBUTION
  };
};