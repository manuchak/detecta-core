
import { useMemo } from 'react';
import { useAuthenticatedQuery, AUTHENTICATED_QUERY_CONFIG } from '@/hooks/useAuthenticatedQuery';
import { fetchAllGmvData } from '@/services/gmvDataService';
import { processGmvData, GmvAnalysisData } from '@/utils/gmvDataProcessor';

export const useGmvAnalysis = (selectedClient: string = "all") => {
  const { data: allServices, isLoading, error } = useAuthenticatedQuery<any[]>(
    ['gmv-analysis-complete', selectedClient],
    async () => {
      const res = await fetchAllGmvData();
      console.log(`✅ GMV fetch completo: ${Array.isArray(res) ? res.length : 0} registros`);
      return res as any[];
    },
    {
      ...AUTHENTICATED_QUERY_CONFIG,
      staleTime: 30_000,
      gcTime: 60_000,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      retry: 2,
    }
  );

  const analysisData = useMemo((): GmvAnalysisData => {
    // Ensure allServices is an array before processing
    const servicesArray = Array.isArray(allServices) ? allServices : [];
    return processGmvData(servicesArray, selectedClient);
  }, [allServices, selectedClient]);

  return {
    ...analysisData,
    isLoading,
    error,
    totalRecords: Array.isArray(allServices) ? allServices.length : 0
  };
};
