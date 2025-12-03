import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const systemPrompt = `Eres un especialista en OCR de documentos mexicanos oficiales.
Extrae los datos estructurados del documento proporcionado en la imagen.

TIPOS DE DOCUMENTOS Y CAMPOS A EXTRAER:

Para INE (Credencial de Elector):
- nombre_completo: Nombre completo del titular
- apellido_paterno: Apellido paterno
- apellido_materno: Apellido materno
- clave_elector: Clave de elector (18 caracteres)
- curp: CURP (18 caracteres)
- fecha_nacimiento: Fecha de nacimiento (formato YYYY-MM-DD)
- sexo: M o F
- domicilio: Dirección completa
- seccion: Sección electoral
- vigencia: Año de vigencia
- estado_emisor: Estado que emitió el documento

Para Licencia de Conducir:
- nombre_completo: Nombre completo
- numero_licencia: Número de licencia
- tipo_licencia: Tipo (A, B, C, D, E)
- fecha_expedicion: Fecha de expedición
- fecha_vencimiento: Fecha de vencimiento
- restricciones: Restricciones si las hay
- estado_emisor: Estado emisor
- tipo_sangre: Tipo de sangre

Para CURP:
- curp: CURP completo (18 caracteres)
- nombre_completo: Nombre completo
- fecha_nacimiento: Fecha de nacimiento
- sexo: M o F
- estado_nacimiento: Estado de nacimiento

Para Comprobante de Domicilio:
- nombre_titular: Nombre del titular del servicio
- direccion_completa: Dirección completa
- colonia: Colonia
- codigo_postal: Código postal
- municipio: Municipio o alcaldía
- estado: Estado
- tipo_servicio: CFE, Telmex, Agua, Gas, etc.
- fecha_emision: Fecha de emisión del comprobante
- periodo_facturado: Periodo que cubre el comprobante

Para RFC:
- rfc: RFC completo (13 caracteres persona física)
- nombre_completo: Nombre o razón social
- regimen_fiscal: Régimen fiscal
- fecha_inicio_operaciones: Fecha de inicio

Para Carta de Antecedentes No Penales:
- nombre_completo: Nombre del solicitante
- folio: Número de folio
- fecha_expedicion: Fecha de expedición
- resultado: "SIN ANTECEDENTES" o descripción
- autoridad_emisora: Autoridad que emite

INSTRUCCIONES:
1. Analiza la imagen cuidadosamente
2. Extrae SOLO los campos visibles en el documento
3. Si un campo no es legible, usa null
4. Asegura que CURP y RFC tengan el formato correcto
5. Las fechas deben estar en formato YYYY-MM-DD
6. Calcula una confianza general del 0-100 basada en la legibilidad

Responde ÚNICAMENTE con un JSON válido con esta estructura:
{
  "tipo_documento_detectado": "ine|licencia|curp|comprobante_domicilio|rfc|carta_antecedentes",
  "datos_extraidos": { ... campos según tipo ... },
  "confianza": 0-100,
  "observaciones": "notas sobre legibilidad o problemas detectados"
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documento_id, imagen_url } = await req.json();
    
    console.log(`[OCR] Procesando documento: ${documento_id}`);
    console.log(`[OCR] URL de imagen: ${imagen_url}`);

    if (!documento_id || !imagen_url) {
      throw new Error('documento_id e imagen_url son requeridos');
    }

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no configurada');
    }

    // Crear cliente Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Actualizar estado a procesando
    await supabase
      .from('documentos_candidato')
      .update({ estado_validacion: 'procesando' })
      .eq('id', documento_id);

    // Llamar a Lovable AI con visión
    console.log('[OCR] Llamando a Lovable AI Vision...');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analiza este documento mexicano y extrae los datos estructurados:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imagen_url
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[OCR] Error de AI:', errorText);
      throw new Error(`Error de AI: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';
    
    console.log('[OCR] Respuesta AI:', aiContent);

    // Parsear respuesta JSON
    let ocrResult;
    try {
      // Limpiar markdown si viene envuelto
      let jsonStr = aiContent;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      ocrResult = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('[OCR] Error parseando JSON:', parseError);
      ocrResult = {
        tipo_documento_detectado: 'desconocido',
        datos_extraidos: {},
        confianza: 0,
        observaciones: 'Error al procesar la respuesta del OCR'
      };
    }

    // Extraer nombre para comparación
    const nombreExtraido = ocrResult.datos_extraidos?.nombre_completo || 
                          `${ocrResult.datos_extraidos?.nombre || ''} ${ocrResult.datos_extraidos?.apellido_paterno || ''} ${ocrResult.datos_extraidos?.apellido_materno || ''}`.trim() ||
                          ocrResult.datos_extraidos?.nombre_titular || null;

    // Determinar estado de validación basado en confianza
    let estadoValidacion = 'requiere_revision';
    if (ocrResult.confianza >= 80) {
      estadoValidacion = 'valido';
    } else if (ocrResult.confianza < 50) {
      estadoValidacion = 'invalido';
    }

    // Extraer fechas de vigencia si existen
    const fechaEmision = ocrResult.datos_extraidos?.fecha_expedicion || 
                        ocrResult.datos_extraidos?.fecha_emision || null;
    const fechaVencimiento = ocrResult.datos_extraidos?.fecha_vencimiento || 
                            ocrResult.datos_extraidos?.vigencia ? `${ocrResult.datos_extraidos.vigencia}-12-31` : null;

    // Verificar si documento está vigente
    let documentoVigente = null;
    if (fechaVencimiento) {
      const hoy = new Date();
      const vencimiento = new Date(fechaVencimiento);
      documentoVigente = vencimiento > hoy;
    }

    // Actualizar documento con resultados OCR
    const { error: updateError } = await supabase
      .from('documentos_candidato')
      .update({
        ocr_procesado: true,
        ocr_datos_extraidos: ocrResult.datos_extraidos,
        ocr_confianza: ocrResult.confianza,
        ocr_fecha_proceso: new Date().toISOString(),
        ocr_error: ocrResult.confianza < 50 ? ocrResult.observaciones : null,
        estado_validacion: estadoValidacion,
        nombre_extraido: nombreExtraido,
        fecha_emision: fechaEmision,
        fecha_vencimiento: fechaVencimiento,
        documento_vigente: documentoVigente,
        updated_at: new Date().toISOString()
      })
      .eq('id', documento_id);

    if (updateError) {
      console.error('[OCR] Error actualizando documento:', updateError);
      throw updateError;
    }

    console.log(`[OCR] Documento ${documento_id} procesado con éxito. Confianza: ${ocrResult.confianza}%`);

    return new Response(JSON.stringify({
      success: true,
      documento_id,
      resultado: {
        tipo_detectado: ocrResult.tipo_documento_detectado,
        confianza: ocrResult.confianza,
        estado: estadoValidacion,
        datos_extraidos: ocrResult.datos_extraidos,
        observaciones: ocrResult.observaciones
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[OCR] Error:', error);
    
    // Si tenemos documento_id, actualizar con error
    try {
      const { documento_id } = await req.json().catch(() => ({}));
      if (documento_id) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase
          .from('documentos_candidato')
          .update({
            estado_validacion: 'invalido',
            ocr_error: error.message,
            ocr_procesado: true,
            ocr_fecha_proceso: new Date().toISOString()
          })
          .eq('id', documento_id);
      }
    } catch (e) {
      console.error('[OCR] Error actualizando estado de error:', e);
    }

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
