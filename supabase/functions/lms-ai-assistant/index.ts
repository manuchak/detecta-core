import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AIRequest {
  action: "generate_course_metadata" | "generate_course_structure" | "generate_quiz_questions" | "generate_flashcards" | "generate_rich_text";
  data: Record<string, unknown>;
}

const SYSTEM_PROMPTS = {
  generate_course_metadata: `Eres un experto en diseño instruccional para empresas de seguridad y custodia vehicular.
Dado un título de curso, genera:
1. Un código corto (formato: XXX-YYY-NNN, ej: SEG-CUST-001)
2. Una descripción atractiva de 2-3 oraciones
3. La categoría más apropiada (onboarding, compliance, operativo, seguridad, tecnologia, habilidades_blandas)
4. El nivel sugerido (basico, intermedio, avanzado)

Responde SOLO en formato JSON válido:
{"codigo": "...", "descripcion": "...", "categoria": "...", "nivel": "..."}`,

  generate_course_structure: `Eres un experto en diseño instruccional para empresas de seguridad y custodia vehicular.
Dado un tema y duración estimada, genera una estructura de módulos con contenidos sugeridos.
Cada módulo debe tener contenidos variados: texto_enriquecido, video, documento, quiz, interactivo.

Responde SOLO en formato JSON válido:
{
  "modulos": [
    {
      "titulo": "...",
      "descripcion": "...",
      "contenidos": [
        {"titulo": "...", "tipo": "texto_enriquecido|video|documento|quiz|interactivo", "duracion_min": N}
      ]
    }
  ]
}`,

  generate_quiz_questions: `Eres un experto en evaluaciones de aprendizaje para empresas de seguridad.
Genera preguntas de opción múltiple claras y relevantes.
Tipos: "single" (una respuesta correcta) o "multiple" (varias correctas).

Responde SOLO en formato JSON válido:
{
  "questions": [
    {
      "question": "...",
      "type": "single|multiple",
      "options": [
        {"id": "a", "text": "...", "isCorrect": true|false}
      ],
      "explanation": "..."
    }
  ]
}`,

  generate_flashcards: `Eres un experto en técnicas de aprendizaje para empresas de seguridad.
Genera flashcards con frente (concepto breve) y reverso (explicación concisa).
Usa emojis cuando sea apropiado para hacer el contenido más visual.

Responde SOLO en formato JSON válido:
{
  "cards": [
    {"front": "...", "back": "..."}
  ]
}`,

  generate_rich_text: `Eres un redactor experto en contenido educativo para empresas de seguridad.
Genera contenido HTML bien estructurado con encabezados, párrafos, listas y énfasis.
El contenido debe ser claro, profesional y orientado al aprendizaje.

Responde SOLO en formato JSON válido:
{"html": "<h2>...</h2><p>...</p>..."}`
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { action, data } = await req.json() as AIRequest;
    
    if (!action || !SYSTEM_PROMPTS[action]) {
      throw new Error(`Invalid action: ${action}`);
    }

    console.log(`[lms-ai-assistant] Action: ${action}`, data);

    // Build user prompt based on action
    let userPrompt = "";
    switch (action) {
      case "generate_course_metadata":
        userPrompt = `Título del curso: "${data.titulo}"`;
        break;
      case "generate_course_structure":
        userPrompt = `Tema: "${data.tema}"\nDuración total estimada: ${data.duracion_min} minutos\nNúmero de módulos sugeridos: ${data.num_modulos || 3}`;
        break;
      case "generate_quiz_questions":
        userPrompt = `Tema: "${data.tema}"\nContexto del módulo: "${data.contexto || ''}"\nNúmero de preguntas: ${data.cantidad || 5}`;
        break;
      case "generate_flashcards":
        userPrompt = `Tema: "${data.tema}"\nContexto: "${data.contexto || ''}"\nNúmero de tarjetas: ${data.cantidad || 6}`;
        break;
      case "generate_rich_text":
        userPrompt = `Tema: "${data.tema}"\nContexto del módulo: "${data.contexto || ''}"\nExtensión aproximada: ${data.longitud || 'media'} (corta: 1 párrafo, media: 2-3 párrafos, larga: 4+ párrafos)`;
        break;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPTS[action] },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[lms-ai-assistant] AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido. Intenta de nuevo en unos segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA agotados. Contacta al administrador." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from AI");
    }

    console.log("[lms-ai-assistant] AI response received");

    // Parse JSON from response (handle markdown code blocks)
    let parsedContent;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      parsedContent = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("[lms-ai-assistant] Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    return new Response(
      JSON.stringify({ success: true, data: parsedContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[lms-ai-assistant] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
