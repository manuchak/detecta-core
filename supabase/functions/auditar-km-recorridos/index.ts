import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Constantes de configuración
const MAX_KM_MEXICO = 3500; // Tijuana a Cancún ~3,400km
const UMBRAL_ERROR_MAPBOX = 0.08; // 8%
const UMBRAL_ERROR_TEORICO = 0.15; // 15%
const BATCH_SIZE = 50;

interface ServicioCustodia {
  id: number;
  id_servicio: string | null;
  origen: string | null;
  destino: string | null;
  km_recorridos: number | null;
  km_teorico: number | null;
  km_auditado: boolean | null;
}

interface AuditResult {
  servicio_id: number;
  id_servicio: string | null;
  km_original: number | null;
  km_corregido: number;
  distancia_mapbox: number | null;
  margen_error_pct: number | null;
  metodo_correccion: string;
  razon: string;
  origen_normalizado: string;
  destino_normalizado: string;
}

// Normalizar texto de ubicación para comparaciones
function normalizarUbicacion(texto: string | null): string {
  if (!texto) return "";
  return texto
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remover acentos
    .replace(/[^A-Z0-9\s,]/g, "") // Solo alfanuméricos y comas
    .replace(/\s+/g, " ")
    .trim();
}

// Calcular distancia usando Mapbox Directions API
async function calcularDistanciaMapbox(
  origen: string,
  destino: string,
  mapboxToken: string
): Promise<{ distancia: number | null; error?: string }> {
  try {
    // Geocodificar origen
    const origenCoords = await geocodificar(origen, mapboxToken);
    if (!origenCoords) {
      return { distancia: null, error: `No se pudo geocodificar origen: ${origen}` };
    }

    // Geocodificar destino
    const destinoCoords = await geocodificar(destino, mapboxToken);
    if (!destinoCoords) {
      return { distancia: null, error: `No se pudo geocodificar destino: ${destino}` };
    }

    // Calcular ruta
    const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${origenCoords.lng},${origenCoords.lat};${destinoCoords.lng},${destinoCoords.lat}?access_token=${mapboxToken}&geometries=geojson`;
    
    const response = await fetch(directionsUrl);
    if (!response.ok) {
      return { distancia: null, error: `Error API Directions: ${response.status}` };
    }

    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      // Convertir metros a kilómetros
      const distanciaKm = data.routes[0].distance / 1000;
      return { distancia: Math.round(distanciaKm * 10) / 10 };
    }

    return { distancia: null, error: "No se encontró ruta" };
  } catch (error) {
    console.error("Error calculando distancia Mapbox:", error);
    return { distancia: null, error: String(error) };
  }
}

// Geocodificar dirección
async function geocodificar(
  direccion: string,
  mapboxToken: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = encodeURIComponent(`${direccion}, Mexico`);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${mapboxToken}&country=mx&limit=1`;
    
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
    return null;
  } catch {
    return null;
  }
}

// Auditar un servicio individual
async function auditarServicio(
  servicio: ServicioCustodia,
  mapboxToken: string,
  usarMapbox: boolean = true
): Promise<AuditResult | null> {
  const origenNorm = normalizarUbicacion(servicio.origen);
  const destinoNorm = normalizarUbicacion(servicio.destino);
  const kmOriginal = servicio.km_recorridos;

  // Si no hay km_recorridos o ya está auditado, saltar
  if (kmOriginal === null || servicio.km_auditado) {
    return null;
  }

  let kmCorregido = kmOriginal;
  let metodo = "sin_cambio";
  let razon = "";
  let distanciaMapbox: number | null = null;
  let margenError: number | null = null;

  // Regla 1: Mismo origen/destino normalizado
  if (origenNorm && destinoNorm && origenNorm === destinoNorm) {
    if (kmOriginal > 0) {
      kmCorregido = 0;
      metodo = "origen_igual_destino";
      razon = `Origen y destino idénticos después de normalizar: "${origenNorm}"`;
      console.log(`[Regla 1] Servicio ${servicio.id_servicio}: ${kmOriginal}km → 0km (mismo punto)`);
    }
  }
  // Regla 2: Probable error metros/km (valores > 10,000)
  else if (kmOriginal > 10000) {
    const kmDividido = kmOriginal / 1000;
    if (kmDividido >= 1 && kmDividido <= MAX_KM_MEXICO) {
      kmCorregido = Math.round(kmDividido * 10) / 10;
      metodo = "division_1000";
      razon = `Valor ${kmOriginal} parece estar en metros. Corregido a ${kmCorregido}km`;
      console.log(`[Regla 2] Servicio ${servicio.id_servicio}: ${kmOriginal}km → ${kmCorregido}km (metros→km)`);
    }
  }
  // Regla 3: Validación con km_teorico si existe
  else if (servicio.km_teorico && servicio.km_teorico > 0 && kmOriginal > 0) {
    const diferencia = Math.abs(kmOriginal - servicio.km_teorico) / servicio.km_teorico;
    if (diferencia > UMBRAL_ERROR_TEORICO) {
      kmCorregido = servicio.km_teorico;
      metodo = "km_teorico";
      margenError = diferencia * 100;
      razon = `Diferencia de ${margenError.toFixed(1)}% vs km_teorico (${servicio.km_teorico}km). Umbral: ${UMBRAL_ERROR_TEORICO * 100}%`;
      console.log(`[Regla 3] Servicio ${servicio.id_servicio}: ${kmOriginal}km → ${kmCorregido}km (vs teorico)`);
    }
  }

  // Regla 4: Mapbox API para casos que aún son sospechosos
  const necesitaMapbox = usarMapbox && (
    kmCorregido > 1500 || // Distancias muy largas
    (metodo === "sin_cambio" && kmOriginal > 500) // Sin corrección pero sospechoso
  );

  if (necesitaMapbox && origenNorm && destinoNorm) {
    const resultado = await calcularDistanciaMapbox(servicio.origen!, servicio.destino!, mapboxToken);
    
    if (resultado.distancia !== null) {
      distanciaMapbox = resultado.distancia;
      const valorComparar = metodo !== "sin_cambio" ? kmCorregido : kmOriginal;
      const errorVsMapbox = distanciaMapbox > 0 
        ? Math.abs(valorComparar - distanciaMapbox) / distanciaMapbox 
        : 0;

      if (errorVsMapbox > UMBRAL_ERROR_MAPBOX) {
        kmCorregido = distanciaMapbox;
        metodo = "mapbox_api";
        margenError = errorVsMapbox * 100;
        razon = `Mapbox calculó ${distanciaMapbox}km. Error de ${margenError.toFixed(1)}% supera umbral del ${UMBRAL_ERROR_MAPBOX * 100}%`;
        console.log(`[Regla 4] Servicio ${servicio.id_servicio}: ${kmOriginal}km → ${kmCorregido}km (Mapbox)`);
      }
    } else {
      console.warn(`[Mapbox] No se pudo calcular para ${servicio.id_servicio}: ${resultado.error}`);
    }
  }

  // Si no hubo cambios, no crear registro
  if (metodo === "sin_cambio") {
    return null;
  }

  return {
    servicio_id: servicio.id,
    id_servicio: servicio.id_servicio,
    km_original: kmOriginal,
    km_corregido: kmCorregido,
    distancia_mapbox: distanciaMapbox,
    margen_error_pct: margenError,
    metodo_correccion: metodo,
    razon,
    origen_normalizado: origenNorm,
    destino_normalizado: destinoNorm,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mapboxToken = Deno.env.get("MAPBOX_ACCESS_TOKEN");

    if (!mapboxToken) {
      console.error("MAPBOX_ACCESS_TOKEN no configurado");
      return new Response(
        JSON.stringify({ error: "MAPBOX_ACCESS_TOKEN no configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parsear parámetros
    const body = await req.json().catch(() => ({}));
    const {
      prioridad = "todos", // 'extremos', 'metros', 'sospechosos', 'mismo_punto', 'todos'
      limite = BATCH_SIZE,
      aplicarCambios = false, // Si es true, actualiza servicios_custodia
      usarMapbox = true,
    } = body;

    console.log(`=== Iniciando auditoría KM ===`);
    console.log(`Prioridad: ${prioridad}, Límite: ${limite}, Aplicar: ${aplicarCambios}, Mapbox: ${usarMapbox}`);

    // Construir query según prioridad
    let query = supabase
      .from("servicios_custodia")
      .select("id, id_servicio, origen, destino, km_recorridos, km_teorico, km_auditado")
      .eq("km_auditado", false)
      .not("km_recorridos", "is", null)
      .gt("km_recorridos", 0)
      .limit(limite);

    switch (prioridad) {
      case "extremos":
        query = query.gt("km_recorridos", 100000);
        break;
      case "metros":
        query = query.gt("km_recorridos", 10000).lte("km_recorridos", 100000);
        break;
      case "sospechosos":
        query = query.gt("km_recorridos", 2000).lte("km_recorridos", 10000);
        break;
      case "mismo_punto":
        // Este requiere filtrado post-query por normalización
        break;
      case "todos":
      default:
        // Sin filtro adicional, ordenar por km_recorridos desc para priorizar anomalías
        query = query.order("km_recorridos", { ascending: false });
    }

    const { data: servicios, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error obteniendo servicios:", fetchError);
      throw fetchError;
    }

    if (!servicios || servicios.length === 0) {
      return new Response(
        JSON.stringify({ message: "No hay servicios pendientes de auditoría", auditados: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Procesando ${servicios.length} servicios...`);

    // Procesar servicios
    const resultados: AuditResult[] = [];
    const errores: { id: number; error: string }[] = [];

    for (const servicio of servicios) {
      try {
        const resultado = await auditarServicio(servicio as ServicioCustodia, mapboxToken, usarMapbox);
        if (resultado) {
          resultados.push(resultado);
        }
      } catch (error) {
        console.error(`Error procesando servicio ${servicio.id}:`, error);
        errores.push({ id: servicio.id, error: String(error) });
      }
    }

    console.log(`Auditoría completada: ${resultados.length} correcciones, ${errores.length} errores`);

    // Si hay resultados y aplicarCambios es true, actualizar base de datos
    if (resultados.length > 0 && aplicarCambios) {
      console.log("Aplicando cambios a la base de datos...");

      // Insertar registros de auditoría
      const { error: insertError } = await supabase
        .from("auditoria_km_correcciones")
        .insert(resultados);

      if (insertError) {
        console.error("Error insertando auditoría:", insertError);
        throw insertError;
      }

      // Actualizar servicios_custodia
      for (const resultado of resultados) {
        const { error: updateError } = await supabase
          .from("servicios_custodia")
          .update({
            km_original_backup: resultado.km_original,
            km_recorridos: resultado.km_corregido,
            km_auditado: true,
            fecha_auditoria: new Date().toISOString(),
          })
          .eq("id", resultado.servicio_id);

        if (updateError) {
          console.error(`Error actualizando servicio ${resultado.servicio_id}:`, updateError);
        }
      }

      console.log(`Actualizados ${resultados.length} servicios`);
    }

    // Estadísticas por método
    const estadisticas = {
      total_procesados: servicios.length,
      total_correcciones: resultados.length,
      total_errores: errores.length,
      cambios_aplicados: aplicarCambios,
      por_metodo: {
        origen_igual_destino: resultados.filter(r => r.metodo_correccion === "origen_igual_destino").length,
        division_1000: resultados.filter(r => r.metodo_correccion === "division_1000").length,
        km_teorico: resultados.filter(r => r.metodo_correccion === "km_teorico").length,
        mapbox_api: resultados.filter(r => r.metodo_correccion === "mapbox_api").length,
      },
    };

    return new Response(
      JSON.stringify({
        message: "Auditoría completada",
        estadisticas,
        resultados: resultados.slice(0, 20), // Limitar respuesta
        errores: errores.slice(0, 10),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error en auditoría:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
