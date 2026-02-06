import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const KAPSO_BASE_URL = 'https://api.kapso.ai/meta/whatsapp/v24.0';

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

interface InteractiveConfig {
  type: 'button' | 'list';
  header?: string;
  body: string;
  footer?: string;
  buttons?: InteractiveButton[];
  sections?: InteractiveSection[];
}

interface SendMessageRequest {
  to: string;
  type: 'text' | 'image' | 'document' | 'interactive';
  text?: string;
  mediaUrl?: string;
  mediaCaption?: string;
  filename?: string;
  interactive?: InteractiveConfig;
  context?: {
    servicio_id?: string;
    ticket_id?: string;
    custodio_telefono?: string;
    tipo_notificacion?: string;
  };
}

function normalizePhoneNumber(phone: string): string {
  // Eliminar espacios, guiones, paréntesis
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Si no tiene código de país, agregar 52 (México)
  if (!cleaned.startsWith('+') && !cleaned.startsWith('52')) {
    cleaned = '52' + cleaned;
  }
  
  // Eliminar el + si existe
  cleaned = cleaned.replace(/^\+/, '');
  
  return cleaned;
}

function buildInteractivePayload(to: string, interactive: InteractiveConfig) {
  if (interactive.type === 'button') {
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: interactive.header ? { type: 'text', text: interactive.header } : undefined,
        body: { text: interactive.body },
        footer: interactive.footer ? { text: interactive.footer } : undefined,
        action: {
          buttons: (interactive.buttons || []).map((btn) => ({
            type: 'reply',
            reply: {
              id: btn.id,
              title: btn.title.substring(0, 20) // WhatsApp limita a 20 chars
            }
          }))
        }
      }
    };
  } else if (interactive.type === 'list') {
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        header: interactive.header ? { type: 'text', text: interactive.header } : undefined,
        body: { text: interactive.body },
        footer: interactive.footer ? { text: interactive.footer } : undefined,
        action: {
          button: 'Ver opciones',
          sections: interactive.sections
        }
      }
    };
  }
  
  throw new Error('Tipo interactivo no soportado');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const KAPSO_API_KEY = Deno.env.get('KAPSO_API_KEY');
    const KAPSO_PHONE_NUMBER_ID = Deno.env.get('KAPSO_PHONE_NUMBER_ID');
    
    if (!KAPSO_API_KEY || !KAPSO_PHONE_NUMBER_ID) {
      console.error('Configuración incompleta:', { 
        hasApiKey: !!KAPSO_API_KEY, 
        hasPhoneId: !!KAPSO_PHONE_NUMBER_ID 
      });
      throw new Error('Configuración de Kapso incompleta');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const request: SendMessageRequest = await req.json();
    
    console.log('Solicitud recibida:', {
      to: request.to,
      type: request.type,
      hasText: !!request.text,
      hasInteractive: !!request.interactive
    });
    
    // Normalizar número de teléfono (formato internacional)
    const normalizedPhone = normalizePhoneNumber(request.to);
    
    let messagePayload: any;
    const endpoint = `${KAPSO_BASE_URL}/${KAPSO_PHONE_NUMBER_ID}/messages`;
    
    // Construir payload según tipo de mensaje
    switch (request.type) {
      case 'text':
        messagePayload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedPhone,
          type: 'text',
          text: { body: request.text }
        };
        break;
        
      case 'image':
        messagePayload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedPhone,
          type: 'image',
          image: {
            link: request.mediaUrl,
            caption: request.mediaCaption
          }
        };
        break;
        
      case 'document':
        messagePayload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedPhone,
          type: 'document',
          document: {
            link: request.mediaUrl,
            filename: request.filename,
            caption: request.mediaCaption
          }
        };
        break;
        
      case 'interactive':
        if (!request.interactive) {
          throw new Error('Configuración interactiva requerida');
        }
        messagePayload = buildInteractivePayload(normalizedPhone, request.interactive);
        break;
        
      default:
        throw new Error(`Tipo de mensaje no soportado: ${request.type}`);
    }
    
    // Enviar a Kapso
    console.log('Enviando mensaje a Kapso:', JSON.stringify(messagePayload, null, 2));
    
    const kapsoResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-API-Key': KAPSO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    });
    
    // Validar content-type antes de parsear
    const contentType = kapsoResponse.headers.get('content-type');
    console.log('Kapso response status:', kapsoResponse.status, 'content-type:', contentType);
    
    if (!contentType?.includes('application/json')) {
      const textResponse = await kapsoResponse.text();
      console.error('Kapso returned non-JSON response:', textResponse.substring(0, 500));
      
      if (textResponse.trim().startsWith('<!') || textResponse.includes('<html')) {
        throw new Error(
          `Kapso API returned HTML instead of JSON (status: ${kapsoResponse.status}). ` +
          `This usually indicates: invalid API key, wrong endpoint, or service unavailable. ` +
          `Check KAPSO_API_KEY and KAPSO_PHONE_NUMBER_ID secrets.`
        );
      }
      throw new Error(`Unexpected response format from Kapso: ${contentType}`);
    }
    
    const kapsoData = await kapsoResponse.json();
    
    if (!kapsoResponse.ok) {
      console.error('Error de Kapso:', kapsoData);
      
      // Detectar errores específicos de WhatsApp
      const errorMessage = kapsoData.error || kapsoData.message || '';
      
      // Error de ventana de 24 horas - las credenciales son válidas, retornar 200 con flag
      if (errorMessage.includes('24-hour') || errorMessage.includes('template')) {
        console.log('✅ Credenciales válidas - Error de regla 24h de WhatsApp (esperado para test)');
        return new Response(JSON.stringify({
          success: true,
          credentials_valid: true,
          message_sent: false,
          whatsapp_24h_rule: true,
          info: 'Las credenciales son válidas. Para enviar mensajes se requieren templates aprobados por WhatsApp (regla de 24 horas).'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      throw new Error(kapsoData.error?.message || kapsoData.error || `Error de Kapso: ${kapsoResponse.status}`);
    }
    
    const messageId = kapsoData.messages?.[0]?.id;
    
    // Registrar mensaje en base de datos
    const messageRecord = {
      chat_id: normalizedPhone,
      message_id: messageId,
      sender_phone: KAPSO_PHONE_NUMBER_ID,
      message_text: request.text || request.mediaCaption || '[Mensaje interactivo]',
      message_type: request.type,
      media_url: request.mediaUrl || null,
      is_from_bot: true,
      delivery_status: 'sent',
      ticket_id: request.context?.ticket_id || null,
      created_at: new Date().toISOString()
    };
    
    const { error: dbError } = await supabase.from('whatsapp_messages').insert(messageRecord);
    
    if (dbError) {
      console.warn('Error guardando mensaje en BD:', dbError);
      // No fallar si no se puede guardar en BD
    }
    
    // Log de auditoría
    console.log(`✅ Mensaje enviado exitosamente a ${normalizedPhone}. ID: ${messageId}`);
    
    return new Response(JSON.stringify({
      success: true,
      message_id: messageId,
      to: normalizedPhone
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('❌ Error en kapso-send-message:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
