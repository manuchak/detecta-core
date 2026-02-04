import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ServicioFacturacion {
  id: number;
  id_servicio: string;
  fecha_hora_cita: string;
  nombre_cliente: string;
  folio_cliente: string;
  ruta: string;
  origen: string;
  destino: string;
  tipo_servicio: string;
  local_foraneo: string;
  km_recorridos: number;
  km_teorico: number;
  cobro_cliente: number;
  costo_custodio: number;
  margen_bruto: number;
  porcentaje_margen: number;
  nombre_custodio: string;
  nombre_armado: string;
  proveedor: string;
  estado: string;
  casetas: string;
  gadget: string;
  duracion_servicio: string;
  created_at: string;
  creado_por: string;
  cliente_rfc?: string;
  cliente_email?: string;
  forma_pago_preferida?: string;
  precio_lista?: number;
  costo_lista?: number;
}

export interface FiltrosFacturacion {
  fechaInicio?: string;
  fechaFin?: string;
  cliente?: string;
  estado?: string;
  tipoServicio?: string;
  localForaneo?: string;
}

export function useServiciosFacturacion(filtros: FiltrosFacturacion = {}) {
  return useQuery({
    queryKey: ['servicios-facturacion', filtros],
    queryFn: async () => {
      let query = supabase
        .from('vw_servicios_facturacion')
        .select('*')
        .order('fecha_hora_cita', { ascending: false });

      // Aplicar filtros
      if (filtros.fechaInicio) {
        query = query.gte('fecha_hora_cita', filtros.fechaInicio);
      }
      if (filtros.fechaFin) {
        query = query.lte('fecha_hora_cita', filtros.fechaFin);
      }
      if (filtros.cliente) {
        query = query.ilike('nombre_cliente', `%${filtros.cliente}%`);
      }
      if (filtros.estado) {
        query = query.eq('estado', filtros.estado);
      }
      if (filtros.tipoServicio) {
        query = query.eq('tipo_servicio', filtros.tipoServicio);
      }
      if (filtros.localForaneo) {
        query = query.eq('local_foraneo', filtros.localForaneo);
      }

      const { data, error } = await query.limit(1000);

      if (error) throw error;
      return (data || []) as ServicioFacturacion[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useClientesUnicos() {
  return useQuery({
    queryKey: ['clientes-facturacion-unicos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicios_custodia')
        .select('nombre_cliente')
        .not('nombre_cliente', 'is', null)
        .order('nombre_cliente');

      if (error) throw error;
      
      // Get unique clients
      const clientes = [...new Set(data?.map(d => d.nombre_cliente).filter(Boolean))];
      return clientes as string[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
