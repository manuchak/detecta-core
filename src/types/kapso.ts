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

// ==================== ADMIN PANEL TYPES ====================

export type MetaApprovalStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

export interface WhatsAppTemplateRecord {
  id: string;
  name: string;
  content: string;
  category: string;
  meta_status: MetaApprovalStatus;
  meta_template_id?: string;
  meta_category: MetaTemplateCategory;
  variable_count: number;
  has_buttons: boolean;
  button_count: number;
  is_active: boolean;
  last_test_at?: string;
  last_test_phone?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export const TEMPLATE_CATEGORIES = {
  servicios: { 
    label: 'Servicios y Planeación', 
    icon: 'Truck', 
    count: 7,
    templates: [
      'servicio_asignado', 'servicio_reasignado', 'recordatorio_servicio_60min',
      'recordatorio_servicio_30min', 'servicio_cancelado', 'confirmacion_posicionamiento', 'servicio_completado'
    ]
  },
  checklist: { 
    label: 'Checklist y GPS', 
    icon: 'ClipboardCheck', 
    count: 5,
    templates: [
      'alerta_checklist_pendiente', 'alerta_gps_fuera_rango', 'alerta_gps_sin_datos',
      'alerta_item_critico', 'checklist_aprobado'
    ]
  },
  tickets: { 
    label: 'Tickets de Soporte', 
    icon: 'Ticket', 
    count: 5,
    templates: [
      'ticket_creado', 'ticket_asignado', 'ticket_actualizado',
      'ticket_resuelto', 'ticket_encuesta_csat'
    ]
  },
  onboarding: { 
    label: 'Onboarding Custodios', 
    icon: 'UserPlus', 
    count: 4,
    templates: [
      'custodio_invitacion', 'onboarding_documentos_pendientes',
      'onboarding_documento_vencido', 'onboarding_completado'
    ]
  },
  siercp: { 
    label: 'Evaluaciones SIERCP', 
    icon: 'Brain', 
    count: 3,
    templates: ['siercp_invitacion', 'siercp_recordatorio', 'siercp_completada']
  },
  lms: { 
    label: 'LMS y Capacitación', 
    icon: 'GraduationCap', 
    count: 4,
    templates: [
      'lms_curso_asignado', 'lms_curso_recordatorio',
      'lms_quiz_disponible', 'lms_certificado_emitido'
    ]
  },
  leads: { 
    label: 'Adquisición de Leads', 
    icon: 'Target', 
    count: 3,
    templates: ['lead_bienvenida', 'lead_seguimiento', 'lead_armados_campana']
  },
  supply: { 
    label: 'Supply y Operaciones', 
    icon: 'Users', 
    count: 3,
    templates: [
      'supply_entrevista_programada', 'supply_documentacion_solicitada', 'supply_aprobacion_final'
    ]
  }
} as const;

export type TemplateCategoryKey = keyof typeof TEMPLATE_CATEGORIES;

// ==================== TEMPLATE CONTENT ====================

/**
 * Contenido de cada template para preview y seed
 */
export const TEMPLATE_CONTENT: Record<DetectaTemplateName, string> = {
  // Servicios
  servicio_asignado: `🛡️ SERVICIO ASIGNADO

Hola {{1}},

Tienes un nuevo servicio asignado:

📅 {{2}}
⏰ {{3}}
👤 Cliente: {{4}}
📍 Origen: {{5}}
➡️ Destino: {{6}}

Confirma tu disponibilidad.`,

  servicio_reasignado: `🔄 SERVICIO REASIGNADO

Hola {{1}},

Se te ha reasignado el servicio {{2}}:

📅 {{3}} a las {{4}}
👤 Cliente: {{5}}
📍 {{6}} → {{7}}

⚠️ Este servicio requiere atención inmediata.`,

  recordatorio_servicio_60min: `⏰ RECORDATORIO - 1 HORA

{{1}}, tu servicio inicia en 1 hora:

👤 Cliente: {{2}}
📍 Origen: {{3}}
⏰ Hora cita: {{4}}

✅ Recuerda completar el checklist pre-servicio.`,

  recordatorio_servicio_30min: `⚠️ ALERTA - 30 MINUTOS

{{1}}, tu servicio inicia en 30 minutos:

📍 {{2}}
⏰ {{3}}

🚗 Confirma que estás en camino.`,

  servicio_cancelado: `❌ SERVICIO CANCELADO

{{1}}, el siguiente servicio ha sido cancelado:

📋 Folio: {{2}}
👤 Cliente: {{3}}
📅 Fecha: {{4}}

Motivo: {{5}}

Tu disponibilidad ha sido actualizada automáticamente.`,

  confirmacion_posicionamiento: `✅ POSICIÓN CONFIRMADA

{{1}}, tu posición ha sido registrada:

📍 Ubicación: {{2}}
⏰ Hora: {{3}}
📋 Servicio: {{4}}

El cliente ha sido notificado de tu llegada.`,

  servicio_completado: `🎉 SERVICIO COMPLETADO

{{1}}, ¡excelente trabajo!

El servicio {{2}} ha sido completado exitosamente.

⭐ Recuerda calificar tu experiencia en la app.

Puntos ganados: +{{3}} 🏆`,

  // Checklist
  alerta_checklist_pendiente: `⚠️ CHECKLIST PENDIENTE

{{1}}, tienes un checklist sin completar:

📋 Servicio: {{2}}
👤 Cliente: {{3}}
⏰ Hora cita: {{4}}

Completa el checklist desde la app Detecta antes de iniciar.`,

  alerta_gps_fuera_rango: `📍 ALERTA GPS

{{1}}, detectamos que tu ubicación está lejos del punto de origen:

📋 Servicio: {{2}}
📍 Distancia: {{3}} metros

Si hay un cambio de ubicación, notifica a monitoreo.`,

  alerta_gps_sin_datos: `⚠️ GPS NO DETECTADO

{{1}}, las fotos del checklist no tienen ubicación GPS:

📋 Servicio: {{2}}

Verifica que tu teléfono tenga el GPS activado y vuelve a tomar las fotos.`,

  alerta_item_critico: `🚨 ALERTA DE SEGURIDAD

{{1}}, se detectó un problema crítico en la inspección:

⚠️ {{2}}
📋 Servicio: {{3}}

Por seguridad, NO inicies el servicio hasta resolver este tema.`,

  checklist_aprobado: `✅ CHECKLIST APROBADO

{{1}}, tu checklist pre-servicio está completo:

📋 Servicio: {{2}}
⏰ Hora cita: {{3}}
📍 Origen: {{4}}

Estás listo para iniciar. ¡Buen servicio!`,

  // Tickets
  ticket_creado: `🎫 TICKET CREADO

Hola {{1}},

Hemos recibido tu solicitud:

📋 Ticket: {{2}}
📂 Categoría: {{3}}
⏰ Tiempo de respuesta: {{4}}

Un agente te contactará pronto. Puedes responder a este chat para agregar información.`,

  ticket_asignado: `👤 AGENTE ASIGNADO

{{1}}, tu ticket {{2}} ha sido asignado:

👤 Agente: {{3}}
📂 Departamento: {{4}}

El agente revisará tu caso y te contactará pronto.`,

  ticket_actualizado: `📝 ACTUALIZACIÓN DE TICKET

{{1}}, hay novedades en tu ticket {{2}}:

Estado: {{3}}
Mensaje: {{4}}

Puedes responder a este mensaje para continuar la conversación.`,

  ticket_resuelto: `✅ TICKET RESUELTO

{{1}}, tu ticket {{2}} ha sido resuelto:

Solución: {{3}}

¿Te fue útil esta atención?`,

  ticket_encuesta_csat: `⭐ TU OPINIÓN IMPORTA

{{1}}, ¿cómo calificarías la atención de tu ticket {{2}}?

Tu retroalimentación nos ayuda a mejorar.`,

  // Onboarding
  custodio_invitacion: `🛡️ BIENVENIDO A DETECTA

¡Hola {{1}}! 🎉

Ya eres parte del equipo de custodios de Detecta.

Para activar tu cuenta, usa este link:
{{2}}

⚠️ Este link es personal y expira en 7 días.`,

  onboarding_documentos_pendientes: `📄 DOCUMENTOS PENDIENTES

{{1}}, para completar tu registro necesitas subir:

{{2}}

Ingresa a tu portal para subir los documentos:
{{3}}

⏰ Tienes {{4}} días para completar este paso.`,

  onboarding_documento_vencido: `⚠️ DOCUMENTO POR VENCER

{{1}}, tu {{2}} vence el {{3}}.

Para seguir operando, actualiza tu documento antes de la fecha de vencimiento.`,

  onboarding_completado: `🎉 REGISTRO COMPLETADO

¡Felicidades {{1}}!

Tu registro como custodio está completo. Ya puedes recibir asignaciones de servicio.

Descarga la app Detecta:
📱 Android: {{2}}
🍎 iOS: {{3}}

¡Bienvenido al equipo! 🛡️`,

  // SIERCP
  siercp_invitacion: `🧠 EVALUACIÓN PSICOMÉTRICA

Hola {{1}},

Te invitamos a completar tu evaluación SIERCP:

🔗 {{2}}

⏰ El enlace es válido por {{3}} horas.

Esta evaluación es requerida para continuar con tu proceso de selección.`,

  siercp_recordatorio: `⏰ RECORDATORIO SIERCP

{{1}}, tu evaluación SIERCP está pendiente:

🔗 {{2}}

⚠️ El enlace expira en {{3}} horas.

Completa la evaluación para avanzar en tu proceso.`,

  siercp_completada: `✅ EVALUACIÓN COMPLETADA

{{1}}, has completado tu evaluación SIERCP.

Nuestro equipo revisará los resultados y te contactaremos pronto.

Gracias por tu participación.`,

  // LMS
  lms_curso_asignado: `📚 NUEVO CURSO ASIGNADO

{{1}}, tienes un nuevo curso asignado:

📖 {{2}}
⏰ Duración: {{3}}
📅 Fecha límite: {{4}}

Accede desde tu portal de capacitación.`,

  lms_curso_recordatorio: `⏰ CURSO PENDIENTE

{{1}}, tu curso "{{2}}" vence en {{3}} días.

Progreso actual: {{4}}%

Completa el curso para evitar penalizaciones.`,

  lms_quiz_disponible: `📝 QUIZ DISPONIBLE

{{1}}, ya puedes tomar el quiz del módulo "{{2}}":

⏱️ Tiempo: {{3}} minutos
📊 Intentos: {{4}}/3

Debes aprobar con mínimo 80%.`,

  lms_certificado_emitido: `🏆 CERTIFICADO EMITIDO

¡Felicidades {{1}}! 🎉

Has completado el curso "{{2}}" y tu certificado está listo.

📜 Código: {{3}}
🔗 Descargar: {{4}}

+{{5}} puntos de gamificación 🏅`,

  // Leads
  lead_bienvenida: `🛡️ ÚNETE A DETECTA

¡Hola {{1}}!

Gracias por tu interés en ser custodio de Detecta.

✅ Ingresos competitivos
✅ Horarios flexibles
✅ Capacitación continua
✅ Seguro y prestaciones

¿Listo para dar el siguiente paso?`,

  lead_seguimiento: `🤝 TE ESTAMOS ESPERANDO

{{1}}, notamos que iniciaste tu proceso con Detecta pero no lo completaste.

¿Tienes alguna duda? Estamos aquí para ayudarte.

Zonas con alta demanda: {{2}}`,

  lead_armados_campana: `🎯 OPORTUNIDAD ARMADOS

{{1}}, estamos buscando personal armado certificado para nuestra red de seguridad.

Requisitos:
✅ Licencia de portación vigente
✅ Experiencia comprobable
✅ Disponibilidad inmediata

Beneficios exclusivos para armados certificados.`,

  // Supply
  supply_entrevista_programada: `📅 ENTREVISTA PROGRAMADA

{{1}}, tu entrevista ha sido agendada:

📅 Fecha: {{2}}
⏰ Hora: {{3}}
📍 Modalidad: {{4}}
👤 Entrevistador: {{5}}

{{6}}`,

  supply_documentacion_solicitada: `📄 DOCUMENTOS REQUERIDOS

{{1}}, para avanzar en tu proceso necesitamos:

{{2}}

Envía los documentos respondiendo a este mensaje o súbelos en el portal.

⏰ Tienes {{3}} días para enviarlos.`,

  supply_aprobacion_final: `🎉 ¡APROBADO!

¡Felicidades {{1}}!

Has sido aprobado para unirte al equipo de Detecta como {{2}}.

Próximos pasos:
1️⃣ Completar onboarding digital
2️⃣ Firmar contrato
3️⃣ Recibir capacitación inicial

Te contactaremos para coordinar tu inicio.`
};

/**
 * Variables descriptivas para cada template
 */
export const TEMPLATE_VARIABLES: Record<DetectaTemplateName, string[]> = {
  servicio_asignado: ['custodio_nombre', 'fecha', 'hora', 'cliente', 'origen', 'destino'],
  servicio_reasignado: ['custodio_nombre', 'servicio_id', 'fecha', 'hora', 'cliente', 'origen', 'destino'],
  recordatorio_servicio_60min: ['custodio_nombre', 'cliente', 'origen', 'hora_cita'],
  recordatorio_servicio_30min: ['custodio_nombre', 'origen', 'hora'],
  servicio_cancelado: ['custodio_nombre', 'folio', 'cliente', 'fecha', 'motivo'],
  confirmacion_posicionamiento: ['custodio_nombre', 'ubicacion', 'hora', 'servicio_id'],
  servicio_completado: ['custodio_nombre', 'servicio_id', 'puntos'],
  
  alerta_checklist_pendiente: ['custodio_nombre', 'servicio_id', 'cliente', 'hora_cita'],
  alerta_gps_fuera_rango: ['custodio_nombre', 'servicio_id', 'distancia_metros'],
  alerta_gps_sin_datos: ['custodio_nombre', 'servicio_id'],
  alerta_item_critico: ['custodio_nombre', 'item_critico', 'servicio_id'],
  checklist_aprobado: ['custodio_nombre', 'servicio_id', 'hora_cita', 'origen'],
  
  ticket_creado: ['nombre', 'ticket_number', 'categoria', 'tiempo_respuesta'],
  ticket_asignado: ['nombre', 'ticket_number', 'agente', 'departamento'],
  ticket_actualizado: ['nombre', 'ticket_number', 'estado', 'mensaje'],
  ticket_resuelto: ['nombre', 'ticket_number', 'solucion'],
  ticket_encuesta_csat: ['nombre', 'ticket_number'],
  
  custodio_invitacion: ['nombre', 'link'],
  onboarding_documentos_pendientes: ['nombre', 'documentos_lista', 'portal_link', 'dias_restantes'],
  onboarding_documento_vencido: ['nombre', 'tipo_documento', 'fecha_vencimiento'],
  onboarding_completado: ['nombre', 'link_android', 'link_ios'],
  
  siercp_invitacion: ['nombre', 'link', 'horas_validez'],
  siercp_recordatorio: ['nombre', 'link', 'horas_restantes'],
  siercp_completada: ['nombre'],
  
  lms_curso_asignado: ['nombre', 'curso_nombre', 'duracion', 'fecha_limite'],
  lms_curso_recordatorio: ['nombre', 'curso_nombre', 'dias_restantes', 'progreso_pct'],
  lms_quiz_disponible: ['nombre', 'modulo_nombre', 'tiempo_minutos', 'intentos'],
  lms_certificado_emitido: ['nombre', 'curso_nombre', 'codigo_certificado', 'link_descarga', 'puntos'],
  
  lead_bienvenida: ['nombre'],
  lead_seguimiento: ['nombre', 'zonas_demanda'],
  lead_armados_campana: ['nombre'],
  
  supply_entrevista_programada: ['nombre', 'fecha', 'hora', 'modalidad', 'entrevistador', 'instrucciones'],
  supply_documentacion_solicitada: ['nombre', 'documentos_lista', 'dias_plazo'],
  supply_aprobacion_final: ['nombre', 'rol']
};
