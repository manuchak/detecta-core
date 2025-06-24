
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
