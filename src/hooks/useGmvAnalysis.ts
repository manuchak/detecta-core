
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAllGmvData } from '@/services/gmvDataService';
import { processGmvData, GmvAnalysisData } from '@/utils/gmvDataProcessor';

export const useGmvAnalysis = (selectedClient: string = "all") => {
  const { data: allServices, isLoading, error } = useQuery({
    queryKey: ['gmv-analysis-complete'],
    queryFn: fetchAllGmvData,
    staleTime: 5 * 60 * 1000, // Reducido a 5 minutos para datos más frescos
    gcTime: 10 * 60 * 1000, // Cache durante 10 minutos
    retry: 3,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Evitar refetch innecesario al montar
  });

  const analysisData = useMemo((): GmvAnalysisData => {
    return processGmvData(allServices, selectedClient);
  }, [allServices, selectedClient]);

  return {
    ...analysisData,
    isLoading,
    error,
    totalRecords: allServices?.length || 0
  };
};
