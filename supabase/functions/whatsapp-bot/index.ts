import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessage {
  from: string;
  to: string;
  body: string;
  type: 'text' | 'image' | 'audio' | 'document';
  timestamp: number;
}

interface TicketData {
  customer_phone: string;
  customer_name?: string;
  subject: string;
  description: string;
  category: string;
  whatsapp_chat_id: string;
}

serve(async (req) => {
  console.log('=== WhatsApp Bot Function Started ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Creating Supabase client...');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log('Supabase client created successfully');

    let requestBody;
    try {
      const rawBody = await req.text();
      console.log('Raw request body:', rawBody);
      requestBody = JSON.parse(rawBody);
      console.log('Parsed request body:', requestBody);
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, phone_number, message, chat_id } = requestBody;
    console.log('Action requested:', action);
    console.log('Phone number:', phone_number);

    switch (action) {
      case 'generate_qr': {
        console.log('=== Generating QR Code ===');
        
        if (!phone_number) {
          console.error('Phone number is required but not provided');
          return new Response(
            JSON.stringify({ error: 'Phone number is required' }), 
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Generating mock QR code...');
        const qrCodeData = generateMockQRCode();
        console.log('QR code generated successfully, length:', qrCodeData.length);
        
        const configData = {
          phone_number,
          qr_code: qrCodeData,
          connection_status: 'connecting',
          is_active: true,
          welcome_message: 'Hola! Gracias por contactarnos. ¿En qué podemos ayudarte?',
          business_hours_start: '09:00',
          business_hours_end: '18:00',
          auto_reply_enabled: true,
          updated_at: new Date().toISOString()
        };
        
        console.log('Attempting to upsert configuration...');
        
        const { data, error } = await supabase
          .from('whatsapp_configurations')
          .upsert(configData, { 
            onConflict: 'phone_number',
            ignoreDuplicates: false 
          })
          .select()
          .single();

        if (error) {
          console.error('Database upsert error:', error);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to save configuration', 
              details: error.message,
              code: error.code 
            }), 
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Configuration saved successfully:', data);
        
        const response = {
          success: true,
          qr_code: qrCodeData,
          message: 'QR code generated successfully',
          config: data
        };
        
        console.log('Sending successful response');
        
        return new Response(
          JSON.stringify(response),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'disconnect': {
        const { error } = await supabase
          .from('whatsapp_configurations')
          .update({
            connection_status: 'disconnected',
            is_active: false,
            qr_code: null
          })
          .eq('is_active', true);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'send_message': {
        // Lógica para enviar mensaje a WhatsApp
        await logMessage(supabase, {
          chat_id: chat_id,
          message_text: message,
          is_from_bot: true
        });

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'receive_message': {
        // Procesar mensaje recibido de WhatsApp
        const response = await processIncomingMessage(supabase, message);
        
        return new Response(
          JSON.stringify(response),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in whatsapp-bot function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateMockQRCode(): string {
  // IMPORTANTE: Este es un QR FALSO/DEMO que NO funciona con WhatsApp real
  // Para WhatsApp Web real se necesita whatsapp-web.js o similar
  
  const informativeMessage = `
    <div style="padding: 20px; text-align: center; border: 2px dashed #FF6B6B; border-radius: 12px; background: #FFF5F5; max-width: 300px;">
      <div style="font-size: 32px; margin-bottom: 10px;">⚠️</div>
      <h3 style="color: #E53E3E; margin: 10px 0; font-family: Arial, sans-serif;">QR Demo No Funcional</h3>
      <p style="color: #2D3748; line-height: 1.6; font-size: 14px; margin: 15px 0;">
        <strong>Este QR es solo visual/demo</strong>
        <br><br>
        Para WhatsApp Web real necesitas:
        <br>• <code>whatsapp-web.js</code>
        <br>• Autenticación real con WhatsApp
        <br>• QR con datos de sesión válidos
        <br>• WebSocket connection
        <br><br>
        <small style="color: #718096;">El QR actual solo simula la apariencia visual</small>
      </p>
    </div>
  `;
  
  console.log('Generating informative message instead of fake QR');
  
  return btoa(informativeMessage);
}

async function processIncomingMessage(supabase: any, message: WhatsAppMessage) {
  console.log('Processing incoming message:', message);

  // Registrar el mensaje
  await logMessage(supabase, {
    chat_id: message.from,
    sender_phone: message.from,
    message_text: message.body,
    is_from_bot: false
  });

  // Obtener configuración activa
  const { data: config } = await supabase
    .from('whatsapp_configurations')
    .select('*')
    .eq('is_active', true)
    .single();

  if (!config || !config.auto_reply_enabled) {
    return { success: true, no_reply: true };
  }

  // Verificar horario de atención
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  const isBusinessHours = currentTime >= config.business_hours_start && 
                         currentTime <= config.business_hours_end;

  if (!isBusinessHours) {
    const { data: template } = await supabase
      .from('whatsapp_templates')
      .select('content')
      .eq('name', 'fuera_horario')
      .single();

    if (template) {
      await sendReply(supabase, message.from, template.content);
    }
    return { success: true, reply: 'out_of_hours' };
  }

  // Procesar mensaje según contenido
  const messageText = message.body.toLowerCase().trim();
  let replyTemplate = null;
  let createTicket = false;

  if (messageText.includes('hola') || messageText.includes('ayuda') || messageText === '1') {
    replyTemplate = 'menu_principal';
  } else if (messageText === '2' || messageText.includes('incidencia') || messageText.includes('problema')) {
    createTicket = true;
    replyTemplate = 'ticket_creado';
  } else if (messageText === '4' || messageText.includes('agente') || messageText.includes('humano')) {
    replyTemplate = 'escalamiento';
    createTicket = true;
  } else if (!replyTemplate) {
    replyTemplate = 'bienvenida';
  }

  // Crear ticket si es necesario
  let ticketNumber = null;
  if (createTicket) {
    ticketNumber = await createTicketFromMessage(supabase, message);
  }

  // Enviar respuesta automática
  if (replyTemplate) {
    const { data: template } = await supabase
      .from('whatsapp_templates')
      .select('content')
      .eq('name', replyTemplate)
      .single();

    if (template) {
      let replyText = template.content;
      if (ticketNumber) {
        replyText = replyText.replace('{ticket_number}', ticketNumber);
      }
      await sendReply(supabase, message.from, replyText);
    }
  }

  return { success: true, ticket_created: !!ticketNumber };
}

async function createTicketFromMessage(supabase: any, message: WhatsAppMessage): Promise<string> {
  const ticketData: TicketData = {
    customer_phone: message.from,
    subject: 'Consulta desde WhatsApp',
    description: message.body,
    category: 'whatsapp',
    whatsapp_chat_id: message.from
  };

  const { data, error } = await supabase
    .from('tickets')
    .insert(ticketData)
    .select('ticket_number')
    .single();

  if (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }

  return data.ticket_number;
}

async function sendReply(supabase: any, chatId: string, message: string) {
  // En un entorno real, aquí se enviaría el mensaje usando Baileys
  console.log(`Sending reply to ${chatId}: ${message}`);
  
  // Registrar el mensaje enviado
  await logMessage(supabase, {
    chat_id: chatId,
    message_text: message,
    is_from_bot: true
  });
}

async function logMessage(supabase: any, messageData: any) {
  const { error } = await supabase
    .from('whatsapp_messages')
    .insert({
      ...messageData,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error logging message:', error);
  }
}