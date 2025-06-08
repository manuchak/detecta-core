
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ServicioMonitoreo, CreateServicioData } from '@/types/serviciosMonitoreo';

export const useServiciosMonitoreo = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener todos los servicios
  const { data: servicios, isLoading, error } = useQuery({
    queryKey: ['servicios-monitoreo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicios_monitoreo')
        .select(`
          *,
          ejecutivo:profiles!ejecutivo_ventas_id(display_name),
          coordinador:profiles!coordinador_operaciones_id(display_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ServicioMonitoreo[];
    }
  });

  // Crear nuevo servicio
  const createServicio = useMutation({
    mutationFn: async (data: CreateServicioData) => {
      const { data: result, error } = await supabase
        .from('servicios_monitoreo')
        .insert([{
          ...data,
          ejecutivo_ventas_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios-monitoreo'] });
      toast({
        title: "Servicio creado",
        description: "El servicio de monitoreo ha sido creado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el servicio de monitoreo.",
        variant: "destructive",
      });
      console.error('Error creating service:', error);
    }
  });

  // Actualizar estado del servicio
  const updateEstadoServicio = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const { data, error } = await supabase
        .from('servicios_monitoreo')
        .update({ estado_general: estado })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios-monitoreo'] });
      toast({
        title: "Estado actualizado",
        description: "El estado del servicio ha sido actualizado.",
      });
    }
  });

  return {
    servicios,
    isLoading,
    error,
    createServicio,
    updateEstadoServicio
  };
};

// Export the separate hook
export { useAnalisisRiesgo } from './useAnalisisRiesgo';
