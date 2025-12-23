import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Build comprehensive system prompt with KB
    const systemPrompt = `Eres el asistente de soporte de Detecta Security, empresa de custodia y monitoreo GPS en México.

REGLAS DE SEGURIDAD (OBLIGATORIAS):
${(kbGuardrails || []).map(g => `- [${g.tipo.toUpperCase()}] ${g.regla}: ${g.accion_recomendada}`).join('\n')}

GLOSARIO DETECTA:
${(kbGlossary || []).map(g => `- ${g.termino}: ${g.definicion}`).join('\n')}

MATRIZ DE ESCALAMIENTO:
${(kbEscalation || []).map(e => `- ${e.nivel} (${e.responsable}): ${e.descripcion} - SLA: ${e.sla_sugerido}`).join('\n')}

${detectedIntent ? `
INTENT DETECTADO: ${detectedIntent.nombre}
- Prioridad: ${detectedPriority}
- Nivel escalamiento: ${detectedLevel}
- Descripción: ${detectedIntent.descripcion}
${detectedPriority === 'P0' ? '⚠️ PRIORIDAD CRÍTICA: Activa protocolo de emergencia inmediatamente.' : ''}
` : ''}

PLANTILLAS DE RESPUESTA KB:
${(kbTemplates || []).slice(0, 10).map(t => `- [${t.nombre}]: "${t.template}"`).join('\n')}

CATEGORÍAS DE TICKETS:
${(categorias || []).map(c => `- ${c.nombre}: ${c.descripcion || ''} (SLA: ${c.sla_horas_respuesta}h respuesta, ${c.sla_horas_resolucion}h resolución)`).join('\n')}

MÓDULOS DE CAPACITACIÓN:
${(modulos || []).map(m => `- ${m.nombre}: ${m.descripcion || ''}`).join('\n')}

${custodioInfo ? `
CUSTODIO:
- Nombre: ${custodioInfo.nombre_completo || 'No disponible'}
- Teléfono: ${custodioInfo.telefono}
- Zona: ${custodioInfo.zona_operacion || 'No especificada'}
${serviciosRecientes.length > 0 ? `Servicios recientes:\n${serviciosRecientes.slice(0, 3).map(s => `  • ${s.tipo_servicio || 'Servicio'}: ${s.origen || '?'} → ${s.destino || '?'} (${s.estado})`).join('\n')}` : ''}
` : ''}

${ticketContext ? `
TICKET ACTUAL #${ticketContext.ticket_number}:
- Asunto: ${ticketContext.subject}
- Categoría: ${ticketContext.categoria?.nombre || 'Sin categoría'}
- Estado: ${ticketContext.status}
` : ''}

INSTRUCCIONES:
1. Responde en español, amigable y conciso (máx 4 oraciones)
2. Si es emergencia P0: prioriza seguridad, instruye 911 si hay riesgo de vida, ofrece escalar a C4
3. Para pagos: menciona SLA y pide folio/fecha para verificar
4. Si el custodio pide "hablar con humano" o está frustrado: ofrece escalar
5. Usa el glosario cuando mencionen términos técnicos
6. NO inventes información de pagos, montos o fechas no confirmados`;

    const messages = [{ role: 'system', content: systemPrompt }];
    for (const resp of conversationHistory) {
      messages.push({ role: resp.autor_tipo === 'custodio' ? 'user' : 'assistant', content: resp.mensaje });
    }
    messages.push({ role: 'user', content: mensaje });

    console.log('Calling Lovable AI Gateway with KB context...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 500,
        temperature: 0.7,
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
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const botMessage = aiData.choices?.[0]?.message?.content || 'Lo siento, no pude procesar tu mensaje. Intenta de nuevo.';

    console.log('Bot response:', botMessage.substring(0, 100) + '...');

    // Save bot response
    if (ticket_id) {
      await supabase.from('ticket_respuestas').insert({
        ticket_id,
        autor_id: '00000000-0000-0000-0000-000000000000',
        autor_tipo: 'sistema',
        autor_nombre: 'Asistente IA',
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
      priority: detectedPriority
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
