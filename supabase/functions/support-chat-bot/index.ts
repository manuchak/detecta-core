import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeo de categorías detectadas a IDs reales
const CATEGORY_MAPPING: Record<string, string> = {
  'pagos': 'a09c9b58-4452-45fd-a663-a020998bfaf2', // Pagos y Comisiones
  'gastos': '99d5492d-2379-423c-bf0a-5630b151550a', // Gastos y Reembolsos
  'servicios': '71687f08-3013-4935-873f-9bba64b07dab', // Servicios y Asignaciones
  'gps': 'f0efdd26-9c71-4598-8f2f-64b0257d256f', // Equipamiento GPS
  'cuenta': 'cde41265-92d9-4655-9eaa-57de33139e71', // Cuenta y Perfil
  'otro': '1ad5a0a8-85e1-4379-9675-2f81a28f6bd6', // Soporte General
};

// Tool definition for extracting ticket data
const extractTicketDataTool = {
  type: "function",
  function: {
    name: "extract_ticket_data",
    description: "Extrae los datos del problema del custodio para crear un ticket de soporte formal",
    parameters: {
      type: "object",
      properties: {
        tipo_problema: { 
          type: "string", 
          enum: ["pagos", "gastos", "servicios", "gps", "cuenta", "otro"],
          description: "Categoría del problema detectado"
        },
        folio_servicio: { 
          type: "string", 
          description: "Folio o número de servicio si se proporcionó" 
        },
        fecha_servicio: { 
          type: "string", 
          description: "Fecha del servicio si se mencionó (formato YYYY-MM-DD)" 
        },
        monto_reclamado: { 
          type: "number", 
          description: "Monto en disputa o reclamado si aplica" 
        },
        descripcion_breve: { 
          type: "string", 
          description: "Resumen del problema en máximo 2 oraciones" 
        },
        datos_suficientes: { 
          type: "boolean", 
          description: "true si hay suficiente información para registrar un ticket formal" 
        },
        pregunta_pendiente: { 
          type: "string", 
          description: "Pregunta para obtener más información si falta algo importante" 
        },
        prioridad_sugerida: {
          type: "string",
          enum: ["baja", "media", "alta", "urgente"],
          description: "Prioridad sugerida basada en la urgencia del problema"
        }
      },
      required: ["tipo_problema", "descripcion_breve", "datos_suficientes", "prioridad_sugerida"]
    }
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticket_id, mensaje, custodio_telefono, action } = await req.json();
    console.log('Support chat bot request:', { ticket_id, action, custodio_telefono });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle escalation action
    if (action === 'escalate') {
      console.log('Escalating ticket to human agent:', ticket_id);
      
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ status: 'en_progreso', priority: 'alta' })
        .eq('id', ticket_id);

      if (updateError) throw updateError;

      await supabase.from('ticket_respuestas').insert({
        ticket_id,
        autor_id: '00000000-0000-0000-0000-000000000000',
        autor_tipo: 'sistema',
        autor_nombre: 'Asistente IA',
        mensaje: '📢 He transferido tu conversación a un agente humano. Te contactarán pronto.',
        es_resolucion: false,
        es_interno: false
      });

      return new Response(JSON.stringify({ success: true, escalated: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle close conversation action
    if (action === 'close_conversation') {
      console.log('Closing conversation for ticket:', ticket_id);
      
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ status: 'resuelto' })
        .eq('id', ticket_id);

      if (updateError) throw updateError;

      await supabase.from('ticket_respuestas').insert({
        ticket_id,
        autor_id: '00000000-0000-0000-0000-000000000000',
        autor_tipo: 'sistema',
        autor_nombre: 'Asistente IA',
        mensaje: '✅ Conversación cerrada. Tu ticket ha sido registrado y si necesitas algo más, estaré aquí para ayudarte. ¡Gracias por usar el soporte de Detecta!',
        es_resolucion: true,
        es_interno: false
      });

      return new Response(JSON.stringify({ success: true, closed: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ===== FETCH KNOWLEDGE BASE =====
    console.log('Fetching knowledge base context...');

    // Get KB categories with intents
    const { data: kbCategories } = await supabase
      .from('knowledge_base_categories')
      .select('id, nombre, descripcion, prioridad_default')
      .eq('activo', true);

    // Get KB intents with triggers
    const { data: kbIntents } = await supabase
      .from('knowledge_base_intents')
      .select('id, nombre, descripcion, disparadores, prioridad, sla_minutos, nivel_escalamiento, category_id')
      .eq('activo', true);

    // Get KB templates
    const { data: kbTemplates } = await supabase
      .from('knowledge_base_templates')
      .select('intent_id, nombre, template')
      .eq('activo', true);

    // Get KB glossary
    const { data: kbGlossary } = await supabase
      .from('knowledge_base_glossary')
      .select('termino, definicion')
      .eq('activo', true);

    // Get KB guardrails
    const { data: kbGuardrails } = await supabase
      .from('knowledge_base_guardrails')
      .select('tipo, regla, accion_recomendada')
      .eq('activo', true);

    // Get escalation matrix
    const { data: kbEscalation } = await supabase
      .from('knowledge_base_escalation_matrix')
      .select('nivel, responsable, descripcion, sla_sugerido')
      .eq('activo', true);

    // Detect intent from message
    const messageLower = mensaje.toLowerCase();
    let detectedIntent = null;
    let detectedPriority = 'P3';
    let detectedLevel = 'L1';

    for (const intent of (kbIntents || [])) {
      const triggers = intent.disparadores || [];
      for (const trigger of triggers) {
        if (messageLower.includes(trigger.toLowerCase())) {
          detectedIntent = intent;
          detectedPriority = intent.prioridad;
          detectedLevel = intent.nivel_escalamiento;
          break;
        }
      }
      if (detectedIntent) break;
    }

    console.log('Detected intent:', detectedIntent?.nombre || 'none', 'Priority:', detectedPriority);

    // Get ticket categories and templates
    const { data: categorias } = await supabase
      .from('ticket_categorias_custodio')
      .select('id, nombre, descripcion, sla_horas_respuesta, sla_horas_resolucion');

    const { data: subcategorias } = await supabase
      .from('ticket_subcategorias_custodio')
      .select('id, categoria_id, nombre, descripcion, plantilla_respuesta');

    // Get current ticket info
    let ticketContext = null;
    if (ticket_id) {
      const { data: ticket } = await supabase
        .from('tickets')
        .select(`*, categoria:ticket_categorias_custodio(nombre, descripcion), subcategoria:ticket_subcategorias_custodio(nombre, plantilla_respuesta)`)
        .eq('id', ticket_id)
        .single();
      ticketContext = ticket;
    }

    // Get conversation history
    let conversationHistory: any[] = [];
    if (ticket_id) {
      const { data: respuestas } = await supabase
        .from('ticket_respuestas')
        .select('autor_tipo, autor_nombre, mensaje, created_at')
        .eq('ticket_id', ticket_id)
        .eq('es_interno', false)
        .order('created_at', { ascending: true })
        .limit(20);
      conversationHistory = respuestas || [];
    }

    // Get custodian info
    let custodioInfo = null;
    let serviciosRecientes: any[] = [];
    if (custodio_telefono) {
      const { data: custodio } = await supabase
        .from('custodios_operativos')
        .select('id, nombre_completo, telefono, email, estado, zona_operacion')
        .eq('telefono', custodio_telefono)
        .single();
      custodioInfo = custodio;

      if (custodio) {
        const { data: servicios } = await supabase
          .from('servicios_custodia')
          .select('id, tipo_servicio, origen, destino, fecha_programada, estado')
          .eq('telefono_custodio', custodio_telefono)
          .order('created_at', { ascending: false })
          .limit(5);
        serviciosRecientes = servicios || [];
      }
    }

    // Get training modules
    const { data: modulos } = await supabase
      .from('modulos_capacitacion')
      .select('nombre, descripcion')
      .eq('activo', true)
      .limit(10);

    // Build optimized system prompt (reduced from ~1600 tokens to ~800)
    const systemPrompt = `Eres Sara, asistente de soporte de Detecta Security (custodia y monitoreo GPS en México).

PERSONALIDAD: Amigable, concisa, profesional. Máximo 3-4 oraciones por respuesta.

${detectedIntent ? `INTENT DETECTADO: ${detectedIntent.nombre} (${detectedPriority})
${detectedPriority === 'P0' ? '⚠️ EMERGENCIA: Prioriza seguridad, sugiere 911 si hay riesgo.' : ''}` : ''}

CATEGORÍAS DISPONIBLES:
${(categorias || []).slice(0, 5).map(c => `- ${c.nombre} (SLA: ${c.sla_horas_respuesta}h)`).join('\n')}

${custodioInfo ? `CUSTODIO: ${custodioInfo.nombre_completo || 'Usuario'} - ${custodioInfo.zona_operacion || 'Sin zona'}` : ''}

${ticketContext ? `TICKET #${ticketContext.ticket_number}: ${ticketContext.subject} (${ticketContext.status})` : ''}

TU OBJETIVO:
1. Saluda brevemente si es el primer mensaje
2. Pregunta qué tipo de problema tiene (pagos, servicios, GPS, cuenta, otro)
3. Recopila datos específicos según el tipo:
   - PAGOS: folio del servicio, fecha aproximada, monto
   - SERVICIOS: qué pasó, cuándo, folio si lo tiene
   - GPS/APP: describe el error, modelo de dispositivo
   - CUENTA: qué necesita cambiar/actualizar
4. Cuando tengas suficiente info, usa extract_ticket_data con datos_suficientes=true
5. Si falta info importante, usa datos_suficientes=false con pregunta_pendiente

REGLAS:
- NO inventes datos de pagos, folios o montos
- Si pide "hablar con humano" → ofrece escalar
- Si es emergencia P0 → activa protocolo, sugiere 911
- Siempre confirma el ticket con número y SLA cuando se registre`;

    const messages = [{ role: 'system', content: systemPrompt }];
    for (const resp of conversationHistory) {
      messages.push({ role: resp.autor_tipo === 'custodio' ? 'user' : 'assistant', content: resp.mensaje });
    }
    messages.push({ role: 'user', content: mensaje });

    console.log('Calling Lovable AI Gateway with tool calling...');

    // First call: AI with tool calling to extract data
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 1000,
        tools: [extractTicketDataTool],
        tool_choice: "auto",
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Demasiadas solicitudes, espera un momento.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos insuficientes. Contacta al administrador.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI Response:', JSON.stringify(aiData, null, 2));

    const choice = aiData.choices?.[0];
    let botMessage = choice?.message?.content || '';
    let ticketCreated = false;
    let ticketUpdated = false;
    let suggestClose = false;
    let extractedData: any = null;

    // Check if tool was called
    const toolCalls = choice?.message?.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      const toolCall = toolCalls[0];
      if (toolCall.function?.name === 'extract_ticket_data') {
        try {
          extractedData = JSON.parse(toolCall.function.arguments);
          console.log('Extracted ticket data:', extractedData);

          if (extractedData.datos_suficientes) {
            // Update ticket with formal data
            const categoryId = CATEGORY_MAPPING[extractedData.tipo_problema] || CATEGORY_MAPPING['otro'];
            
            // Build structured description
            let structuredDescription = extractedData.descripcion_breve;
            if (extractedData.folio_servicio) {
              structuredDescription += `\n📋 Folio: ${extractedData.folio_servicio}`;
            }
            if (extractedData.fecha_servicio) {
              structuredDescription += `\n📅 Fecha: ${extractedData.fecha_servicio}`;
            }
            if (extractedData.monto_reclamado) {
              structuredDescription += `\n💰 Monto: $${extractedData.monto_reclamado.toLocaleString('es-MX')}`;
            }

            // Update the ticket
            const { error: updateError } = await supabase
              .from('tickets')
              .update({
                categoria_custodio_id: categoryId,
                priority: extractedData.prioridad_sugerida || 'media',
                description: structuredDescription,
                subject: `${extractedData.tipo_problema.charAt(0).toUpperCase() + extractedData.tipo_problema.slice(1)}: ${extractedData.descripcion_breve.substring(0, 50)}...`
              })
              .eq('id', ticket_id);

            if (updateError) {
              console.error('Error updating ticket:', updateError);
            } else {
              ticketUpdated = true;
              ticketCreated = true;
              suggestClose = true;

              // Get SLA info for category
              const { data: categoryData } = await supabase
                .from('ticket_categorias_custodio')
                .select('nombre, sla_horas_respuesta')
                .eq('id', categoryId)
                .single();

              const slaHours = categoryData?.sla_horas_respuesta || 24;
              const categoryName = categoryData?.nombre || 'Soporte';

              // Generate confirmation message
              botMessage = `✅ He registrado tu ticket formalmente.

📋 **Detalles del ticket #${ticketContext?.ticket_number || 'Pendiente'}:**
• Categoría: ${categoryName}
• Prioridad: ${extractedData.prioridad_sugerida || 'Media'}
• Descripción: ${extractedData.descripcion_breve}
${extractedData.folio_servicio ? `• Folio: ${extractedData.folio_servicio}` : ''}
${extractedData.monto_reclamado ? `• Monto: $${extractedData.monto_reclamado.toLocaleString('es-MX')}` : ''}

⏱️ **SLA:** Un agente revisará tu caso en las próximas ${slaHours} horas.

¿Hay algo más en lo que pueda ayudarte? Si no, puedes cerrar esta conversación.`;
            }
          } else {
            // Need more info - use the pending question
            if (!botMessage && extractedData.pregunta_pendiente) {
              botMessage = extractedData.pregunta_pendiente;
            }
          }
        } catch (parseError) {
          console.error('Error parsing tool call arguments:', parseError);
        }
      }
    }

    // If no message yet, get one from AI
    if (!botMessage) {
      // Make another call without tools to get a conversational response
      const followUpResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages,
          max_tokens: 500,
        }),
      });

      if (followUpResponse.ok) {
        const followUpData = await followUpResponse.json();
        botMessage = followUpData.choices?.[0]?.message?.content || 'Lo siento, no pude procesar tu mensaje. Intenta de nuevo.';
      } else {
        botMessage = 'Lo siento, no pude procesar tu mensaje. Intenta de nuevo.';
      }
    }

    console.log('Bot response:', botMessage.substring(0, 100) + '...');

    // Save bot response
    if (ticket_id) {
      await supabase.from('ticket_respuestas').insert({
        ticket_id,
        autor_id: '00000000-0000-0000-0000-000000000000',
        autor_tipo: 'sistema',
        autor_nombre: 'Sara',
        mensaje: botMessage,
        es_resolucion: false,
        es_interno: false
      });
    }

    // Auto-escalate P0 priorities
    const shouldEscalate = detectedPriority === 'P0' || 
                           botMessage.toLowerCase().includes('agente humano') || 
                           botMessage.toLowerCase().includes('transferir');

    return new Response(JSON.stringify({ 
      success: true, 
      message: botMessage,
      suggestsEscalation: shouldEscalate,
      detectedIntent: detectedIntent?.nombre,
      priority: detectedPriority,
      ticketCreated,
      ticketUpdated,
      suggestClose,
      extractedData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in support-chat-bot:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
