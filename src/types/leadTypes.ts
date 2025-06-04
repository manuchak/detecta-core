
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
}
