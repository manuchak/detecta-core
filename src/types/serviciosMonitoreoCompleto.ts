import type { TipoServicio, Prioridad } from './serviciosMonitoreo';

export interface CreateServicioMonitoreoCompleto {
  // Información básica del cliente
  nombre_cliente: string;
  empresa?: string;
  telefono_contacto: string;
  email_contacto: string;
  direccion_cliente: string;
  
  // Información del servicio
  tipo_servicio: TipoServicio;
  prioridad: Prioridad;
  cantidad_vehiculos: number;
  modelo_vehiculo?: string;
  tipo_vehiculo?: string;
  
  // Operación y rutas
  horarios_operacion?: HorarioOperacion;
  rutas_habituales?: string[];
  zonas_riesgo_identificadas: boolean;
  detalles_zonas_riesgo?: string;
  
  // GPS actual
  cuenta_gps_instalado: boolean;
  detalles_gps_actual?: string;
  cuenta_boton_panico: boolean;
  
  // Preferencias GPS - campos nuevos agregados
  objetivos_principales?: string[]; // Changed from prioridad_funcional to support multiple
  funcionalidades_deseadas?: {
    ubicacion_tiempo_real?: boolean;
    historial_rutas?: boolean;
    alertas_velocidad?: boolean;
    geocercas?: boolean;
    boton_panico?: boolean;
    paro_motor?: boolean;
    alerta_jamming?: boolean;
    sensor_vibracion?: boolean;
    sensor_combustible?: boolean;
    diagnosticos_vehiculo?: boolean;
    sensor_puertas?: boolean;
    camara_foto?: boolean;
  };
  condiciones_especiales_uso?: string;
  presupuesto_estimado?: string;
  
  // GPS preferencias (campos existentes)
  tipo_gps_preferido?: string;
  marca_gps_preferida?: string;
  modelo_gps_preferido?: string;
  requiere_paro_motor: boolean;
  condiciones_paro_motor?: string;
  
  // Sensores y configuración
  configuracion_sensores: ConfiguracionSensores;
  
  // Contactos de emergencia
  contactos_emergencia: ContactoEmergencia[];
  
  // Configuración de reportes
  configuracion_reportes: ConfiguracionReportes;
  
  observaciones?: string;
}

export interface HorarioOperacion {
  [key: string]: { inicio: string; fin: string; activo: boolean } | boolean | undefined;
  lunes?: { inicio: string; fin: string; activo: boolean };
  martes?: { inicio: string; fin: string; activo: boolean };
  miercoles?: { inicio: string; fin: string; activo: boolean };
  jueves?: { inicio: string; fin: string; activo: boolean };
  viernes?: { inicio: string; fin: string; activo: boolean };
  sabado?: { inicio: string; fin: string; activo: boolean };
  domingo?: { inicio: string; fin: string; activo: boolean };
  es_24_horas?: boolean;
}

export interface ConfiguracionSensores {
  // Sensores de Seguridad y Antimanipulación
  sensor_puerta: boolean;
  sensor_ignicion: boolean;
  boton_panico: boolean;
  corte_ignicion_paro_motor: boolean;
  deteccion_jamming: boolean;
  sensor_presencia_vibracion: boolean;
  
  // Sensores de Ubicación y Movimiento
  geocercas_dinamicas: boolean;
  
  // Sensores de Operación del Vehículo
  lectura_obdii_can_bus: boolean;
  sensor_combustible: boolean;
  sensor_temperatura: boolean;
  sensor_carga_peso: boolean;
  
  // Funciones de energía y autonomía
  bateria_interna_respaldo: boolean;
  alerta_desconexion_electrica: boolean;
  monitoreo_voltaje: boolean;
  
  // Conectividad y Comunicación
  bluetooth_wifi: boolean;
  compatibilidad_sensores_rs232: boolean;
}

export interface ContactoEmergencia {
  nombre: string;
  telefono: string;
  email?: string;
  tipo_contacto: 'principal' | 'secundario' | 'emergencia';
  orden_prioridad: number;
}

export interface ConfiguracionReportes {
  frecuencia_reportes: 'cada_30_minutos' | 'diario' | 'semanal' | 'mensual';
  limitantes_protocolos?: string;
  medio_contacto_preferido: 'llamada' | 'whatsapp' | 'sms' | 'correo';
  observaciones_adicionales?: string;
}

export interface MarcaGPS {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface ModeloGPS {
  id: string;
  marca_id: string;
  nombre: string;
  caracteristicas?: any;
  activo: boolean;
}

export interface TipoMonitoreo {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

// New interfaces for approval workflow
export interface AprobacionCoordinador {
  id: string;
  servicio_id: string;
  coordinador_id: string;
  fecha_revision: string;
  estado_aprobacion: 'pendiente' | 'aprobado' | 'rechazado' | 'requiere_aclaracion';
  
  // Validation questionnaire
  modelo_vehiculo_compatible?: boolean;
  cobertura_celular_verificada?: boolean;
  requiere_instalacion_fisica?: boolean;
  acceso_instalacion_disponible?: boolean;
  restricciones_tecnicas_sla?: boolean;
  contactos_emergencia_validados?: boolean;
  elementos_aclarar_cliente?: string;
  
  observaciones?: string;
  fecha_respuesta?: string;
}

export interface AnalisisRiesgoSeguridad {
  id: string;
  servicio_id: string;
  analista_id: string;
  fecha_analisis: string;
  estado_analisis: 'pendiente' | 'completado' | 'requiere_informacion';
  
  // Risk analysis questionnaire
  tipo_monitoreo_requerido?: string;
  tipo_activo_proteger?: string;
  perfil_usuario?: string;
  zonas_operacion?: string[];
  historial_incidentes?: string;
  frecuencia_uso_rutas?: string;
  tipo_riesgo_principal?: string[];
  nivel_exposicion?: 'alto' | 'medio' | 'bajo';
  controles_actuales_existentes?: string[];
  dispositivos_seguridad_requeridos?: string[];
  medios_comunicacion_cliente?: string[];
  puntos_criticos_identificados?: string;
  apoyo_externo_autoridades?: string;
  
  // Analysis results
  calificacion_riesgo?: 'bajo' | 'medio' | 'alto' | 'critico';
  recomendaciones?: string;
  equipamiento_recomendado?: any;
  aprobado_seguridad?: boolean;
  
  observaciones?: string;
}
