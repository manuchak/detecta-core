// Tipos específicos para el dashboard de recursos de planeación

export interface ClusterInactividad {
  activo_30d: number;
  inactivo_30_60d: number;
  inactivo_60_90d: number;
  inactivo_90_120d: number;
  inactivo_mas_120d: number;
  nunca_asignado: number;
}

export interface IndisponibilidadTemporal {
  tipo: string;
  cantidad: number;
}

export interface ZonaDemanda {
  origen: string;
  cantidad_servicios: number;
  porcentaje: number;
  // Campos para geocodificación en mapa
  lat?: number;
  lng?: number;
  estado?: string;
}

export interface FlujoOrigenDestino {
  origen: string;
  destino: string;
  origen_lat?: number;
  origen_lng?: number;
  destino_lat?: number;
  destino_lng?: number;
  cantidad: number;
  porcentaje: number;
  flujo_inverso: number;
  ratio_desequilibrio: number;
}

export interface RecursosCustodios {
  total_activos: number;
  pool_registrado?: number; // Total registrados en DB (incluye migración histórica)
  disponibles: number;
  con_servicio_reciente: number;
  tasa_activacion: number;
  clusters: ClusterInactividad;
  indisponibilidades: IndisponibilidadTemporal[];
}

export interface RecursosArmados {
  total_activos: number;
  pool_registrado?: number;
  disponibles: number;
  con_servicio_30d: number;
  tasa_activacion: number;
  clusters: ClusterInactividad;
  indisponibilidades: IndisponibilidadTemporal[];
}

export interface ProveedorExternoMetrics {
  nombre: string;
  serviciosTotales: number;
  servicios30d: number;
  diasActivos: number;
  armadosActivos: number;
  activo: boolean;
}

export interface RecursosPlaneacion {
  custodios: RecursosCustodios;
  armados: RecursosArmados;
  proveedores_externos: ProveedorExternoMetrics[];
  top_zonas_demanda: ZonaDemanda[];
  flujos_origen_destino: FlujoOrigenDestino[];
}

export const CLUSTER_CONFIG = {
  activo_30d: {
    label: 'Activo (0-30 días)',
    color: 'hsl(142, 76%, 36%)', // green
    bgClass: 'bg-green-500',
  },
  inactivo_30_60d: {
    label: '30-60 días',
    color: 'hsl(45, 93%, 47%)', // yellow
    bgClass: 'bg-yellow-500',
  },
  inactivo_60_90d: {
    label: '60-90 días',
    color: 'hsl(25, 95%, 53%)', // orange
    bgClass: 'bg-orange-500',
  },
  inactivo_90_120d: {
    label: '90-120 días',
    color: 'hsl(0, 72%, 51%)', // red
    bgClass: 'bg-red-500',
  },
  inactivo_mas_120d: {
    label: '+120 días',
    color: 'hsl(0, 0%, 45%)', // gray
    bgClass: 'bg-gray-500',
  },
  nunca_asignado: {
    label: 'Sin asignar',
    color: 'hsl(0, 0%, 70%)', // light gray
    bgClass: 'bg-gray-400',
  },
} as const;

export type ClusterKey = keyof typeof CLUSTER_CONFIG;
