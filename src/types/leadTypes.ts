
// Unified Lead interface used across the application
export interface Lead {
  id: string;
  nombre: string;
  email: string;
  telefono?: string; // Make optional to match database
  empresa?: string;
  estado: string;
  fuente?: string;
  fecha_creacion: string;
  fecha_contacto?: string;
  asignado_a?: string;
  notas?: string;
  mensaje?: string;
  updated_at: string;
  created_at: string;
}

export interface AssignedLead {
  lead_id: string;
  lead_nombre: string;
  lead_email: string;
  lead_telefono: string;
  lead_estado: string;
  lead_fecha_creacion: string;
  approval_stage: string;
  phone_interview_completed: boolean;
  second_interview_required: boolean;
  final_decision: string | null;
  notas?: string; // Campo para almacenar información adicional del candidato
  analyst_name?: string; // Nombre del analista asignado
  analyst_email?: string; // Email del analista asignado
  last_call_outcome?: string; // Resultado de la última llamada manual
  has_successful_call?: boolean; // Si ha tenido al menos una llamada exitosa
}

export interface ManualCallLog {
  id: string;
  lead_id: string;
  caller_id: string;
  call_outcome: 'successful' | 'no_answer' | 'busy' | 'voicemail' | 'wrong_number' | 'call_failed' | 'reschedule_requested';
  call_notes?: string;
  call_duration_minutes?: number;
  call_datetime: string;
  scheduled_datetime?: string;
  rescheduled_from_call_id?: string;
  requires_reschedule?: boolean;
  created_at: string;
  updated_at: string;
}
