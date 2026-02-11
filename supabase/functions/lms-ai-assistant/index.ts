import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type AIAction =
  | "generate_course_metadata"
  | "generate_course_structure"
  | "generate_quiz_questions"
  | "generate_flashcards"
  | "generate_rich_text"
  | "generate_image"
  | "generate_learning_objectives"
  | "generate_video_script";

interface AIRequest {
  action: AIAction;
  data: Record<string, unknown>;
}

const SYSTEM_PROMPTS: Record<string, string> = {
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
{"html": "<h2>...</h2><p>...</p>..."}`,

  generate_learning_objectives: `Eres un experto en diseño instruccional con conocimiento profundo de la taxonomía de Bloom.
Genera objetivos de aprendizaje claros, medibles y alineados con el contenido del módulo.
Cada objetivo debe comenzar con un verbo de acción de la taxonomía de Bloom (Conocer, Comprender, Aplicar, Analizar, Evaluar, Crear).
Los objetivos deben ser específicos al contexto de empresas de seguridad y custodia vehicular.

Responde SOLO en formato JSON válido:
{
  "objetivos": [
    "Al finalizar este módulo, el participante será capaz de..."
  ]
}`,

  generate_video_script: `Eres un experto en producción de contenido educativo audiovisual para empresas de seguridad.
Genera un guión de video estructurado y profesional con:
1. Introducción (gancho + presentación del tema)
2. Desarrollo (puntos clave con ejemplos prácticos)
3. Cierre (resumen + llamado a la acción)

También genera un prompt optimizado para herramientas de IA de generación de video (como Synthesia, HeyGen, Runway) que pueda usarse para crear el video.

Responde SOLO en formato JSON válido:
{
  "script": {
    "introduccion": "...",
    "puntos_clave": ["...", "..."],
    "ejemplos": ["...", "..."],
    "cierre": "..."
  },
  "prompt_externo": "...",
  "duracion_estimada_min": N,
  "notas_produccion": "..."
}`,
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
    
    console.log(`[lms-ai-assistant] Action: ${action}`, data);

    // Handle image generation separately (uses different model)
    if (action === "generate_image") {
      const imagePrompt = `Genera una imagen profesional para la portada de un curso de capacitación empresarial.
Título del curso: "${data.titulo}"
${data.descripcion ? `Descripción: "${data.descripcion}"` : ''}

La imagen debe ser:
- Profesional y corporativa
- Relacionada con seguridad, custodia vehicular o capacitación empresarial
- Estilo moderno y limpio
- Colores sobrios (azules, grises, blancos)
- Sin texto superpuesto
- Aspecto 16:9 horizontal`;

      const imageController = new AbortController();
      const imageTimeoutId = setTimeout(() => imageController.abort(), 25000);

      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [{ role: "user", content: imagePrompt }],
          modalities: ["image", "text"]
        }),
        signal: imageController.signal
      });
      clearTimeout(imageTimeoutId);

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        console.error("[lms-ai-assistant] Image generation error:", imageResponse.status, errorText);
        
        if (imageResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: "Límite de solicitudes excedido. Intenta de nuevo en unos segundos." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (imageResponse.status === 402) {
          return new Response(
            JSON.stringify({ error: "Créditos de IA agotados. Contacta al administrador." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error(`Image generation error: ${imageResponse.status}`);
      }

      const imageData = await imageResponse.json();
      const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageUrl) {
        console.error("[lms-ai-assistant] No image in response:", imageData);
        throw new Error("No image generated");
      }

      console.log("[lms-ai-assistant] Image generated successfully");

      return new Response(
        JSON.stringify({ success: true, data: { imageBase64: imageUrl } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For text-based actions
    if (!SYSTEM_PROMPTS[action]) {
      throw new Error(`Invalid action: ${action}`);
    }

    // Build user prompt based on action
    let userPrompt = "";
    switch (action) {
      case "generate_course_metadata":
        userPrompt = `Título del curso: "${data.titulo}"`;
        break;
      case "generate_course_structure":
        userPrompt = `Tema: "${data.tema}"\nDuración total estimada: ${data.duracion_min} minutos\nNúmero de módulos sugeridos: ${data.num_modulos || 3}\nEnfoque instruccional: "${data.enfoque || 'General'}"`;
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
      case "generate_learning_objectives":
        userPrompt = `Módulo: "${data.modulo_titulo}"\nCurso: "${data.curso_titulo || ''}"\nContenidos del módulo: ${JSON.stringify(data.contenidos || [])}\nNúmero de objetivos: ${data.cantidad || 4}`;
        break;
      case "generate_video_script":
        userPrompt = `Tema del video: "${data.tema}"\nContexto del módulo: "${data.modulo_titulo || ''}"\nCurso: "${data.curso_titulo || ''}"\nDuración objetivo: ${data.duracion_min || 5} minutos\nAudiencia objetivo: ${data.audiencia || 'Personal operativo de seguridad y custodia vehicular'}`;
        break;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPTS[action] },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

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
    
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(
        JSON.stringify({ error: "La solicitud tardó demasiado. Intenta de nuevo." }),
        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
