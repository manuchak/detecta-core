import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-kapso-signature',
};

interface KapsoWebhookPayload {
  event: string;
  timestamp: string;
  data: {
    id?: string;
    from?: string;
    to?: string;
    timestamp?: string;
    type?: string;
    text?: { body: string };
    image?: { id: string; mime_type: string; caption?: string };
    document?: { id: string; filename: string; mime_type: string };
    interactive?: {
      type: string;
      button_reply?: { id: string; title: string };
      list_reply?: { id: string; title: string };
    };
    status?: string;
    conversation?: { id: string };
    context?: { message_id: string };
  };
}

serve(async (req) => {
  // Verificación de webhook (GET request de Kapso/Meta)
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    
    const VERIFY_TOKEN = Deno.env.get('KAPSO_WEBHOOK_VERIFY_TOKEN') || 'detecta_kapso_webhook';
    
    console.log('Verificación de webhook:', { mode, tokenMatch: token === VERIFY_TOKEN });
    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook verificado exitosamente');
      return new Response(challenge, { status: 200 });
    }
    
    console.log('❌ Verificación de webhook fallida');
    return new Response('Verification failed', { status: 403 });
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: KapsoWebhookPayload = await req.json();
    
    console.log('📥 Webhook recibido:', JSON.stringify(payload, null, 2));
    
    // Procesar según tipo de evento
    switch (payload.event) {
      case 'whatsapp.message.received':
        await handleIncomingMessage(supabase, payload);
        break;
        
      case 'whatsapp.message.delivered':
        await handleDeliveryStatus(supabase, payload, 'delivered');
        break;
        
      case 'whatsapp.message.read':
        await handleDeliveryStatus(supabase, payload, 'read');
        break;
        
      case 'whatsapp.message.failed':
        await handleDeliveryStatus(supabase, payload, 'failed');
        break;
        
      default:
        console.log('Evento no manejado:', payload.event);
    }
    
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('❌ Error en kapso-webhook-receiver:', error);
    // Siempre responder 200 para evitar reintentos de Kapso
    return new Response(JSON.stringify({ 
      received: true, 
      error: error.message 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleIncomingMessage(supabase: any, payload: KapsoWebhookPayload) {
  const { data } = payload;
  const senderPhone = data.from!;
  const messageType = data.type || 'text';
  
  console.log(`📨 Mensaje entrante de ${senderPhone}, tipo: ${messageType}`);
  
  // Extraer contenido del mensaje
  let messageText = '';
  let mediaUrl = null;
  
  if (data.text) {
    messageText = data.text.body;
  } else if (data.image) {
    messageText = data.image.caption || '[Imagen]';
    mediaUrl = data.image.id;
  } else if (data.document) {
    messageText = `[Documento: ${data.document.filename}]`;
    mediaUrl = data.document.id;
  } else if (data.interactive) {
    // Respuesta a botón o lista
    const reply = data.interactive.button_reply || data.interactive.list_reply;
    messageText = reply?.title || '[Respuesta interactiva]';
    
    // Procesar respuesta interactiva
    if (reply) {
      await handleInteractiveResponse(supabase, senderPhone, reply);
    }
  }
  
  // Guardar mensaje en base de datos
  const messageRecord = {
    chat_id: senderPhone,
    message_id: data.id,
    sender_phone: senderPhone,
    sender_name: null,
    message_text: messageText,
    message_type: messageType,
    media_url: mediaUrl,
    is_from_bot: false,
    is_read: false,
    delivery_status: 'delivered',
    created_at: new Date().toISOString()
  };
  
  const { data: insertedMsg, error: msgError } = await supabase
    .from('whatsapp_messages')
    .insert(messageRecord)
    .select()
    .single();
  
  if (msgError) {
    console.error('Error guardando mensaje:', msgError);
  }
  
  // Buscar si hay un ticket abierto con este chat
  const { data: existingTicket } = await supabase
    .from('tickets')
    .select('id, ticket_number, status')
    .eq('whatsapp_chat_id', senderPhone)
    .neq('status', 'cerrado')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (existingTicket) {
    // Agregar mensaje como respuesta al ticket
    await supabase.from('ticket_respuestas').insert({
      ticket_id: existingTicket.id,
      autor_id: null,
      autor_tipo: 'custodio',
      autor_nombre: senderPhone,
      mensaje: messageText,
      es_resolucion: false,
      es_interno: false,
      created_at: new Date().toISOString()
    });
    
    // Actualizar mensaje con ticket_id
    if (insertedMsg) {
      await supabase
        .from('whatsapp_messages')
        .update({ ticket_id: existingTicket.id })
        .eq('id', insertedMsg.id);
    }
    
    console.log(`✅ Mensaje vinculado a ticket existente: ${existingTicket.ticket_number}`);
  } else {
    // Verificar si es un custodio activo
    const { data: custodio } = await supabase
      .from('profiles')
      .select('id, full_name, role, telefono')
      .or(`telefono.eq.${senderPhone},telefono.ilike.%${senderPhone.slice(-10)}%`)
      .eq('role', 'custodio')
      .maybeSingle();
    
    if (custodio) {
      // Crear ticket automático para custodio
      const ticketNumber = `TKT-WA-${Date.now().toString(36).toUpperCase()}`;
      
      const { data: newTicket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          ticket_number: ticketNumber,
          customer_phone: senderPhone,
          customer_name: custodio.full_name,
          subject: `Mensaje de WhatsApp de ${custodio.full_name}`,
          description: messageText,
          status: 'abierto',
          priority: 'media',
          category: 'soporte_custodio',
          source: 'whatsapp',
          whatsapp_chat_id: senderPhone,
          custodio_id: custodio.id,
          custodio_telefono: senderPhone,
          tipo_ticket: 'soporte_whatsapp'
        })
        .select()
        .single();
      
      if (!ticketError && newTicket) {
        // Actualizar mensaje con ticket_id
        if (insertedMsg) {
          await supabase
            .from('whatsapp_messages')
            .update({ ticket_id: newTicket.id })
            .eq('id', insertedMsg.id);
        }
        
        console.log(`✅ Ticket creado automáticamente: ${ticketNumber}`);
        
        // Enviar respuesta automática
        await sendAutoReply(senderPhone, custodio.full_name, ticketNumber);
      }
    } else {
      console.log(`⚠️ Mensaje de número desconocido: ${senderPhone}`);
    }
  }
}

async function handleInteractiveResponse(supabase: any, phone: string, reply: { id: string; title: string }) {
  console.log(`🔘 Respuesta interactiva de ${phone}: ${reply.id} - ${reply.title}`);
  
  const buttonId = reply.id;
  
  // Procesar según ID del botón
  if (buttonId.startsWith('CONFIRM_SERVICE_')) {
    const serviceId = buttonId.replace('CONFIRM_SERVICE_', '');
    await handleServiceConfirmation(supabase, phone, serviceId, true);
  } else if (buttonId.startsWith('REJECT_SERVICE_')) {
    const serviceId = buttonId.replace('REJECT_SERVICE_', '');
    await handleServiceConfirmation(supabase, phone, serviceId, false);
  } else if (buttonId.startsWith('CHECKLIST_DONE_')) {
    const servicioId = buttonId.replace('CHECKLIST_DONE_', '');
    console.log(`✅ Custodio ${phone} indica checklist completado para ${servicioId}`);
  } else if (buttonId.startsWith('CHECKLIST_HELP_') || buttonId.startsWith('NEED_HELP_')) {
    await createHelpTicket(supabase, phone, buttonId);
  }
}

async function handleServiceConfirmation(supabase: any, phone: string, serviceId: string, accepted: boolean) {
  const updateData = accepted 
    ? {
        estado_confirmacion_custodio: 'confirmado',
        fecha_confirmacion: new Date().toISOString()
      }
    : {
        estado_confirmacion_custodio: 'rechazado',
        requiere_reasignacion: true
      };
  
  const { error } = await supabase
    .from('servicios_planificados')
    .update(updateData)
    .eq('id', serviceId);
  
  if (error) {
    console.error(`Error actualizando servicio ${serviceId}:`, error);
  } else {
    console.log(`✅ Servicio ${serviceId} ${accepted ? 'confirmado' : 'rechazado'} por ${phone}`);
  }
}

async function createHelpTicket(supabase: any, phone: string, buttonId: string) {
  // Buscar custodio
  const { data: custodio } = await supabase
    .from('profiles')
    .select('id, full_name')
    .or(`telefono.eq.${phone},telefono.ilike.%${phone.slice(-10)}%`)
    .eq('role', 'custodio')
    .maybeSingle();
  
  if (custodio) {
    const ticketNumber = `TKT-HELP-${Date.now().toString(36).toUpperCase()}`;
    
    await supabase.from('tickets').insert({
      ticket_number: ticketNumber,
      customer_phone: phone,
      customer_name: custodio.full_name,
      subject: `Solicitud de ayuda de ${custodio.full_name}`,
      description: `El custodio solicitó ayuda via WhatsApp (botón: ${buttonId})`,
      status: 'abierto',
      priority: 'alta',
      category: 'soporte_custodio',
      source: 'whatsapp',
      whatsapp_chat_id: phone,
      custodio_id: custodio.id,
      custodio_telefono: phone,
      tipo_ticket: 'solicitud_ayuda'
    });
    
    console.log(`✅ Ticket de ayuda creado: ${ticketNumber}`);
  }
}

async function handleDeliveryStatus(supabase: any, payload: KapsoWebhookPayload, status: string) {
  const messageId = payload.data.id;
  
  if (messageId) {
    const { error } = await supabase
      .from('whatsapp_messages')
      .update({ 
        is_read: status === 'read',
        delivery_status: status
      })
      .eq('message_id', messageId);
    
    if (!error) {
      console.log(`📬 Mensaje ${messageId} actualizado a: ${status}`);
    }
  }
}

async function sendAutoReply(phone: string, custodioName: string, ticketNumber: string) {
  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/kapso-send-message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: phone,
        type: 'text',
        text: `¡Hola ${custodioName}! 👋\n\nHemos recibido tu mensaje y creado el ticket ${ticketNumber}.\n\nUn agente te responderá pronto. Mientras tanto, puedes seguir enviando mensajes aquí.\n\n🛡️ Equipo Detecta`
      })
    });
    
    console.log('Auto-reply enviado:', await response.json());
  } catch (error) {
    console.error('Error enviando auto-reply:', error);
  }
}
