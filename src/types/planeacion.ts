// =====================================================
// TIPOS PARA MÓDULO DE PLANEACIÓN DE CUSTODIAS
// =====================================================

export type EstadoCustodio = 'activo' | 'inactivo';
export type DisponibilidadCustodio = 'disponible' | 'ocupado' | 'off' | 'temporalmente_indisponible';
export type TipoCustodia = 'armado' | 'no_armado';
export type EstadoServicio = 'nuevo' | 'en_oferta' | 'asignado' | 'en_curso' | 'finalizado' | 'cancelado';
export type EstadoOferta = 'enviada' | 'aceptada' | 'rechazada' | 'expirada';
export type TipoEvento = 'desvio' | 'jammer' | 'ign_on' | 'ign_off' | 'arribo_poi' | 'contacto_custodio' | 'contacto_cliente' | 'otro';
export type SeveridadEvento = 'baja' | 'media' | 'alta' | 'critica';
export type ActorTouchpoint = 'C4' | 'Planificador' | 'Custodio' | 'Cliente';
export type CanalComunicacion = 'whatsapp' | 'app' | 'telefono' | 'email';
export type TipoServicioCustodia = 'traslado' | 'custodia_local' | 'escolta' | 'vigilancia';

// =====================================================
// INTERFACES DE DATOS
// =====================================================

export interface Cliente {
  id: string;
  nombre: string;
  rfc?: string;
  contacto_nombre: string;
  contacto_tel: string;
  contacto_email?: string;
  sla_minutos_asignacion: number;
  notas?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Custodio {
  id: string;
  nombre: string;
  tel: string;
  email?: string;
  rating_promedio: number | null;
  dias_sin_actividad: number;
  zona_base?: string;
  lat?: number;
  lng?: number;
  tiene_gadgets: boolean;
  tipo_custodia: TipoCustodia;
  certificaciones: string[];
  estado: EstadoCustodio;
  disponibilidad: DisponibilidadCustodio;
  ultima_actividad: string;
  cuenta_bancaria?: any;
  documentos: string[];
  comentarios?: string;
  created_at: string;
  updated_at: string;
  // Nuevas propiedades para el sistema unificado
  numero_servicios?: number | null;
  fuente?: 'pc_custodios' | 'candidatos_custodios' | 'servicios_custodia' | 'custodios_operativos';
  es_nuevo?: boolean;
  expectativa_ingresos?: number;
  experiencia_seguridad?: boolean;
  vehiculo_propio?: boolean;
  // Scores operativos (cuando vienen de custodios_operativos)
  score_comunicacion?: number;
  score_aceptacion?: number;
  score_confiabilidad?: number;
  score_total?: number;
  tasa_aceptacion?: number;
  tasa_respuesta?: number;
  tasa_confiabilidad?: number;
}

export interface RutaFrecuente {
  id: string;
  cliente_id: string;
  nombre_ruta: string;
  origen_texto: string;
  origen_lat?: number;
  origen_lng?: number;
  destino_texto: string;
  destino_lat?: number;
  destino_lng?: number;
  km_estimados?: number;
  tiempo_estimado_min?: number;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface Servicio {
  id: string;
  folio: string;
  cliente_id: string;
  fecha_programada: string;
  hora_ventana_inicio: string;
  hora_ventana_fin: string;
  origen_texto: string;
  origen_lat?: number;
  origen_lng?: number;
  destino_texto: string;
  destino_lat?: number;
  destino_lng?: number;
  tipo_servicio: TipoServicioCustodia;
  requiere_gadgets: boolean;
  requiere_armado?: boolean;
  estado: EstadoServicio;
  custodio_asignado_id?: string;
  motivo_cancelacion?: string;
  notas_especiales?: string;
  prioridad: number;
  valor_estimado?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Relaciones y campos auxiliares
  cliente?: Cliente | string;
  cliente_rel?: Cliente; // relación anidada cuando se selecciona explícitamente como alias
  custodio_asignado?: Custodio;
  ofertas?: OfertaCustodio[];
  asignacion?: Asignacion;
  eventos?: EventoMonitoreo[];
  touchpoints?: Touchpoint[];
  costos?: CostoIngreso;
}

export interface OfertaCustodio {
  id: string;
  servicio_id: string;
  custodio_id: string;
  estado: EstadoOferta;
  motivo_rechazo?: string;
  score_asignacion?: number;
  ola_numero: number;
  enviada_en: string;
  respondida_en?: string;
  expira_en: string;
  canal: CanalComunicacion;
  mensaje_enviado?: string;
  created_at: string;
  // Relaciones
  servicio?: Servicio;
  custodio?: Custodio;
}

export interface Asignacion {
  id: string;
  servicio_id: string;
  custodio_id: string;
  oferta_id?: string;
  aceptada_en: string;
  confirmada_por_planificador: boolean;
  confirmada_por?: string;
  confirmada_en?: string;
  notas?: string;
  created_at: string;
  // Relaciones
  servicio?: Servicio;
  custodio?: Custodio;
  oferta?: OfertaCustodio;
}

export interface EventoMonitoreo {
  id: string;
  servicio_id: string;
  timestamp: string;
  tipo: TipoEvento;
  severidad: SeveridadEvento;
  detalle: string;
  ubicacion_lat?: number;
  ubicacion_lng?: number;
  adjuntos: string[];
  resuelto: boolean;
  resuelto_por?: string;
  resuelto_en?: string;
  notas_resolucion?: string;
  created_by?: string;
  created_at: string;
  // Relaciones
  servicio?: Servicio;
}

export interface Touchpoint {
  id: string;
  servicio_id: string;
  actor: ActorTouchpoint;
  timestamp: string;
  medio: CanalComunicacion;
  notas: string;
  duracion_min?: number;
  adjuntos: string[];
  created_by?: string;
  created_at: string;
  // Relaciones
  servicio?: Servicio;
}

export interface CostoIngreso {
  id: string;
  servicio_id: string;
  costo_custodio: number;
  casetas: number;
  viaticos: number;
  otros_costos: number;
  cobro_cliente: number;
  variacion: number;
  margen: number;
  porcentaje_margen: number;
  notas_costos?: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  servicio?: Servicio;
}

export interface ConfigScoring {
  id: string;
  nombre_config: string;
  peso_antiguo_inactivo: number;
  peso_distancia_origen: number;
  peso_rating: number;
  peso_match_tipo: number;
  peso_gadgets: number;
  peso_certificaciones: number;
  peso_confirmado_disponible: number;
  activa: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  usuario_id?: string;
  accion: string;
  entidad: string;
  entidad_id?: string;
  timestamp: string;
  payload?: any;
  ip_address?: string;
  user_agent?: string;
}

// =====================================================
// INTERFACES PARA UI Y FORMULARIOS
// =====================================================

export interface ServicioForm {
  cliente_id: string;
  id_interno_cliente?: string;
  fecha_programada: string;
  hora_ventana_inicio: string;
  hora_ventana_fin: string;
  origen_texto: string;
  origen_lat?: number;
  origen_lng?: number;
  destino_texto: string;
  destino_lat?: number;
  destino_lng?: number;
  tipo_servicio: TipoServicioCustodia;
  requiere_gadgets: boolean;
  requiere_armado?: boolean;
  notas_especiales?: string;
  prioridad: number;
  valor_estimado?: number;
}

export interface CustodioForm {
  nombre: string;
  tel: string;
  email?: string;
  zona_base?: string;
  lat?: number;
  lng?: number;
  tiene_gadgets: boolean;
  tipo_custodia: TipoCustodia;
  certificaciones: string[];
  comentarios?: string;
}

export interface ClienteForm {
  nombre: string;
  rfc?: string;
  contacto_nombre: string;
  contacto_tel: string;
  contacto_email?: string;
  sla_minutos_asignacion: number;
  notas?: string;
}

// =====================================================
// INTERFACES PARA REPORTING Y KPIS
// =====================================================

export interface KPIDashboard {
  total_servicios: number;
  servicios_por_estado: Record<EstadoServicio, number>;
  tasa_aceptacion: number;
  tiempo_medio_asignacion: number;
  servicios_con_gadgets: number;
  custodios_activos: number;
  ingresos_totales: number;
  margen_promedio: number;
}

export interface ReporteAceptacion {
  periodo: string;
  custodio_id: string;
  custodio_nombre: string;
  ofertas_enviadas: number;
  ofertas_aceptadas: number;
  tasa_aceptacion: number;
  tiempo_promedio_respuesta: number;
}

export interface ReporteTiempos {
  cliente_id: string;
  cliente_nombre: string;
  sla_configurado: number;
  tiempo_promedio_asignacion: number;
  servicios_dentro_sla: number;
  servicios_fuera_sla: number;
  porcentaje_cumplimiento: number;
}

export interface ReporteMargenes {
  servicio_id: string;
  cliente_nombre: string;
  fecha_servicio: string;
  cobro_cliente: number;
  costos_totales: number;
  margen: number;
  porcentaje_margen: number;
}

// =====================================================
// INTERFACES PARA ALGORITMO DE SCORING
// =====================================================

export interface CustodioConScore {
  custodio: Custodio;
  score: number;
  desglose_score: {
    antiguo_inactivo: number;
    distancia_origen: number;
    rating: number;
    match_tipo: number;
    gadgets: number;
    certificaciones: number;
    confirmado_disponible: number;
  };
  distancia_km?: number;
  tiempo_estimado_llegada?: number;
}

export interface ParametrosScoring {
  servicio: Servicio;
  config: ConfigScoring;
  custodios_disponibles: Custodio[];
}

// =====================================================
// INTERFACES PARA IMPORTACIÓN
// =====================================================

export interface MapeoCampos {
  [campo_excel: string]: string; // campo_db
}

export interface ResultadoImportacion {
  total_filas: number;
  filas_procesadas: number;
  filas_exitosas: number;
  filas_con_errores: number;
  errores: ErrorImportacion[];
}

export interface ErrorImportacion {
  fila: number;
  campo: string;
  valor: any;
  error: string;
}

// =====================================================
// INTERFACES PARA FILTROS Y BÚSQUEDAS
// =====================================================

export interface FiltrosServicios {
  estado?: EstadoServicio[];
  cliente_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  tipo_servicio?: TipoServicioCustodia[];
  requiere_gadgets?: boolean;
  custodio_asignado?: string;
  busqueda?: string;
}

export interface FiltrosCustodios {
  estado?: EstadoCustodio[];
  disponibilidad?: DisponibilidadCustodio[];
  tipo_custodia?: TipoCustodia[];
  tiene_gadgets?: boolean;
  zona_base?: string;
  certificaciones?: string[];
  rating_minimo?: number;
  busqueda?: string;
}

export interface FiltrosClientes {
  activo?: boolean;
  busqueda?: string;
}

// =====================================================
// INTERFACES PARA ASIGNACIÓN DE ARMADOS
// =====================================================

/**
 * Datos de servicio pendiente de asignación
 * 
 * ⚠️ IMPORTANTE: custodio_asignado debe ser string directo, NO objeto
 * 
 * ✅ Ejemplo correcto: "Juan Pérez"
 * ❌ Ejemplo incorrecto: { nombre: "Juan Pérez" }
 * 
 * Este formato garantiza compatibilidad con PendingAssignmentModal
 * y SimplifiedArmedAssignment para renderizar correctamente los tabs
 * y filtros personalizables de armados internos.
 */
export interface PendingServiceAssignment {
  id?: string;
  id_servicio?: string;
  folio?: string;
  nombre_cliente: string;
  empresa_cliente?: string;
  email_cliente?: string;
  telefono_cliente?: string;
  origen_texto: string;
  destino_texto: string;
  fecha_programada: string;
  hora_ventana_inicio: string;
  tipo_servicio: string;
  requiere_armado: boolean;
  notas_especiales?: string;
  created_at: string;
  custodio_asignado: string | null; // ⚠️ Debe ser string, no objeto
  armado_asignado?: string | null;
  estado?: EstadoServicio;
}

/**
 * Punto intermedio para rutas de reparto
 * 
 * ⚠️ IMPORTANTE: puntos_intermedios debe ser array directo en JSONB
 * 
 * ❌ NO usar: JSON.stringify(puntos_intermedios)
 * ✅ SÍ usar: puntos_intermedios (array directo)
 * 
 * Supabase convierte automáticamente arrays JavaScript a JSONB.
 * El uso de JSON.stringify() causa errores de check constraint.
 */
export interface PuntoIntermedio {
  orden: number;
  nombre: string;
  direccion: string;
  tiempo_estimado_parada_min: number;
  observaciones?: string;
}