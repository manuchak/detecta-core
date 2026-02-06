/**
 * Tipos TypeScript para la integración de Kapso WhatsApp
 * Incluye 34 templates diseñados para Detecta
 */

// ==================== MENSAJES SALIENTES ====================

export interface KapsoInteractiveButton {
  id: string;
  title: string;
}

export interface KapsoInteractiveSection {
  title: string;
  rows: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
}

export interface KapsoInteractiveConfig {
  type: 'button' | 'list';
  header?: string;
  body: string;
  footer?: string;
  buttons?: KapsoInteractiveButton[];
  sections?: KapsoInteractiveSection[];
}

export interface KapsoMessageContext {
  servicio_id?: string;
  ticket_id?: string;
  custodio_telefono?: string;
  tipo_notificacion?: string;
  invitation_id?: string;
  lead_id?: string;
  candidato_id?: string;
  curso_id?: string;
  evaluacion_id?: string;
}

export interface KapsoSendMessageRequest {
  to: string;
  type: 'text' | 'image' | 'document' | 'interactive';
  text?: string;
  mediaUrl?: string;
  mediaCaption?: string;
  filename?: string;
  interactive?: KapsoInteractiveConfig;
  context?: KapsoMessageContext;
}

export interface KapsoTemplateParameter {
  type: 'text' | 'image' | 'document' | 'video';
  text?: string;
  image?: { link: string };
  document?: { link: string; filename: string };
}

export interface KapsoSendTemplateRequest {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: {
    header?: {
      type: string;
      parameters?: KapsoTemplateParameter[];
    };
    body?: {
      parameters: Array<{ type: 'text'; text: string }>;
    };
    buttons?: Array<{
      type: 'quick_reply' | 'url';
      index: number;
      parameters?: KapsoTemplateParameter[];
    }>;
  };
  context?: KapsoMessageContext;
}

export interface KapsoSendResponse {
  success: boolean;
  message_id?: string;
  to?: string;
  template?: string;
  error?: string;
}

// ==================== WEBHOOKS ENTRANTES ====================

export interface KapsoWebhookTextMessage {
  body: string;
}

export interface KapsoWebhookImageMessage {
  id: string;
  mime_type: string;
  caption?: string;
}

export interface KapsoWebhookDocumentMessage {
  id: string;
  filename: string;
  mime_type: string;
}

export interface KapsoWebhookInteractiveReply {
  id: string;
  title: string;
}

export interface KapsoWebhookInteractiveMessage {
  type: string;
  button_reply?: KapsoWebhookInteractiveReply;
  list_reply?: KapsoWebhookInteractiveReply;
}

export interface KapsoWebhookData {
  id?: string;
  from?: string;
  to?: string;
  timestamp?: string;
  type?: string;
  text?: KapsoWebhookTextMessage;
  image?: KapsoWebhookImageMessage;
  document?: KapsoWebhookDocumentMessage;
  interactive?: KapsoWebhookInteractiveMessage;
  status?: string;
  conversation?: { id: string };
  context?: { message_id: string };
}

export interface KapsoWebhookPayload {
  event: KapsoWebhookEvent;
  timestamp: string;
  data: KapsoWebhookData;
}

export type KapsoWebhookEvent = 
  | 'whatsapp.message.received'
  | 'whatsapp.message.delivered'
  | 'whatsapp.message.read'
  | 'whatsapp.message.failed';

// ==================== DELIVERY STATUS ====================

export type KapsoDeliveryStatus = 'sent' | 'delivered' | 'read' | 'failed';

// ==================== TEMPLATES - 34 TOTAL ====================

/**
 * Nombres de templates organizados por categoría
 * Estos nombres deben coincidir exactamente con los registrados en Meta/Kapso
 */
export const DETECTA_TEMPLATE_NAMES = {
  // === SERVICIOS Y PLANEACIÓN (7) ===
  SERVICIO_ASIGNADO: 'servicio_asignado',
  SERVICIO_REASIGNADO: 'servicio_reasignado',
  RECORDATORIO_SERVICIO_60MIN: 'recordatorio_servicio_60min',
  RECORDATORIO_SERVICIO_30MIN: 'recordatorio_servicio_30min',
  SERVICIO_CANCELADO: 'servicio_cancelado',
  CONFIRMACION_POSICIONAMIENTO: 'confirmacion_posicionamiento',
  SERVICIO_COMPLETADO: 'servicio_completado',
  
  // === CHECKLIST Y GPS (5) ===
  ALERTA_CHECKLIST_PENDIENTE: 'alerta_checklist_pendiente',
  ALERTA_GPS_FUERA_RANGO: 'alerta_gps_fuera_rango',
  ALERTA_GPS_SIN_DATOS: 'alerta_gps_sin_datos',
  ALERTA_ITEM_CRITICO: 'alerta_item_critico',
  CHECKLIST_APROBADO: 'checklist_aprobado',
  
  // === TICKETS DE SOPORTE (5) ===
  TICKET_CREADO: 'ticket_creado',
  TICKET_ASIGNADO: 'ticket_asignado',
  TICKET_ACTUALIZADO: 'ticket_actualizado',
  TICKET_RESUELTO: 'ticket_resuelto',
  TICKET_ENCUESTA_CSAT: 'ticket_encuesta_csat',
  
  // === ONBOARDING CUSTODIOS (4) ===
  CUSTODIO_INVITACION: 'custodio_invitacion',
  ONBOARDING_DOCUMENTOS_PENDIENTES: 'onboarding_documentos_pendientes',
  ONBOARDING_DOCUMENTO_VENCIDO: 'onboarding_documento_vencido',
  ONBOARDING_COMPLETADO: 'onboarding_completado',
  
  // === EVALUACIONES SIERCP (3) ===
  SIERCP_INVITACION: 'siercp_invitacion',
  SIERCP_RECORDATORIO: 'siercp_recordatorio',
  SIERCP_COMPLETADA: 'siercp_completada',
  
  // === LMS Y CAPACITACIÓN (4) ===
  LMS_CURSO_ASIGNADO: 'lms_curso_asignado',
  LMS_CURSO_RECORDATORIO: 'lms_curso_recordatorio',
  LMS_QUIZ_DISPONIBLE: 'lms_quiz_disponible',
  LMS_CERTIFICADO_EMITIDO: 'lms_certificado_emitido',
  
  // === ADQUISICIÓN DE LEADS (3) ===
  LEAD_BIENVENIDA: 'lead_bienvenida',
  LEAD_SEGUIMIENTO: 'lead_seguimiento',
  LEAD_ARMADOS_CAMPANA: 'lead_armados_campana',
  
  // === SUPPLY Y OPERACIONES (3) ===
  SUPPLY_ENTREVISTA_PROGRAMADA: 'supply_entrevista_programada',
  SUPPLY_DOCUMENTACION_SOLICITADA: 'supply_documentacion_solicitada',
  SUPPLY_APROBACION_FINAL: 'supply_aprobacion_final'
} as const;

export type DetectaTemplateName = typeof DETECTA_TEMPLATE_NAMES[keyof typeof DETECTA_TEMPLATE_NAMES];

// ==================== BUTTON IDs - PREFIJOS ESTANDARIZADOS ====================

/**
 * Prefijos de IDs de botones para respuestas interactivas
 * El webhook usa estos prefijos para enrutar las respuestas
 */
export const KAPSO_BUTTON_PREFIXES = {
  // Servicios
  CONFIRM_SERVICE: 'CONFIRM_SERVICE_',
  REJECT_SERVICE: 'REJECT_SERVICE_',
  ON_THE_WAY: 'ON_THE_WAY_',
  DELAYED: 'DELAYED_',
  
  // Ayuda general
  NEED_HELP: 'NEED_HELP_',
  
  // Checklist
  CHECKLIST_DONE: 'CHECKLIST_DONE_',
  CHECKLIST_HELP: 'CHECKLIST_HELP_',
  RETAKE_PHOTOS: 'RETAKE_PHOTOS_',
  GPS_ISSUE_RESOLVED: 'GPS_ISSUE_RESOLVED_',
  
  // GPS
  CALL_MONITORING: 'CALL_MONITORING_',
  GPS_OK: 'GPS_OK_',
  CONTACT_SUPERVISOR: 'CONTACT_SUPERVISOR_',
  PROBLEM_RESOLVED: 'PROBLEM_RESOLVED_',
  
  // Tickets
  TICKET_SATISFIED: 'TICKET_SATISFIED_',
  TICKET_NOT_RESOLVED: 'TICKET_NOT_RESOLVED_',
  TICKET_REOPEN: 'TICKET_REOPEN_',
  CSAT_EXCELLENT: 'CSAT_EXCELLENT_',
  CSAT_REGULAR: 'CSAT_REGULAR_',
  CSAT_POOR: 'CSAT_POOR_',
  
  // Documentos
  UPLOAD_DOCUMENTS: 'UPLOAD_DOCUMENTS_',
  UPDATE_DOCUMENT: 'UPDATE_DOCUMENT_',
  DOCUMENT_HELP: 'DOCUMENT_HELP_',
  
  // SIERCP
  START_EVALUATION: 'START_EVALUATION_',
  EVALUATION_QUESTIONS: 'EVALUATION_QUESTIONS_',
  
  // LMS
  GO_TO_COURSE: 'GO_TO_COURSE_',
  REMIND_LATER: 'REMIND_LATER_',
  START_QUIZ: 'START_QUIZ_',
  CONTINUE_COURSE: 'CONTINUE_COURSE_',
  
  // Leads
  COMPLETE_REGISTRATION: 'COMPLETE_REGISTRATION_',
  MORE_INFO: 'MORE_INFO_',
  TALK_TO_RECRUITER: 'TALK_TO_RECRUITER_',
  APPLY_NOW: 'APPLY_NOW_',
  
  // Supply
  CONFIRM_ATTENDANCE: 'CONFIRM_ATTENDANCE_',
  RESCHEDULE: 'RESCHEDULE_',
  START_ONBOARDING: 'START_ONBOARDING_'
} as const;

export type KapsoButtonPrefix = typeof KAPSO_BUTTON_PREFIXES[keyof typeof KAPSO_BUTTON_PREFIXES];

// ==================== CONFIRMACIÓN DE SERVICIO ====================

export type EstadoConfirmacionCustodio = 'pendiente' | 'confirmado' | 'rechazado' | 'en_camino' | 'retrasado';

export interface ServicioConfirmacionData {
  estado_confirmacion_custodio: EstadoConfirmacionCustodio;
  fecha_confirmacion?: string;
  requiere_reasignacion?: boolean;
  motivo_rechazo?: string;
}

// ==================== TEMPLATE VARIABLE TYPES ====================

/**
 * Tipos para las variables de cada template
 * Facilitan el autocompletado y validación
 */

export interface ServicioAsignadoVars {
  custodio_nombre: string;
  fecha: string;
  hora: string;
  cliente: string;
  origen: string;
  destino: string;
}

export interface ServicioReasignadoVars {
  custodio_nombre: string;
  servicio_id: string;
  fecha: string;
  hora: string;
  cliente: string;
  origen: string;
  destino: string;
}

export interface RecordatorioServicioVars {
  custodio_nombre: string;
  cliente: string;
  origen: string;
  hora_cita: string;
}

export interface AlertaChecklistVars {
  custodio_nombre: string;
  servicio_id: string;
  cliente: string;
  hora_cita: string;
}

export interface AlertaGPSVars {
  custodio_nombre: string;
  servicio_id: string;
  distancia_metros: string;
}

export interface TicketCreadoVars {
  nombre: string;
  ticket_number: string;
  categoria: string;
  tiempo_respuesta: string;
}

export interface TicketResueltVars {
  nombre: string;
  ticket_number: string;
  solucion: string;
}

export interface CustodioInvitacionVars {
  nombre: string;
  link: string;
}

export interface OnboardingDocumentosVars {
  nombre: string;
  documentos_lista: string;
  portal_link: string;
  dias_restantes: string;
}

export interface SIERCPInvitacionVars {
  nombre: string;
  link: string;
  horas_validez: string;
}

export interface LMSCursoVars {
  nombre: string;
  curso_nombre: string;
  duracion: string;
  fecha_limite: string;
}

export interface LMSCertificadoVars {
  nombre: string;
  curso_nombre: string;
  codigo_certificado: string;
  link_descarga: string;
  puntos: string;
}

export interface LeadBienvenidaVars {
  nombre: string;
}

export interface LeadSeguimientoVars {
  nombre: string;
  zonas_demanda: string;
}

export interface SupplyEntrevistaVars {
  nombre: string;
  fecha: string;
  hora: string;
  modalidad: string;
  entrevistador: string;
  instrucciones: string;
}

export interface SupplyAprobacionVars {
  nombre: string;
  rol: string;
}

// ==================== META TEMPLATE CATEGORIES ====================

export type MetaTemplateCategory = 'UTILITY' | 'MARKETING';

export interface TemplateConfig {
  name: DetectaTemplateName;
  category: MetaTemplateCategory;
  variableCount: number;
  hasButtons: boolean;
  buttonCount?: number;
}

/**
 * Configuración de cada template para referencia
 */
export const TEMPLATE_CONFIGS: Record<DetectaTemplateName, TemplateConfig> = {
  // Servicios y Planeación
  servicio_asignado: { name: 'servicio_asignado', category: 'UTILITY', variableCount: 6, hasButtons: true, buttonCount: 2 },
  servicio_reasignado: { name: 'servicio_reasignado', category: 'UTILITY', variableCount: 7, hasButtons: true, buttonCount: 2 },
  recordatorio_servicio_60min: { name: 'recordatorio_servicio_60min', category: 'UTILITY', variableCount: 4, hasButtons: true, buttonCount: 2 },
  recordatorio_servicio_30min: { name: 'recordatorio_servicio_30min', category: 'UTILITY', variableCount: 3, hasButtons: true, buttonCount: 2 },
  servicio_cancelado: { name: 'servicio_cancelado', category: 'UTILITY', variableCount: 5, hasButtons: false },
  confirmacion_posicionamiento: { name: 'confirmacion_posicionamiento', category: 'UTILITY', variableCount: 4, hasButtons: false },
  servicio_completado: { name: 'servicio_completado', category: 'UTILITY', variableCount: 3, hasButtons: false },
  
  // Checklist y GPS
  alerta_checklist_pendiente: { name: 'alerta_checklist_pendiente', category: 'UTILITY', variableCount: 4, hasButtons: true, buttonCount: 2 },
  alerta_gps_fuera_rango: { name: 'alerta_gps_fuera_rango', category: 'UTILITY', variableCount: 3, hasButtons: true, buttonCount: 2 },
  alerta_gps_sin_datos: { name: 'alerta_gps_sin_datos', category: 'UTILITY', variableCount: 2, hasButtons: true, buttonCount: 2 },
  alerta_item_critico: { name: 'alerta_item_critico', category: 'UTILITY', variableCount: 3, hasButtons: true, buttonCount: 2 },
  checklist_aprobado: { name: 'checklist_aprobado', category: 'UTILITY', variableCount: 4, hasButtons: false },
  
  // Tickets de Soporte
  ticket_creado: { name: 'ticket_creado', category: 'UTILITY', variableCount: 4, hasButtons: false },
  ticket_asignado: { name: 'ticket_asignado', category: 'UTILITY', variableCount: 4, hasButtons: false },
  ticket_actualizado: { name: 'ticket_actualizado', category: 'UTILITY', variableCount: 4, hasButtons: false },
  ticket_resuelto: { name: 'ticket_resuelto', category: 'UTILITY', variableCount: 3, hasButtons: true, buttonCount: 3 },
  ticket_encuesta_csat: { name: 'ticket_encuesta_csat', category: 'UTILITY', variableCount: 2, hasButtons: true, buttonCount: 3 },
  
  // Onboarding Custodios
  custodio_invitacion: { name: 'custodio_invitacion', category: 'UTILITY', variableCount: 2, hasButtons: false },
  onboarding_documentos_pendientes: { name: 'onboarding_documentos_pendientes', category: 'UTILITY', variableCount: 4, hasButtons: true, buttonCount: 2 },
  onboarding_documento_vencido: { name: 'onboarding_documento_vencido', category: 'UTILITY', variableCount: 3, hasButtons: true, buttonCount: 2 },
  onboarding_completado: { name: 'onboarding_completado', category: 'UTILITY', variableCount: 3, hasButtons: false },
  
  // Evaluaciones SIERCP
  siercp_invitacion: { name: 'siercp_invitacion', category: 'UTILITY', variableCount: 3, hasButtons: true, buttonCount: 2 },
  siercp_recordatorio: { name: 'siercp_recordatorio', category: 'UTILITY', variableCount: 3, hasButtons: true, buttonCount: 1 },
  siercp_completada: { name: 'siercp_completada', category: 'UTILITY', variableCount: 1, hasButtons: false },
  
  // LMS y Capacitación
  lms_curso_asignado: { name: 'lms_curso_asignado', category: 'UTILITY', variableCount: 4, hasButtons: true, buttonCount: 2 },
  lms_curso_recordatorio: { name: 'lms_curso_recordatorio', category: 'UTILITY', variableCount: 4, hasButtons: true, buttonCount: 1 },
  lms_quiz_disponible: { name: 'lms_quiz_disponible', category: 'UTILITY', variableCount: 4, hasButtons: true, buttonCount: 1 },
  lms_certificado_emitido: { name: 'lms_certificado_emitido', category: 'UTILITY', variableCount: 5, hasButtons: false },
  
  // Adquisición de Leads
  lead_bienvenida: { name: 'lead_bienvenida', category: 'MARKETING', variableCount: 1, hasButtons: true, buttonCount: 2 },
  lead_seguimiento: { name: 'lead_seguimiento', category: 'MARKETING', variableCount: 2, hasButtons: true, buttonCount: 2 },
  lead_armados_campana: { name: 'lead_armados_campana', category: 'MARKETING', variableCount: 1, hasButtons: true, buttonCount: 2 },
  
  // Supply y Operaciones
  supply_entrevista_programada: { name: 'supply_entrevista_programada', category: 'UTILITY', variableCount: 6, hasButtons: true, buttonCount: 2 },
  supply_documentacion_solicitada: { name: 'supply_documentacion_solicitada', category: 'UTILITY', variableCount: 3, hasButtons: true, buttonCount: 2 },
  supply_aprobacion_final: { name: 'supply_aprobacion_final', category: 'UTILITY', variableCount: 2, hasButtons: true, buttonCount: 1 }
};
