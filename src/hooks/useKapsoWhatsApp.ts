import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InteractiveButton {
  id: string;
  title: string;
}

interface InteractiveSection {
  title: string;
  rows: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
}

interface SendMessageParams {
  to: string;
  type: 'text' | 'image' | 'document' | 'interactive';
  text?: string;
  mediaUrl?: string;
  mediaCaption?: string;
  filename?: string;
  interactive?: {
    type: 'button' | 'list';
    header?: string;
    body: string;
    footer?: string;
    buttons?: InteractiveButton[];
    sections?: InteractiveSection[];
  };
  context?: {
    servicio_id?: string;
    ticket_id?: string;
    custodio_telefono?: string;
    tipo_notificacion?: string;
  };
}

interface SendTemplateParams {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: {
    header?: { type: string; parameters?: any[] };
    body?: { parameters: Array<{ type: 'text'; text: string }> };
    buttons?: Array<{ type: string; index: number; parameters?: any[] }>;
  };
  context?: Record<string, string>;
}

interface KapsoResponse {
  success: boolean;
  message_id?: string;
  to?: string;
  template?: string;
  error?: string;
}

/**
 * Hook centralizado para envío de mensajes WhatsApp via Kapso
 * Reemplaza los enlaces manuales wa.me con comunicación real bidireccional
 */
export const useKapsoWhatsApp = () => {
  // Enviar mensaje genérico
  const sendMessage = useMutation({
    mutationFn: async (params: SendMessageParams): Promise<KapsoResponse> => {
      const { data, error } = await supabase.functions.invoke('kapso-send-message', {
        body: params
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Error al enviar mensaje');
      return data;
    },
    onSuccess: (data) => {
      toast.success('Mensaje enviado', {
        description: `WhatsApp enviado correctamente`
      });
    },
    onError: (error: Error) => {
      console.error('Error enviando mensaje:', error);
      toast.error('Error al enviar mensaje', {
        description: error.message
      });
    }
  });
  
  // Enviar template
  const sendTemplate = useMutation({
    mutationFn: async (params: SendTemplateParams): Promise<KapsoResponse> => {
      const { data, error } = await supabase.functions.invoke('kapso-send-template', {
        body: params
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Error al enviar template');
      return data;
    },
    onSuccess: (data) => {
      toast.success('Template enviado', {
        description: `Template ${data.template} enviado correctamente`
      });
    },
    onError: (error: Error) => {
      console.error('Error enviando template:', error);
      toast.error('Error al enviar template', {
        description: error.message
      });
    }
  });
  
  // =========== HELPERS PARA CASOS DE USO ESPECÍFICOS ===========
  
  /**
   * Enviar notificación de asignación de servicio con botones de confirmación
   */
  const sendServiceAssignment = async (
    custodioPhone: string,
    custodioName: string,
    serviceData: {
      id: string;
      cliente: string;
      fecha: string;
      hora: string;
      origen: string;
    }
  ) => {
    return sendMessage.mutateAsync({
      to: custodioPhone,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: '🛡️ NUEVO SERVICIO ASIGNADO',
        body: `Hola ${custodioName},\n\nSe te ha asignado un nuevo servicio:\n\n👤 Cliente: ${serviceData.cliente}\n📅 Fecha: ${serviceData.fecha}\n⏰ Hora: ${serviceData.hora}\n📍 Origen: ${serviceData.origen}\n\n¿Confirmas tu disponibilidad?`,
        footer: 'Detecta - Sistema de Custodios',
        buttons: [
          { id: `CONFIRM_SERVICE_${serviceData.id}`, title: '✅ Confirmar' },
          { id: `REJECT_SERVICE_${serviceData.id}`, title: '❌ No disponible' }
        ]
      },
      context: {
        servicio_id: serviceData.id,
        custodio_telefono: custodioPhone,
        tipo_notificacion: 'asignacion_servicio'
      }
    });
  };
  
  /**
   * Enviar recordatorio de checklist pendiente
   */
  const sendChecklistReminder = async (
    custodioPhone: string,
    custodioName: string,
    servicioId: string,
    cliente: string
  ) => {
    return sendMessage.mutateAsync({
      to: custodioPhone,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: '⚠️ CHECKLIST PENDIENTE',
        body: `${custodioName}, tienes un checklist pre-servicio pendiente:\n\n📋 Servicio: ${servicioId}\n👤 Cliente: ${cliente}\n\nCompleta el checklist desde la app Detecta.`,
        buttons: [
          { id: `CHECKLIST_DONE_${servicioId}`, title: '✅ Ya lo completé' },
          { id: `CHECKLIST_HELP_${servicioId}`, title: '❓ Necesito ayuda' }
        ]
      },
      context: {
        servicio_id: servicioId,
        custodio_telefono: custodioPhone,
        tipo_notificacion: 'recordatorio_checklist'
      }
    });
  };
  
  /**
   * Enviar invitación de custodio usando template
   */
  const sendCustodianInvitation = async (
    phone: string,
    name: string,
    invitationLink: string,
    invitationId: string
  ) => {
    // Primero intentar con template (si está aprobado)
    // Si falla, enviar como mensaje de texto
    try {
      return await sendTemplate.mutateAsync({
        to: phone,
        templateName: 'custodio_invitacion',
        components: {
          body: {
            parameters: [
              { type: 'text', text: name },
              { type: 'text', text: invitationLink }
            ]
          }
        },
        context: {
          invitation_id: invitationId,
          tipo_notificacion: 'invitacion_custodio'
        }
      });
    } catch (templateError) {
      // Fallback a mensaje de texto si el template no está disponible
      console.warn('Template no disponible, enviando como texto:', templateError);
      return sendMessage.mutateAsync({
        to: phone,
        type: 'text',
        text: `¡Hola ${name}! 🎉\n\nYa eres parte del equipo de custodios de Detecta.\n\nPara activar tu cuenta y acceder a tu portal personal, usa este link:\n\n${invitationLink}\n\n⚠️ Este link es personal y expira en 30 días.\n\n🛡️ Equipo Detecta`,
        context: {
          tipo_notificacion: 'invitacion_custodio'
        }
      });
    }
  };
  
  /**
   * Enviar actualización de ticket
   */
  const sendTicketUpdate = async (
    phone: string,
    ticketNumber: string,
    status: string,
    message: string
  ) => {
    return sendMessage.mutateAsync({
      to: phone,
      type: 'text',
      text: `🎫 ACTUALIZACIÓN DE TICKET\n\nTu ticket ${ticketNumber} ha sido actualizado:\n\n📌 Estado: ${status}\n💬 ${message}\n\nPuedes responder a este mensaje para continuar la conversación.`,
      context: {
        tipo_notificacion: 'ticket_update'
      }
    });
  };
  
  /**
   * Enviar mensaje de texto simple
   */
  const sendTextMessage = async (
    phone: string,
    text: string,
    context?: SendMessageParams['context']
  ) => {
    return sendMessage.mutateAsync({
      to: phone,
      type: 'text',
      text,
      context
    });
  };
  
  /**
   * Enviar imagen con caption opcional
   */
  const sendImage = async (
    phone: string,
    imageUrl: string,
    caption?: string,
    context?: SendMessageParams['context']
  ) => {
    return sendMessage.mutateAsync({
      to: phone,
      type: 'image',
      mediaUrl: imageUrl,
      mediaCaption: caption,
      context
    });
  };
  
  /**
   * Enviar documento
   */
  const sendDocument = async (
    phone: string,
    documentUrl: string,
    filename: string,
    caption?: string,
    context?: SendMessageParams['context']
  ) => {
    return sendMessage.mutateAsync({
      to: phone,
      type: 'document',
      mediaUrl: documentUrl,
      filename,
      mediaCaption: caption,
      context
    });
  };
  
  /**
   * Fallback a wa.me si Kapso falla
   */
  const openWhatsAppFallback = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('52') ? cleanPhone : `52${cleanPhone}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${fullPhone}?text=${encodedMessage}`, '_blank');
  };
  
  /**
   * Enviar con fallback automático a wa.me
   */
  const sendWithFallback = async (
    phone: string,
    message: string,
    options?: Partial<SendMessageParams>
  ) => {
    try {
      await sendMessage.mutateAsync({
        to: phone,
        type: 'text',
        text: message,
        ...options
      });
    } catch (error) {
      console.warn('Kapso falló, usando fallback wa.me:', error);
      toast.warning('Abriendo WhatsApp manualmente', {
        description: 'No se pudo enviar automáticamente'
      });
      openWhatsAppFallback(phone, message);
    }
  };
  
  return {
    // Mutaciones base
    sendMessage,
    sendTemplate,
    
    // Helpers específicos de Detecta
    sendServiceAssignment,
    sendChecklistReminder,
    sendCustodianInvitation,
    sendTicketUpdate,
    
    // Helpers genéricos
    sendTextMessage,
    sendImage,
    sendDocument,
    sendWithFallback,
    openWhatsAppFallback,
    
    // Estados
    isSending: sendMessage.isPending || sendTemplate.isPending,
    isError: sendMessage.isError || sendTemplate.isError,
    error: sendMessage.error || sendTemplate.error
  };
};

export default useKapsoWhatsApp;
