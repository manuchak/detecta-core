// Unified Lead interface used across the application
// Estados del proceso custodio
export type LeadEstado = 
  | 'nuevo'
  | 'contactado'
  | 'en_revision'
  | 'aprobado'
  | 'en_liberacion'
  | 'rechazado'
  | 'psicometricos_pendiente'
  | 'psicometricos_completado'
  | 'toxicologicos_pendiente'
  | 'toxicologicos_completado'
  | 'instalacion_gps_pendiente'
  | 'instalacion_gps_completado'
  | 'custodio_activo'
  | 'rechazado_psicometrico'
  | 'rechazado_toxicologico'
  | 'inactivo'
  | 'aprobado_en_espera'; // Pool de Reserva - Candidatos aprobados en zona saturada

export interface Lead {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  empresa?: string;
  estado: LeadEstado;
  fuente?: string;
  fecha_creacion: string;
  fecha_contacto?: string;
  asignado_a?: string;
  notas?: string;
  mensaje?: string;
  updated_at: string;
  created_at: string;
  // Campos específicos del proceso custodio
  fecha_aprobacion?: string;
  fecha_psicometricos?: string;
  fecha_toxicologicos?: string;
  fecha_instalacion_gps?: string;
  fecha_activacion_custodio?: string;
  motivo_rechazo?: string;
  credenciales_enviadas?: boolean;
}

export interface AssignedLead {
  lead_id: string;
  lead_nombre: string;
  lead_email: string;
  lead_telefono: string;
  lead_estado: LeadEstado;
  lead_fecha_creacion: string;
  current_stage?: string; // Etapa actual del proceso de aprobación
  phone_interview_completed?: boolean; // Si completó entrevista telefónica
  second_interview_required?: boolean; // Si requiere segunda entrevista
  final_decision: string | null;
  notas?: string; // Campo para almacenar información adicional del candidato
  
  // Información del analista asignado
  asignado_a?: string; // UUID del analista asignado
  analista_nombre?: string; // Nombre del analista asignado
  analista_email?: string; // Email del analista asignado
  
  // Campos para rastreo de intentos de contacto
  contact_attempts_count?: number;
  last_contact_attempt_at?: string | null;
  last_contact_outcome?: string; // Resultado de la última llamada manual
  
  has_successful_call?: boolean; // Si ha tenido al menos una llamada exitosa
  has_scheduled_call?: boolean; // Si tiene una llamada reprogramada pendiente
  scheduled_call_datetime?: string; // Fecha y hora de la llamada reprogramada
  // Nuevos campos para manejo de entrevistas interrumpidas
  last_interview_data?: Record<string, any>; // Datos de la última sesión de entrevista
  interruption_reason?: string; // Motivo de la última interrupción
  interview_session_id?: string; // ID de la sesión actual/última
  last_autosave_at?: string; // Timestamp del último auto-guardado
  interview_interrupted?: boolean; // Si la entrevista fue interrumpida
  interview_in_progress?: boolean; // Si la entrevista está en progreso
  interview_started_at?: string; // Cuándo se inició la entrevista
  
  // Pool de Reserva - Nuevos campos
  zona_preferida_id?: string;
  zona_nombre?: string;
  fecha_entrada_pool?: string;
  motivo_pool?: string;
}

export interface ManualCallLog {
  id: string;
  lead_id: string;
  caller_id: string;
  call_outcome: 'successful' | 'no_answer' | 'busy' | 'voicemail' | 'wrong_number' | 'non_existent_number' | 'call_failed' | 'reschedule_requested' | 'numero_no_disponible';
  call_notes?: string;
  call_duration_minutes?: number;
  call_datetime: string;
  scheduled_datetime?: string;
  rescheduled_from_call_id?: string;
  requires_reschedule?: boolean;
  created_at: string;
  updated_at: string;
}

// Pool de Reserva - Interfaces adicionales
export interface ZoneCapacity {
  id: string;
  zona_id: string;
  zona_nombre: string;
  capacidad_maxima: number;
  capacidad_actual: number;
  umbral_saturacion: number;
  zona_saturada: boolean;
  espacios_disponibles: number;
  activo: boolean;
}

export interface PoolMovement {
  id: string;
  lead_id: string;
  zona_id: string;
  movimiento_tipo: 'entrada' | 'salida' | 'reactivacion' | 'expiracion';
  motivo: string;
  fecha_entrada?: string;
  fecha_salida?: string;
  reactivado_por?: string;
  notas?: string;
  metadata?: Record<string, any>;
  created_at: string;
  created_by?: string;
}
