// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ForecastConfig {
  id: string;
  config_type: string;
  alpha: number;
  beta: number;
  gamma: number;
  use_manual: boolean;
  show_advanced: boolean;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ForecastConfigUpdate {
  alpha?: number;
  beta?: number;
  gamma?: number;
  use_manual?: boolean;
  show_advanced?: boolean;
}

export const useForecastConfig = () => {
  return useQuery({
    queryKey: ["forecast-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forecast_config")
        .select("*")
        .eq("config_type", "global")
        .single();

      if (error) {
        console.error("Error fetching forecast config:", error);
        throw error;
      }

      return data as ForecastConfig;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateForecastConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: ForecastConfigUpdate) => {
      const { data, error } = await supabase
        .from("forecast_config")
        .update(updates)
        .eq("config_type", "global")
        .select()
        .single();

      if (error) {
        console.error("Error updating forecast config:", error);
        throw error;
      }

      return data as ForecastConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forecast-config"] });
      toast.success("Configuración del modelo actualizada");
    },
    onError: (error: any) => {
      console.error("Error updating forecast config:", error);
      toast.error("Error al actualizar la configuración del modelo");
    },
  });
};

export const useCanModifyForecastConfig = () => {
  return useQuery({
    queryKey: ["can-modify-forecast-config"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('user_has_role_secure', {
        check_role: 'admin'
      });

      if (error) {
        console.error("Error checking user roles:", error);
        return false;
      }

      return data || false;
    },
    staleTime: 10 * 60 * 1000,
  });
};
