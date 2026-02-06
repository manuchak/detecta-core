import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const KAPSO_BASE_URL = 'https://api.kapso.ai/meta/whatsapp/v24.0';

interface TemplateParameter {
  type: 'text' | 'image' | 'document' | 'video';
  text?: string;
  image?: { link: string };
  document?: { link: string; filename: string };
}

interface TemplateButton {
  type: 'quick_reply' | 'url';
  index: number;
  parameters?: TemplateParameter[];
}

interface SendTemplateRequest {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: {
    header?: {
      type: string;
      parameters?: TemplateParameter[];
    };
    body?: {
      parameters: Array<{ type: 'text'; text: string }>;
    };
    buttons?: TemplateButton[];
  };
  context?: {
    servicio_id?: string;
    ticket_id?: string;
    custodio_telefono?: string;
    tipo_notificacion?: string;
    invitation_id?: string;
  };
}

function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  if (!cleaned.startsWith('+') && !cleaned.startsWith('52')) {
    cleaned = '52' + cleaned;
  }
  cleaned = cleaned.replace(/^\+/, '');
  return cleaned;
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

    const request: SendTemplateRequest = await req.json();
    
    console.log('Solicitud de template recibida:', {
      to: request.to,
      templateName: request.templateName,
      languageCode: request.languageCode
    });
    
    const normalizedPhone = normalizePhoneNumber(request.to);
    const languageCode = request.languageCode || 'es_MX';
    
    // Construir payload del template
    const templateComponents: any[] = [];
    
    // Agregar componentes si existen
    if (request.components?.header) {
      templateComponents.push({
        type: 'header',
        parameters: request.components.header.parameters
      });
    }
    
    if (request.components?.body) {
      templateComponents.push({
        type: 'body',
        parameters: request.components.body.parameters
      });
    }
    
    if (request.components?.buttons) {
      request.components.buttons.forEach(button => {
        templateComponents.push({
          type: 'button',
          sub_type: button.type,
          index: button.index,
          parameters: button.parameters
        });
      });
    }
    
    const templatePayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalizedPhone,
      type: 'template',
      template: {
        name: request.templateName,
        language: {
          code: languageCode
        },
        components: templateComponents.length > 0 ? templateComponents : undefined
      }
    };
    
    // Enviar a Kapso
    console.log('Enviando template a Kapso:', JSON.stringify(templatePayload, null, 2));
    
    const kapsoResponse = await fetch(`${KAPSO_BASE_URL}/${KAPSO_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'X-API-Key': KAPSO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(templatePayload)
    });
    
    const kapsoData = await kapsoResponse.json();
    
    if (!kapsoResponse.ok) {
      console.error('Error de Kapso:', kapsoData);
      throw new Error(kapsoData.error?.message || `Error de Kapso: ${kapsoResponse.status}`);
    }
    
    const messageId = kapsoData.messages?.[0]?.id;
    
    // Registrar en base de datos
    const messageRecord = {
      chat_id: normalizedPhone,
      message_id: messageId,
      sender_phone: KAPSO_PHONE_NUMBER_ID,
      message_text: `[Template: ${request.templateName}]`,
      message_type: 'template',
      is_from_bot: true,
      delivery_status: 'sent',
      ticket_id: request.context?.ticket_id || null,
      created_at: new Date().toISOString()
    };
    
    const { error: dbError } = await supabase.from('whatsapp_messages').insert(messageRecord);
    
    if (dbError) {
      console.warn('Error guardando mensaje en BD:', dbError);
    }
    
    // Actualizar whatsapp_templates con uso si existe
    await supabase
      .from('whatsapp_templates')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('name', request.templateName);
    
    console.log(`✅ Template enviado exitosamente a ${normalizedPhone}. ID: ${messageId}`);
    
    return new Response(JSON.stringify({
      success: true,
      message_id: messageId,
      to: normalizedPhone,
      template: request.templateName
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('❌ Error en kapso-send-template:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
