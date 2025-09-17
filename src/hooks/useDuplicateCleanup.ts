
// @ts-nocheck

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DuplicateCleanupResult {
  duplicates_found: number;
  duplicates_removed: number;
  details: string;
}

interface DuplicateCheck {
  id_servicio: string;
  duplicate_count: number;
  service_ids: number[];
  latest_date: string;
}

interface MaintenanceLog {
  id: string;
  operation_type: string;
  table_name: string;
  records_affected: number;
  operation_details: string;
  executed_at: string;
  created_at: string;
}

export const useDuplicateCleanup = () => {
  const queryClient = useQueryClient();

  // Query para verificar duplicados existentes
  const { data: duplicates, isLoading: checkingDuplicates } = useQuery({
    queryKey: ['duplicate-services'],
    queryFn: async (): Promise<DuplicateCheck[]> => {
      const { data, error } = await supabase.rpc('check_duplicate_service_ids');
      if (error) throw error;
      return data || [];
    },
  });

  // Query para obtener logs de mantenimiento
  const { data: maintenanceLogs, isLoading: loadingLogs } = useQuery({
    queryKey: ['maintenance-logs'],
    queryFn: async (): Promise<MaintenanceLog[]> => {
      const { data, error } = await supabase
        .from('maintenance_log')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  // Mutation para ejecutar limpieza manual
  const cleanupMutation = useMutation({
    mutationFn: async (): Promise<DuplicateCleanupResult> => {
      const { data, error } = await supabase.rpc('clean_duplicate_service_ids');
      if (error) throw error;
      return data[0];
    },
    onSuccess: (data) => {
      toast.success(`Limpieza completada: ${data.details}`);
      queryClient.invalidateQueries({ queryKey: ['duplicate-services'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-logs'] });
    },
    onError: (error) => {
      toast.error(`Error en la limpieza: ${error.message}`);
    },
  });

  return {
    duplicates,
    maintenanceLogs,
    checkingDuplicates,
    loadingLogs,
    cleanupMutation,
    executeCleanup: cleanupMutation.mutate,
    isExecutingCleanup: cleanupMutation.isPending,
  };
};
