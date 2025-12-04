import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Velocidad promedio para estimación por km_teorico (km/h)
const VELOCIDAD_PROMEDIO_KMH = 50;
// Tiempo adicional por carga/descarga y esperas (horas)
const TIEMPO_OPERATIVO_EXTRA = 1.5;

interface ServicioData {
  id: string;
  id_servicio: string;
  origen: string | null;
  destino: string | null;
  km_teorico: number | null;
  tiempo_estimado: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN');
    
    if (!mapboxToken) {
      console.error('❌ MAPBOX_ACCESS_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Mapbox token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await req.json();
    const { servicio_id, batch_mode = false, limit = 50 } = body;
    
    console.log(`🔄 Iniciando estimación - batch_mode: ${batch_mode}, limit: ${limit}, servicio_id: ${servicio_id}`);
    
    let servicios: ServicioData[] = [];
    
    if (batch_mode) {
      // Procesar múltiples servicios SEICSA sin duración real ni estimada
      const { data, error } = await supabase
        .from('servicios_custodia')
        .select('id, id_servicio, origen, destino, km_teorico, tiempo_estimado')
        .or('id_servicio.like.SIINSRH-%,proveedor.ilike.%seicsa%')
        .is('duracion_servicio', null)
        .is('duracion_estimada', null)
        .limit(limit);
      
      if (error) {
        console.error('❌ Error fetching services:', error);
        throw error;
      }
      servicios = data || [];
      console.log(`📋 Encontrados ${servicios.length} servicios pendientes de estimación`);
    } else if (servicio_id) {
      // Procesar un servicio específico
      const { data, error } = await supabase
        .from('servicios_custodia')
        .select('id, id_servicio, origen, destino, km_teorico, tiempo_estimado')
        .eq('id', servicio_id)
        .single();
      
      if (error) {
        console.error('❌ Error fetching service:', error);
        throw error;
      }
      servicios = data ? [data] : [];
    }

    const resultados: Array<{
      id_servicio: string;
      duracion_estimada?: number;
      metodo?: string;
      confianza?: number;
      status: string;
      reason?: string;
    }> = [];
    
    for (const servicio of servicios) {
      let duracionHoras: number | undefined;
      let metodo: string | undefined;
      let confianza: number | undefined;
      
      // Estrategia 1: Usar km_teorico si existe
      if (servicio.km_teorico && servicio.km_teorico > 0) {
        duracionHoras = (servicio.km_teorico / VELOCIDAD_PROMEDIO_KMH) + TIEMPO_OPERATIVO_EXTRA;
        metodo = 'km_teorico';
        confianza = 0.75;
        console.log(`✅ ${servicio.id_servicio}: Estimado por km_teorico (${servicio.km_teorico}km) = ${duracionHoras.toFixed(2)}h`);
      }
      // Estrategia 2: Usar tiempo_estimado si existe (es TEXT, convertir a horas)
      else if (servicio.tiempo_estimado) {
        const parsed = parseFloat(servicio.tiempo_estimado);
        if (!isNaN(parsed) && parsed > 0) {
          duracionHoras = parsed;
          metodo = 'tiempo_estimado_existente';
          confianza = 0.80;
          console.log(`✅ ${servicio.id_servicio}: Usando tiempo_estimado existente = ${duracionHoras}h`);
        }
      }
      // Estrategia 3: Calcular con Mapbox Directions API
      else if (servicio.origen && servicio.destino) {
        try {
          console.log(`🗺️ ${servicio.id_servicio}: Geocodificando origen "${servicio.origen}" y destino "${servicio.destino}"`);
          
          // Geocodificar origen
          const origenCoords = await geocodeAddress(servicio.origen, mapboxToken);
          const destinoCoords = await geocodeAddress(servicio.destino, mapboxToken);
          
          if (origenCoords && destinoCoords) {
            console.log(`📍 Coordenadas: origen ${origenCoords}, destino ${destinoCoords}`);
            
            // Obtener ruta de Mapbox Directions
            const route = await getMapboxRoute(origenCoords, destinoCoords, mapboxToken);
            
            if (route) {
              // Duración en segundos → horas + tiempo operativo
              duracionHoras = (route.duration / 3600) + TIEMPO_OPERATIVO_EXTRA;
              metodo = 'mapbox_api';
              confianza = 0.90;
              console.log(`✅ ${servicio.id_servicio}: Calculado por Mapbox API = ${duracionHoras.toFixed(2)}h (${(route.distance/1000).toFixed(1)}km)`);
            } else {
              console.warn(`⚠️ ${servicio.id_servicio}: No se encontró ruta en Mapbox`);
            }
          } else {
            console.warn(`⚠️ ${servicio.id_servicio}: No se pudieron geocodificar las direcciones`);
          }
        } catch (mapboxError) {
          console.error(`⚠️ Error Mapbox para ${servicio.id_servicio}:`, mapboxError);
        }
      } else {
        console.warn(`⚠️ ${servicio.id_servicio}: Sin datos suficientes (sin km_teorico, tiempo_estimado, origen/destino)`);
      }
      
      // Actualizar base de datos si se calculó duración
      if (duracionHoras !== undefined && duracionHoras > 0 && metodo && confianza !== undefined) {
        const hours = Math.floor(duracionHoras);
        const minutes = Math.floor((duracionHoras % 1) * 60);
        const intervalStr = `${hours}:${minutes.toString().padStart(2, '0')}:00`;
        
        const { error: updateError } = await supabase
          .from('servicios_custodia')
          .update({
            duracion_estimada: intervalStr,
            metodo_estimacion: metodo,
            confianza_estimacion: confianza,
          })
          .eq('id', servicio.id);
        
        if (updateError) {
          console.error(`❌ Error actualizando ${servicio.id_servicio}:`, updateError);
          resultados.push({
            id_servicio: servicio.id_servicio,
            status: 'error',
            reason: updateError.message
          });
        } else {
          resultados.push({
            id_servicio: servicio.id_servicio,
            duracion_estimada: duracionHoras,
            metodo,
            confianza,
            status: 'success'
          });
        }
      } else {
        resultados.push({
          id_servicio: servicio.id_servicio,
          status: 'skipped',
          reason: 'No se pudo calcular duración - datos insuficientes'
        });
      }
    }

    const exitosos = resultados.filter(r => r.status === 'success').length;
    console.log(`✅ Procesamiento completado: ${exitosos}/${resultados.length} exitosos`);

    return new Response(
      JSON.stringify({ 
        procesados: resultados.length,
        exitosos,
        omitidos: resultados.filter(r => r.status === 'skipped').length,
        errores: resultados.filter(r => r.status === 'error').length,
        resultados 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error general:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Geocodificar dirección usando Mapbox
async function geocodeAddress(address: string, token: string): Promise<[number, number] | null> {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${token}&country=MX&limit=1&language=es`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Geocoding error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features[0].center as [number, number]; // [lng, lat]
    }
    return null;
  } catch (error) {
    console.error('Geocoding exception:', error);
    return null;
  }
}

// Obtener ruta de Mapbox Directions
async function getMapboxRoute(origin: [number, number], destination: [number, number], token: string): Promise<{ duration: number; distance: number } | null> {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?access_token=${token}&overview=false`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Directions error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      return {
        duration: data.routes[0].duration, // segundos
        distance: data.routes[0].distance  // metros
      };
    }
    return null;
  } catch (error) {
    console.error('Directions exception:', error);
    return null;
  }
}
