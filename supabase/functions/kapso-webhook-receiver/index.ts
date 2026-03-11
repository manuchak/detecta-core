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

/* ─── Routing context resolved for each incoming message ─── */
interface MessageRoutingContext {
  sender_type: 'custodio' | 'cliente' | 'unknown';
  comm_channel: 'custodio_c4' | 'custodio_planeacion' | 'cliente_c4' | 'unknown';
  comm_phase: 'pre_servicio' | 'en_servicio' | 'post_servicio' | 'sin_servicio';
  servicio_id: string | null;
  profile_id: string | null;
  profile_name: string | null;
  cliente_id: string | null;
}

// Prefijos de botones soportados
const BUTTON_HANDLERS: Record<string, string> = {
  'CONFIRM_SERVICE_': 'service_confirmation',
  'REJECT_SERVICE_': 'service_rejection',
  'ON_THE_WAY_': 'service_on_way',
  'DELAYED_': 'service_delayed',
  'NEED_HELP_': 'help_request',
  'CHECKLIST_DONE_': 'checklist_completed',
  'CHECKLIST_HELP_': 'checklist_help',
  'RETAKE_PHOTOS_': 'retake_photos',
  'CALL_MONITORING_': 'call_monitoring',
  'GPS_OK_': 'gps_confirmed',
  'GPS_ISSUE_RESOLVED_': 'gps_resolved',
  'CONTACT_SUPERVISOR_': 'contact_supervisor',
  'PROBLEM_RESOLVED_': 'problem_resolved',
  'TICKET_SATISFIED_': 'ticket_satisfied',
  'TICKET_NOT_RESOLVED_': 'ticket_not_resolved',
  'TICKET_REOPEN_': 'ticket_reopen',
  'CSAT_EXCELLENT_': 'csat_excellent',
  'CSAT_REGULAR_': 'csat_regular',
  'CSAT_POOR_': 'csat_poor',
  'UPLOAD_DOCUMENTS_': 'upload_documents',
  'UPDATE_DOCUMENT_': 'update_document',
  'DOCUMENT_HELP_': 'document_help',
  'START_EVALUATION_': 'start_evaluation',
  'EVALUATION_QUESTIONS_': 'evaluation_questions',
  'GO_TO_COURSE_': 'go_to_course',
  'REMIND_LATER_': 'remind_later',
  'START_QUIZ_': 'start_quiz',
  'CONTINUE_COURSE_': 'continue_course',
  'COMPLETE_REGISTRATION_': 'complete_registration',
  'MORE_INFO_': 'more_info',
  'TALK_TO_RECRUITER_': 'talk_to_recruiter',
  'APPLY_NOW_': 'apply_now',
  'CONFIRM_ATTENDANCE_': 'confirm_attendance',
  'RESCHEDULE_': 'reschedule',
  'START_ONBOARDING_': 'start_onboarding'
};

/* ══════════════════════════════════════════════════════════════
   ROUTING: Classify incoming message sender & context
   ══════════════════════════════════════════════════════════════ */

async function resolveMessageContext(supabase: any, senderPhone: string): Promise<MessageRoutingContext> {
  const phoneLast10 = senderPhone.replace(/\D/g, '').slice(-10);

  // ── 1. Check if sender is a custodio ──
  const { data: custodio } = await supabase
    .from('profiles')
    .select('id, full_name, role, telefono')
    .or(`telefono.eq.${senderPhone},telefono.ilike.%${phoneLast10}%`)
    .eq('role', 'custodio')
    .maybeSingle();

  if (custodio) {
    // 1a. Has active service in monitoring? (hora_inicio_real set, hora_fin_real null)
    const { data: activeMonitored } = await supabase
      .from('servicios_planificados')
      .select('id, id_servicio')
      .is('hora_fin_real', null)
      .not('hora_inicio_real', 'is', null)
      .or(`custodio_telefono.ilike.%${phoneLast10}%,custodio_telefono.eq.${senderPhone}`)
      .order('hora_inicio_real', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeMonitored) {
      console.log(`🔗 Custodio ${custodio.full_name} → servicio en monitoreo ${activeMonitored.id_servicio}`);
      return {
        sender_type: 'custodio',
        comm_channel: 'custodio_c4',
        comm_phase: 'en_servicio',
        servicio_id: activeMonitored.id,
        profile_id: custodio.id,
        profile_name: custodio.full_name,
        cliente_id: null,
      };
    }

    // 1b. Has assigned service pre-monitoring? (hora_inicio_real IS NULL, not completed)
    const { data: preService } = await supabase
      .from('servicios_planificados')
      .select('id, id_servicio')
      .is('hora_fin_real', null)
      .is('hora_inicio_real', null)
      .or(`custodio_telefono.ilike.%${phoneLast10}%,custodio_telefono.eq.${senderPhone}`)
      .order('fecha_hora_cita', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (preService) {
      console.log(`🔗 Custodio ${custodio.full_name} → servicio pre-servicio ${preService.id_servicio}`);
      return {
        sender_type: 'custodio',
        comm_channel: 'custodio_planeacion',
        comm_phase: 'pre_servicio',
        servicio_id: preService.id,
        profile_id: custodio.id,
        profile_name: custodio.full_name,
        cliente_id: null,
      };
    }

    // 1c. Custodio without active service
    // Fallback: inherit from last outbound message
    const { data: lastOutbound } = await supabase
      .from('whatsapp_messages')
      .select('servicio_id, comm_channel')
      .eq('chat_id', senderPhone)
      .eq('is_from_bot', true)
      .not('servicio_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastOutbound?.servicio_id) {
      console.log(`🔗 Custodio ${custodio.full_name} → servicio heredado ${lastOutbound.servicio_id}`);
      return {
        sender_type: 'custodio',
        comm_channel: lastOutbound.comm_channel || 'custodio_c4',
        comm_phase: 'post_servicio',
        servicio_id: lastOutbound.servicio_id,
        profile_id: custodio.id,
        profile_name: custodio.full_name,
        cliente_id: null,
      };
    }

    // No service at all
    return {
      sender_type: 'custodio',
      comm_channel: 'unknown',
      comm_phase: 'sin_servicio',
      servicio_id: null,
      profile_id: custodio.id,
      profile_name: custodio.full_name,
      cliente_id: null,
    };
  }

  // ── 2. Check if sender is a client (telefono_cliente in active service) ──
  const { data: clientService } = await supabase
    .from('servicios_planificados')
    .select('id, id_servicio, cliente_id, hora_inicio_real')
    .is('hora_fin_real', null)
    .or(`telefono_cliente.ilike.%${phoneLast10}%,telefono_cliente.eq.${senderPhone}`)
    .order('hora_inicio_real', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (clientService) {
    const hasStarted = !!clientService.hora_inicio_real;
    console.log(`🔗 Cliente → servicio ${clientService.id_servicio} (${hasStarted ? 'en_servicio' : 'pre_servicio'})`);
    return {
      sender_type: 'cliente',
      comm_channel: 'cliente_c4',
      comm_phase: hasStarted ? 'en_servicio' : 'pre_servicio',
      servicio_id: clientService.id,
      profile_id: null,
      profile_name: null,
      cliente_id: clientService.cliente_id || null,
    };
  }

  // 2b. Check in pc_clientes_contactos
  const { data: contacto } = await supabase
    .from('pc_clientes_contactos')
    .select('id, cliente_id, nombre')
    .eq('activo', true)
    .ilike('telefono', `%${phoneLast10}%`)
    .limit(1)
    .maybeSingle();

  if (contacto) {
    // Find active service for this client
    const { data: clienteService } = await supabase
      .from('servicios_planificados')
      .select('id, id_servicio')
      .eq('cliente_id', contacto.cliente_id)
      .is('hora_fin_real', null)
      .order('hora_inicio_real', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (clienteService) {
      console.log(`🔗 Contacto cliente ${contacto.nombre} → servicio ${clienteService.id_servicio}`);
      return {
        sender_type: 'cliente',
        comm_channel: 'cliente_c4',
        comm_phase: 'en_servicio',
        servicio_id: clienteService.id,
        profile_id: null,
        profile_name: contacto.nombre,
        cliente_id: contacto.cliente_id,
      };
    }

    // Client contact but no active service
    return {
      sender_type: 'cliente',
      comm_channel: 'cliente_c4',
      comm_phase: 'sin_servicio',
      servicio_id: null,
      profile_id: null,
      profile_name: contacto.nombre,
      cliente_id: contacto.cliente_id,
    };
  }

  // 2c. Check in pc_clientes.contacto_whatsapp
  const { data: clienteDirecto } = await supabase
    .from('pc_clientes')
    .select('id, nombre_comercial, contacto_whatsapp')
    .ilike('contacto_whatsapp', `%${phoneLast10}%`)
    .limit(1)
    .maybeSingle();

  if (clienteDirecto) {
    const { data: clienteService2 } = await supabase
      .from('servicios_planificados')
      .select('id, id_servicio')
      .eq('cliente_id', clienteDirecto.id)
      .is('hora_fin_real', null)
      .order('hora_inicio_real', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (clienteService2) {
      console.log(`🔗 Cliente directo ${clienteDirecto.nombre_comercial} → servicio ${clienteService2.id_servicio}`);
      return {
        sender_type: 'cliente',
        comm_channel: 'cliente_c4',
        comm_phase: 'en_servicio',
        servicio_id: clienteService2.id,
        profile_id: null,
        profile_name: clienteDirecto.nombre_comercial,
        cliente_id: clienteDirecto.id,
      };
    }

    return {
      sender_type: 'cliente',
      comm_channel: 'cliente_c4',
      comm_phase: 'sin_servicio',
      servicio_id: null,
      profile_id: null,
      profile_name: clienteDirecto.nombre_comercial,
      cliente_id: clienteDirecto.id,
    };
  }

  // ── 3. Fallback: inherit from last outbound ──
  const { data: fallbackOutbound } = await supabase
    .from('whatsapp_messages')
    .select('servicio_id, comm_channel, sender_type')
    .eq('chat_id', senderPhone)
    .eq('is_from_bot', true)
    .not('servicio_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fallbackOutbound?.servicio_id) {
    console.log(`🔗 Desconocido → servicio heredado ${fallbackOutbound.servicio_id}`);
    return {
      sender_type: 'unknown',
      comm_channel: fallbackOutbound.comm_channel || 'unknown',
      comm_phase: 'post_servicio',
      servicio_id: fallbackOutbound.servicio_id,
      profile_id: null,
      profile_name: null,
      cliente_id: null,
    };
  }

  // ── 4. Completely unknown ──
  return {
    sender_type: 'unknown',
    comm_channel: 'unknown',
    comm_phase: 'sin_servicio',
    servicio_id: null,
    profile_id: null,
    profile_name: null,
    cliente_id: null,
  };
}

/* ══════════════════════════════════════════════════════════════
   MAIN HANDLER
   ══════════════════════════════════════════════════════════════ */

serve(async (req) => {
  // Webhook verification (GET from Kapso/Meta)
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

    const payload = await req.json();
    console.log('📥 Webhook recibido:', JSON.stringify(payload, null, 2));

    // ── Kapso native format (no top-level "event") ──
    if (!payload.event && payload.message?.kapso) {
      const kapsoMeta = payload.message.kapso;
      const kapsoStatus = kapsoMeta.status as string;
      const direction = kapsoMeta.direction as string;
      const messageId = payload.message.id as string;

      console.log(`📡 Formato Kapso detectado — direction: ${direction}, status: ${kapsoStatus}, messageId: ${messageId}`);

      if (direction === 'outbound') {
        if (messageId) {
          const { error: updErr } = await supabase
            .from('whatsapp_messages')
            .update({ delivery_status: kapsoStatus, is_read: kapsoStatus === 'read' })
            .eq('message_id', messageId);
          if (updErr) console.error(`⚠️ Error actualizando delivery_status para ${messageId}:`, updErr);
          else console.log(`📬 Mensaje ${messageId} → ${kapsoStatus}`);
        }
        if (kapsoStatus === 'failed') {
          const errors = kapsoMeta.statuses?.[0]?.errors || kapsoMeta.errors;
          if (errors) console.error('❌ Error de entrega detallado:', JSON.stringify(errors));
        }
      } else if (direction === 'inbound') {
        const msgData = payload.message;
        const kapsoMediaUrl = kapsoMeta.media_url || null;
        const adaptedPayload: KapsoWebhookPayload = {
          event: 'whatsapp.message.received',
          timestamp: msgData.timestamp || new Date().toISOString(),
          data: {
            id: msgData.id,
            from: msgData.from || msgData.chat_id,
            to: msgData.to,
            type: msgData.type || 'text',
            text: msgData.text ? { body: msgData.text.body || msgData.text } : undefined,
            image: msgData.image ? { ...msgData.image, link: kapsoMediaUrl || msgData.image?.link } : undefined,
            document: msgData.document,
            interactive: msgData.interactive,
          },
        };
        await handleIncomingMessage(supabase, adaptedPayload);
      } else {
        console.log(`⚠️ Dirección Kapso desconocida: ${direction}`);
      }

      return new Response(JSON.stringify({ received: true, format: 'kapso_native' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Generic format (with "event" field) ──
    switch (payload.event) {
      case 'whatsapp.message.received':
        await handleIncomingMessage(supabase, payload as KapsoWebhookPayload);
        break;
      case 'whatsapp.message.delivered':
        await handleDeliveryStatus(supabase, payload as KapsoWebhookPayload, 'delivered');
        break;
      case 'whatsapp.message.read':
        await handleDeliveryStatus(supabase, payload as KapsoWebhookPayload, 'read');
        break;
      case 'whatsapp.message.failed':
        await handleDeliveryStatus(supabase, payload as KapsoWebhookPayload, 'failed');
        break;
      default:
        console.log('Evento no manejado:', payload.event);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error en kapso-webhook-receiver:', error);
    return new Response(JSON.stringify({ received: true, error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

/* ══════════════════════════════════════════════════════════════
   INCOMING MESSAGE HANDLER (with routing context)
   ══════════════════════════════════════════════════════════════ */

async function handleIncomingMessage(supabase: any, payload: KapsoWebhookPayload) {
  const { data } = payload;
  const senderPhone = data.from!;
  const messageType = data.type || 'text';

  console.log(`📨 Mensaje entrante de ${senderPhone}, tipo: ${messageType}`);

  // ── Resolve routing context ──
  const ctx = await resolveMessageContext(supabase, senderPhone);
  console.log(`🧭 Routing: sender_type=${ctx.sender_type}, channel=${ctx.comm_channel}, phase=${ctx.comm_phase}, servicio=${ctx.servicio_id}`);

  // ── Extract message content ──
  let messageText = '';
  let mediaUrl = null;
  let mediaId: string | null = null;

  if (data.text) {
    messageText = data.text.body;
  } else if (data.image) {
    messageText = data.image.caption || '[Imagen]';
    mediaId = data.image.id;
    mediaUrl = (data.image as any).link || data.image.id;
  } else if (data.document) {
    messageText = `[Documento: ${data.document.filename}]`;
    mediaUrl = data.document.id;
    mediaId = data.document.id;
  } else if (data.interactive) {
    const reply = data.interactive.button_reply || data.interactive.list_reply;
    messageText = reply?.title || '[Respuesta interactiva]';
    if (reply) {
      await handleInteractiveResponse(supabase, senderPhone, reply);
    }
  }

  // ── Save message with routing context ──
  const messageRecord: any = {
    chat_id: senderPhone,
    message_id: data.id,
    sender_phone: senderPhone,
    sender_name: ctx.profile_name || null,
    message_text: messageText,
    message_type: messageType,
    media_url: mediaUrl,
    is_from_bot: false,
    is_read: false,
    delivery_status: 'delivered',
    created_at: new Date().toISOString(),
    // ── Routing context fields ──
    comm_channel: ctx.comm_channel,
    comm_phase: ctx.comm_phase,
    sender_type: ctx.sender_type,
  };

  if (ctx.servicio_id) {
    messageRecord.servicio_id = ctx.servicio_id;
  }

  const { data: insertedMsg, error: msgError } = await supabase
    .from('whatsapp_messages')
    .insert(messageRecord)
    .select()
    .single();

  if (msgError) {
    console.error('Error guardando mensaje:', msgError);
  }

  // ── Trigger media download if applicable ──
  if (mediaId && insertedMsg) {
    try {
      const downloadRes = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/kapso-download-media`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            media_id: mediaId,
            servicio_id: ctx.servicio_id || null,
            whatsapp_message_id: insertedMsg.id,
            media_type: messageType,
          }),
        }
      );
      const downloadResult = await downloadRes.json();
      if (downloadResult.success) {
        console.log(`📸 Media descargado y persistido: ${downloadResult.public_url}`);
      } else {
        console.error('⚠️ Error descargando media:', downloadResult.error);
      }
    } catch (err) {
      console.error('⚠️ Error invocando kapso-download-media:', err);
    }
  }

  // ── Ticket logic: only for custodios without active service or unknown senders ──
  if (ctx.sender_type === 'custodio' && ctx.servicio_id) {
    // Custodio with active service → managed via bitácora, no ticket
    console.log(`📋 Mensaje de custodio con servicio activo (${ctx.comm_channel}) — gestionado en bitácora`);
    return;
  }

  if (ctx.sender_type === 'cliente' && ctx.servicio_id) {
    // Client with active service → visible in Client tab, no ticket
    console.log(`📋 Mensaje de cliente con servicio activo (${ctx.comm_channel}) — visible en tab Cliente`);
    return;
  }

  // ── Check for existing open ticket ──
  const { data: existingTicket } = await supabase
    .from('tickets')
    .select('id, ticket_number, status')
    .eq('whatsapp_chat_id', senderPhone)
    .neq('status', 'cerrado')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingTicket) {
    await supabase.from('ticket_respuestas').insert({
      ticket_id: existingTicket.id,
      autor_id: null,
      autor_tipo: ctx.sender_type === 'cliente' ? 'cliente' : 'custodio',
      autor_nombre: ctx.profile_name || senderPhone,
      mensaje: messageText,
      es_resolucion: false,
      es_interno: false,
      created_at: new Date().toISOString()
    });

    if (insertedMsg) {
      await supabase
        .from('whatsapp_messages')
        .update({ ticket_id: existingTicket.id })
        .eq('id', insertedMsg.id);
    }
    console.log(`✅ Mensaje vinculado a ticket existente: ${existingTicket.ticket_number}`);
  } else if (ctx.sender_type === 'custodio' && ctx.profile_id) {
    // Custodio without active service → auto-create ticket
    const ticketNumber = `TKT-WA-${Date.now().toString(36).toUpperCase()}`;
    const { data: newTicket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        ticket_number: ticketNumber,
        customer_phone: senderPhone,
        customer_name: ctx.profile_name,
        subject: `Mensaje de WhatsApp de ${ctx.profile_name}`,
        description: messageText,
        status: 'abierto',
        priority: 'media',
        category: 'soporte_custodio',
        source: 'whatsapp',
        whatsapp_chat_id: senderPhone,
        custodio_id: ctx.profile_id,
        custodio_telefono: senderPhone,
        tipo_ticket: 'soporte_whatsapp'
      })
      .select()
      .single();

    if (!ticketError && newTicket) {
      if (insertedMsg) {
        await supabase.from('whatsapp_messages').update({ ticket_id: newTicket.id }).eq('id', insertedMsg.id);
      }
      console.log(`✅ Ticket creado automáticamente: ${ticketNumber}`);
      await sendAutoReply(senderPhone, ctx.profile_name || 'Usuario', ticketNumber);
    }
  } else if (ctx.sender_type === 'cliente') {
    // Client without active service → create attention ticket
    const ticketNumber = `TKT-CLI-${Date.now().toString(36).toUpperCase()}`;
    await supabase.from('tickets').insert({
      ticket_number: ticketNumber,
      customer_phone: senderPhone,
      customer_name: ctx.profile_name || senderPhone,
      subject: `Mensaje de cliente via WhatsApp`,
      description: messageText,
      status: 'abierto',
      priority: 'media',
      category: 'atencion_cliente',
      source: 'whatsapp',
      whatsapp_chat_id: senderPhone,
      tipo_ticket: 'atencion_cliente'
    });
    console.log(`✅ Ticket de atención al cliente creado: ${ticketNumber}`);
  } else {
    console.log(`⚠️ Mensaje de número desconocido: ${senderPhone}`);
  }
}

async function handleInteractiveResponse(supabase: any, senderPhone: string, reply: { id: string; title: string }) {
  const replyId = reply.id;
  console.log(`🔘 Botón interactivo recibido: ${replyId}`);

  for (const prefix in BUTTON_HANDLERS) {
    if (replyId.startsWith(prefix)) {
      const handlerName = BUTTON_HANDLERS[prefix];
      switch (handlerName) {
        case 'service_confirmation':
          await handleServiceConfirmation(supabase, senderPhone, replyId);
          break;
        case 'service_rejection':
          await handleServiceRejection(supabase, senderPhone, replyId);
          break;
        case 'service_on_way':
          await handleServiceOnWay(supabase, senderPhone, replyId);
          break;
        case 'service_delayed':
          await handleServiceDelay(supabase, senderPhone, replyId);
          break;
        case 'help_request':
          await createHelpTicket(supabase, senderPhone, replyId);
          break;
        case 'checklist_completed':
          await handleChecklistCompleted(supabase, senderPhone, replyId);
          break;
        case 'checklist_help':
          await createHelpTicket(supabase, senderPhone, replyId);
          break;
        case 'retake_photos':
          await handleRetakePhotos(supabase, senderPhone, replyId);
          break;
        case 'call_monitoring':
          await handleCallMonitoring(supabase, senderPhone, replyId);
          break;
        case 'gps_confirmed':
          await handleGPSConfirmed(supabase, senderPhone, replyId);
          break;
        case 'gps_resolved':
          await handleGPSResolved(supabase, senderPhone, replyId);
          break;
        case 'contact_supervisor':
          await handleContactSupervisor(supabase, senderPhone, replyId);
          break;
        case 'problem_resolved':
          await handleProblemResolved(supabase, senderPhone, replyId);
          break;
        case 'ticket_satisfied':
          await handleTicketFeedback(supabase, senderPhone, replyId, 'satisfied');
          break;
        case 'ticket_not_resolved':
          await handleTicketFeedback(supabase, senderPhone, replyId, 'not_resolved');
          break;
        case 'ticket_reopen':
          await handleTicketReopen(supabase, senderPhone, replyId);
          break;
        case 'csat_excellent':
          await handleCSATResponse(supabase, senderPhone, replyId, 'excellent');
          break;
        case 'csat_regular':
          await handleCSATResponse(supabase, senderPhone, replyId, 'regular');
          break;
        case 'csat_poor':
          await handleCSATResponse(supabase, senderPhone, replyId, 'poor');
          break;
        case 'upload_documents':
          await handleUploadDocuments(supabase, senderPhone, replyId);
          break;
        case 'update_document':
          await handleUpdateDocument(supabase, senderPhone, replyId);
          break;
        case 'document_help':
          await createHelpTicket(supabase, senderPhone, replyId);
          break;
        case 'start_evaluation':
          await handleStartEvaluation(supabase, senderPhone, replyId);
          break;
        case 'evaluation_questions':
          await handleEvaluationQuestions(supabase, senderPhone, replyId);
          break;
        case 'go_to_course':
          await handleGoToCourse(supabase, senderPhone, replyId);
          break;
        case 'remind_later':
          await handleRemindLater(supabase, senderPhone, replyId);
          break;
        case 'start_quiz':
          await handleStartQuiz(supabase, senderPhone, replyId);
          break;
        case 'continue_course':
          await handleContinueCourse(supabase, senderPhone, replyId);
          break;
        case 'complete_registration':
          await handleCompleteRegistration(supabase, senderPhone, replyId);
          break;
        case 'more_info':
          await handleMoreInfo(supabase, senderPhone, replyId);
          break;
        case 'talk_to_recruiter':
          await handleTalkToRecruiter(supabase, senderPhone, replyId);
          break;
        case 'apply_now':
          await handleApplyNow(supabase, senderPhone, replyId);
          break;
        case 'confirm_attendance':
          await handleConfirmAttendance(supabase, senderPhone, replyId);
          break;
        case 'reschedule':
          await handleReschedule(supabase, senderPhone, replyId);
          break;
        case 'start_onboarding':
          await handleStartOnboarding(supabase, senderPhone, replyId);
          break;
        default:
          console.log(`⚠️ Handler no implementado para botón: ${handlerName}`);
      }
      return;
    }
  }
  console.log(`⚠️ Botón interactivo no reconocido: ${replyId}`);
}

async function handleServiceConfirmation(supabase: any, senderPhone: string, replyId: string) {
  console.log(`✅ Confirmación de servicio recibida: ${replyId} de ${senderPhone}`);
  // Implement service confirmation logic here
}

async function handleServiceRejection(supabase: any, senderPhone: string, replyId: string) {
  console.log(`❌ Rechazo de servicio recibido: ${replyId} de ${senderPhone}`);
  // Implement service rejection logic here
}

async function handleServiceOnWay(supabase: any, senderPhone: string, replyId: string) {
  console.log(`🚗 Servicio en camino: ${replyId} de ${senderPhone}`);
  // Implement on the way logic here
}

async function handleServiceDelay(supabase: any, senderPhone: string, replyId: string) {
  console.log(`⏳ Retraso en servicio: ${replyId} de ${senderPhone}`);
  // Implement delay handling logic here
}

async function createHelpTicket(supabase: any, senderPhone: string, replyId: string) {
  console.log(`🆘 Solicitud de ayuda recibida: ${replyId} de ${senderPhone}`);
  // Implement help ticket creation here
}

async function handleChecklistCompleted(supabase: any, senderPhone: string, replyId: string) {
  console.log(`✅ Checklist completado: ${replyId} de ${senderPhone}`);
  // Implement checklist completion logic here
}

async function handleRetakePhotos(supabase: any, senderPhone: string, replyId: string) {
  console.log(`📷 Solicitud de re-tomar fotos: ${replyId} de ${senderPhone}`);
  // Implement retake photos logic here
}

async function handleCallMonitoring(supabase: any, senderPhone: string, replyId: string) {
  console.log(`📞 Llamada a monitoreo solicitada: ${replyId} de ${senderPhone}`);
  // Implement call monitoring logic here
}

async function handleGPSConfirmed(supabase: any, senderPhone: string, replyId: string) {
  console.log(`📍 GPS confirmado: ${replyId} de ${senderPhone}`);
  // Implement GPS confirmation logic here
}

async function handleGPSResolved(supabase: any, senderPhone: string, replyId: string) {
  console.log(`📍 Problema GPS resuelto: ${replyId} de ${senderPhone}`);
  // Implement GPS issue resolved logic here
}

async function handleContactSupervisor(supabase: any, senderPhone: string, replyId: string) {
  console.log(`👤 Contactar supervisor: ${replyId} de ${senderPhone}`);
  // Implement contact supervisor logic here
}

async function handleProblemResolved(supabase: any, senderPhone: string, replyId: string) {
  console.log(`✔️ Problema resuelto: ${replyId} de ${senderPhone}`);
  // Implement problem resolved logic here
}

async function handleTicketFeedback(supabase: any, senderPhone: string, replyId: string, feedbackType: string) {
  console.log(`📝 Feedback de ticket (${feedbackType}): ${replyId} de ${senderPhone}`);
  // Implement ticket feedback logic here
}

async function handleTicketReopen(supabase: any, senderPhone: string, replyId: string) {
  console.log(`🔄 Reapertura de ticket: ${replyId} de ${senderPhone}`);
  // Implement ticket reopen logic here
}

async function handleCSATResponse(supabase: any, senderPhone: string, replyId: string, csatLevel: string) {
  console.log(`⭐ CSAT respuesta (${csatLevel}): ${replyId} de ${senderPhone}`);
  // Implement CSAT response logic here
}

async function handleUploadDocuments(supabase: any, senderPhone: string, replyId: string) {
  console.log(`📄 Subir documentos: ${replyId} de ${senderPhone}`);
  // Implement upload documents logic here
}

async function handleUpdateDocument(supabase: any, senderPhone: string, replyId: string) {
  console.log(`✏️ Actualizar documento: ${replyId} de ${senderPhone}`);
  // Implement update document logic here
}

async function handleStartEvaluation(supabase: any, senderPhone: string, replyId: string) {
  console.log(`📝 Iniciar evaluación: ${replyId} de ${senderPhone}`);
  // Implement start evaluation logic here
}

async function handleEvaluationQuestions(supabase: any, senderPhone: string, replyId: string) {
  console.log(`❓ Preguntas de evaluación: ${replyId} de ${senderPhone}`);
  // Implement evaluation questions logic here
}

async function handleGoToCourse(supabase: any, senderPhone: string, replyId: string) {
  console.log(`📚 Ir al curso: ${replyId} de ${senderPhone}`);
  // Implement go to course logic here
}

async function handleRemindLater(supabase: any, senderPhone: string, replyId: string) {
  console.log(`⏰ Recordar más tarde: ${replyId} de ${senderPhone}`);
  // Implement remind later logic here
}

async function handleStartQuiz(supabase: any, senderPhone: string, replyId: string) {
  console.log(`📝 Iniciar quiz: ${replyId} de ${senderPhone}`);
  // Implement start quiz logic here
}

async function handleContinueCourse(supabase: any, senderPhone: string, replyId: string) {
  console.log(`▶️ Continuar curso: ${replyId} de ${senderPhone}`);
  // Implement continue course logic here
}

async function handleCompleteRegistration(supabase: any, senderPhone: string, replyId: string) {
  console.log(`✅ Completar registro: ${replyId} de ${senderPhone}`);
  // Implement complete registration logic here
}

async function handleMoreInfo(supabase: any, senderPhone: string, replyId: string) {
  console.log(`ℹ️ Más información: ${replyId} de ${senderPhone}`);
  // Implement more info logic here
}

async function handleTalkToRecruiter(supabase: any, senderPhone: string, replyId: string) {
  console.log(`💬 Hablar con reclutador: ${replyId} de ${senderPhone}`);
  // Implement talk to recruiter logic here
}

async function handleApplyNow(supabase: any, senderPhone: string, replyId: string) {
  console.log(`📝 Aplicar ahora: ${replyId} de ${senderPhone}`);
  // Implement apply now logic here
}

async function handleConfirmAttendance(supabase: any, senderPhone: string, replyId: string) {
  console.log(`✅ Confirmar asistencia: ${replyId} de ${senderPhone}`);
  // Implement confirm attendance logic here
}

async function handleReschedule(supabase: any, senderPhone: string, replyId: string) {
  console.log(`🔄 Reprogramar: ${replyId} de ${senderPhone}`);
  // Implement reschedule logic here
}

async function handleStartOnboarding(supabase: any, senderPhone: string, replyId: string) {
  console.log(`🚀 Iniciar onboarding: ${replyId} de ${senderPhone}`);
  // Implement start onboarding logic here
}

async function handleDeliveryStatus(supabase: any, payload: KapsoWebhookPayload, status: string) {
  const messageId = payload.data.id;
  if (!messageId) {
    console.log('⚠️ No message ID in delivery status update');
    return;
  }
  const { error } = await supabase
    .from('whatsapp_messages')
    .update({ delivery_status: status, is_read: status === 'read' })
    .eq('message_id', messageId);
  if (error) {
    console.error(`⚠️ Error actualizando estado de entrega para ${messageId}:`, error);
  } else {
    console.log(`📬 Estado de entrega actualizado para ${messageId}: ${status}`);
  }
}

async function sendAutoReply(phone: string, name: string, ticketNumber: string) {
  console.log(`✉️ Enviando respuesta automática a ${phone} para ticket ${ticketNumber}`);
  // Implement sending auto-reply message logic here
}
