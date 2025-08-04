import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GPSDeviceData {
  modelo: string;
  marca: string;
  descripcion: string;
  especificaciones: any;
  caracteristicas: string[];
  precio_estimado?: number;
  aplicaciones: string[];
  dimensiones?: string;
  peso?: string;
  temperatura_operacion?: string;
  voltaje_operacion?: string;
  frecuencias?: string[];
  sensores?: string[];
  conectividad?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { searchQuery } = await req.json()
    
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY')
    if (!perplexityApiKey) {
      throw new Error('PERPLEXITY_API_KEY not found in environment variables')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Realizar búsqueda con Perplexity
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: `Eres un experto en dispositivos GPS tracking. Proporciona información técnica detallada y precisa sobre dispositivos GPS para rastreo vehicular y personal. Responde siempre en formato JSON estructurado.`
          },
          {
            role: 'user',
            content: `
Busca información detallada sobre dispositivos GPS tracking, especialmente el modelo "${searchQuery}" y otros modelos similares populares. 

Para cada dispositivo encontrado, proporciona la siguiente información en formato JSON:
{
  "devices": [
    {
      "modelo": "nombre del modelo exacto",
      "marca": "fabricante/marca",
      "descripcion": "descripción técnica del dispositivo",
      "especificaciones": {
        "gps": "tipo de GPS (GPS, A-GPS, GLONASS, etc.)",
        "gsm": "bandas GSM soportadas",
        "bateria": "información de batería",
        "memoria": "capacidad de memoria/almacenamiento",
        "precision": "precisión del GPS",
        "tiempo_posicionamiento": "tiempo para obtener posición"
      },
      "caracteristicas": ["lista", "de", "características", "principales"],
      "precio_estimado": precio_en_usd_si_disponible,
      "aplicaciones": ["rastreo_vehicular", "rastreo_personal", "etc"],
      "dimensiones": "dimensiones físicas",
      "peso": "peso del dispositivo",
      "temperatura_operacion": "rango de temperatura",
      "voltaje_operacion": "voltaje de alimentación",
      "frecuencias": ["bandas de frecuencia soportadas"],
      "sensores": ["acelerometro", "giroscopio", "etc"],
      "conectividad": ["2G", "3G", "4G", "WiFi", "Bluetooth"]
    }
  ]
}

Incluye al menos 5-10 dispositivos GPS tracking populares y confiables del mercado actual.
            `
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 4000,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'month',
        frequency_penalty: 1,
        presence_penalty: 0
      }),
    });

    if (!perplexityResponse.ok) {
      throw new Error(`Perplexity API error: ${perplexityResponse.statusText}`)
    }

    const perplexityData = await perplexityResponse.json()
    const responseText = perplexityData.choices[0].message.content

    // Parsear la respuesta JSON
    let devicesData
    try {
      // Buscar el JSON en la respuesta
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        devicesData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No se encontró JSON válido en la respuesta')
      }
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError)
      throw new Error('Error al parsear la respuesta de la API')
    }

    // Verificar si existe la categoría GPS Tracking
    let gpsCategory
    const { data: existingCategory } = await supabase
      .from('categorias_productos')
      .select('id')
      .eq('nombre', 'GPS Tracking')
      .single()

    if (existingCategory) {
      gpsCategory = existingCategory
    } else {
      // Crear categoría GPS Tracking
      const { data: newCategory, error: categoryError } = await supabase
        .from('categorias_productos')
        .insert({
          nombre: 'GPS Tracking',
          descripcion: 'Dispositivos de rastreo GPS para vehículos y personal',
          codigo: 'GPS-TRACK',
          activo: true
        })
        .select()
        .single()

      if (categoryError) throw categoryError
      gpsCategory = newCategory
    }

    const insertedDevices = []

    // Insertar cada dispositivo en la base de datos
    for (const device of devicesData.devices || []) {
      try {
        // Verificar si el dispositivo ya existe
        const { data: existingDevice } = await supabase
          .from('productos_inventario')
          .select('id')
          .eq('nombre', device.modelo)
          .single()

        if (existingDevice) {
          console.log(`Dispositivo ${device.modelo} ya existe, saltando...`)
          continue
        }

        // Generar código de producto único
        const codigo = `GPS-${device.marca?.substring(0, 3).toUpperCase()}-${device.modelo?.replace(/[^A-Za-z0-9]/g, '').substring(0, 8).toUpperCase()}`

        // Insertar producto
        const { data: producto, error: productoError } = await supabase
          .from('productos_inventario')
          .insert({
            codigo_producto: codigo,
            nombre: device.modelo,
            descripcion: device.descripcion,
            categoria_id: gpsCategory.id,
            marca: device.marca,
            modelo: device.modelo,
            especificaciones: device.especificaciones || {},
            precio_venta_sugerido: device.precio_estimado || 0,
            dimensiones: device.dimensiones,
            peso_kg: device.peso ? parseFloat(device.peso.match(/[\d.]+/)?.[0] || '0') : 0,
            voltaje_operacion: device.voltaje_operacion,
            temperatura_operacion: device.temperatura_operacion,
            certificaciones: device.caracteristicas || [],
            software_requerido: 'Plataforma de rastreo GPS',
            es_serializado: true,
            requiere_configuracion: true,
            garantia_meses: 12,
            stock_minimo: 5,
            stock_maximo: 50,
            activo: true,
            estado_producto: 'activo'
          })
          .select()
          .single()

        if (productoError) {
          console.error('Error insertando producto:', productoError)
          continue
        }

        // Insertar configuraciones del producto
        const configuraciones = [
          { parametro: 'IMEI', valor: '', descripcion: 'Número IMEI del dispositivo', requerido: true },
          { parametro: 'Servidor', valor: '', descripcion: 'Dirección del servidor de rastreo', requerido: true },
          { parametro: 'Puerto', valor: '8888', descripcion: 'Puerto de comunicación', requerido: true },
          { parametro: 'APN', valor: 'internet.comcel.com.co', descripcion: 'APN del operador móvil', requerido: true },
          { parametro: 'Intervalo_Reporte', valor: '60', descripcion: 'Intervalo de reporte en segundos', requerido: false },
          { parametro: 'Sensibilidad_Shock', valor: 'Media', descripcion: 'Nivel de sensibilidad del sensor de impacto', requerido: false }
        ]

        for (const config of configuraciones) {
          await supabase
            .from('configuraciones_producto')
            .insert({
              producto_id: producto.id,
              parametro: config.parametro,
              valor: config.valor,
              descripcion: config.descripcion,
              requerido: config.requerido
            })
        }

        // Crear registro inicial de stock
        await supabase
          .from('stock_productos')
          .insert({
            producto_id: producto.id,
            cantidad_disponible: 0,
            cantidad_reservada: 0,
            cantidad_transito: 0,
            valor_inventario: 0
          })

        insertedDevices.push({
          id: producto.id,
          nombre: device.modelo,
          marca: device.marca,
          codigo: codigo
        })

      } catch (deviceError) {
        console.error(`Error procesando dispositivo ${device.modelo}:`, deviceError)
        continue
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Se procesaron ${insertedDevices.length} dispositivos GPS`,
        devices: insertedDevices,
        raw_response: responseText
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})