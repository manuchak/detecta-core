
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
}
