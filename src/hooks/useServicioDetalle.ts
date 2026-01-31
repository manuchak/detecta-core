import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ServicioDetalle {
  id: string;
  id_servicio: string;
  nombre_cliente: string;
  id_interno_cliente: string | null;
  telefono_cliente: string | null;
  origen: string;
  destino: string;
  fecha_hora_cita: string;
  hora_inicio_real: string | null;
  tipo_servicio: string;
  requiere_armado: boolean;
  observaciones: string | null;
  estado_planeacion: string;
  custodio_asignado: string | null;
  armado_asignado: string | null;
  // Additional fields from DB
  created_at?: string;
  updated_at?: string;
}

export const useServicioDetalle = (serviceId: string | null) => {
  return useQuery({
    queryKey: ['servicio-detalle', serviceId],
    queryFn: async (): Promise<ServicioDetalle | null> => {
      if (!serviceId) return null;
      
      const { data, error } = await supabase
        .from('servicios_planificados')
        .select('*')
        .eq('id', serviceId)
        .single();
      
      if (error) {
        console.error('Error fetching service details:', error);
        throw error;
      }
      
      return data as ServicioDetalle;
    },
    enabled: !!serviceId,
    staleTime: 30000, // 30 seconds
  });
};
