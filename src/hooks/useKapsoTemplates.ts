import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  DETECTA_TEMPLATE_NAMES,
  KAPSO_BUTTON_PREFIXES,
  KapsoSendResponse,
  KapsoMessageContext,
  ServicioAsignadoVars,
  ServicioReasignadoVars,
  RecordatorioServicioVars,
  AlertaChecklistVars,
  AlertaGPSVars,
  TicketCreadoVars,
  TicketResueltVars,
  CustodioInvitacionVars,
  OnboardingDocumentosVars,
  SIERCPInvitacionVars,
  LMSCursoVars,
  LMSCertificadoVars,
  LeadBienvenidaVars,
  LeadSeguimientoVars,
  SupplyEntrevistaVars,
  SupplyAprobacionVars
} from '@/types/kapso';

interface SendTemplateParams {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: {
    header?: { type: string; parameters?: any[] };
    body?: { parameters: Array<{ type: 'text'; text: string }> };
    buttons?: Array<{ type: string; index: number; parameters?: any[] }>;
  };
  context?: KapsoMessageContext;
}

/**
 * Hook especializado para enviar templates de WhatsApp via Kapso
 * Proporciona funciones tipadas para cada categoría de template
 */
export const useKapsoTemplates = () => {
  // Mutación base para enviar templates
  const sendTemplate = useMutation({
    mutationFn: async (params: SendTemplateParams): Promise<KapsoSendResponse> => {
      const { data, error } = await supabase.functions.invoke('kapso-send-template', {
        body: params
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Error al enviar template');
      return data;
    },
    onError: (error: Error) => {
      console.error('Error enviando template:', error);
      toast.error('Error al enviar notificación', {
        description: error.message
      });
    }
  });

  // ==================== SERVICIOS Y PLANEACIÓN ====================

  /**
   * Envía notificación de servicio asignado con botones de confirmación
   */
  const sendServicioAsignado = async (
    to: string,
    vars: ServicioAsignadoVars,
    servicioId: string
  ) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.SERVICIO_ASIGNADO,
      components: {
        body: {
          parameters: [
            { type: 'text', text: vars.custodio_nombre },
            { type: 'text', text: vars.fecha },
            { type: 'text', text: vars.hora },
            { type: 'text', text: vars.cliente },
            { type: 'text', text: vars.origen },
            { type: 'text', text: vars.destino }
          ]
        },
        buttons: [
          { type: 'quick_reply', index: 0, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.CONFIRM_SERVICE}${servicioId}` }] },
          { type: 'quick_reply', index: 1, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.REJECT_SERVICE}${servicioId}` }] }
        ]
      },
      context: { servicio_id: servicioId, custodio_telefono: to, tipo_notificacion: 'servicio_asignado' }
    });
  };

  /**
   * Envía notificación de servicio reasignado
   */
  const sendServicioReasignado = async (
    to: string,
    vars: ServicioReasignadoVars,
    servicioId: string
  ) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.SERVICIO_REASIGNADO,
      components: {
        body: {
          parameters: [
            { type: 'text', text: vars.custodio_nombre },
            { type: 'text', text: vars.servicio_id },
            { type: 'text', text: vars.fecha },
            { type: 'text', text: vars.hora },
            { type: 'text', text: vars.cliente },
            { type: 'text', text: vars.origen },
            { type: 'text', text: vars.destino }
          ]
        },
        buttons: [
          { type: 'quick_reply', index: 0, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.CONFIRM_SERVICE}${servicioId}` }] },
          { type: 'quick_reply', index: 1, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.NEED_HELP}${servicioId}` }] }
        ]
      },
      context: { servicio_id: servicioId, custodio_telefono: to, tipo_notificacion: 'servicio_reasignado' }
    });
  };

  /**
   * Envía recordatorio 60 minutos antes del servicio
   */
  const sendRecordatorio60Min = async (
    to: string,
    vars: RecordatorioServicioVars,
    servicioId: string
  ) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.RECORDATORIO_SERVICIO_60MIN,
      components: {
        body: {
          parameters: [
            { type: 'text', text: vars.custodio_nombre },
            { type: 'text', text: vars.cliente },
            { type: 'text', text: vars.origen },
            { type: 'text', text: vars.hora_cita }
          ]
        },
        buttons: [
          { type: 'quick_reply', index: 0, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.CHECKLIST_DONE}${servicioId}` }] },
          { type: 'quick_reply', index: 1, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.NEED_HELP}${servicioId}` }] }
        ]
      },
      context: { servicio_id: servicioId, custodio_telefono: to, tipo_notificacion: 'recordatorio_60min' }
    });
  };

  /**
   * Envía recordatorio 30 minutos antes del servicio
   */
  const sendRecordatorio30Min = async (
    to: string,
    custodioNombre: string,
    origen: string,
    hora: string,
    servicioId: string
  ) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.RECORDATORIO_SERVICIO_30MIN,
      components: {
        body: {
          parameters: [
            { type: 'text', text: custodioNombre },
            { type: 'text', text: origen },
            { type: 'text', text: hora }
          ]
        },
        buttons: [
          { type: 'quick_reply', index: 0, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.ON_THE_WAY}${servicioId}` }] },
          { type: 'quick_reply', index: 1, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.DELAYED}${servicioId}` }] }
        ]
      },
      context: { servicio_id: servicioId, custodio_telefono: to, tipo_notificacion: 'recordatorio_30min' }
    });
  };

  /**
   * Envía notificación de servicio cancelado
   */
  const sendServicioCancelado = async (
    to: string,
    custodioNombre: string,
    folio: string,
    cliente: string,
    fecha: string,
    motivo: string
  ) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.SERVICIO_CANCELADO,
      components: {
        body: {
          parameters: [
            { type: 'text', text: custodioNombre },
            { type: 'text', text: folio },
            { type: 'text', text: cliente },
            { type: 'text', text: fecha },
            { type: 'text', text: motivo }
          ]
        }
      },
      context: { custodio_telefono: to, tipo_notificacion: 'servicio_cancelado' }
    });
  };

  /**
   * Envía confirmación de posicionamiento
   */
  const sendConfirmacionPosicionamiento = async (
    to: string,
    custodioNombre: string,
    ubicacion: string,
    hora: string,
    servicioId: string
  ) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.CONFIRMACION_POSICIONAMIENTO,
      components: {
        body: {
          parameters: [
            { type: 'text', text: custodioNombre },
            { type: 'text', text: ubicacion },
            { type: 'text', text: hora },
            { type: 'text', text: servicioId }
          ]
        }
      },
      context: { servicio_id: servicioId, custodio_telefono: to, tipo_notificacion: 'confirmacion_posicionamiento' }
    });
  };

  /**
   * Envía notificación de servicio completado
   */
  const sendServicioCompletado = async (
    to: string,
    custodioNombre: string,
    servicioId: string,
    puntos: string
  ) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.SERVICIO_COMPLETADO,
      components: {
        body: {
          parameters: [
            { type: 'text', text: custodioNombre },
            { type: 'text', text: servicioId },
            { type: 'text', text: puntos }
          ]
        }
      },
      context: { servicio_id: servicioId, custodio_telefono: to, tipo_notificacion: 'servicio_completado' }
    });
  };

  // ==================== CHECKLIST Y GPS ====================

  /**
   * Envía alerta de checklist pendiente
   */
  const sendAlertaChecklistPendiente = async (
    to: string,
    vars: AlertaChecklistVars,
    servicioId: string
  ) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.ALERTA_CHECKLIST_PENDIENTE,
      components: {
        body: {
          parameters: [
            { type: 'text', text: vars.custodio_nombre },
            { type: 'text', text: vars.servicio_id },
            { type: 'text', text: vars.cliente },
            { type: 'text', text: vars.hora_cita }
          ]
        },
        buttons: [
          { type: 'quick_reply', index: 0, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.CHECKLIST_DONE}${servicioId}` }] },
          { type: 'quick_reply', index: 1, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.CHECKLIST_HELP}${servicioId}` }] }
        ]
      },
      context: { servicio_id: servicioId, custodio_telefono: to, tipo_notificacion: 'alerta_checklist' }
    });
  };

  /**
   * Envía alerta de GPS fuera de rango
   */
  const sendAlertaGPSFueraRango = async (
    to: string,
    vars: AlertaGPSVars,
    servicioId: string
  ) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.ALERTA_GPS_FUERA_RANGO,
      components: {
        body: {
          parameters: [
            { type: 'text', text: vars.custodio_nombre },
            { type: 'text', text: vars.servicio_id },
            { type: 'text', text: vars.distancia_metros }
          ]
        },
        buttons: [
          { type: 'quick_reply', index: 0, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.CALL_MONITORING}${servicioId}` }] },
          { type: 'quick_reply', index: 1, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.GPS_OK}${servicioId}` }] }
        ]
      },
      context: { servicio_id: servicioId, custodio_telefono: to, tipo_notificacion: 'alerta_gps_rango' }
    });
  };

  /**
   * Envía alerta de GPS sin datos en fotos
   */
  const sendAlertaGPSSinDatos = async (
    to: string,
    custodioNombre: string,
    servicioId: string
  ) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.ALERTA_GPS_SIN_DATOS,
      components: {
        body: {
          parameters: [
            { type: 'text', text: custodioNombre },
            { type: 'text', text: servicioId }
          ]
        },
        buttons: [
          { type: 'quick_reply', index: 0, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.RETAKE_PHOTOS}${servicioId}` }] },
          { type: 'quick_reply', index: 1, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.NEED_HELP}${servicioId}` }] }
        ]
      },
      context: { servicio_id: servicioId, custodio_telefono: to, tipo_notificacion: 'alerta_gps_sin_datos' }
    });
  };

  /**
   * Envía alerta de item crítico en checklist
   */
  const sendAlertaItemCritico = async (
    to: string,
    custodioNombre: string,
    itemProblema: string,
    servicioId: string
  ) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.ALERTA_ITEM_CRITICO,
      components: {
        body: {
          parameters: [
            { type: 'text', text: custodioNombre },
            { type: 'text', text: itemProblema },
            { type: 'text', text: servicioId }
          ]
        },
        buttons: [
          { type: 'quick_reply', index: 0, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.CONTACT_SUPERVISOR}${servicioId}` }] },
          { type: 'quick_reply', index: 1, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.PROBLEM_RESOLVED}${servicioId}` }] }
        ]
      },
      context: { servicio_id: servicioId, custodio_telefono: to, tipo_notificacion: 'alerta_item_critico' }
    });
  };

  /**
   * Envía confirmación de checklist aprobado
   */
  const sendChecklistAprobado = async (
    to: string,
    custodioNombre: string,
    servicioId: string,
    horaCita: string,
    origen: string
  ) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.CHECKLIST_APROBADO,
      components: {
        body: {
          parameters: [
            { type: 'text', text: custodioNombre },
            { type: 'text', text: servicioId },
            { type: 'text', text: horaCita },
            { type: 'text', text: origen }
          ]
        }
      },
      context: { servicio_id: servicioId, custodio_telefono: to, tipo_notificacion: 'checklist_aprobado' }
    });
  };

  // ==================== TICKETS DE SOPORTE ====================

  /**
   * Envía notificación de ticket creado
   */
  const sendTicketCreado = async (to: string, vars: TicketCreadoVars, ticketId: string) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.TICKET_CREADO,
      components: {
        body: {
          parameters: [
            { type: 'text', text: vars.nombre },
            { type: 'text', text: vars.ticket_number },
            { type: 'text', text: vars.categoria },
            { type: 'text', text: vars.tiempo_respuesta }
          ]
        }
      },
      context: { ticket_id: ticketId, custodio_telefono: to, tipo_notificacion: 'ticket_creado' }
    });
  };

  /**
   * Envía notificación de ticket asignado
   */
  const sendTicketAsignado = async (
    to: string,
    nombre: string,
    ticketNumber: string,
    agente: string,
    departamento: string,
    ticketId: string
  ) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.TICKET_ASIGNADO,
      components: {
        body: {
          parameters: [
            { type: 'text', text: nombre },
            { type: 'text', text: ticketNumber },
            { type: 'text', text: agente },
            { type: 'text', text: departamento }
          ]
        }
      },
      context: { ticket_id: ticketId, custodio_telefono: to, tipo_notificacion: 'ticket_asignado' }
    });
  };

  /**
   * Envía actualización de ticket
   */
  const sendTicketActualizado = async (
    to: string,
    nombre: string,
    ticketNumber: string,
    estado: string,
    mensaje: string,
    ticketId: string
  ) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.TICKET_ACTUALIZADO,
      components: {
        body: {
          parameters: [
            { type: 'text', text: nombre },
            { type: 'text', text: ticketNumber },
            { type: 'text', text: estado },
            { type: 'text', text: mensaje }
          ]
        }
      },
      context: { ticket_id: ticketId, custodio_telefono: to, tipo_notificacion: 'ticket_actualizado' }
    });
  };

  /**
   * Envía notificación de ticket resuelto con botones de feedback
   */
  const sendTicketResuelto = async (to: string, vars: TicketResueltVars, ticketId: string) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.TICKET_RESUELTO,
      components: {
        body: {
          parameters: [
            { type: 'text', text: vars.nombre },
            { type: 'text', text: vars.ticket_number },
            { type: 'text', text: vars.solucion }
          ]
        },
        buttons: [
          { type: 'quick_reply', index: 0, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.TICKET_SATISFIED}${ticketId}` }] },
          { type: 'quick_reply', index: 1, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.TICKET_NOT_RESOLVED}${ticketId}` }] },
          { type: 'quick_reply', index: 2, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.TICKET_REOPEN}${ticketId}` }] }
        ]
      },
      context: { ticket_id: ticketId, custodio_telefono: to, tipo_notificacion: 'ticket_resuelto' }
    });
  };

  /**
   * Envía encuesta CSAT post-resolución
   */
  const sendTicketEncuestaCSAT = async (to: string, nombre: string, ticketNumber: string, ticketId: string) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.TICKET_ENCUESTA_CSAT,
      components: {
        body: {
          parameters: [
            { type: 'text', text: nombre },
            { type: 'text', text: ticketNumber }
          ]
        },
        buttons: [
          { type: 'quick_reply', index: 0, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.CSAT_EXCELLENT}${ticketId}` }] },
          { type: 'quick_reply', index: 1, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.CSAT_REGULAR}${ticketId}` }] },
          { type: 'quick_reply', index: 2, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.CSAT_POOR}${ticketId}` }] }
        ]
      },
      context: { ticket_id: ticketId, custodio_telefono: to, tipo_notificacion: 'ticket_csat' }
    });
  };

  // ==================== ONBOARDING CUSTODIOS ====================

  /**
   * Envía invitación de custodio
   */
  const sendCustodioInvitacion = async (to: string, vars: CustodioInvitacionVars, invitationId: string) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.CUSTODIO_INVITACION,
      components: {
        body: {
          parameters: [
            { type: 'text', text: vars.nombre },
            { type: 'text', text: vars.link }
          ]
        }
      },
      context: { invitation_id: invitationId, custodio_telefono: to, tipo_notificacion: 'custodio_invitacion' }
    });
  };

  /**
   * Envía recordatorio de documentos pendientes
   */
  const sendOnboardingDocumentosPendientes = async (to: string, vars: OnboardingDocumentosVars, custodioId: string) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.ONBOARDING_DOCUMENTOS_PENDIENTES,
      components: {
        body: {
          parameters: [
            { type: 'text', text: vars.nombre },
            { type: 'text', text: vars.documentos_lista },
            { type: 'text', text: vars.portal_link },
            { type: 'text', text: vars.dias_restantes }
          ]
        },
        buttons: [
          { type: 'quick_reply', index: 0, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.UPLOAD_DOCUMENTS}${custodioId}` }] },
          { type: 'quick_reply', index: 1, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.DOCUMENT_HELP}${custodioId}` }] }
        ]
      },
      context: { candidato_id: custodioId, custodio_telefono: to, tipo_notificacion: 'onboarding_documentos' }
    });
  };

  /**
   * Envía alerta de documento por vencer
   */
  const sendOnboardingDocumentoVencido = async (
    to: string,
    nombre: string,
    tipoDocumento: string,
    fechaVencimiento: string,
    custodioId: string
  ) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.ONBOARDING_DOCUMENTO_VENCIDO,
      components: {
        body: {
          parameters: [
            { type: 'text', text: nombre },
            { type: 'text', text: tipoDocumento },
            { type: 'text', text: fechaVencimiento }
          ]
        },
        buttons: [
          { type: 'quick_reply', index: 0, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.UPDATE_DOCUMENT}${custodioId}` }] },
          { type: 'quick_reply', index: 1, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.NEED_HELP}${custodioId}` }] }
        ]
      },
      context: { candidato_id: custodioId, custodio_telefono: to, tipo_notificacion: 'documento_vencido' }
    });
  };

  /**
   * Envía confirmación de onboarding completado
   */
  const sendOnboardingCompletado = async (
    to: string,
    nombre: string,
    androidLink: string,
    iosLink: string
  ) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.ONBOARDING_COMPLETADO,
      components: {
        body: {
          parameters: [
            { type: 'text', text: nombre },
            { type: 'text', text: androidLink },
            { type: 'text', text: iosLink }
          ]
        }
      },
      context: { custodio_telefono: to, tipo_notificacion: 'onboarding_completado' }
    });
  };

  // ==================== EVALUACIONES SIERCP ====================

  /**
   * Envía invitación a evaluación SIERCP
   */
  const sendSIERCPInvitacion = async (to: string, vars: SIERCPInvitacionVars, evaluacionId: string) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.SIERCP_INVITACION,
      components: {
        body: {
          parameters: [
            { type: 'text', text: vars.nombre },
            { type: 'text', text: vars.link },
            { type: 'text', text: vars.horas_validez }
          ]
        },
        buttons: [
          { type: 'quick_reply', index: 0, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.START_EVALUATION}${evaluacionId}` }] },
          { type: 'quick_reply', index: 1, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.EVALUATION_QUESTIONS}${evaluacionId}` }] }
        ]
      },
      context: { evaluacion_id: evaluacionId, custodio_telefono: to, tipo_notificacion: 'siercp_invitacion' }
    });
  };

  /**
   * Envía recordatorio de evaluación SIERCP
   */
  const sendSIERCPRecordatorio = async (to: string, nombre: string, link: string, horasRestantes: string, evaluacionId: string) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.SIERCP_RECORDATORIO,
      components: {
        body: {
          parameters: [
            { type: 'text', text: nombre },
            { type: 'text', text: link },
            { type: 'text', text: horasRestantes }
          ]
        },
        buttons: [
          { type: 'quick_reply', index: 0, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.START_EVALUATION}${evaluacionId}` }] }
        ]
      },
      context: { evaluacion_id: evaluacionId, custodio_telefono: to, tipo_notificacion: 'siercp_recordatorio' }
    });
  };

  /**
   * Envía confirmación de evaluación SIERCP completada
   */
  const sendSIERCPCompletada = async (to: string, nombre: string, evaluacionId: string) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.SIERCP_COMPLETADA,
      components: {
        body: {
          parameters: [
            { type: 'text', text: nombre }
          ]
        }
      },
      context: { evaluacion_id: evaluacionId, custodio_telefono: to, tipo_notificacion: 'siercp_completada' }
    });
  };

  // ==================== LMS Y CAPACITACIÓN ====================

  /**
   * Envía notificación de curso asignado
   */
  const sendLMSCursoAsignado = async (to: string, vars: LMSCursoVars, cursoId: string) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.LMS_CURSO_ASIGNADO,
      components: {
        body: {
          parameters: [
            { type: 'text', text: vars.nombre },
            { type: 'text', text: vars.curso_nombre },
            { type: 'text', text: vars.duracion },
            { type: 'text', text: vars.fecha_limite }
          ]
        },
        buttons: [
          { type: 'quick_reply', index: 0, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.GO_TO_COURSE}${cursoId}` }] },
          { type: 'quick_reply', index: 1, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.REMIND_LATER}${cursoId}` }] }
        ]
      },
      context: { curso_id: cursoId, custodio_telefono: to, tipo_notificacion: 'lms_curso_asignado' }
    });
  };

  /**
   * Envía recordatorio de curso pendiente
   */
  const sendLMSCursoRecordatorio = async (
    to: string,
    nombre: string,
    cursoNombre: string,
    diasRestantes: string,
    progreso: string,
    cursoId: string
  ) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.LMS_CURSO_RECORDATORIO,
      components: {
        body: {
          parameters: [
            { type: 'text', text: nombre },
            { type: 'text', text: cursoNombre },
            { type: 'text', text: diasRestantes },
            { type: 'text', text: progreso }
          ]
        },
        buttons: [
          { type: 'quick_reply', index: 0, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.CONTINUE_COURSE}${cursoId}` }] }
        ]
      },
      context: { curso_id: cursoId, custodio_telefono: to, tipo_notificacion: 'lms_recordatorio' }
    });
  };

  /**
   * Envía notificación de quiz disponible
   */
  const sendLMSQuizDisponible = async (
    to: string,
    nombre: string,
    moduloNombre: string,
    tiempoMinutos: string,
    intentos: string,
    quizId: string
  ) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.LMS_QUIZ_DISPONIBLE,
      components: {
        body: {
          parameters: [
            { type: 'text', text: nombre },
            { type: 'text', text: moduloNombre },
            { type: 'text', text: tiempoMinutos },
            { type: 'text', text: intentos }
          ]
        },
        buttons: [
          { type: 'quick_reply', index: 0, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.START_QUIZ}${quizId}` }] }
        ]
      },
      context: { curso_id: quizId, custodio_telefono: to, tipo_notificacion: 'lms_quiz' }
    });
  };

  /**
   * Envía notificación de certificado emitido
   */
  const sendLMSCertificadoEmitido = async (to: string, vars: LMSCertificadoVars) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.LMS_CERTIFICADO_EMITIDO,
      components: {
        body: {
          parameters: [
            { type: 'text', text: vars.nombre },
            { type: 'text', text: vars.curso_nombre },
            { type: 'text', text: vars.codigo_certificado },
            { type: 'text', text: vars.link_descarga },
            { type: 'text', text: vars.puntos }
          ]
        }
      },
      context: { custodio_telefono: to, tipo_notificacion: 'lms_certificado' }
    });
  };

  // ==================== ADQUISICIÓN DE LEADS ====================

  /**
   * Envía mensaje de bienvenida a nuevo lead
   */
  const sendLeadBienvenida = async (to: string, vars: LeadBienvenidaVars, leadId: string) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.LEAD_BIENVENIDA,
      components: {
        body: {
          parameters: [
            { type: 'text', text: vars.nombre }
          ]
        },
        buttons: [
          { type: 'quick_reply', index: 0, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.COMPLETE_REGISTRATION}${leadId}` }] },
          { type: 'quick_reply', index: 1, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.MORE_INFO}${leadId}` }] }
        ]
      },
      context: { lead_id: leadId, custodio_telefono: to, tipo_notificacion: 'lead_bienvenida' }
    });
  };

  /**
   * Envía seguimiento a lead que no completó registro
   */
  const sendLeadSeguimiento = async (to: string, vars: LeadSeguimientoVars, leadId: string) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.LEAD_SEGUIMIENTO,
      components: {
        body: {
          parameters: [
            { type: 'text', text: vars.nombre },
            { type: 'text', text: vars.zonas_demanda }
          ]
        },
        buttons: [
          { type: 'quick_reply', index: 0, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.COMPLETE_REGISTRATION}${leadId}` }] },
          { type: 'quick_reply', index: 1, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.TALK_TO_RECRUITER}${leadId}` }] }
        ]
      },
      context: { lead_id: leadId, custodio_telefono: to, tipo_notificacion: 'lead_seguimiento' }
    });
  };

  /**
   * Envía campaña de adquisición de armados
   */
  const sendLeadArmadosCampana = async (to: string, nombre: string, leadId: string) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.LEAD_ARMADOS_CAMPANA,
      components: {
        body: {
          parameters: [
            { type: 'text', text: nombre }
          ]
        },
        buttons: [
          { type: 'quick_reply', index: 0, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.APPLY_NOW}${leadId}` }] },
          { type: 'quick_reply', index: 1, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.MORE_INFO}${leadId}` }] }
        ]
      },
      context: { lead_id: leadId, custodio_telefono: to, tipo_notificacion: 'lead_armados' }
    });
  };

  // ==================== SUPPLY Y OPERACIONES ====================

  /**
   * Envía notificación de entrevista programada
   */
  const sendSupplyEntrevistaProgramada = async (to: string, vars: SupplyEntrevistaVars, candidatoId: string) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.SUPPLY_ENTREVISTA_PROGRAMADA,
      components: {
        body: {
          parameters: [
            { type: 'text', text: vars.nombre },
            { type: 'text', text: vars.fecha },
            { type: 'text', text: vars.hora },
            { type: 'text', text: vars.modalidad },
            { type: 'text', text: vars.entrevistador },
            { type: 'text', text: vars.instrucciones }
          ]
        },
        buttons: [
          { type: 'quick_reply', index: 0, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.CONFIRM_ATTENDANCE}${candidatoId}` }] },
          { type: 'quick_reply', index: 1, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.RESCHEDULE}${candidatoId}` }] }
        ]
      },
      context: { candidato_id: candidatoId, custodio_telefono: to, tipo_notificacion: 'supply_entrevista' }
    });
  };

  /**
   * Envía solicitud de documentación adicional
   */
  const sendSupplyDocumentacionSolicitada = async (
    to: string,
    nombre: string,
    documentosLista: string,
    diasPlazo: string,
    candidatoId: string
  ) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.SUPPLY_DOCUMENTACION_SOLICITADA,
      components: {
        body: {
          parameters: [
            { type: 'text', text: nombre },
            { type: 'text', text: documentosLista },
            { type: 'text', text: diasPlazo }
          ]
        },
        buttons: [
          { type: 'quick_reply', index: 0, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.UPLOAD_DOCUMENTS}${candidatoId}` }] },
          { type: 'quick_reply', index: 1, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.DOCUMENT_HELP}${candidatoId}` }] }
        ]
      },
      context: { candidato_id: candidatoId, custodio_telefono: to, tipo_notificacion: 'supply_documentacion' }
    });
  };

  /**
   * Envía notificación de aprobación final
   */
  const sendSupplyAprobacionFinal = async (to: string, vars: SupplyAprobacionVars, candidatoId: string) => {
    return sendTemplate.mutateAsync({
      to,
      templateName: DETECTA_TEMPLATE_NAMES.SUPPLY_APROBACION_FINAL,
      components: {
        body: {
          parameters: [
            { type: 'text', text: vars.nombre },
            { type: 'text', text: vars.rol }
          ]
        },
        buttons: [
          { type: 'quick_reply', index: 0, parameters: [{ type: 'text', text: `${KAPSO_BUTTON_PREFIXES.START_ONBOARDING}${candidatoId}` }] }
        ]
      },
      context: { candidato_id: candidatoId, custodio_telefono: to, tipo_notificacion: 'supply_aprobacion' }
    });
  };

  return {
    // Base mutation
    sendTemplate,
    
    // Servicios y Planeación
    sendServicioAsignado,
    sendServicioReasignado,
    sendRecordatorio60Min,
    sendRecordatorio30Min,
    sendServicioCancelado,
    sendConfirmacionPosicionamiento,
    sendServicioCompletado,
    
    // Checklist y GPS
    sendAlertaChecklistPendiente,
    sendAlertaGPSFueraRango,
    sendAlertaGPSSinDatos,
    sendAlertaItemCritico,
    sendChecklistAprobado,
    
    // Tickets de Soporte
    sendTicketCreado,
    sendTicketAsignado,
    sendTicketActualizado,
    sendTicketResuelto,
    sendTicketEncuestaCSAT,
    
    // Onboarding Custodios
    sendCustodioInvitacion,
    sendOnboardingDocumentosPendientes,
    sendOnboardingDocumentoVencido,
    sendOnboardingCompletado,
    
    // Evaluaciones SIERCP
    sendSIERCPInvitacion,
    sendSIERCPRecordatorio,
    sendSIERCPCompletada,
    
    // LMS y Capacitación
    sendLMSCursoAsignado,
    sendLMSCursoRecordatorio,
    sendLMSQuizDisponible,
    sendLMSCertificadoEmitido,
    
    // Adquisición de Leads
    sendLeadBienvenida,
    sendLeadSeguimiento,
    sendLeadArmadosCampana,
    
    // Supply y Operaciones
    sendSupplyEntrevistaProgramada,
    sendSupplyDocumentacionSolicitada,
    sendSupplyAprobacionFinal,
    
    // Estados
    isSending: sendTemplate.isPending,
    isError: sendTemplate.isError,
    error: sendTemplate.error
  };
};

export default useKapsoTemplates;
