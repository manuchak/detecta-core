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

// Prefijos de botones soportados - debe coincidir con KAPSO_BUTTON_PREFIXES
const BUTTON_HANDLERS: Record<string, string> = {
  // Servicios
  'CONFIRM_SERVICE_': 'service_confirmation',
  'REJECT_SERVICE_': 'service_rejection',
  'ON_THE_WAY_': 'service_on_way',
  'DELAYED_': 'service_delayed',
  
  // Ayuda
  'NEED_HELP_': 'help_request',
  
  // Checklist
  'CHECKLIST_DONE_': 'checklist_completed',
  'CHECKLIST_HELP_': 'checklist_help',
  'RETAKE_PHOTOS_': 'retake_photos',
  
  // GPS
  'CALL_MONITORING_': 'call_monitoring',
  'GPS_OK_': 'gps_confirmed',
  'GPS_ISSUE_RESOLVED_': 'gps_resolved',
  'CONTACT_SUPERVISOR_': 'contact_supervisor',
  'PROBLEM_RESOLVED_': 'problem_resolved',
  
  // Tickets
  'TICKET_SATISFIED_': 'ticket_satisfied',
  'TICKET_NOT_RESOLVED_': 'ticket_not_resolved',
  'TICKET_REOPEN_': 'ticket_reopen',
  'CSAT_EXCELLENT_': 'csat_excellent',
  'CSAT_REGULAR_': 'csat_regular',
  'CSAT_POOR_': 'csat_poor',
  
  // Documentos
  'UPLOAD_DOCUMENTS_': 'upload_documents',
  'UPDATE_DOCUMENT_': 'update_document',
  'DOCUMENT_HELP_': 'document_help',
  
  // SIERCP
  'START_EVALUATION_': 'start_evaluation',
  'EVALUATION_QUESTIONS_': 'evaluation_questions',
  
  // LMS
  'GO_TO_COURSE_': 'go_to_course',
  'REMIND_LATER_': 'remind_later',
  'START_QUIZ_': 'start_quiz',
  'CONTINUE_COURSE_': 'continue_course',
  
  // Leads
  'COMPLETE_REGISTRATION_': 'complete_registration',
  'MORE_INFO_': 'more_info',
  'TALK_TO_RECRUITER_': 'talk_to_recruiter',
  'APPLY_NOW_': 'apply_now',
  
  // Supply
  'CONFIRM_ATTENDANCE_': 'confirm_attendance',
  'RESCHEDULE_': 'reschedule',
  'START_ONBOARDING_': 'start_onboarding'
};

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
  
  // Encontrar qué handler usar basado en el prefijo
  let handlerType: string | null = null;
  let entityId: string | null = null;
  
  for (const [prefix, handler] of Object.entries(BUTTON_HANDLERS)) {
    if (buttonId.startsWith(prefix)) {
      handlerType = handler;
      entityId = buttonId.replace(prefix, '');
      break;
    }
  }
  
  if (!handlerType || !entityId) {
    console.log(`⚠️ Botón no reconocido: ${buttonId}`);
    return;
  }
  
  console.log(`📌 Handler: ${handlerType}, Entity: ${entityId}`);
  
  // Procesar según tipo de handler
  switch (handlerType) {
    // === SERVICIOS ===
    case 'service_confirmation':
      await handleServiceConfirmation(supabase, phone, entityId, 'confirmado');
      break;
    case 'service_rejection':
      await handleServiceConfirmation(supabase, phone, entityId, 'rechazado');
      break;
    case 'service_on_way':
      await handleServiceConfirmation(supabase, phone, entityId, 'en_camino');
      break;
    case 'service_delayed':
      await handleServiceDelay(supabase, phone, entityId);
      break;
      
    // === CHECKLIST ===
    case 'checklist_completed':
      console.log(`✅ Custodio ${phone} indica checklist completado para ${entityId}`);
      break;
    case 'checklist_help':
    case 'help_request':
      await createHelpTicket(supabase, phone, buttonId, 'checklist');
      break;
      
    // === GPS ===
    case 'call_monitoring':
      await createHelpTicket(supabase, phone, buttonId, 'monitoreo');
      break;
    case 'gps_confirmed':
    case 'gps_resolved':
      console.log(`✅ GPS confirmado OK por ${phone} para ${entityId}`);
      break;
    case 'contact_supervisor':
      await createHelpTicket(supabase, phone, buttonId, 'supervisor');
      break;
    case 'problem_resolved':
      console.log(`✅ Problema resuelto por ${phone} para ${entityId}`);
      break;
      
    // === TICKETS ===
    case 'ticket_satisfied':
      await handleTicketFeedback(supabase, entityId, 'satisfied');
      break;
    case 'ticket_not_resolved':
      await handleTicketFeedback(supabase, entityId, 'not_resolved');
      break;
    case 'ticket_reopen':
      await handleTicketReopen(supabase, entityId);
      break;
    case 'csat_excellent':
      await handleCSATResponse(supabase, entityId, 5);
      break;
    case 'csat_regular':
      await handleCSATResponse(supabase, entityId, 3);
      break;
    case 'csat_poor':
      await handleCSATResponse(supabase, entityId, 1);
      break;
      
    // === DOCUMENTOS ===
    case 'upload_documents':
    case 'update_document':
      console.log(`📄 Usuario ${phone} quiere subir documentos (${entityId})`);
      break;
    case 'document_help':
      await createHelpTicket(supabase, phone, buttonId, 'documentos');
      break;
      
    // === SIERCP ===
    case 'start_evaluation':
      console.log(`📝 Usuario ${phone} iniciará evaluación ${entityId}`);
      break;
    case 'evaluation_questions':
      await createHelpTicket(supabase, phone, buttonId, 'siercp');
      break;
      
    // === LMS ===
    case 'go_to_course':
    case 'continue_course':
    case 'start_quiz':
      console.log(`📚 Usuario ${phone} accederá a curso/quiz ${entityId}`);
      break;
    case 'remind_later':
      console.log(`⏰ Usuario ${phone} solicita recordatorio para ${entityId}`);
      break;
      
    // === LEADS ===
    case 'complete_registration':
    case 'apply_now':
      console.log(`📝 Lead ${phone} quiere completar registro (${entityId})`);
      await updateLeadStatus(supabase, entityId, 'interested');
      break;
    case 'more_info':
    case 'talk_to_recruiter':
      console.log(`📞 Lead ${phone} solicita más información (${entityId})`);
      await updateLeadStatus(supabase, entityId, 'contact_requested');
      break;
      
    // === SUPPLY ===
    case 'confirm_attendance':
      await handleInterviewConfirmation(supabase, entityId, true);
      break;
    case 'reschedule':
      await handleInterviewConfirmation(supabase, entityId, false);
      break;
    case 'start_onboarding':
      console.log(`🚀 Candidato ${entityId} iniciará onboarding`);
      break;
      
    default:
      console.log(`⚠️ Handler no implementado: ${handlerType}`);
  }
}

async function handleServiceConfirmation(supabase: any, phone: string, serviceId: string, status: string) {
  const updateData: any = {
    estado_confirmacion_custodio: status,
    fecha_confirmacion: new Date().toISOString()
  };
  
  if (status === 'rechazado') {
    updateData.requiere_reasignacion = true;
  }
  
  const { error } = await supabase
    .from('servicios_planificados')
    .update(updateData)
    .eq('id', serviceId);
  
  if (error) {
    console.error(`Error actualizando servicio ${serviceId}:`, error);
  } else {
    console.log(`✅ Servicio ${serviceId} actualizado a: ${status} por ${phone}`);
  }
}

async function handleServiceDelay(supabase: any, phone: string, serviceId: string) {
  // Actualizar estado y crear alerta
  await supabase
    .from('servicios_planificados')
    .update({ 
      estado_confirmacion_custodio: 'retrasado',
      notas_custodio: 'Custodio reportó retraso via WhatsApp'
    })
    .eq('id', serviceId);
  
  // Crear ticket de alerta
  const { data: custodio } = await supabase
    .from('profiles')
    .select('id, full_name')
    .or(`telefono.eq.${phone},telefono.ilike.%${phone.slice(-10)}%`)
    .eq('role', 'custodio')
    .maybeSingle();
  
  if (custodio) {
    await supabase.from('tickets').insert({
      ticket_number: `TKT-DELAY-${Date.now().toString(36).toUpperCase()}`,
      customer_phone: phone,
      customer_name: custodio.full_name,
      subject: `⚠️ Retraso reportado - Servicio ${serviceId}`,
      description: `El custodio ${custodio.full_name} reportó retraso para el servicio ${serviceId}`,
      status: 'abierto',
      priority: 'alta',
      category: 'operaciones',
      source: 'whatsapp',
      whatsapp_chat_id: phone,
      custodio_id: custodio.id,
      tipo_ticket: 'alerta_retraso'
    });
  }
  
  console.log(`⚠️ Retraso reportado por ${phone} para servicio ${serviceId}`);
}

async function createHelpTicket(supabase: any, phone: string, buttonId: string, category: string) {
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
      description: `El custodio solicitó ayuda via WhatsApp (botón: ${buttonId}, categoría: ${category})`,
      status: 'abierto',
      priority: 'alta',
      category: `soporte_${category}`,
      source: 'whatsapp',
      whatsapp_chat_id: phone,
      custodio_id: custodio.id,
      custodio_telefono: phone,
      tipo_ticket: 'solicitud_ayuda'
    });
    
    console.log(`✅ Ticket de ayuda creado: ${ticketNumber} (categoría: ${category})`);
  }
}

async function handleTicketFeedback(supabase: any, ticketId: string, feedback: string) {
  await supabase
    .from('tickets')
    .update({ 
      feedback_recibido: feedback,
      feedback_fecha: new Date().toISOString()
    })
    .eq('id', ticketId);
  
  console.log(`📊 Feedback recibido para ticket ${ticketId}: ${feedback}`);
}

async function handleTicketReopen(supabase: any, ticketId: string) {
  await supabase
    .from('tickets')
    .update({ 
      status: 'reabierto',
      fecha_reapertura: new Date().toISOString()
    })
    .eq('id', ticketId);
  
  console.log(`🔄 Ticket ${ticketId} reabierto`);
}

async function handleCSATResponse(supabase: any, ticketId: string, score: number) {
  await supabase
    .from('tickets')
    .update({ 
      csat_score: score,
      csat_fecha: new Date().toISOString()
    })
    .eq('id', ticketId);
  
  console.log(`⭐ CSAT ${score} para ticket ${ticketId}`);
}

async function updateLeadStatus(supabase: any, leadId: string, status: string) {
  // Intentar actualizar en candidatos_custodios
  const { error } = await supabase
    .from('candidatos_custodios')
    .update({ 
      estado_proceso: status,
      ultima_interaccion: new Date().toISOString(),
      canal_respuesta: 'whatsapp'
    })
    .eq('id', leadId);
  
  if (error) {
    console.warn(`No se pudo actualizar lead ${leadId}:`, error);
  } else {
    console.log(`📈 Lead ${leadId} actualizado a: ${status}`);
  }
}

async function handleInterviewConfirmation(supabase: any, candidatoId: string, confirmed: boolean) {
  const status = confirmed ? 'confirmada' : 'reagendar_solicitado';
  
  // Buscar entrevista pendiente del candidato
  const { data: entrevista, error } = await supabase
    .from('candidatos_custodios')
    .update({
      estado_entrevista: status,
      fecha_confirmacion_entrevista: new Date().toISOString()
    })
    .eq('id', candidatoId);
  
  console.log(`📅 Entrevista ${candidatoId}: ${status}`);
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
