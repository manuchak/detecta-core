/**
 * Tipos TypeScript para la integración de Kapso WhatsApp
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

// ==================== TEMPLATES PREDEFINIDOS ====================

export const DETECTA_TEMPLATE_NAMES = {
  CUSTODIO_INVITACION: 'custodio_invitacion',
  SERVICIO_ASIGNADO: 'servicio_asignado',
  RECORDATORIO_SERVICIO: 'recordatorio_servicio',
  ALERTA_CHECKLIST: 'alerta_checklist',
  CONFIRMACION_POSICION: 'confirmacion_posicion',
  TICKET_ACTUALIZADO: 'ticket_actualizado'
} as const;

export type DetectaTemplateName = typeof DETECTA_TEMPLATE_NAMES[keyof typeof DETECTA_TEMPLATE_NAMES];

// ==================== BUTTON IDS ====================

export const KAPSO_BUTTON_PREFIXES = {
  CONFIRM_SERVICE: 'CONFIRM_SERVICE_',
  REJECT_SERVICE: 'REJECT_SERVICE_',
  NEED_HELP: 'NEED_HELP_',
  CHECKLIST_DONE: 'CHECKLIST_DONE_',
  CHECKLIST_HELP: 'CHECKLIST_HELP_'
} as const;

// ==================== CONFIRMACIÓN DE SERVICIO ====================

export type EstadoConfirmacionCustodio = 'pendiente' | 'confirmado' | 'rechazado';

export interface ServicioConfirmacionData {
  estado_confirmacion_custodio: EstadoConfirmacionCustodio;
  fecha_confirmacion?: string;
  requiere_reasignacion?: boolean;
}
