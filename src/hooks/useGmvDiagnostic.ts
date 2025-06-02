
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGmvAnalysis } from './useGmvAnalysis';

export const useGmvDiagnostic = () => {
  
  const { data: allServices, isLoading, error } = useQuery({
    queryKey: ['gmv-diagnostic'],
    queryFn: async () => {
      console.log('=== DIAGNÓSTICO GMV DETALLADO ===');
      
      try {
        const { data: serviceData, error } = await supabase
          .rpc('bypass_rls_get_servicios', { max_records: 25000 });

        if (error) {
          console.error('Error al obtener servicios:', error);
          throw error;
        }

        console.log(`📊 Total de registros obtenidos: ${serviceData?.length || 0}`);
        return serviceData || [];
      } catch (error) {
        console.error('Error en consulta diagnóstica:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 2
  });
  
  const diagnosticResult = useGmvAnalysis(allServices);
  
  return {
    isLoading,
    error,
    diagnosticResult
  };
};
