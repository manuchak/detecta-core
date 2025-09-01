// Tipos para el sistema de control de GPS portátiles en comodato

export type EstadoComodato = 'asignado' | 'en_uso' | 'devuelto' | 'perdido' | 'dañado' | 'vencido';

export type TipoMovimientoComodato = 'asignacion' | 'devolucion' | 'reporte_daño' | 'perdida' | 'extension' | 'observacion';

export interface ComodatoGPS {
  id: string;
  producto_gps_id: string;
  numero_serie_gps: string;
  
  // Referencias duales para custodios
  pc_custodio_id?: string;
  custodio_operativo_nombre?: string;
  custodio_operativo_telefono?: string;
  
  // Fechas del ciclo de comodato
  fecha_asignacion: string;
  fecha_devolucion_programada: string;
  fecha_devolucion_real?: string;
  
  // Estado y observaciones
  estado: EstadoComodato;
  observaciones?: string;
  condiciones_asignacion?: string;
  condiciones_devolucion?: string;
  
  // Auditoría
  asignado_por: string;
  devuelto_por?: string;
  created_at: string;
  updated_at: string;
}

export interface MovimientoComodato {
  id: string;
  comodato_id: string;
  tipo_movimiento: TipoMovimientoComodato;
  fecha_movimiento: string;
  observaciones?: string;
  evidencias?: Record<string, any>;
  datos_adicionales?: Record<string, any>;
  usuario_id: string;
  created_at: string;
}

export interface CustodioOperativoActivo {
  nombre_custodio: string;
  telefono?: string;
  telefono_operador?: string;
  total_servicios: number;
  ultimo_servicio: string;
  servicios_completados: number;
  km_promedio?: number;
}

export interface ProductoGPS {
  id: string;
  nombre: string;
  marca?: string;
  modelo?: string;
  numero_serie?: string;
  cantidad_disponible: number;
  precio_venta_sugerido?: number;
}

// Interfaces para formularios
export interface ComodatoGPSForm {
  producto_gps_id: string;
  numero_serie_gps: string;
  custodio_tipo: 'planeacion' | 'operativo';
  pc_custodio_id?: string;
  custodio_operativo_nombre?: string;
  custodio_operativo_telefono?: string;
  fecha_devolucion_programada: string;
  observaciones?: string;
  condiciones_asignacion?: string;
}

export interface DevolucionForm {
  fecha_devolucion_real: string;
  condiciones_devolucion?: string;
  observaciones?: string;
  evidencias?: File[];
}

// Interfaces para búsqueda y filtros
export interface FiltrosComodatos {
  estado?: EstadoComodato[];
  custodio_nombre?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  vencidos_proximos?: boolean;
}

// Interface para KPIs del dashboard
export interface KPIsComodatos {
  total_activos: number;
  por_vencer: number;
  vencidos: number;
  en_uso: number;
  disponibles_wms: number;
  custodios_con_gps: number;
  promedio_dias_uso: number;
  tasa_devolucion: number;
}

// Interface extendida con información adicional para la UI
export interface ComodatoGPSExtendido extends ComodatoGPS {
  // Información del producto GPS
  producto_nombre?: string;
  producto_marca?: string;
  producto_modelo?: string;
  
  // Información del custodio de planeación
  pc_custodio_nombre?: string;
  pc_custodio_email?: string;
  pc_custodio_tel?: string;
  
  // Información del usuario asignador
  asignado_por_nombre?: string;
  devuelto_por_nombre?: string;
  
  // Cálculos derivados
  dias_asignado?: number;
  dias_restantes?: number;
  esta_vencido?: boolean;
  esta_por_vencer?: boolean;
}