import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ServicioFacturacion {
  // Identificación completa
  id: number;
  folio_saphiro: string;           // ID completo (ej: EMEDEME-234)
  id_servicio: string;             // Backward compatibility
  folio_planeacion: string | null;
  folio_cliente: string;
  referencia_cliente: string | null;
  id_interno_cliente: string | null;  // Backward compatibility
  
  // Timeline Planeación
  fecha_recepcion: string | null;      // Cuando se recibió el servicio (sp.created_at)
  fecha_asignacion: string | null;     // Cuando se asignó custodio
  fecha_asignacion_armado: string | null;
  
  // Timeline Operativo
  fecha_hora_cita: string;             // FECHA ANCLA del servicio
  fecha_hora_asignacion: string | null;
  hora_presentacion: string | null;    // Custodio en sitio
  hora_inicio_custodia: string | null; // Inicio real del servicio
  hora_arribo: string | null;          // Llegada a destino
  hora_finalizacion: string | null;    // Fin del servicio
  duracion_servicio: string | null;
  duracion_calculada: string | null;   // Calculada: fin - inicio
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
  desviacion_km: number | null;        // Porcentaje de desviación
  
  // Custodio
  nombre_custodio: string;
  custodio_id: string | null;
  telefono_custodio: string | null;
  vehiculo_custodio: string | null;
  placa_custodio: string | null;
  
  // Armado
  nombre_armado: string | null;
  armado_id: string | null;
  telefono_armado: string | null;
  tipo_asignacion_armado: string | null; // 'interno' o 'proveedor'
  proveedor: string | null;
  requiere_armado: boolean;
  
  // Transporte
  tipo_unidad: string | null;
  tipo_carga: string | null;
  nombre_operador_transporte: string | null;
  telefono_operador: string | null;
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
      // Obtener proveedores reales de la tabla proveedores_armados (no de servicios_custodia)
      // Esto evita mostrar datos legacy incorrectos como "EX-MILITAR", "Seter", etc.
      const { data, error } = await supabase
        .from('proveedores_armados')
        .select('nombre_empresa')
        .eq('activo', true)
        .order('nombre_empresa');

      if (error) throw error;
      
      return data?.map(d => d.nombre_empresa).filter(Boolean) as string[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
