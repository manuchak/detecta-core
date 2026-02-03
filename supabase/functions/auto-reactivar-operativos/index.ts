import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReactivacionResult {
  operativoId: string;
  operativoTipo: 'custodio' | 'armado';
  nombre: string;
  motivoOriginal: string | null;
  diasInactivo: number;
}

function calcularDias(fechaInicio: string | null): number {
  if (!fechaInicio) return 0;
  const inicio = new Date(fechaInicio);
  const hoy = new Date();
  const diffTime = Math.abs(hoy.getTime() - inicio.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

async function procesarTabla(
  supabase: ReturnType<typeof createClient>,
  tableName: 'custodios_operativos' | 'armados_operativos',
  operativoTipo: 'custodio' | 'armado'
): Promise<ReactivacionResult[]> {
  const hoy = new Date().toISOString().split('T')[0];
  
  console.log(`[${tableName}] Buscando operativos pendientes de reactivación...`);
  
  // 1. Buscar operativos pendientes de reactivación
  const { data: operativos, error } = await supabase
    .from(tableName)
    .select('id, nombre, estado, fecha_inactivacion, motivo_inactivacion')
    .in('estado', ['inactivo', 'suspendido'])
    .eq('tipo_inactivacion', 'temporal')
    .lte('fecha_reactivacion_programada', hoy);

  if (error) {
    console.error(`[${tableName}] Error buscando operativos:`, error);
    return [];
  }

  if (!operativos?.length) {
    console.log(`[${tableName}] No hay operativos pendientes de reactivación`);
    return [];
  }

  console.log(`[${tableName}] Encontrados ${operativos.length} operativos para reactivar`);

  const resultados: ReactivacionResult[] = [];

  for (const operativo of operativos) {
    try {
      console.log(`[${tableName}] Procesando: ${operativo.nombre} (${operativo.id})`);
      
      // 2. Actualizar estado del operativo
      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          estado: 'activo',
          fecha_inactivacion: null,
          motivo_inactivacion: null,
          tipo_inactivacion: null,
          fecha_reactivacion_programada: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', operativo.id);

      if (updateError) {
        console.error(`[${tableName}] Error actualizando operativo ${operativo.id}:`, updateError);
        continue;
      }

      // 3. Registrar en historial
      const { error: historialError } = await supabase
        .from('operativo_estatus_historial')
        .insert({
          operativo_id: operativo.id,
          operativo_tipo: operativoTipo,
          estatus_anterior: operativo.estado,
          estatus_nuevo: 'activo',
          tipo_cambio: 'reactivacion',
          motivo: 'Reactivación automática programada',
          notas: `Inactivo desde: ${operativo.fecha_inactivacion || 'N/A'}. Motivo original: ${operativo.motivo_inactivacion || 'N/A'}`,
          creado_por: null // Sistema
        });

      if (historialError) {
        console.error(`[${tableName}] Error registrando historial para ${operativo.id}:`, historialError);
        // Continuar aunque falle el historial
      }

      // 4. Cerrar sanciones cumplidas del operativo
      const { error: sancionesError, count } = await supabase
        .from('sanciones_aplicadas')
        .update({
          estado: 'cumplida',
          fecha_revision: new Date().toISOString()
        })
        .eq('operativo_id', operativo.id)
        .eq('estado', 'activa')
        .lte('fecha_fin', hoy);

      if (sancionesError) {
        console.error(`[${tableName}] Error actualizando sanciones para ${operativo.id}:`, sancionesError);
      } else if (count && count > 0) {
        console.log(`[${tableName}] ${count} sanciones marcadas como cumplidas para ${operativo.nombre}`);
      }

      resultados.push({
        operativoId: operativo.id,
        operativoTipo,
        nombre: operativo.nombre,
        motivoOriginal: operativo.motivo_inactivacion,
        diasInactivo: calcularDias(operativo.fecha_inactivacion)
      });

      console.log(`[${tableName}] ✓ Reactivado: ${operativo.nombre}`);
    } catch (err) {
      console.error(`[${tableName}] Error procesando operativo ${operativo.id}:`, err);
    }
  }

  return resultados;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("========================================");
  console.log("=== INICIO: Reactivación Automática ===");
  console.log(`=== Fecha: ${new Date().toISOString()} ===`);
  console.log("========================================");

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Procesar ambas tablas
    const custodiosReactivados = await procesarTabla(supabase, 'custodios_operativos', 'custodio');
    const armadosReactivados = await procesarTabla(supabase, 'armados_operativos', 'armado');

    const resumen = {
      fecha_ejecucion: new Date().toISOString(),
      custodios_reactivados: custodiosReactivados.length,
      armados_reactivados: armadosReactivados.length,
      total: custodiosReactivados.length + armadosReactivados.length,
      detalle: {
        custodios: custodiosReactivados,
        armados: armadosReactivados
      }
    };

    console.log("========================================");
    console.log(`=== RESUMEN ===`);
    console.log(`Custodios reactivados: ${resumen.custodios_reactivados}`);
    console.log(`Armados reactivados: ${resumen.armados_reactivados}`);
    console.log(`Total: ${resumen.total}`);
    console.log("========================================");

    return new Response(JSON.stringify(resumen), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    console.error("Error fatal en reactivación automática:", error);
    
    return new Response(JSON.stringify({
      error: "Error interno en reactivación automática",
      message: error instanceof Error ? error.message : "Unknown error",
      fecha_ejecucion: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
