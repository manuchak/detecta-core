

export type EstadoAfiliacion = 'pendiente' | 'activo' | 'suspendido' | 'inactivo';
export type TipoInstalacion = 'gps_vehicular' | 'gps_personal' | 'camara' | 'alarma' | 'combo';
export type EstadoInstalacion = 'programada' | 'confirmada' | 'en_proceso' | 'completada' | 'cancelada' | 'reprogramada';
export type PrioridadInstalacion = 'baja' | 'normal' | 'alta' | 'urgente';
export type EstadoInventario = 'disponible' | 'asignado' | 'instalado' | 'mantenimiento' | 'dañado' | 'perdido';

export interface Instalador {
  id: string;
  user_id?: string;
  nombre_completo: string;
  telefono: string;
  email: string;
  cedula_profesional?: string;
  especialidades: string[];
  zona_cobertura?: any;
  disponibilidad_horaria?: any;
  calificacion_promedio: number;
  servicios_completados: number;
  estado_afiliacion: EstadoAfiliacion;
  fecha_afiliacion: string;
  documentacion_completa: boolean;
  certificaciones: string[];
  vehiculo_propio: boolean;
  datos_vehiculo?: any;
  banco_datos?: any;
  created_at: string;
  updated_at: string;
}

export interface ProgramacionInstalacion {
  id: string;
  servicio_id: string;
  instalador_id?: string;
  activo_id?: string;
  tipo_instalacion: TipoInstalacion;
  fecha_programada: string;
  fecha_estimada_fin?: string;
  direccion_instalacion: string;
  coordenadas_instalacion?: any;
  contacto_cliente: string;
  telefono_contacto: string;
  estado: EstadoInstalacion;
  prioridad: PrioridadInstalacion;
  equipos_requeridos?: any;
  herramientas_especiales: string[];
  tiempo_estimado: number;
  observaciones_cliente?: string;
  instrucciones_especiales?: string;
  requiere_vehiculo_elevado: boolean;
  acceso_restringido: boolean;
  created_at: string;
  updated_at: string;
  // Relaciones
  instalador?: Instalador;
  servicio?: any;
  activo?: any;
}

export interface InventarioGPS {
  id: string;
  numero_serie: string;
  modelo: string;
  marca: string;
  tipo_dispositivo: TipoInstalacion;
  estado: EstadoInventario;
  instalador_asignado?: string;
  servicio_asignado?: string;
  fecha_asignacion?: string;
  fecha_instalacion?: string;
  ubicacion_actual?: string;
  firmware_version?: string;
  ultimo_reporte?: string;
  bateria_estado?: number;
  signal_quality?: number;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface SeguimientoInstalacion {
  id: string;
  instalacion_id: string;
  instalador_id: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado_anterior?: string;
  estado_nuevo: string;
  observaciones?: string;
  problemas_encontrados: string[];
  solucion_aplicada?: string;
  equipos_utilizados?: any;
  evidencia_fotografica: string[];
  firma_cliente?: string;
  calificacion_cliente?: number;
  comentarios_cliente?: string;
  ubicacion_gps?: any;
  created_at: string;
}

export interface EvaluacionInstalador {
  id: string;
  instalacion_id: string;
  instalador_id: string;
  evaluado_por: string;
  calificacion_tecnica: number;
  calificacion_puntualidad: number;
  calificacion_comunicacion: number;
  calificacion_general: number;
  comentarios?: string;
  recomendado: boolean;
  problemas_reportados: string[];
  fortalezas_destacadas: string[];
  created_at: string;
}

export interface CreateInstaladorData {
  nombre_completo: string;
  telefono: string;
  email: string;
  cedula_profesional?: string;
  especialidades: string[];
  zona_cobertura?: any;
  disponibilidad_horaria?: any;
  certificaciones?: string[];
  vehiculo_propio?: boolean;
  datos_vehiculo?: any;
  banco_datos?: any;
}

export interface CreateProgramacionData {
  servicio_id: string;
  activo_id?: string;
  tipo_instalacion: TipoInstalacion;
  fecha_programada: string;
  direccion_instalacion: string;
  contacto_cliente: string;
  telefono_contacto: string;
  prioridad?: PrioridadInstalacion;
  equipos_requeridos?: any;
  herramientas_especiales?: string[];
  tiempo_estimado?: number;
  observaciones_cliente?: string;
  instrucciones_especiales?: string;
  requiere_vehiculo_elevado?: boolean;
  acceso_restringido?: boolean;
}

