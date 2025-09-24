import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CreateServicioCustodiaData {
  id_servicio: string;
  nombre_cliente: string;
  empresa_cliente?: string;
  telefono_contacto?: string;
  email_cliente?: string;
  ubicacion_completa: string;
  tipo_servicio: string;
  prioridad: string;
  num_vehiculos?: number;
  observaciones?: string;
  fecha_hora_cita?: string;
  estado?: string;
}

export const useCreateServicioCustodia = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateServicioCustodiaData) => {
      const servicioData = {
        id_servicio: data.id_servicio,
        nombre_cliente: data.nombre_cliente,
        empresa_cliente: data.empresa_cliente,
        telefono_contacto: data.telefono_contacto,
        email_cliente: data.email_cliente,
        origen: data.ubicacion_completa,
        destino: data.ubicacion_completa,
        tipo_servicio: data.tipo_servicio,
        prioridad: data.prioridad,
        num_vehiculos: data.num_vehiculos || 1,
        observaciones: data.observaciones,
        fecha_hora_cita: data.fecha_hora_cita || new Date().toISOString(),
        estado: data.estado || 'programado',
        nombre_custodio: 'Sin Asignar',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from('servicios_custodia')
        .insert(servicioData)
        .select()
        .single();

      if (error) {
        console.error('Error creating service:', error);
        throw new Error(error.message || 'Error al crear el servicio');
      }

      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Servicio creado exitosamente",
        description: `Servicio ${data.id_servicio} ha sido registrado correctamente.`,
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['scheduled-services'] });
      queryClient.invalidateQueries({ queryKey: ['servicios-custodia'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error al crear servicio",
        description: error.message,
      });
    },
  });
};