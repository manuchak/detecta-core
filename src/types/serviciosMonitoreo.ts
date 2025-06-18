export type TipoServicio = 'personal' | 'vehicular' | 'flotilla';
export type Prioridad = 'baja' | 'media' | 'alta' | 'critica';
export type EstadoGeneral = 
  | 'pendiente_evaluacion' 
  | 'pendiente_analisis_riesgo' 
  | 'en_evaluacion_riesgo' 
  | 'evaluacion_completada'
  | 'pendiente_aprobacion' 
  | 'aprobado' 
  | 'rechazado'
  | 'pendiente_instalacion' 
  | 'programacion_instalacion' 
  | 'instalacion_programada' 
  | 'instalacion_completada'
  | 'integracion_sistema' 
  | 'servicio_activo' 
  | 'suspendido' 
  | 'cancelado';

export type NivelRiesgo = 'bajo' | 'medio' | 'alto' | 'muy_alto';
export type SituacionFinanciera = 'estable' | 'regular' | 'inestable' | 'desconocida';
export type Recomendacion = 'aprobar' | 'aprobar_con_condiciones' | 'rechazar' | 'requiere_revision';
export type TipoActivo = 'vehiculo' | 'persona' | 'inmueble' | 'carga';
export type TipoCliente = 'nuevo' | 'recurrente' | 'referido';
export type MetodoEvaluacion = 'automatico' | 'manual' | 'mixto';

export interface ServicioMonitoreo {
  id: string;
  numero_servicio: string;
  cliente_id?: string;
  nombre_cliente: string;
  empresa?: string;
  telefono_contacto: string;
  email_contacto: string;
  direccion_cliente: string;
  tipo_servicio: TipoServicio;
  prioridad: Prioridad;
  estado_general: EstadoGeneral;
  fecha_solicitud: string;
  fecha_limite_respuesta?: string;
  fecha_inicio_servicio?: string;
  ejecutivo_ventas_id?: string;
  coordinador_operaciones_id?: string;
  
  // Nuevos campos añadidos
  cantidad_vehiculos?: number;
  modelo_vehiculo?: string;
  tipo_vehiculo?: string;
  horarios_operacion?: any;
  rutas_habituales?: string[];
  zonas_riesgo_identificadas?: boolean;
  detalles_zonas_riesgo?: string;
  cuenta_gps_instalado?: boolean;
  detalles_gps_actual?: string;
  cuenta_boton_panico?: boolean;
  tipo_gps_preferido?: string;
  marca_gps_preferida?: string;
  modelo_gps_preferido?: string;
  requiere_paro_motor?: boolean;
  condiciones_paro_motor?: string;
  
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface CriterioEvaluacionFinanciera {
  id: string;
  nombre: string;
  descripcion?: string;
  peso_score: number;
  categoria: 'ingresos' | 'estabilidad' | 'historial_crediticio' | 'referencias';
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface RespuestaAnalisisRiesgo {
  id: string;
  analisis_id: string;
  criterio_id: string;
  respuesta: string;
  valor_numerico?: number;
  observaciones?: string;
  created_at: string;
}

export interface AnalisisRiesgo {
  id: string;
  servicio_id: string;
  nivel_riesgo_cliente?: NivelRiesgo;
  antecedentes_verificados: boolean;
  referencias_comerciales: boolean;
  situacion_financiera?: SituacionFinanciera;
  zona_operacion: string;
  nivel_riesgo_zona?: NivelRiesgo;
  incidencia_delictiva?: any;
  detalles_riesgo?: any;
  score_riesgo?: number;
  recomendacion?: Recomendacion;
  condiciones_especiales?: string[];
  evaluado_por?: string;
  fecha_evaluacion?: string;
  revisado_por?: string;
  fecha_revision?: string;
  metodo_evaluacion?: MetodoEvaluacion;
  documentos_revisados?: string[];
  referencias_verificadas?: any;
  historial_crediticio?: string;
  ingresos_declarados?: number;
  comprobantes_ingresos?: boolean;
  tiempo_en_actividad?: number;
  tipo_cliente?: TipoCliente;
  created_at: string;
  updated_at: string;
}

export interface DocumentacionRequerida {
  id: string;
  servicio_id: string;
  identificacion_oficial: boolean;
  comprobante_domicilio: boolean;
  rfc?: string;
  curp?: string;
  acta_constitutiva: boolean;
  poder_notarial: boolean;
  cedula_fiscal: boolean;
  tarjeta_circulacion: boolean;
  factura_vehiculo: boolean;
  poliza_seguro: boolean;
  documentos_adicionales?: any;
  documentacion_completa: boolean;
  validado_por?: string;
  fecha_validacion?: string;
  observaciones_documentacion?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivoMonitoreo {
  id: string;
  servicio_id: string;
  tipo_activo: TipoActivo;
  descripcion: string;
  marca?: string;
  modelo?: string;
  año?: number;
  color?: string;
  placas?: string;
  numero_serie?: string;
  numero_motor?: string;
  nombre_persona?: string;
  edad?: number;
  ocupacion?: string;
  telefono_persona?: string;
  ubicacion_habitual?: string;
  rutas_frecuentes?: string[];
  horarios_operacion?: any;
  requiere_gps: boolean;
  gps_instalado: boolean;
  fecha_instalacion_gps?: string;
  numero_dispositivo?: string;
  integrado_sistema: boolean;
  fecha_integracion?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateServicioData {
  nombre_cliente: string;
  empresa?: string;
  telefono_contacto: string;
  email_contacto: string;
  direccion_cliente: string;
  tipo_servicio: TipoServicio;
  prioridad: Prioridad;
  observaciones?: string;
}
