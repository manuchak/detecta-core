import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CIUDADES_MX: Record<string, { lat: number; lng: number; estado: string }> = {
  'cdmx': { lat: 19.4326, lng: -99.1332, estado: 'Ciudad de México' },
  'mexico': { lat: 19.4326, lng: -99.1332, estado: 'Ciudad de México' },
  'guadalajara': { lat: 20.6597, lng: -103.3496, estado: 'Jalisco' },
  'monterrey': { lat: 25.6866, lng: -100.3161, estado: 'Nuevo León' },
  'puebla': { lat: 19.0414, lng: -98.2063, estado: 'Puebla' },
  'queretaro': { lat: 20.5888, lng: -100.3899, estado: 'Querétaro' },
  'toluca': { lat: 19.2826, lng: -99.6557, estado: 'Estado de México' },
  'leon': { lat: 21.1219, lng: -101.6827, estado: 'Guanajuato' },
  'tijuana': { lat: 32.5149, lng: -117.0382, estado: 'Baja California' },
  'aguascalientes': { lat: 21.8853, lng: -102.2916, estado: 'Aguascalientes' },
  'ecatepec': { lat: 19.6014, lng: -99.0602, estado: 'Estado de México' },
  'veracruz': { lat: 19.1738, lng: -96.1342, estado: 'Veracruz' },
  'pachuca': { lat: 20.1011, lng: -98.7624, estado: 'Hidalgo' },
  'morelia': { lat: 19.7060, lng: -101.1949, estado: 'Michoacán' },
  'chihuahua': { lat: 28.6353, lng: -106.0889, estado: 'Chihuahua' },
};

const CARRETERAS_MX = [
  'México-Querétaro', 'México-Puebla', 'México-Cuernavaca',
  'México-Toluca', 'Guadalajara-Colima', 'Monterrey-Saltillo',
  'Puebla-Veracruz', 'Querétaro-León', 'México-Pachuca', 'Arco Norte'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { incidente_id } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: incidente, error: fetchError } = await supabase
      .from('incidentes_rrss')
      .select('*')
      .eq('id', incidente_id)
      .single();

    if (fetchError || !incidente) {
      throw new Error('Incidente no encontrado');
    }

    console.log(`🔍 Procesando incidente ${incidente_id}...`);

    const aiAnalysis = await analyzeIncidentWithAI(incidente.texto_original);
    console.log('🤖 Análisis AI completado:', aiAnalysis.tipo_incidente);

    let coordenadas = null;
    let geocodingMetodo = null;
    let confianza = 0;
    let estado = null;
    let municipio = null;
    let carretera = null;

    if (aiAnalysis.ubicacion_detectada) {
      const ubicacionNormalizada = normalizarTexto(aiAnalysis.ubicacion_detectada);
      const ciudadEncontrada = buscarEnDiccionario(ubicacionNormalizada);
      
      if (ciudadEncontrada) {
        coordenadas = {
          lat: ciudadEncontrada.lat,
          lng: ciudadEncontrada.lng
        };
        estado = ciudadEncontrada.estado;
        geocodingMetodo = 'diccionario';
        confianza = 85;
        console.log(`📍 Ubicación encontrada en diccionario: ${estado}`);
      } else {
        console.log('🗺️ Buscando en Mapbox...');
        const mapboxResult = await geocodeWithMapbox(aiAnalysis.ubicacion_detectada);
        
        if (mapboxResult) {
          coordenadas = { lat: mapboxResult.lat, lng: mapboxResult.lng };
          estado = mapboxResult.estado;
          municipio = mapboxResult.municipio;
          geocodingMetodo = 'mapbox';
          confianza = mapboxResult.confidence;
          console.log(`📍 Geocoded con Mapbox: ${estado}, ${municipio}`);
        }
      }

      carretera = extraerCarretera(incidente.texto_original);
    }

    const { error: updateError } = await supabase
      .from('incidentes_rrss')
      .update({
        ubicacion_texto_original: aiAnalysis.ubicacion_detectada,
        ubicacion_normalizada: aiAnalysis.ubicacion_normalizada,
        estado,
        municipio,
        carretera,
        coordenadas_lat: coordenadas?.lat,
        coordenadas_lng: coordenadas?.lng,
        geocoding_metodo: geocodingMetodo,
        geocoding_confianza: confianza,
        tipo_incidente: aiAnalysis.tipo_incidente,
        subtipo: aiAnalysis.subtipo,
        severidad: aiAnalysis.severidad,
        keywords_detectados: aiAnalysis.keywords,
        confianza_clasificacion: aiAnalysis.confianza,
        sentimiento: aiAnalysis.sentimiento,
        resumen_ai: aiAnalysis.resumen,
        entidades_mencionadas: aiAnalysis.entidades,
        tipo_carga_mencionada: aiAnalysis.tipo_carga,
        monto_perdida_estimado: aiAnalysis.monto_perdida,
        empresa_afectada: aiAnalysis.empresa,
        num_victimas: aiAnalysis.num_victimas,
        armas_mencionadas: aiAnalysis.armas_mencionadas,
        grupo_delictivo_atribuido: aiAnalysis.grupo_delictivo,
        procesado: true,
        procesado_at: new Date().toISOString()
      })
      .eq('id', incidente_id);

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Incidente ${incidente_id} procesado exitosamente`);

    return new Response(
      JSON.stringify({ 
        success: true,
        incidente_id,
        tipo_incidente: aiAnalysis.tipo_incidente,
        ubicacion: estado,
        geocoding: geocodingMetodo
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error procesando:', error);
    
    const { incidente_id } = await req.json().catch(() => ({}));
    if (incidente_id) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      await supabase
        .from('incidentes_rrss')
        .update({
          error_procesamiento: error.message,
          procesado_at: new Date().toISOString()
        })
        .eq('id', incidente_id);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function analyzeIncidentWithAI(texto: string) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  const systemPrompt = 'Eres un analista de inteligencia especializado en incidentes de seguridad que afectan al transporte de carga en México. Extrae información estructurada de posts de redes sociales.';

  const userPrompt = `Analiza este post sobre un posible incidente de transporte de carga:

"${texto}"

Extrae información estructurada siguiendo estas reglas:

1. **Ubicación**: Identifica CUALQUIER mención de ubicación (ciudad, estado, carretera, kilómetro, colonia)
2. **Tipo de incidente**: Clasifica como uno de estos:
   - robo_carga: Robo de mercancía del tráiler/camión
   - robo_unidad: Robo del tractocamión completo
   - robo_combustible: Ordeña o robo de diésel/gasolina
   - robo_autopartes: Robo de piezas del vehículo
   - asalto_transporte: Intento de asalto a transporte
   - bloqueo_carretera: Bloqueos que afectan circulación
   - accidente_trailer: Accidentes de tráiler/camión
   - secuestro_operador: Secuestro o retención del operador/chofer
   - extorsion: Cobro de piso o extorsión
   - vandalismo_unidad: Daño intencional a vehículo
   - otro: Otro tipo de incidente
   - sin_clasificar: No se puede determinar

3. **Severidad**: 
   - critica: Víctimas mortales, uso de armas de alto calibre, pérdidas >$1M MXN
   - alta: Heridos graves, uso de armas, pérdidas >$500K MXN
   - media: Amenazas, pérdidas moderadas <$500K
   - baja: Sin violencia, pérdidas menores

4. **Keywords**: Extrae palabras clave relevantes (max 10)
5. **Entidades**: Grupos delictivos, autoridades mencionadas
6. **Datos específicos**: Tipo de carga, monto estimado, empresa, víctimas`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        tools: [{
          type: "function",
          function: {
            name: "clasificar_incidente_transporte",
            description: "Extrae y clasifica información de incidentes de transporte de carga",
            parameters: {
              type: "object",
              properties: {
                ubicacion_detectada: { type: "string", description: "Ubicación mencionada (texto original)" },
                ubicacion_normalizada: { type: "string", description: "Ciudad o estado normalizado" },
                tipo_incidente: {
                  type: "string",
                  enum: [
                    "robo_carga", "robo_unidad", "robo_combustible", "robo_autopartes",
                    "asalto_transporte", "bloqueo_carretera", "accidente_trailer",
                    "secuestro_operador", "extorsion", "vandalismo_unidad", "otro", "sin_clasificar"
                  ]
                },
                subtipo: { type: "string", description: "Subtipo específico del incidente" },
                severidad: { type: "string", enum: ["baja", "media", "alta", "critica"] },
                keywords: { type: "array", items: { type: "string" } },
                confianza: { type: "integer", description: "Confianza de clasificación 0-100" },
                sentimiento: { type: "string", enum: ["negativo", "neutro", "positivo"] },
                resumen: { type: "string", description: "Resumen breve (max 150 palabras)" },
                entidades: {
                  type: "object",
                  properties: {
                    grupos_delictivos: { type: "array", items: { type: "string" } },
                    autoridades: { type: "array", items: { type: "string" } }
                  }
                },
                tipo_carga: { type: "string", description: "Tipo de carga mencionada" },
                monto_perdida: { type: "number", description: "Monto estimado de pérdida en MXN" },
                empresa: { type: "string", description: "Empresa afectada si se menciona" },
                num_victimas: { type: "integer", description: "Número de víctimas" },
                armas_mencionadas: { type: "boolean" },
                grupo_delictivo: { type: "string", description: "Grupo delictivo atribuido" }
              },
              required: ["tipo_incidente", "severidad", "keywords", "confianza", "resumen"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "clasificar_incidente_transporte" } }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Lovable AI error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0].message.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No se recibió tool call de AI');
    }

    return JSON.parse(toolCall.function.arguments);
    
  } catch (error) {
    console.error('Error en análisis AI:', error);
    return clasificarPorKeywords(texto);
  }
}

async function geocodeWithMapbox(ubicacion: string) {
  const MAPBOX_TOKEN = Deno.env.get('MAPBOX_ACCESS_TOKEN');
  if (!MAPBOX_TOKEN) {
    console.warn('MAPBOX_ACCESS_TOKEN no disponible');
    return null;
  }

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(ubicacion)}.json?country=MX&access_token=${MAPBOX_TOKEN}&language=es&types=place,region,locality`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.features || data.features.length === 0) return null;
    
    const feature = data.features[0];
    const [lng, lat] = feature.center;
    
    const regionContext = feature.context?.find((c: any) => c.id.startsWith('region'));
    const placeContext = feature.context?.find((c: any) => c.id.startsWith('place'));
    
    return {
      lat,
      lng,
      estado: regionContext?.text || null,
      municipio: placeContext?.text || feature.text,
      confidence: Math.round((feature.relevance || 0.5) * 100)
    };
  } catch (error) {
    console.error('Error en Mapbox geocoding:', error);
    return null;
  }
}

function buscarEnDiccionario(texto: string) {
  for (const [key, data] of Object.entries(CIUDADES_MX)) {
    if (texto.includes(key) || texto.includes(data.estado.toLowerCase())) {
      return data;
    }
  }
  return null;
}

function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '');
}

function extraerCarretera(texto: string): string | null {
  const textoNorm = texto.toLowerCase();
  for (const carretera of CARRETERAS_MX) {
    if (textoNorm.includes(carretera.toLowerCase())) {
      const kmMatch = texto.match(/km\.?\s*(\d+)/i);
      return kmMatch ? `${carretera} KM ${kmMatch[1]}` : carretera;
    }
  }
  return null;
}

function clasificarPorKeywords(texto: string) {
  const textoLower = texto.toLowerCase();
  
  let tipo = 'sin_clasificar';
  if (textoLower.match(/robo.*carga|roban.*mercanc[ií]a/)) tipo = 'robo_carga';
  else if (textoLower.match(/robo.*tr[aá]iler|robo.*cami[oó]n/)) tipo = 'robo_unidad';
  else if (textoLower.match(/robo.*combustible|orde[ñn]a/)) tipo = 'robo_combustible';
  else if (textoLower.match(/bloqueo|bloquean.*carretera/)) tipo = 'bloqueo_carretera';
  else if (textoLower.match(/asalto|asaltan/)) tipo = 'asalto_transporte';
  else if (textoLower.match(/accidente.*tr[aá]iler|volcadura/)) tipo = 'accidente_trailer';
  else if (textoLower.match(/secuestro.*chofer|secuestro.*operador/)) tipo = 'secuestro_operador';
  
  const severidad = textoLower.match(/muerto|fallecido|asesinado/) ? 'critica' : 'media';
  
  return {
    ubicacion_detectada: null,
    ubicacion_normalizada: null,
    tipo_incidente: tipo,
    subtipo: null,
    severidad,
    keywords: [],
    confianza: 50,
    sentimiento: 'negativo',
    resumen: 'Clasificación automática por keywords (AI no disponible)',
    entidades: {},
    tipo_carga: null,
    monto_perdida: null,
    empresa: null,
    num_victimas: null,
    armas_mencionadas: textoLower.includes('arma') || textoLower.includes('pistola'),
    grupo_delictivo: null
  };
}
