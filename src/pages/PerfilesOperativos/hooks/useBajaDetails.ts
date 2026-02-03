import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SancionAplicada {
  id: string;
  dias_suspension: number;
  fecha_inicio: string;
  fecha_fin: string;
  notas: string | null;
  estado: string | null;
  servicio_relacionado_id: string | null;
  sancion_id: string | null;
  created_at: string | null;
  catalogo_sancion?: {
    nombre: string;
    categoria: string;
    codigo: string;
  } | null;
  servicio_relacionado?: {
    id_servicio: string | null;
    nombre_cliente: string | null;
    fecha_hora_cita: string | null;
    origen: string | null;
    destino: string | null;
  } | null;
}

export interface EstatusHistorial {
  id: string;
  estatus_anterior: string;
  estatus_nuevo: string;
  motivo: string;
  notas: string | null;
  tipo_cambio: string;
  created_at: string | null;
  fecha_reactivacion: string | null;
}

export interface BajaDetails {
  sanciones: SancionAplicada[];
  historial: EstatusHistorial[];
}

export function useBajaDetails(custodioId: string | null) {
  return useQuery({
    queryKey: ['baja-details', custodioId],
    queryFn: async (): Promise<BajaDetails> => {
      if (!custodioId) {
        return { sanciones: [], historial: [] };
      }

      // Fetch sanctions applied to this custodian
      const { data: sanciones, error: sancionesError } = await supabase
        .from('sanciones_aplicadas')
        .select(`
          id,
          dias_suspension,
          fecha_inicio,
          fecha_fin,
          notas,
          estado,
          servicio_relacionado_id,
          sancion_id,
          created_at
        `)
        .eq('operativo_id', custodioId)
        .eq('operativo_tipo', 'custodio')
        .order('created_at', { ascending: false });

      if (sancionesError) {
        console.error('Error fetching sanciones:', sancionesError);
      }

      // Fetch status history
      const { data: historial, error: historialError } = await supabase
        .from('operativo_estatus_historial')
        .select('*')
        .eq('operativo_id', custodioId)
        .eq('operativo_tipo', 'custodio')
        .order('created_at', { ascending: false });

      if (historialError) {
        console.error('Error fetching historial:', historialError);
      }

      // For each sancion with a servicio_relacionado_id, fetch service and catalog details
      const sancionesWithServices = await Promise.all(
        (sanciones || []).map(async (sancion) => {
          let servicio_relacionado = null;
          let catalogo_sancion = null;
          
          // Fetch catalog info
          if (sancion.sancion_id) {
            const { data: catalogData } = await supabase
              .from('catalogo_sanciones')
              .select('nombre, categoria, codigo')
              .eq('id', sancion.sancion_id)
              .maybeSingle();
            
            catalogo_sancion = catalogData;
          }
          
          if (sancion.servicio_relacionado_id) {
            // Try servicios_custodia first (execution)
            const { data: servicioExec } = await supabase
              .from('servicios_custodia')
              .select('id_servicio, nombre_cliente, fecha_hora_cita, origen, destino')
              .eq('id', sancion.servicio_relacionado_id)
              .maybeSingle();
            
            if (servicioExec) {
              servicio_relacionado = servicioExec;
            } else {
              // Try servicios_planificados (planning)
              const { data: servicioPlan } = await supabase
                .from('servicios_planificados')
                .select('id_interno_cliente, nombre_cliente, fecha_hora_cita, origen, destino')
                .eq('id', sancion.servicio_relacionado_id)
                .maybeSingle();
              
              if (servicioPlan) {
                servicio_relacionado = {
                  id_servicio: servicioPlan.id_interno_cliente,
                  nombre_cliente: servicioPlan.nombre_cliente,
                  fecha_hora_cita: servicioPlan.fecha_hora_cita,
                  origen: servicioPlan.origen,
                  destino: servicioPlan.destino,
                };
              }
            }
          }

          return {
            ...sancion,
            catalogo_sancion,
            servicio_relacionado,
          };
        })
      );

      return {
        sanciones: sancionesWithServices,
        historial: historial || [],
      };
    },
    enabled: !!custodioId,
  });
}
