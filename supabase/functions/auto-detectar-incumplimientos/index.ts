import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeteccionResult {
  tipo: 'NO_SHOW' | 'CANCELACION_ULTIMA_HORA' | 'LLEGADA_TARDE';
  operativoId: string;
  operativoTipo: 'custodio' | 'armado';
  servicioId?: string;
  descripcion: string;
  sancionCreada: boolean;
}

interface CatalogoSancion {
  id: string;
  codigo: string;
  dias_suspension_default: number;
  puntos_score_perdidos: number;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Obtener sanción del catálogo
async function getSancionFromCatalogo(
  supabase: ReturnType<typeof createClient>,
  codigo: string
): Promise<CatalogoSancion | null> {
  const { data, error } = await supabase
    .from('catalogo_sanciones')
    .select('id, codigo, dias_suspension_default, puntos_score_perdidos')
    .eq('codigo', codigo)
    .eq('activo', true)
    .single();

  if (error) {
    console.error(`Error obteniendo sanción ${codigo}:`, error);
    return null;
  }
  return data;
}

// Verificar si ya existe sanción para este servicio
async function existeSancionParaServicio(
  supabase: ReturnType<typeof createClient>,
  servicioId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('sanciones_aplicadas')
    .select('id')
    .eq('servicio_relacionado_id', servicioId)
    .limit(1);

  if (error) {
    console.error('Error verificando sanción existente:', error);
    return true; // Asumimos que existe para evitar duplicados
  }
  return data && data.length > 0;
}

// Verificar si el operativo ya tiene sanción activa
async function tieneSancionActiva(
  supabase: ReturnType<typeof createClient>,
  operativoId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('sanciones_aplicadas')
    .select('id')
    .eq('operativo_id', operativoId)
    .eq('estado', 'activa')
    .limit(1);

  if (error) {
    console.error('Error verificando sanción activa:', error);
    return true;
  }
  return data && data.length > 0;
}

// Aplicar sanción y suspender operativo
async function aplicarSancion(
  supabase: ReturnType<typeof createClient>,
  params: {
    operativoId: string;
    operativoTipo: 'custodio' | 'armado';
    sancionCodigo: string;
    servicioId?: string;
    notas: string;
  }
): Promise<boolean> {
  const sancion = await getSancionFromCatalogo(supabase, params.sancionCodigo);
  if (!sancion) {
    console.error(`Sanción ${params.sancionCodigo} no encontrada en catálogo`);
    return false;
  }

  const fechaInicio = new Date().toISOString().split('T')[0];
  const fechaFin = addDays(new Date(), sancion.dias_suspension_default)
    .toISOString().split('T')[0];

  console.log(`Aplicando sanción ${params.sancionCodigo} a operativo ${params.operativoId}`);
  console.log(`  - Días suspensión: ${sancion.dias_suspension_default}`);
  console.log(`  - Fecha fin: ${fechaFin}`);

  // Crear sanción
  const { error: sancionError } = await supabase
    .from('sanciones_aplicadas')
    .insert({
      operativo_id: params.operativoId,
      operativo_tipo: params.operativoTipo,
      sancion_id: sancion.id,
      servicio_relacionado_id: params.servicioId || null,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      dias_suspension: sancion.dias_suspension_default,
      puntos_perdidos: sancion.puntos_score_perdidos,
      estado: 'activa',
      notas: params.notas,
      aplicada_por: null // Sistema
    });

  if (sancionError) {
    console.error('Error creando sanción:', sancionError);
    return false;
  }

  // Suspender operativo si hay días de suspensión
  if (sancion.dias_suspension_default > 0) {
    const tableName = params.operativoTipo === 'custodio'
      ? 'custodios_operativos'
      : 'armados_operativos';

    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        estado: 'suspendido',
        fecha_inactivacion: fechaInicio,
        motivo_inactivacion: 'sancion_disciplinaria',
        tipo_inactivacion: 'temporal',
        fecha_reactivacion_programada: fechaFin,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.operativoId);

    if (updateError) {
      console.error(`Error suspendiendo operativo en ${tableName}:`, updateError);
      // La sanción ya se creó, así que retornamos true
    }

    // Registrar en historial
    await supabase
      .from('operativo_estatus_historial')
      .insert({
        operativo_id: params.operativoId,
        operativo_tipo: params.operativoTipo,
        estatus_anterior: 'activo',
        estatus_nuevo: 'suspendido',
        tipo_cambio: 'suspension',
        motivo: `Sanción automática: ${params.sancionCodigo}`,
        notas: params.notas,
        creado_por: null
      });
  }

  console.log(`✓ Sanción ${params.sancionCodigo} aplicada correctamente`);
  return true;
}

// REGLA 1: Detectar NO_SHOW
async function detectarNoShow(
  supabase: ReturnType<typeof createClient>
): Promise<DeteccionResult[]> {
  const resultados: DeteccionResult[] = [];
  
  // Servicios confirmados que deberían haber empezado hace más de 30 minutos
  const umbralTiempo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  
  console.log('[NO_SHOW] Buscando servicios sin inicio real...');
  console.log(`[NO_SHOW] Umbral tiempo: ${umbralTiempo}`);

  const { data: servicios, error } = await supabase
    .from('servicios_planificados')
    .select('id, custodio_id, custodio_asignado, fecha_hora_cita')
    .eq('estado_planeacion', 'confirmado')
    .lt('fecha_hora_cita', umbralTiempo)
    .is('hora_inicio_real', null)
    .not('custodio_id', 'is', null);

  if (error) {
    console.error('[NO_SHOW] Error buscando servicios:', error);
    return resultados;
  }

  if (!servicios?.length) {
    console.log('[NO_SHOW] No se encontraron servicios con NO_SHOW');
    return resultados;
  }

  console.log(`[NO_SHOW] Encontrados ${servicios.length} posibles NO_SHOW`);

  for (const servicio of servicios) {
    // Verificar si ya tiene sanción para este servicio
    if (await existeSancionParaServicio(supabase, servicio.id)) {
      console.log(`[NO_SHOW] Servicio ${servicio.id} ya tiene sanción, saltando...`);
      continue;
    }

    const sancionCreada = await aplicarSancion(supabase, {
      operativoId: servicio.custodio_id,
      operativoTipo: 'custodio',
      sancionCodigo: 'NO_SHOW',
      servicioId: servicio.id,
      notas: `Detección automática. Servicio ${servicio.id} confirmado para ${servicio.fecha_hora_cita} sin registro de inicio.`
    });

    // Actualizar servicio a cancelado
    if (sancionCreada) {
      await supabase
        .from('servicios_planificados')
        .update({
          estado_planeacion: 'cancelado',
          comentarios_planeacion: 'Cancelado automáticamente por NO_SHOW del custodio'
        })
        .eq('id', servicio.id);
    }

    resultados.push({
      tipo: 'NO_SHOW',
      operativoId: servicio.custodio_id,
      operativoTipo: 'custodio',
      servicioId: servicio.id,
      descripcion: `Custodio ${servicio.custodio_asignado || 'N/A'} no se presentó al servicio`,
      sancionCreada
    });
  }

  return resultados;
}

// REGLA 2: Detectar CANCELACION_ULTIMA_HORA
async function detectarCancelacionUltimaHora(
  supabase: ReturnType<typeof createClient>
): Promise<DeteccionResult[]> {
  const resultados: DeteccionResult[] = [];

  // Servicios cancelados en las últimas 24 horas
  const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  console.log('[CANCELACION] Buscando cancelaciones a última hora...');

  const { data: servicios, error } = await supabase
    .from('servicios_planificados')
    .select('id, custodio_id, custodio_asignado, fecha_hora_cita, fecha_cancelacion')
    .eq('estado_planeacion', 'cancelado')
    .not('fecha_cancelacion', 'is', null)
    .not('custodio_id', 'is', null)
    .gte('fecha_cancelacion', hace24h);

  if (error) {
    console.error('[CANCELACION] Error buscando servicios:', error);
    return resultados;
  }

  if (!servicios?.length) {
    console.log('[CANCELACION] No se encontraron cancelaciones recientes');
    return resultados;
  }

  console.log(`[CANCELACION] Encontrados ${servicios.length} servicios cancelados para evaluar`);

  for (const servicio of servicios) {
    // Verificar si ya tiene sanción para este servicio
    if (await existeSancionParaServicio(supabase, servicio.id)) {
      continue;
    }

    // Calcular diferencia entre cita y cancelación
    const fechaCita = new Date(servicio.fecha_hora_cita);
    const fechaCancelacion = new Date(servicio.fecha_cancelacion);
    const diferenciaHoras = (fechaCita.getTime() - fechaCancelacion.getTime()) / (1000 * 60 * 60);

    // Solo si se canceló con menos de 2 horas de anticipación y antes de la cita
    if (diferenciaHoras < 2 && diferenciaHoras > 0) {
      console.log(`[CANCELACION] Servicio ${servicio.id} cancelado ${diferenciaHoras.toFixed(1)}h antes`);

      const sancionCreada = await aplicarSancion(supabase, {
        operativoId: servicio.custodio_id,
        operativoTipo: 'custodio',
        sancionCodigo: 'CANCELACION_ULTIMA_HORA',
        servicioId: servicio.id,
        notas: `Detección automática. Servicio cancelado ${diferenciaHoras.toFixed(1)} horas antes de la cita.`
      });

      resultados.push({
        tipo: 'CANCELACION_ULTIMA_HORA',
        operativoId: servicio.custodio_id,
        operativoTipo: 'custodio',
        servicioId: servicio.id,
        descripcion: `Cancelación a ${diferenciaHoras.toFixed(1)} horas del servicio`,
        sancionCreada
      });
    }
  }

  return resultados;
}

// REGLA 3: Detectar LLEGADA_TARDE (acumulativo)
async function detectarLlegadaTarde(
  supabase: ReturnType<typeof createClient>
): Promise<DeteccionResult[]> {
  const resultados: DeteccionResult[] = [];
  const hace30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  console.log('[TARDANZA] Buscando patrones de llegadas tarde...');

  // Obtener custodios activos
  const { data: custodios, error: custodiosError } = await supabase
    .from('custodios_operativos')
    .select('id, nombre')
    .eq('estado', 'activo');

  if (custodiosError || !custodios?.length) {
    console.log('[TARDANZA] No hay custodios activos para evaluar');
    return resultados;
  }

  console.log(`[TARDANZA] Evaluando ${custodios.length} custodios activos`);

  for (const custodio of custodios) {
    // Verificar si ya tiene sanción activa
    if (await tieneSancionActiva(supabase, custodio.id)) {
      continue;
    }

    // Contar llegadas tarde en últimos 30 días
    const { data: servicios, error: serviciosError } = await supabase
      .from('servicios_planificados')
      .select('id, fecha_hora_cita, hora_llegada_custodio')
      .eq('custodio_id', custodio.id)
      .in('estado_planeacion', ['confirmado', 'finalizado'])
      .not('hora_llegada_custodio', 'is', null)
      .gte('fecha_hora_cita', hace30d);

    if (serviciosError || !servicios?.length) {
      continue;
    }

    // Contar llegadas tarde (>15 min después de la cita)
    let llegadasTarde = 0;
    for (const servicio of servicios) {
      try {
        const horaCita = new Date(servicio.fecha_hora_cita);
        const horaLlegada = servicio.hora_llegada_custodio; // TIME format HH:MM:SS

        if (!horaLlegada || typeof horaLlegada !== 'string') continue;

        const [hCita, mCita] = [horaCita.getHours(), horaCita.getMinutes()];
        const partes = horaLlegada.split(':');
        if (partes.length < 2) continue;
        
        const [hLlegada, mLlegada] = partes.map(Number);

        const minutosCita = hCita * 60 + mCita;
        const minutosLlegada = hLlegada * 60 + mLlegada;

        if (minutosLlegada > minutosCita + 15) {
          llegadasTarde++;
        }
      } catch (e) {
        // Ignorar errores de parsing
      }
    }

    // Si tiene 3+ llegadas tarde, aplicar sanción
    if (llegadasTarde >= 3) {
      console.log(`[TARDANZA] ${custodio.nombre}: ${llegadasTarde} llegadas tarde en 30 días`);

      const sancionCreada = await aplicarSancion(supabase, {
        operativoId: custodio.id,
        operativoTipo: 'custodio',
        sancionCodigo: 'LLEGADA_TARDE',
        notas: `Detección automática. ${llegadasTarde} llegadas tarde (>15 min) en los últimos 30 días.`
      });

      resultados.push({
        tipo: 'LLEGADA_TARDE',
        operativoId: custodio.id,
        operativoTipo: 'custodio',
        descripcion: `${custodio.nombre}: ${llegadasTarde} llegadas tarde en 30 días`,
        sancionCreada
      });
    }
  }

  return resultados;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("============================================");
  console.log("=== INICIO: Detección de Incumplimientos ===");
  console.log(`=== Fecha: ${new Date().toISOString()} ===`);
  console.log("============================================");

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Parsear parámetros opcionales
    let body: Record<string, boolean> = {};
    try {
      body = await req.json();
    } catch {
      // Body vacío es válido
    }

    const {
      detectarNoShowEnabled = true,
      detectarCancelacionEnabled = true,
      detectarLlegadaTardeEnabled = true
    } = body;

    console.log('Configuración:');
    console.log(`  - NO_SHOW: ${detectarNoShowEnabled ? 'Habilitado' : 'Deshabilitado'}`);
    console.log(`  - CANCELACION: ${detectarCancelacionEnabled ? 'Habilitado' : 'Deshabilitado'}`);
    console.log(`  - LLEGADA_TARDE: ${detectarLlegadaTardeEnabled ? 'Habilitado' : 'Deshabilitado'}`);

    const resultados: DeteccionResult[] = [];

    if (detectarNoShowEnabled) {
      const noShows = await detectarNoShow(supabase);
      resultados.push(...noShows);
      console.log(`[RESUMEN] NO_SHOW detectados: ${noShows.length}`);
    }

    if (detectarCancelacionEnabled) {
      const cancelaciones = await detectarCancelacionUltimaHora(supabase);
      resultados.push(...cancelaciones);
      console.log(`[RESUMEN] CANCELACION_ULTIMA_HORA detectados: ${cancelaciones.length}`);
    }

    if (detectarLlegadaTardeEnabled) {
      const tardanzas = await detectarLlegadaTarde(supabase);
      resultados.push(...tardanzas);
      console.log(`[RESUMEN] LLEGADA_TARDE detectados: ${tardanzas.length}`);
    }

    const resumen = {
      fecha_ejecucion: new Date().toISOString(),
      total_detecciones: resultados.length,
      por_tipo: {
        NO_SHOW: resultados.filter(r => r.tipo === 'NO_SHOW').length,
        CANCELACION_ULTIMA_HORA: resultados.filter(r => r.tipo === 'CANCELACION_ULTIMA_HORA').length,
        LLEGADA_TARDE: resultados.filter(r => r.tipo === 'LLEGADA_TARDE').length
      },
      sanciones_creadas: resultados.filter(r => r.sancionCreada).length,
      detalle: resultados
    };

    console.log("============================================");
    console.log("=== RESUMEN FINAL ===");
    console.log(`Total detecciones: ${resumen.total_detecciones}`);
    console.log(`Sanciones creadas: ${resumen.sanciones_creadas}`);
    console.log(`Por tipo: NO_SHOW=${resumen.por_tipo.NO_SHOW}, CANCELACION=${resumen.por_tipo.CANCELACION_ULTIMA_HORA}, TARDANZA=${resumen.por_tipo.LLEGADA_TARDE}`);
    console.log("============================================");

    return new Response(JSON.stringify(resumen), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    console.error("Error fatal en detección de incumplimientos:", error);

    return new Response(JSON.stringify({
      error: "Error interno en detección de incumplimientos",
      message: error instanceof Error ? error.message : "Unknown error",
      fecha_ejecucion: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
