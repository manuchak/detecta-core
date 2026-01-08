/**
 * Tipos para el sistema de invitaciones SIERCP on-demand
 */

export type SIERCPInvitationStatus = 
  | 'pending'     // Creada pero no enviada
  | 'sent'        // Enviada al candidato
  | 'opened'      // El candidato abrió el enlace
  | 'started'     // El candidato inició la evaluación
  | 'completed'   // Evaluación completada
  | 'expired'     // Token expirado
  | 'cancelled';  // Cancelada manualmente

export type SendVia = 'email' | 'whatsapp' | 'manual' | 'sms';

export interface SIERCPInvitation {
  id: string;
  lead_id: string;
  candidato_custodio_id?: string;
  token: string;
  status: SIERCPInvitationStatus;
  expires_at: string;
  sent_at?: string;
  sent_via?: SendVia;
  opened_at?: string;
  started_at?: string;
  completed_at?: string;
  lead_nombre?: string;
  lead_email?: string;
  lead_telefono?: string;
  evaluacion_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  notas?: string;
}

export interface CreateInvitationData {
  lead_id: string;
  candidato_custodio_id?: string;
  lead_nombre: string;
  lead_email?: string;
  lead_telefono?: string;
  expires_hours?: number; // Default 72
  notas?: string;
}

export interface InvitationValidation {
  valid: boolean;
  invitation?: SIERCPInvitation;
  error?: 'not_found' | 'expired' | 'already_completed' | 'cancelled';
  message?: string;
}
