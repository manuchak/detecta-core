import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ServicioFacturacion } from './useServiciosFacturacion';

export interface ClienteConServiciosPendientes {
  cliente: string;
  clienteId: string | null;
  servicios: number;
  montoTotal: number;
  ultimoServicio: string;
  serviciosDetalle: ServicioFacturacion[];
}

export interface FiltrosPorFacturar {
  fechaInicio?: string;
  fechaFin?: string;
  cliente?: string;
}

/**
 * Hook para obtener servicios finalizados que NO están vinculados a ninguna factura
 */
export function useServiciosPorFacturar(filtros: FiltrosPorFacturar = {}) {
  return useQuery({
    queryKey: ['servicios-por-facturar', filtros],
    queryFn: async () => {
      // 1. Obtener IDs de servicios ya facturados
      const { data: partidasFacturadas, error: errorPartidas } = await supabase
        .from('factura_partidas')
        .select('servicio_id')
        .not('servicio_id', 'is', null);

      if (errorPartidas) throw errorPartidas;

      const serviciosFacturadosIds = new Set(
        partidasFacturadas?.map(p => p.servicio_id) || []
      );

      // 2. Query de servicios finalizados
      let query = supabase
        .from('vw_servicios_facturacion')
        .select('*')
        .eq('estado', 'Finalizado')
        .order('fecha_hora_cita', { ascending: false });

      if (filtros.fechaInicio) {
        query = query.gte('fecha_hora_cita', filtros.fechaInicio);
      }
      if (filtros.fechaFin) {
        query = query.lte('fecha_hora_cita', `${filtros.fechaFin}T23:59:59`);
      }
      if (filtros.cliente) {
        query = query.ilike('nombre_cliente', `%${filtros.cliente}%`);
      }

      const { data: servicios, error } = await query.limit(5000);

      if (error) throw error;

      // 3. Filtrar servicios no facturados
      const serviciosSinFacturar = (servicios || []).filter(
        (s: ServicioFacturacion) => !serviciosFacturadosIds.has(s.id)
      );

      return serviciosSinFacturar as ServicioFacturacion[];
    },
    staleTime: 1 * 60 * 1000, // 1 minute - más corto para datos de facturación
  });
}

/**
 * Hook para agrupar servicios por cliente
 */
export function useServiciosAgrupadosPorCliente(filtros: FiltrosPorFacturar = {}) {
  const { data: servicios = [], isLoading, error, refetch } = useServiciosPorFacturar(filtros);

  const clientesAgrupados: ClienteConServiciosPendientes[] = servicios.reduce((acc, servicio) => {
    const cliente = servicio.nombre_cliente || 'Sin cliente';
    
    let clienteExistente = acc.find(c => c.cliente === cliente);
    
    if (!clienteExistente) {
      clienteExistente = {
        cliente,
        clienteId: null, // Se llenará después si existe en pc_clientes
        servicios: 0,
        montoTotal: 0,
        ultimoServicio: servicio.fecha_hora_cita,
        serviciosDetalle: [],
      };
      acc.push(clienteExistente);
    }

    clienteExistente.servicios += 1;
    clienteExistente.montoTotal += servicio.cobro_cliente || 0;
    clienteExistente.serviciosDetalle.push(servicio);

    // Actualizar último servicio si es más reciente
    if (servicio.fecha_hora_cita > clienteExistente.ultimoServicio) {
      clienteExistente.ultimoServicio = servicio.fecha_hora_cita;
    }

    return acc;
  }, [] as ClienteConServiciosPendientes[]);

  // Ordenar por monto descendente
  clientesAgrupados.sort((a, b) => b.montoTotal - a.montoTotal);

  return {
    clientesAgrupados,
    totalServicios: servicios.length,
    totalMonto: servicios.reduce((sum, s) => sum + (s.cobro_cliente || 0), 0),
    isLoading,
    error,
    refetch,
  };
}
