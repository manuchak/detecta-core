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
export function useCustodiosConProximidad(servicioNuevo?: ServicioNuevo) {
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
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('custodios_operativos')
          .select('*')
          .eq('estado', 'activo')
          .in('disponibilidad', ['disponible', 'parcial']);
          
        if (fallbackError) {
          console.error('❌ Fallback también falló:', fallbackError);
          // Throw descriptive error for UI to display
          throw new Error(
            `Sin permisos para ver custodios. Tu rol actual no tiene acceso a esta función. ` +
            `Código: ${fallbackError.code || error.code}`
          );
        }
        
        if (fallbackData && fallbackData.length > 0) {
          console.log(`✅ Fallback exitoso: ${fallbackData.length} custodios`);
          // Return fallback data as "disponibles" with minimal processing
          return {
            disponibles: fallbackData.map(c => ({
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
        const custodioProcessed: CustodioConProximidad = {
          ...custodio,
          fuente: 'custodios_operativos' as const,
          indisponibilidades_activas: custodio.indisponibilidades_activas || [],
          disponibilidad_efectiva: custodio.disponibilidad_efectiva || 'disponible',
          categoria_disponibilidad: 'disponible', // FAIL-OPEN default
          conflictos_detectados: false,
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
                // Real schedule conflict - must use override
                custodioProcessed.disponibilidad_efectiva = 'temporalmente_indisponible';
                custodioProcessed.categoria_disponibilidad = 'no_disponible';
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
      const BATCH_SIZE = 25;
      // Reducir timeout si hay muchos custodios para evitar bloqueos
      const TIMEOUT_MS = custodiosDisponibles.length > 100 ? 2000 : 3000;
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

      // NUEVO: Separar en categorías según disponibilidad REAL (sin conflictos)
      const categorizado: CustodiosCategorizados = {
        disponibles: [],
        parcialmenteOcupados: [],
        ocupados: [],
        noDisponibles: []
      };

      for (const custodio of custodiosProcessed) {
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
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
}