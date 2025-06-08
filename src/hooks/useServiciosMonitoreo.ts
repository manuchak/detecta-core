import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ServicioMonitoreo, CreateServicioData, AnalisisRiesgo, DocumentacionRequerida, ActivoMonitoreo } from '@/types/serviciosMonitoreo';

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

// Hook específico para análisis de riesgo
export const useAnalisisRiesgo = (servicioId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: analisis, isLoading } = useQuery({
    queryKey: ['analisis-riesgo', servicioId],
    queryFn: async () => {
      if (!servicioId) return null;
      
      const { data, error } = await supabase
        .from('analisis_riesgo')
        .select('*')
        .eq('servicio_id', servicioId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as AnalisisRiesgo | null;
    },
    enabled: !!servicioId
  });

  const saveAnalisis = useMutation({
    mutationFn: async (data: Partial<AnalisisRiesgo> & { servicio_id: string; zona_operacion: string }) => {
      const currentUser = await supabase.auth.getUser();
      
      const analisisData = {
        ...data,
        evaluado_por: currentUser.data.user?.id
      };

      const { data: result, error } = await supabase
        .from('analisis_riesgo')
        .upsert(analisisData)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analisis-riesgo'] });
      toast({
        title: "Análisis guardado",
        description: "El análisis de riesgo ha sido guardado exitosamente.",
      });
    }
  });

  return {
    analisis,
    isLoading,
    saveAnalisis
  };
};

// Exportar también el nuevo hook de análisis de riesgo
export { useAnalisisRiesgo } from './useAnalisisRiesgo';
