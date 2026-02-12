export type EstadoLiberacion = 
  | 'pendiente'
  | 'documentacion'
  | 'psicometricos'
  | 'toxicologicos'
  | 'vehiculo'
  | 'gps'
  | 'aprobado_final'
  | 'liberado'
  | 'rechazado';

export type TipoOperativo = 'custodio' | 'armado';

export interface CustodioLiberacion {
  id: string;
  candidato_id: string;
  estado_liberacion: EstadoLiberacion;
  tipo_operativo: TipoOperativo;
  // Documentación
  documentacion_ine: boolean;
  documentacion_licencia: boolean;
  documentacion_antecedentes: boolean;
  documentacion_domicilio: boolean;
  documentacion_curp: boolean;
  documentacion_rfc: boolean;
  documentacion_completa: boolean;
  fecha_documentacion_completa?: string;
  notas_documentacion?: string;
  
  // Psicométricos
  psicometricos_completado: boolean;
  psicometricos_resultado?: 'aprobado' | 'condicional' | 'rechazado';
  psicometricos_puntaje?: number;
  fecha_psicometricos?: string;
  psicometricos_archivo_url?: string;
  notas_psicometricos?: string;
  
  // Toxicológicos
  toxicologicos_completado: boolean;
  toxicologicos_resultado?: 'negativo' | 'positivo';
  fecha_toxicologicos?: string;
  toxicologicos_archivo_url?: string;
  notas_toxicologicos?: string;
  
  // Vehículo
  vehiculo_capturado: boolean;
  vehiculo_marca?: string;
  vehiculo_modelo?: string;
  vehiculo_año?: number;
  vehiculo_placa?: string;
  vehiculo_color?: string;
  vehiculo_tarjeta_circulacion: boolean;
  vehiculo_poliza_seguro: boolean;
  fecha_vehiculo_completo?: string;
  notas_vehiculo?: string;
  
  // GPS
  instalacion_gps_completado: boolean;
  gps_imei?: string;
  gps_numero_linea?: string;
  fecha_instalacion_gps?: string;
  instalador_id?: string;
  notas_gps?: string;
  gps_pendiente: boolean;
  motivo_gps_pendiente?: string;
  fecha_programacion_gps?: string;
  
  // Aprobación
  aprobado_por_supply?: string;
  fecha_aprobacion_supply?: string;
  liberado_por?: string;
  fecha_liberacion?: string;
  notas_liberacion?: string;
  
  // Ubicación de Residencia
  direccion_residencia?: string;
  estado_residencia_id?: string;
  ciudad_residencia?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // Relación con candidato
  candidato?: {
    nombre: string;
    telefono: string;
    email?: string;
    zona_preferida_id?: string;
    vehiculo_propio?: boolean;
  };
  
  // Relación expandida para estado
  estado_residencia?: {
    id: string;
    nombre: string;
  };
}

export interface ChecklistProgress {
  documentacion: number;
  psicometricos: number;
  toxicologicos: number;
  vehiculo: number;
  gps: number;
  total: number;
}

export interface LiberacionMetrics {
  total_en_proceso: number;
  total_liberados_mes: number;
  promedio_dias: number;
  bottleneck_actual: string;
  por_estado: Record<EstadoLiberacion, number>;
}
