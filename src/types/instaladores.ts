export type EstadoAfiliacion = 'pendiente' | 'activo' | 'suspendido' | 'inactivo';
export type TipoInstalacion = 'gps_vehicular' | 'gps_personal' | 'camara' | 'alarma' | 'combo';
export type EstadoInstalacion = 'programada' | 'confirmada' | 'en_proceso' | 'completada' | 'cancelada' | 'reprogramada';
export type PrioridadInstalacion = 'baja' | 'normal' | 'alta' | 'urgente';
export type EstadoInventario = 'disponible' | 'asignado' | 'instalado' | 'mantenimiento' | 'dañado' | 'perdido';

export interface Instalador {
  id: string;
  user_id?: string;
  codigo_instalador?: string;
  nombre_completo: string;
  telefono: string;
  email: string;
  direccion?: string;
  ciudad?: string;
  estado?: string;
  codigo_postal?: string;
  fecha_nacimiento?: string;
  experiencia_años?: number;
  cedula_profesional?: string;
  especialidades: string[];
  zona_cobertura?: any;
  disponibilidad_horaria?: any;
  disponibilidad_horarios?: Record<string, boolean>;
  calificacion_promedio: number;
  servicios_completados: number;
  total_instalaciones?: number;
  instalaciones_exitosas?: number;
  estado_afiliacion: EstadoAfiliacion;
  fecha_afiliacion: string;
  fecha_registro?: string;
  documentacion_completa: boolean;
  certificaciones: string[];
  vehiculo_propio: boolean;
  herramientas_propias?: boolean;
  datos_vehiculo?: any;
  banco_datos?: any;
  activo?: boolean;
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
  instalador_id?: string;
  activo_id?: string;
  tipo_instalacion: TipoInstalacion;
  fecha_programada: string;
  direccion_instalacion: string;
  contacto_cliente: string;
  telefono_contacto: string;
  estado?: EstadoInstalacion;
  prioridad?: PrioridadInstalacion;
  equipos_requeridos?: any;
  herramientas_especiales?: string[];
  tiempo_estimado?: number;
  observaciones_cliente?: string;
  instrucciones_especiales?: string;
  requiere_vehiculo_elevado?: boolean;
  acceso_restringido?: boolean;
}

// Nuevas interfaces para el módulo completo de instaladores
export interface InstaladorDatosFiscales {
  id: string;
  instalador_id: string;
  rfc: string;
  razon_social: string;
  regimen_fiscal: string;
  direccion_fiscal: string;
  ciudad_fiscal: string;
  estado_fiscal: string;
  codigo_postal_fiscal: string;
  email_facturacion: string;
  telefono_facturacion?: string;
  banco?: string;
  cuenta_bancaria?: string;
  clabe_interbancaria?: string;
  titular_cuenta?: string;
  documentos_fiscales: Record<string, any>;
  verificado: boolean;
  verificado_por?: string;
  fecha_verificacion?: string;
  observaciones_verificacion?: string;
  created_at: string;
  updated_at: string;
}

export interface EvidenciaInstalacion {
  id: string;
  programacion_id: string;
  instalador_id: string;
  tipo_evidencia: 'foto_antes' | 'foto_durante' | 'foto_despues' | 'video_funcionamiento' | 'documento_entrega' | 'firma_cliente';
  archivo_url: string;
  descripcion?: string;
  timestamp_captura: string;
  ubicacion_gps?: { x: number; y: number };
  verificado: boolean;
  verificado_por?: string;
  fecha_verificacion?: string;
  observaciones_verificacion?: string;
  created_at: string;
}

export interface PagoInstalador {
  id: string;
  instalador_id: string;
  programacion_id: string;
  concepto: string;
  monto: number;
  moneda: string;
  estado_pago: 'pendiente' | 'aprobado' | 'pagado' | 'rechazado' | 'cancelado';
  metodo_pago?: 'transferencia' | 'cheque' | 'efectivo' | 'deposito';
  referencia_pago?: string;
  fecha_aprobacion?: string;
  aprobado_por?: string;
  fecha_pago?: string;
  pagado_por?: string;
  observaciones?: string;
  documentos_soporte: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AuditoriaInstalacion {
  id: string;
  programacion_id: string;
  instalador_id: string;
  auditor_id: string;
  estado_auditoria: 'en_revision' | 'aprobada' | 'rechazada' | 'requiere_correccion';
  puntuacion_tecnica?: number;
  puntuacion_evidencias?: number;
  puntuacion_documentacion?: number;
  puntuacion_general?: number;
  aspectos_positivos?: string[];
  aspectos_mejora?: string[];
  observaciones?: string;
  requiere_seguimiento: boolean;
  fecha_auditoria: string;
  fecha_resolucion?: string;
  created_at: string;
  updated_at: string;
}
