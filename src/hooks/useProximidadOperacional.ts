import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calcularProximidadOperacional, type CustodioConHistorial, type ServicioNuevo, type ScoringProximidad, type FactorEquidad } from '@/utils/proximidadOperacional';

/**
 * Función de auditoría para registrar accesos a custodios
 * No bloquea la operación principal si falla
 */
const logCustodioAccess = async (
  accion: string, 
  payload: Record<string, unknown>
): Promise<void> => {
  try {
    await supabase.rpc('log_custodio_access_secure', {
      p_accion: accion,
      p_entidad: 'custodios_operativos',
      p_payload: payload
    });
  } catch (err) {
    console.warn('⚠️ Error logging custodio access (non-blocking):', err);
    // No bloquear por error de logging
  }
};

export interface CustodioConProximidad extends CustodioConHistorial {
  scoring_proximidad?: ScoringProximidad;
  indisponibilidades_activas?: any[];
  disponibilidad_efectiva?: string;
  categoria_disponibilidad?: 'disponible' | 'parcialmente_ocupado' | 'ocupado' | 'no_disponible';
  datos_equidad?: FactorEquidad;
  conflictos_detectados?: boolean;
  razon_no_disponible?: string;
  fecha_ultimo_servicio?: string | null;
  
  // Pre-fetched vehicle info (OPTIMIZATION: avoids per-card RPC calls)
  vehiculo_info?: string | null;
  
  // Service preference (Phase 2)
  preferencia_tipo_servicio?: 'local' | 'foraneo' | 'indistinto';
  
  // Métricas de actividad 15 días (Phase 4)
  servicios_locales_15d?: number;
  servicios_foraneos_15d?: number;
  total_servicios_15d?: number;
  sin_clasificar_15d?: number;
  
  // Properties needed for CustodioPerformanceCard compatibility
  performance_level: 'excelente' | 'bueno' | 'regular' | 'malo' | 'nuevo';
  rejection_risk: 'bajo' | 'medio' | 'alto';
  response_speed: 'rapido' | 'normal' | 'lento';
  experience_category: 'experimentado' | 'intermedio' | 'rookie' | 'nuevo' | 'candidato';
  score_comunicacion: number;
  score_aceptacion: number;
  score_confiabilidad: number;
  score_total: number;
  tasa_aceptacion: number;
  tasa_respuesta: number;
  tasa_confiabilidad: number;
}

export interface CustodiosCategorizados {
  disponibles: CustodioConProximidad[];      // Sin conflictos, disponibles
  parcialmenteOcupados: CustodioConProximidad[]; // Con servicios pero sin conflictos  
  ocupados: CustodioConProximidad[];         // Muchos servicios pero sin conflictos
  noDisponibles: CustodioConProximidad[];    // Con conflictos o indisponibles
}

/**
 * Hook para obtener custodios con scoring de proximidad operacional equitativo
 * Aplica algoritmo balanceado que considera:
 * - Proximidad operacional (60%)
 * - Factor de equidad/workload (25%) 
 * - Factor de oportunidad/rotación (15%)
 */
export function useCustodiosConProximidad(
  servicioNuevo?: ServicioNuevo,
  options?: { enabled?: boolean }
) {
  const isEnabled = options?.enabled !== false; // Default true
  
  // Usar un queryKey estable basado en primitivos para evitar re-fetch en loop
  const stableKey = servicioNuevo ? [
    servicioNuevo.fecha_programada ?? null,
    servicioNuevo.hora_ventana_inicio ?? null,
    servicioNuevo.origen_texto ?? null,
    servicioNuevo.destino_texto ?? null,
    servicioNuevo.tipo_servicio ?? null,
    servicioNuevo.incluye_armado ?? null,
  ] : ['sin-servicio'];

  return useQuery({
    queryKey: ['custodios-con-proximidad-equitativo', ...stableKey],
    queryFn: async (): Promise<CustodiosCategorizados> => {
      console.log('🔍 Obteniendo custodios con algoritmo equitativo...');
      
      // Primary: Try secure RPC function
      const { data: custodiosDisponibles, error } = await supabase
        .rpc('get_custodios_activos_disponibles');

      if (error) {
        console.error('❌ Error al obtener custodios (RPC):', error);
        
        // FALLBACK: Try direct table query if RPC fails (permission issue or function not found)
        console.log('🔄 Intentando fallback a custodios_operativos...');
        const [fallbackRes, indispRes] = await Promise.all([
          supabase
            .from('custodios_operativos')
            .select('*')
            .eq('estado', 'activo')
            .in('disponibilidad', ['disponible', 'parcial']),
          supabase
            .from('custodio_indisponibilidades')
            .select('custodio_id')
            .eq('estado', 'activo')
            .or('fecha_fin_estimada.is.null,fecha_fin_estimada.gt.' + new Date().toISOString()),
        ]);
          
        if (fallbackRes.error) {
          console.error('❌ Fallback también falló:', fallbackRes.error);
          throw new Error(
            `Sin permisos para ver custodios. Tu rol actual no tiene acceso a esta función. ` +
            `Código: ${fallbackRes.error.code || error.code}`
          );
        }
        
        if (fallbackRes.data && fallbackRes.data.length > 0) {
          // Filter out custodians with active unavailabilities
          const indispIds = new Set((indispRes.data || []).map(r => r.custodio_id));
          const filtered = fallbackRes.data.filter(c => !indispIds.has(c.id));
          console.log(`✅ Fallback exitoso: ${filtered.length} custodios (${indispIds.size} excluidos por indisponibilidad)`);
          return {
            disponibles: filtered.map(c => ({
              ...c,
              fuente: 'custodios_operativos' as const,
              performance_level: 'nuevo' as const,
              rejection_risk: 'medio' as const,
              response_speed: 'normal' as const,
              experience_category: 'nuevo' as const,
              score_comunicacion: 50,
              score_aceptacion: 75,
              score_confiabilidad: 75,
              score_total: 65,
              tasa_aceptacion: 0.75,
              tasa_respuesta: 0.8,
              tasa_confiabilidad: 0.75,
            })),
            parcialmenteOcupados: [],
            ocupados: [],
            noDisponibles: []
          };
        }
      }

      if (!custodiosDisponibles || custodiosDisponibles.length === 0) {
        console.log('⚠️ No se encontraron custodios disponibles');
        return {
          disponibles: [],
          parcialmenteOcupados: [],
          ocupados: [],
          noDisponibles: []
        };
      }

      console.log(`✅ Encontrados ${custodiosDisponibles.length} custodios disponibles`);

      // AUDITORÍA: Registrar consulta de custodios
      logCustodioAccess('CUSTODIO_CONSULTA', {
        custodios_encontrados: custodiosDisponibles.length,
        origen: 'useCustodiosConProximidad',
        tiene_servicio_nuevo: !!servicioNuevo,
        fecha_consulta: new Date().toISOString()
      });

      // Obtener servicios históricos recientes para contexto temporal
      let serviciosProximos: any[] = [];
      if (servicioNuevo) {
        const fechaServicio = new Date(`${servicioNuevo.fecha_programada}T${servicioNuevo.hora_ventana_inicio}`);
        const fechaInicio = new Date(fechaServicio.getTime() - 24 * 60 * 60 * 1000); // 24h antes
        const fechaFin = new Date(fechaServicio.getTime() + 12 * 60 * 60 * 1000); // 12h después

        const { data: servicios } = await supabase
          .from('servicios_custodia')
          .select('*')
          .gte('fecha_hora_cita', fechaInicio.toISOString())
          .lte('fecha_hora_cita', fechaFin.toISOString())
          .in('estado', ['finalizado', 'en_curso', 'asignado']);

        serviciosProximos = servicios || [];
      }

      // Procesar custodios con algoritmo equitativo EN PARALELO
      console.log(`🔄 Procesando ${custodiosDisponibles.length} custodios con verificación de disponibilidad (PARALELO)...`);
      
      // Helper: Procesar un custodio individual con timeout
      const procesarCustodioConTimeout = async (
        custodio: any,
        timeoutMs: number = 3000
      ): Promise<CustodioConProximidad> => {
        // Build vehicle info string from pre-fetched RPC data (OPTIMIZATION)
        const vehiculoInfo = custodio.vehiculo_marca && custodio.vehiculo_modelo
          ? `${custodio.vehiculo_marca} ${custodio.vehiculo_modelo}${custodio.vehiculo_placas ? ` (${custodio.vehiculo_placas})` : ''}`
          : null;
        
        const custodioProcessed: CustodioConProximidad = {
          ...custodio,
          fuente: 'custodios_operativos' as const,
          indisponibilidades_activas: custodio.indisponibilidades_activas || [],
          disponibilidad_efectiva: custodio.disponibilidad_efectiva || 'disponible',
          categoria_disponibilidad: 'disponible', // FAIL-OPEN default
          conflictos_detectados: false,
          vehiculo_info: vehiculoInfo, // Pre-built vehicle string
          performance_level: 'nuevo',
          rejection_risk: 'medio',
          response_speed: 'normal',
          experience_category: 'nuevo',
          score_comunicacion: custodio.score_total || 50,
          score_aceptacion: 75,
          score_confiabilidad: 75,
          score_total: custodio.score_total || 65,
          tasa_aceptacion: 0.75,
          tasa_respuesta: 0.8,
          tasa_confiabilidad: 0.75
        };

        // Si no hay servicio nuevo, retornar con defaults
        if (!servicioNuevo) {
          return custodioProcessed;
        }

        // Verificar disponibilidad equitativa con timeout
        try {
          const rpcPromise = supabase.rpc('verificar_disponibilidad_equitativa_custodio', {
            p_custodio_id: custodio.id,
            p_custodio_nombre: custodio.nombre,
            p_fecha_servicio: servicioNuevo.fecha_programada,
            p_hora_inicio: servicioNuevo.hora_ventana_inicio,
            p_duracion_estimada_horas: 4
          });

          const timeoutPromise = new Promise<null>((resolve) => 
            setTimeout(() => resolve(null), timeoutMs)
          );

          const result = await Promise.race([rpcPromise, timeoutPromise]);

          // Timeout - usar fail-open
          if (result === null) {
            console.warn(`⏱️ [TIMEOUT] ${custodio.nombre} - usando fail-open`);
            const scoring = calcularProximidadOperacional(custodioProcessed, servicioNuevo, serviciosProximos);
            custodioProcessed.scoring_proximidad = scoring;
            return custodioProcessed;
          }

          const { data: disponibilidadEquitativa, error: rpcError } = result;

          if (rpcError) {
            console.warn(`⚠️ [FAIL-OPEN] RPC error para ${custodio.nombre}: ${rpcError.message}`);
            const scoring = calcularProximidadOperacional(custodioProcessed, servicioNuevo, serviciosProximos);
            custodioProcessed.scoring_proximidad = scoring;
            return custodioProcessed;
          }

          if (disponibilidadEquitativa) {
            const factorEquidad: FactorEquidad = {
              servicios_hoy: disponibilidadEquitativa.servicios_hoy || 0,
              dias_sin_asignar: disponibilidadEquitativa.dias_sin_asignar || 0,
              nivel_fatiga: disponibilidadEquitativa.nivel_fatiga || 'bajo',
              score_equidad: disponibilidadEquitativa.factor_equidad || 50,
              score_oportunidad: disponibilidadEquitativa.factor_oportunidad || 50,
              categoria_disponibilidad: disponibilidadEquitativa.categoria_disponibilidad || 'libre',
              balance_recommendation: disponibilidadEquitativa.scoring_equitativo?.balance_recommendation || 'bueno'
            };

            custodioProcessed.datos_equidad = factorEquidad;
            
            // PHASE 4: Extraer métricas de 15 días del RPC
            custodioProcessed.servicios_locales_15d = disponibilidadEquitativa.servicios_locales_15d ?? 0;
            custodioProcessed.servicios_foraneos_15d = disponibilidadEquitativa.servicios_foraneos_15d ?? 0;
            custodioProcessed.total_servicios_15d = disponibilidadEquitativa.total_servicios_15d ?? 0;
            custodioProcessed.sin_clasificar_15d = disponibilidadEquitativa.sin_clasificar_15d ?? 0;
            
            // Mapear categorías del RPC al formato estándar
            const mapearCategoria = (categoria: string): 'disponible' | 'parcialmente_ocupado' | 'ocupado' | 'no_disponible' => {
              switch (categoria) {
                case 'libre': return 'disponible';
                case 'parcialmente_ocupado': return 'parcialmente_ocupado';
                case 'ocupado_disponible': return 'ocupado';
                case 'no_disponible': return 'no_disponible';
                default: return 'disponible';
              }
            };

            custodioProcessed.categoria_disponibilidad = mapearCategoria(factorEquidad.categoria_disponibilidad);

            // CRITICAL FIX: Differentiate between "schedule conflict" vs "workload limit"
            // - Schedule conflict (overlap): goes to noDisponibles (requires override)
            // - Workload limit (3+ services): stays in ocupados (visible, can still assign)
            if (!disponibilidadEquitativa.disponible) {
              const razon = (disponibilidadEquitativa.razon_no_disponible || '').toLowerCase();
              const esConflictoHorario = razon.includes('conflicto') || 
                                          razon.includes('overlap') ||
                                          razon.includes('solapamiento') ||
                                          (disponibilidadEquitativa.servicios_en_conflicto || 0) > 0;
              const esLimiteWorkload = razon.includes('límite') || 
                                       razon.includes('máximo') || 
                                       razon.includes('alcanzado');

              if (esConflictoHorario) {
                // Schedule conflict - show as warning badge but keep selectable (non-blocking)
                custodioProcessed.disponibilidad_efectiva = 'disponible';
                custodioProcessed.categoria_disponibilidad = 'ocupado';
                custodioProcessed.conflictos_detectados = true;
                custodioProcessed.razon_no_disponible = disponibilidadEquitativa.razon_no_disponible || 'Conflicto de horario';
              } else if (esLimiteWorkload) {
                // Workload limit - keep visible in "ocupados" with warning badge
                custodioProcessed.categoria_disponibilidad = 'ocupado';
                custodioProcessed.conflictos_detectados = false; // Don't hide, just show as busy
                custodioProcessed.razon_no_disponible = disponibilidadEquitativa.razon_no_disponible || 'Límite de servicios (3/día)';
              } else {
                // Unknown reason - default to ocupado to keep visible (fail-open)
                console.warn(`⚠️ Razón desconocida para ${custodio.nombre}: "${razon}", usando ocupado`);
                custodioProcessed.categoria_disponibilidad = 'ocupado';
                custodioProcessed.conflictos_detectados = false;
                custodioProcessed.razon_no_disponible = disponibilidadEquitativa.razon_no_disponible || 'Límite alcanzado';
              }
            }

            const scoring = calcularProximidadOperacional(
              custodioProcessed,
              servicioNuevo,
              serviciosProximos,
              factorEquidad
            );
            custodioProcessed.scoring_proximidad = scoring;
          }
        } catch (error: any) {
          console.warn(`⚠️ [FAIL-OPEN] Error para ${custodio.nombre}:`, error.message);
          const scoring = calcularProximidadOperacional(custodioProcessed, servicioNuevo, serviciosProximos);
          custodioProcessed.scoring_proximidad = scoring;
        }

        return custodioProcessed;
      };

      // PROCESAMIENTO EN PARALELO CON BATCHES
      // OPTIMIZATION: Detect low-end hardware and adjust parameters
      const isLowEndDevice = typeof navigator !== 'undefined' && 
        (navigator.hardwareConcurrency ?? 8) <= 4;
      
      const BATCH_SIZE = isLowEndDevice ? 15 : 25;
      const TIMEOUT_MS = isLowEndDevice ? 1500 : (custodiosDisponibles.length > 100 ? 2000 : 3000);
      
      console.log(`🔧 Hardware detection: ${isLowEndDevice ? 'Low-end' : 'Standard'} (cores: ${navigator.hardwareConcurrency ?? 'unknown'})`);
      console.log(`📊 Batch config: size=${BATCH_SIZE}, timeout=${TIMEOUT_MS}ms`);
      
      const custodiosProcessed: CustodioConProximidad[] = [];
      
      let successCount = 0;
      let failOpenCount = 0;
      
      for (let i = 0; i < custodiosDisponibles.length; i += BATCH_SIZE) {
        const batch = custodiosDisponibles.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(custodiosDisponibles.length / BATCH_SIZE);
        
        console.log(`📦 Procesando batch ${batchNum}/${totalBatches} (${batch.length} custodios, timeout: ${TIMEOUT_MS}ms)...`);
        
        const results = await Promise.allSettled(
          batch.map(custodio => procesarCustodioConTimeout(custodio, TIMEOUT_MS))
        );
        
        // FAIL-OPEN: Si la verificación falla, asumir disponible en lugar de descartar
        for (let j = 0; j < results.length; j++) {
          const result = results[j];
          if (result.status === 'fulfilled') {
            custodiosProcessed.push(result.value);
            successCount++;
          } else {
            // FAIL-OPEN: Custodio original con defaults seguros
            const custodioOriginal = batch[j];
            console.warn(`⚠️ [FAIL-OPEN] Error procesando ${custodioOriginal.nombre}, asumiendo disponible:`, result.reason);
            
            custodiosProcessed.push({
              ...custodioOriginal,
              categoria_disponibilidad: 'disponible',
              conflictos_detectados: false,
              disponibilidad_efectiva: custodioOriginal.disponibilidad || 'disponible',
              servicios_hoy: 0,
              servicios_semana: 0,
              puede_tomar_servicio: true,
              motivo_bloqueo: null,
              distancia_km: null,
              zona_match: false,
              score_total: 50, // Score neutral
            } as CustodioConProximidad);
            failOpenCount++;
          }
        }
      }
      
      console.log(`✅ Procesados ${custodiosProcessed.length}/${custodiosDisponibles.length} custodios (${successCount} ok, ${failOpenCount} fail-open)`);
      
      if (failOpenCount > 0) {
        console.warn(`⚠️ ${failOpenCount} custodios procesados con FAIL-OPEN - verificar conectividad RPC`);
      }
      
      console.log(`✅ Procesados ${custodiosProcessed.length}/${custodiosDisponibles.length} custodios en paralelo`);

      // ── ENRIQUECIMIENTO EN TIEMPO REAL: fecha_ultimo_servicio ──
      // La columna custodios_operativos.fecha_ultimo_servicio puede estar desactualizada.
      // Hacemos UNA query bulk a servicios_custodia + servicios_planificados para corregir.
      try {
        const allNames = custodiosProcessed.map(c => c.nombre).filter(Boolean);
        const hace30d = new Date();
        hace30d.setDate(hace30d.getDate() - 30);
        const hace30dISO = hace30d.toISOString();

        // Dual-source: servicios_custodia + servicios_planificados en paralelo
        const [resCustodia, resPlanificados] = await Promise.all([
          supabase
            .from('servicios_custodia')
            .select('nombre_custodio, fecha_hora_cita')
            .in('nombre_custodio', allNames)
            .neq('estado', 'cancelado')
            .gte('fecha_hora_cita', hace30dISO)
            .order('fecha_hora_cita', { ascending: false }),
          supabase
            .from('servicios_planificados')
            .select('custodio_asignado, fecha_hora_cita')
            .in('custodio_asignado', allNames)
            .neq('estado_planeacion', 'cancelado')
            .gte('fecha_hora_cita', hace30dISO)
            .order('fecha_hora_cita', { ascending: false })
        ]);

        // Construir mapa nombre → fecha más reciente
        const ultimaFechaReal = new Map<string, Date>();

        if (resCustodia.data) {
          for (const row of resCustodia.data) {
            const nombre = row.nombre_custodio;
            const fecha = new Date(row.fecha_hora_cita);
            if (!ultimaFechaReal.has(nombre) || fecha > ultimaFechaReal.get(nombre)!) {
              ultimaFechaReal.set(nombre, fecha);
            }
          }
        }

        if (resPlanificados.data) {
          for (const row of resPlanificados.data) {
            const nombre = row.custodio_asignado;
            const fecha = new Date(row.fecha_hora_cita);
            if (!ultimaFechaReal.has(nombre) || fecha > ultimaFechaReal.get(nombre)!) {
              ultimaFechaReal.set(nombre, fecha);
            }
          }
        }

        // Aplicar correcciones
        const hoy = new Date();
        let corregidos = 0;
        for (const custodio of custodiosProcessed) {
          const fechaReal = ultimaFechaReal.get(custodio.nombre);
          if (!fechaReal) continue;

          const fechaDB = custodio.fecha_ultimo_servicio ? new Date(custodio.fecha_ultimo_servicio) : null;

          // Solo corregir si la fecha real es más reciente que la de la BD
          if (!fechaDB || fechaReal > fechaDB) {
            custodio.fecha_ultimo_servicio = fechaReal.toISOString();
            const diasReales = Math.max(0, Math.floor((hoy.getTime() - fechaReal.getTime()) / (1000 * 60 * 60 * 24)));

            if (custodio.datos_equidad) {
              custodio.datos_equidad.dias_sin_asignar = diasReales;
            } else {
              // Crear datos_equidad mínimos para fail-open
              custodio.datos_equidad = {
                servicios_hoy: 0,
                dias_sin_asignar: diasReales,
                nivel_fatiga: 'bajo',
                score_equidad: 50,
                score_oportunidad: 50,
                categoria_disponibilidad: 'libre',
                balance_recommendation: 'bueno'
              };
            }
            corregidos++;
          }
        }

        if (corregidos > 0) {
          console.log(`🔄 Corregidos ${corregidos} custodios con fecha_ultimo_servicio en tiempo real`);
        }
      } catch (err) {
        console.warn('⚠️ Error enriqueciendo fechas en tiempo real (fail-open):', err);
      }

      // ── FILTRAR CUSTODIOS CON RECHAZOS VIGENTES (CONTEXTUAL) ──
      // Query ligera fail-open: si falla, no bloquea asignaciones
      // Rechazos con motivo "armado" solo excluyen de servicios CON armado
      let custodiosFiltrados = custodiosProcessed;
      try {
        const { data: rechazos } = await supabase
          .from('custodio_rechazos')
          .select('custodio_id, motivo')
          .gt('vigencia_hasta', new Date().toISOString());

        if (rechazos && rechazos.length > 0) {
          const servicioRequiereArmado = servicioNuevo?.incluye_armado ?? false;
          
          custodiosFiltrados = custodiosProcessed.filter(c => {
            const rechazosDelCustodio = rechazos.filter(r => r.custodio_id === c.id);
            if (rechazosDelCustodio.length === 0) return true; // Sin rechazos, pasa
            
            // Verificar si TODOS los rechazos son contextuales (solo aplican a armado)
            const tieneRechazoGeneral = rechazosDelCustodio.some(r => {
              const motivoLower = (r.motivo || '').toLowerCase();
              const esRechazoArmado = motivoLower.includes('armado');
              // Si es rechazo de armado y el servicio NO requiere armado → no excluir por este rechazo
              if (esRechazoArmado && !servicioRequiereArmado) return false;
              // Cualquier otro rechazo → excluir
              return true;
            });
            
            return !tieneRechazoGeneral;
          });
          
          const excluidos = custodiosProcessed.length - custodiosFiltrados.length;
          console.log(`🚫 ${excluidos} custodios excluidos por rechazos vigentes (${custodiosProcessed.length} → ${custodiosFiltrados.length}, servicio requiere armado: ${servicioRequiereArmado})`);
        }
      } catch (err) {
        console.warn('⚠️ Error fetching rechazos (fail-open, no se filtran):', err);
      }

      // NUEVO: Separar en categorías según disponibilidad REAL (sin conflictos)
      const categorizado: CustodiosCategorizados = {
        disponibles: [],
        parcialmenteOcupados: [],
        ocupados: [],
        noDisponibles: []
      };

      for (const custodio of custodiosFiltrados) {
        // CRÍTICO: Filtrar completamente indisponibles y con conflictos
        if (custodio.disponibilidad_efectiva === 'temporalmente_indisponible' || 
            custodio.conflictos_detectados) {
          categorizado.noDisponibles.push(custodio);
          continue;
        }

        // Categorizar según disponibilidad - FAIL-OPEN: default es disponible
        const categoria = custodio.categoria_disponibilidad || 'disponible';
        
        switch (categoria) {
          case 'disponible':
            categorizado.disponibles.push(custodio);
            break;
          case 'parcialmente_ocupado':
            categorizado.parcialmenteOcupados.push(custodio);
            break;
          case 'ocupado':
            categorizado.ocupados.push(custodio);
            break;
          case 'no_disponible':
            categorizado.noDisponibles.push(custodio);
            break;
          default:
            // FAIL-OPEN: cualquier caso no manejado = disponible
            console.log(`⚠️ Categoría desconocida '${categoria}' para ${custodio.nombre}, asignando a disponibles`);
            categorizado.disponibles.push(custodio);
        }
      }

      // Ordenar cada categoría por scoring equitativo
      const ordenarPorScoring = (a: CustodioConProximidad, b: CustodioConProximidad) => {
        if (servicioNuevo && a.scoring_proximidad && b.scoring_proximidad) {
          return b.scoring_proximidad.score_total - a.scoring_proximidad.score_total;
        }
        // Fallback por score operativo
        return (b.score_total || 0) - (a.score_total || 0);
      };

      categorizado.disponibles.sort(ordenarPorScoring);
      categorizado.parcialmenteOcupados.sort(ordenarPorScoring);
      categorizado.ocupados.sort(ordenarPorScoring);

      console.log(`✅ Custodios categorizados:`, {
        disponibles: categorizado.disponibles.length,
        parcialmente_ocupados: categorizado.parcialmenteOcupados.length,
        ocupados: categorizado.ocupados.length,
        no_disponibles: categorizado.noDisponibles.length
      });

      return categorizado;
    },
    // ✅ Don't execute with invalid key
    enabled: isEnabled && stableKey[0] !== 'sin-servicio',
    
    // FIX: Preserve cached data during query key oscillations
    // When servicioNuevo briefly becomes undefined during re-renders,
    // this keeps the previous data visible instead of showing "0 custodians"
    placeholderData: (previousData) => previousData,
    
    // FIX: Increase staleTime to prevent unnecessary refetches
    // during navigation and state sync operations
    staleTime: 2 * 60 * 1000, // 2 minutes
    
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}