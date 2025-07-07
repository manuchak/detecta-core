
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ServicioMonitoreo, CreateServicioData } from '@/types/serviciosMonitoreo';

export const useServiciosMonitoreo = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener todos los servicios con manejo de errores mejorado
  const { data: servicios, isLoading, error } = useQuery({
    queryKey: ['servicios-monitoreo'],
    queryFn: async () => {
      console.log('Iniciando carga de servicios...');
      
      try {
        // Primero intentamos una consulta básica sin joins complejos
        const { data, error } = await supabase
          .from('servicios_monitoreo')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error al cargar servicios:', error);
          throw error;
        }

        console.log('Servicios cargados exitosamente:', data?.length || 0);
        return data as ServicioMonitoreo[];
      } catch (error) {
        console.error('Error en la consulta de servicios:', error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  // Crear nuevo servicio
  const createServicio = useMutation({
    mutationFn: async (data: CreateServicioData) => {
      try {
        // Obtener el usuario actual de manera segura
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          throw new Error('Usuario no autenticado');
        }

        const { data: result, error } = await supabase
          .from('servicios_monitoreo')
          .insert([{
            ...data,
            ejecutivo_ventas_id: userData.user.id
          }])
          .select()
          .single();

        if (error) throw error;
        return result;
      } catch (error) {
        console.error('Error al crear servicio:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios-monitoreo'] });
      toast({
        title: "Servicio creado",
        description: "El servicio de monitoreo ha sido creado exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error en createServicio:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el servicio de monitoreo.",
        variant: "destructive",
      });
    }
  });

  // Actualizar estado del servicio
  const updateEstadoServicio = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      try {
        const { data, error } = await supabase
          .from('servicios_monitoreo')
          .update({ estado_general: estado })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error al actualizar estado del servicio:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios-monitoreo'] });
      toast({
        title: "Estado actualizado",
        description: "El estado del servicio ha sido actualizado.",
      });
    },
    onError: (error) => {
      console.error('Error en updateEstadoServicio:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del servicio.",
        variant: "destructive",
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
