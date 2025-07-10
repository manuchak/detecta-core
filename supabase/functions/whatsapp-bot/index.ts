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
  // IMPORTANTE: Este es un QR DEMO que se ve realista pero NO funciona con WhatsApp real
  // Para WhatsApp Web real se necesita whatsapp-web.js o similar
  
  const realisticQR = `
    <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; background: white;">
      <!-- QR Code Background -->
      <rect width="300" height="300" fill="white"/>
      
      <!-- Corner Position Detection Patterns -->
      <!-- Top Left -->
      <rect x="20" y="20" width="70" height="70" fill="black"/>
      <rect x="30" y="30" width="50" height="50" fill="white"/>
      <rect x="40" y="40" width="30" height="30" fill="black"/>
      
      <!-- Top Right -->
      <rect x="210" y="20" width="70" height="70" fill="black"/>
      <rect x="220" y="30" width="50" height="50" fill="white"/>
      <rect x="230" y="40" width="30" height="30" fill="black"/>
      
      <!-- Bottom Left -->
      <rect x="20" y="210" width="70" height="70" fill="black"/>
      <rect x="30" y="220" width="50" height="50" fill="white"/>
      <rect x="40" y="230" width="30" height="30" fill="black"/>
      
      <!-- Data Pattern (scattered squares to simulate QR data) -->
      <rect x="110" y="20" width="10" height="10" fill="black"/>
      <rect x="130" y="20" width="10" height="10" fill="black"/>
      <rect x="150" y="20" width="10" height="10" fill="black"/>
      <rect x="170" y="20" width="10" height="10" fill="black"/>
      <rect x="190" y="20" width="10" height="10" fill="black"/>
      
      <rect x="20" y="110" width="10" height="10" fill="black"/>
      <rect x="40" y="110" width="10" height="10" fill="black"/>
      <rect x="60" y="110" width="10" height="10" fill="black"/>
      <rect x="80" y="110" width="10" height="10" fill="black"/>
      
      <rect x="110" y="40" width="10" height="10" fill="black"/>
      <rect x="130" y="60" width="10" height="10" fill="black"/>
      <rect x="150" y="40" width="10" height="10" fill="black"/>
      <rect x="170" y="60" width="10" height="10" fill="black"/>
      <rect x="190" y="40" width="10" height="10" fill="black"/>
      
      <rect x="110" y="80" width="10" height="10" fill="black"/>
      <rect x="130" y="80" width="10" height="10" fill="black"/>
      <rect x="150" y="100" width="10" height="10" fill="black"/>
      <rect x="170" y="80" width="10" height="10" fill="black"/>
      <rect x="190" y="100" width="10" height="10" fill="black"/>
      
      <!-- More data pattern -->
      <rect x="110" y="110" width="10" height="10" fill="black"/>
      <rect x="130" y="130" width="10" height="10" fill="black"/>
      <rect x="150" y="110" width="10" height="10" fill="black"/>
      <rect x="170" y="130" width="10" height="10" fill="black"/>
      <rect x="190" y="110" width="10" height="10" fill="black"/>
      
      <rect x="210" y="110" width="10" height="10" fill="black"/>
      <rect x="230" y="130" width="10" height="10" fill="black"/>
      <rect x="250" y="110" width="10" height="10" fill="black"/>
      <rect x="270" y="130" width="10" height="10" fill="black"/>
      
      <rect x="110" y="150" width="10" height="10" fill="black"/>
      <rect x="130" y="170" width="10" height="10" fill="black"/>
      <rect x="150" y="150" width="10" height="10" fill="black"/>
      <rect x="170" y="170" width="10" height="10" fill="black"/>
      <rect x="190" y="150" width="10" height="10" fill="black"/>
      
      <rect x="110" y="190" width="10" height="10" fill="black"/>
      <rect x="130" y="210" width="10" height="10" fill="black"/>
      <rect x="150" y="190" width="10" height="10" fill="black"/>
      <rect x="170" y="210" width="10" height="10" fill="black"/>
      <rect x="190" y="190" width="10" height="10" fill="black"/>
      
      <rect x="210" y="150" width="10" height="10" fill="black"/>
      <rect x="230" y="170" width="10" height="10" fill="black"/>
      <rect x="250" y="150" width="10" height="10" fill="black"/>
      <rect x="270" y="170" width="10" height="10" fill="black"/>
      
      <rect x="110" y="230" width="10" height="10" fill="black"/>
      <rect x="130" y="250" width="10" height="10" fill="black"/>
      <rect x="150" y="230" width="10" height="10" fill="black"/>
      <rect x="170" y="250" width="10" height="10" fill="black"/>
      <rect x="190" y="230" width="10" height="10" fill="black"/>
      
      <rect x="210" y="190" width="10" height="10" fill="black"/>
      <rect x="230" y="210" width="10" height="10" fill="black"/>
      <rect x="250" y="190" width="10" height="10" fill="black"/>
      <rect x="270" y="210" width="10" height="10" fill="black"/>
      
      <rect x="210" y="230" width="10" height="10" fill="black"/>
      <rect x="230" y="250" width="10" height="10" fill="black"/>
      <rect x="250" y="230" width="10" height="10" fill="black"/>
      <rect x="270" y="250" width="10" height="10" fill="black"/>
      
      <!-- Timing patterns -->
      <rect x="100" y="60" width="10" height="10" fill="black"/>
      <rect x="100" y="80" width="10" height="10" fill="black"/>
      <rect x="100" y="100" width="10" height="10" fill="black"/>
      <rect x="100" y="120" width="10" height="10" fill="black"/>
      <rect x="100" y="140" width="10" height="10" fill="black"/>
      <rect x="100" y="160" width="10" height="10" fill="black"/>
      <rect x="100" y="180" width="10" height="10" fill="black"/>
      <rect x="100" y="200" width="10" height="10" fill="black"/>
      
      <rect x="60" y="100" width="10" height="10" fill="black"/>
      <rect x="80" y="100" width="10" height="10" fill="black"/>
      <rect x="120" y="100" width="10" height="10" fill="black"/>
      <rect x="140" y="100" width="10" height="10" fill="black"/>
      <rect x="160" y="100" width="10" height="10" fill="black"/>
      <rect x="180" y="100" width="10" height="10" fill="black"/>
      <rect x="200" y="100" width="10" height="10" fill="black"/>
      
      <!-- WhatsApp Logo in center -->
      <circle cx="150" cy="150" r="25" fill="white" stroke="black" stroke-width="2"/>
      <circle cx="150" cy="150" r="20" fill="#25D366"/>
      
      <!-- Simple WhatsApp icon -->
      <path d="M140 140 Q140 135 145 135 Q155 135 160 140 Q160 145 155 150 L150 155 L145 150 Q140 145 140 140 Z" fill="white"/>
      <circle cx="145" cy="142" r="2" fill="white"/>
      
      <!-- Demo watermark -->
      <text x="150" y="285" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#999">QR Demo - No Funcional</text>
    </svg>
  `;
  
  console.log('Generating realistic QR code demo');
  
  return btoa(realisticQR);
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