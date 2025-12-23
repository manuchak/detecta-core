import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
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
        .update({ 
          status: 'en_progreso',
          priority: 'alta'
        })
        .eq('id', ticket_id);

      if (updateError) {
        console.error('Error escalating ticket:', updateError);
        throw updateError;
      }

      // Add system message about escalation
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

    // Fetch knowledge base context
    console.log('Fetching knowledge base context...');

    // 1. Get ticket categories and subcategories with templates
    const { data: categorias } = await supabase
      .from('ticket_categorias_custodio')
      .select('id, nombre, descripcion, sla_horas_respuesta, sla_horas_resolucion');

    const { data: subcategorias } = await supabase
      .from('ticket_subcategorias_custodio')
      .select('id, categoria_id, nombre, descripcion, plantilla_respuesta');

    // 2. Get current ticket info if exists
    let ticketContext = null;
    if (ticket_id) {
      const { data: ticket } = await supabase
        .from('tickets')
        .select(`
          *,
          categoria:ticket_categorias_custodio(nombre, descripcion),
          subcategoria:ticket_subcategorias_custodio(nombre, plantilla_respuesta)
        `)
        .eq('id', ticket_id)
        .single();
      ticketContext = ticket;
    }

    // 3. Get ticket history for this conversation
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

    // 4. Get custodian info and recent services
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

    // 5. Get training modules for reference
    const { data: modulos } = await supabase
      .from('modulos_capacitacion')
      .select('nombre, descripcion')
      .eq('activo', true)
      .limit(10);

    // Build comprehensive system prompt
    const systemPrompt = `Eres el asistente de soporte de Detecta, una empresa de custodia y monitoreo GPS. Tu rol es:
- Ayudar a los custodios con dudas sobre sus servicios, pagos, equipos GPS, y procesos
- Responder de forma amigable, profesional y concisa en español
- Usar las plantillas de respuesta cuando apliquen
- Escalar a un agente humano cuando el tema sea muy complejo o el custodio lo solicite

CATEGORÍAS DE SOPORTE DISPONIBLES:
${(categorias || []).map(c => `- ${c.nombre}: ${c.descripcion || 'Sin descripción'} (Respuesta SLA: ${c.sla_horas_respuesta}h, Resolución: ${c.sla_horas_resolucion}h)`).join('\n')}

RESPUESTAS MODELO (usa estas como base cuando apliquen):
${(subcategorias || []).filter(s => s.plantilla_respuesta).map(s => `- [${s.nombre}]: "${s.plantilla_respuesta}"`).join('\n')}

MÓDULOS DE CAPACITACIÓN (puedes referenciar):
${(modulos || []).map(m => `- ${m.nombre}: ${m.descripcion || ''}`).join('\n')}

${custodioInfo ? `
CONTEXTO DEL CUSTODIO:
- Nombre: ${custodioInfo.nombre_completo || 'No disponible'}
- Teléfono: ${custodioInfo.telefono}
- Estado: ${custodioInfo.estado || 'Activo'}
- Zona: ${custodioInfo.zona_operacion || 'No especificada'}
${serviciosRecientes.length > 0 ? `
Servicios recientes:
${serviciosRecientes.slice(0, 3).map(s => `  • ${s.tipo_servicio || 'Servicio'} - ${s.origen || '?'} → ${s.destino || '?'} (${s.estado})`).join('\n')}
` : ''}
` : ''}

${ticketContext ? `
TICKET ACTUAL:
- Número: ${ticketContext.ticket_number}
- Asunto: ${ticketContext.subject}
- Descripción: ${ticketContext.description || 'Sin descripción'}
- Categoría: ${ticketContext.categoria?.nombre || 'Sin categoría'}
- Estado: ${ticketContext.status}
${ticketContext.monto_reclamado ? `- Monto reclamado: $${ticketContext.monto_reclamado} MXN` : ''}
` : ''}

INSTRUCCIONES:
1. Responde siempre en español de forma amigable y profesional
2. Si el tema es sobre pagos/finanzas, menciona los tiempos de SLA
3. Si necesitas documentos adicionales, especifica cuáles
4. Si el custodio menciona "hablar con humano", "agente", "persona real" o parece muy frustrado, sugiere amablemente escalar a un agente humano
5. Mantén las respuestas concisas (máximo 3-4 oraciones)
6. Si usas información de las plantillas, adáptala al contexto específico

IMPORTANTE: No inventes información sobre pagos específicos, fechas o montos que no tengas confirmados.`;

    // Build messages array with conversation history
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history
    for (const resp of conversationHistory) {
      const role = resp.autor_tipo === 'custodio' ? 'user' : 'assistant';
      messages.push({ role, content: resp.mensaje });
    }

    // Add current message
    messages.push({ role: 'user', content: mensaje });

    console.log('Calling Lovable AI Gateway...');

    // Call Lovable AI Gateway
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
        return new Response(JSON.stringify({ error: 'Demasiadas solicitudes, por favor espera un momento.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Servicio de IA no disponible temporalmente.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const botMessage = aiData.choices?.[0]?.message?.content || 'Lo siento, no pude procesar tu mensaje. Por favor intenta de nuevo.';

    console.log('Bot response generated:', botMessage.substring(0, 100) + '...');

    // Save bot response to database
    if (ticket_id) {
      const { error: insertError } = await supabase
        .from('ticket_respuestas')
        .insert({
          ticket_id,
          autor_id: '00000000-0000-0000-0000-000000000000',
          autor_tipo: 'sistema',
          autor_nombre: 'Asistente IA',
          mensaje: botMessage,
          es_resolucion: false,
          es_interno: false
        });

      if (insertError) {
        console.error('Error saving bot response:', insertError);
      }
    }

    // Check if bot suggests escalation
    const shouldEscalate = botMessage.toLowerCase().includes('agente humano') || 
                           botMessage.toLowerCase().includes('transferir') ||
                           botMessage.toLowerCase().includes('escalar');

    return new Response(JSON.stringify({ 
      success: true, 
      message: botMessage,
      suggestsEscalation: shouldEscalate
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
