import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ServicioFacturacion {
  // Identificación
  id: number;
  id_servicio: string;
  folio_cliente: string;
  id_interno_cliente: string | null;  // Folio interno del cliente
  
  // Timeline completo
  fecha_hora_cita: string;
  fecha_hora_asignacion: string | null;
  hora_presentacion: string | null;
  hora_inicio_custodia: string | null;
  hora_arribo: string | null;
  hora_finalizacion: string | null;
  duracion_servicio: string | null;
  tiempo_retraso: string | null;
  created_at: string;
  updated_time: string | null;
  
  // Cliente
  nombre_cliente: string;
  comentarios_adicionales: string | null;
  
  // Ruta
  ruta: string;
  origen: string;
  destino: string;
  local_foraneo: string;
  
  // Kilometraje
  km_teorico: number | null;
  km_recorridos: number;
  km_extras: string | null;
  km_auditado: boolean | null;
  desviacion_km: number | null;
  
  // Recursos
  nombre_custodio: string;
  telefono_custodio: string | null;
  nombre_armado: string | null;
  telefono_armado: string | null;
  proveedor: string | null;
  requiere_armado: boolean;
  
  // Transporte
  tipo_unidad: string | null;
  tipo_carga: string | null;
  nombre_operador_transporte: string | null;
  placa_carga: string | null;
  
  // Tracking
  gadget: string | null;
  tipo_gadget: string | null;
  
  // Financiero
  cobro_cliente: number;
  costo_custodio: number;
  casetas: string | null;
  margen_bruto: number;
  porcentaje_margen: number;
  
  // Estado
  estado: string;
  tipo_servicio: string;
  estado_planeacion: string | null;
  
  // Origen
  creado_via: string | null;
  creado_por: string;
}

export interface FiltrosFacturacion {
  fechaInicio?: string;
  fechaFin?: string;
  cliente?: string;
  estado?: string;
  tipoServicio?: string;
  localForaneo?: string;
  proveedor?: string;
  tipoUnidad?: string;
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
      if (filtros.proveedor) {
        query = query.eq('proveedor', filtros.proveedor);
      }
      if (filtros.tipoUnidad) {
        query = query.eq('tipo_unidad', filtros.tipoUnidad);
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

export function useProveedoresUnicos() {
  return useQuery({
    queryKey: ['proveedores-facturacion-unicos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicios_custodia')
        .select('proveedor')
        .not('proveedor', 'is', null)
        .order('proveedor');

      if (error) throw error;
      
      const proveedores = [...new Set(data?.map(d => d.proveedor).filter(Boolean))];
      return proveedores as string[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
