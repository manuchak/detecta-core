import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useWMSAccess } from '@/hooks/useWMSAccess';

export interface ConfiguracionWMS {
  id: string;
  stock_minimo_default: number;
  stock_maximo_default: number;
  moneda_default: string;
  ubicacion_almacen_default: string;
  updated_at: string;
  created_at: string;
  updated_by: string | null;
}

export interface ConfiguracionWMSInput {
  stock_minimo_default: number;
  stock_maximo_default: number;
  moneda_default: string;
  ubicacion_almacen_default: string;
}

export const useConfiguracionWMS = () => {
  const queryClient = useQueryClient();
  const { canManageConfiguration } = useWMSAccess();

  // Obtener configuración actual
  const { data: configuracion, isLoading } = useQuery({
    queryKey: ['configuracion-wms'],
    queryFn: async () => {
      if (!canManageConfiguration()) {
        throw new Error('No tienes permisos para acceder a la configuración WMS');
      }
      
      const { data, error } = await supabase
        .from('configuracion_wms')
        .select('*')
        .single();

      if (error) throw error;
      return data as ConfiguracionWMS;
    },
    enabled: canManageConfiguration(),
  });

  // Actualizar configuración
  const updateConfiguracion = useMutation({
    mutationFn: async (input: ConfiguracionWMSInput) => {
      if (!canManageConfiguration()) {
        throw new Error('No tienes permisos para modificar la configuración WMS');
      }
      
      const { data, error } = await supabase
        .from('configuracion_wms')
        .update(input)
        .eq('id', configuracion?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracion-wms'] });
      toast({
        title: "Éxito",
        description: "Configuración guardada exitosamente",
      });
    },
    onError: (error) => {
      console.error('Error updating configuration:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    },
  });

  return {
    configuracion,
    isLoading,
    updateConfiguracion,
    canManageConfiguration,
  };
};