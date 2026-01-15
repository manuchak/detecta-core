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

      // Procesar custodios con algoritmo equitativo
      const custodiosProcessed: CustodioConProximidad[] = [];
      
      for (const custodio of custodiosDisponibles) {
        const custodioProcessed: CustodioConProximidad = {
          ...custodio,
          fuente: 'custodios_operativos' as const,
          indisponibilidades_activas: custodio.indisponibilidades_activas || [],
          disponibilidad_efectiva: custodio.disponibilidad_efectiva,
          // Default values for performance card compatibility
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

        // NUEVO: Verificar disponibilidad equitativa si hay servicio nuevo
        if (servicioNuevo) {
          try {
            const { data: disponibilidadEquitativa, error: rpcError } = await supabase.rpc('verificar_disponibilidad_equitativa_custodio', {
              p_custodio_id: custodio.id,
              p_custodio_nombre: custodio.nombre,
              p_fecha_servicio: servicioNuevo.fecha_programada,
              p_hora_inicio: servicioNuevo.hora_ventana_inicio,
              p_duracion_estimada_horas: 4
            });

            if (rpcError) {
              console.warn(`⚠️ [useCustodiosConProximidad] RPC error for ${custodio.nombre}:`, {
                code: rpcError.code,
                message: rpcError.message,
                hint: rpcError.hint
              });
              
              // FALLBACK: Usar función de fallback mejorada que verifica conflictos reales
              try {
                const { verificarConflictosCustodio } = await import('@/utils/conflictDetection');
                
                const validacionConflictos = await verificarConflictosCustodio(
                  custodio.id,
                  custodio.nombre,
                  servicioNuevo.fecha_programada,
                  servicioNuevo.hora_ventana_inicio,
                  4
                );

                // Aplicar los resultados de la verificación de conflictos
                if (!validacionConflictos.disponible) {
                  custodioProcessed.disponibilidad_efectiva = 'temporalmente_indisponible';
                  custodioProcessed.categoria_disponibilidad = 'no_disponible';
                  custodioProcessed.conflictos_detectados = true;
                  custodioProcessed.razon_no_disponible = validacionConflictos.razon_no_disponible || 'Conflictos detectados';
                  custodioProcessed.indisponibilidades_activas = [
                    ...(custodioProcessed.indisponibilidades_activas || []),
                    {
                      motivo: validacionConflictos.razon_no_disponible || 'Conflictos detectados',
                      servicios_hoy: validacionConflictos.servicios_hoy,
                      conflictos_detalle: validacionConflictos.conflictos_detalle
                    }
                  ];
                } else {
                  // Mapear la categoría de disponibilidad
                  const mapearCategoria = (categoria: string): 'disponible' | 'parcialmente_ocupado' | 'ocupado' | 'no_disponible' => {
                    switch (categoria) {
                      case 'disponible': return 'disponible';
                      case 'parcialmente_ocupado': return 'parcialmente_ocupado';
                      case 'ocupado': return 'ocupado';
                      case 'no_disponible': return 'no_disponible';
                      default: return 'disponible';
                    }
                  };
                  
                  custodioProcessed.categoria_disponibilidad = mapearCategoria(validacionConflictos.categoria_disponibilidad);
                }
              } catch (fallbackError) {
                console.error(`❌ [useCustodiosConProximidad] Fallback also failed for ${custodio.nombre}:`, fallbackError);
                // Marcar como disponible por defecto si todo falla (fail-open)
                custodioProcessed.categoria_disponibilidad = 'disponible';
              }

              // Calcular scoring con información disponible
              const scoring = calcularProximidadOperacional(
                custodioProcessed,
                servicioNuevo,
                serviciosProximos
              );
              custodioProcessed.scoring_proximidad = scoring;
              
              custodiosProcessed.push(custodioProcessed);
              continue; // Skip to next custodian
            }

            if (disponibilidadEquitativa) {
              // Crear factor de equidad desde la respuesta de la función
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

  // Aplicar el mapeo
  custodioProcessed.categoria_disponibilidad = mapearCategoria(factorEquidad.categoria_disponibilidad);

              // Si no está disponible, marcar como tal
              if (!disponibilidadEquitativa.disponible) {
                custodioProcessed.disponibilidad_efectiva = 'temporalmente_indisponible';
                custodioProcessed.categoria_disponibilidad = 'no_disponible';
                custodioProcessed.conflictos_detectados = true;
                custodioProcessed.razon_no_disponible = disponibilidadEquitativa.razon_no_disponible || 'Límite de servicios alcanzado';
                custodioProcessed.indisponibilidades_activas = [
                  ...(custodioProcessed.indisponibilidades_activas || []),
                  {
                    motivo: disponibilidadEquitativa.razon_no_disponible || 'Límite de servicios alcanzado',
                    servicios_hoy: disponibilidadEquitativa.servicios_hoy,
                    nivel_fatiga: disponibilidadEquitativa.nivel_fatiga
                  }
                ];
              }

              // Calcular scoring de proximidad con factor de equidad
              const scoring = calcularProximidadOperacional(
                custodioProcessed,
                servicioNuevo,
                serviciosProximos,
                factorEquidad // NUEVO: Pasar factor de equidad
              );
              custodioProcessed.scoring_proximidad = scoring;
            }
          } catch (error: any) {
            console.warn('⚠️ Error verificando equidad:', error);
            // Fallback al algoritmo original sin equidad
            if (servicioNuevo) {
              const scoring = calcularProximidadOperacional(
                custodioProcessed,
                servicioNuevo,
                serviciosProximos
                // Sin factor de equidad - algoritmo original
              );
              custodioProcessed.scoring_proximidad = scoring;
            }
          }
        }

        custodiosProcessed.push(custodioProcessed);
      }

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

        // Categorizar solo custodios SIN conflictos
        switch (custodio.categoria_disponibilidad) {
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
            // No agregar a ninguna categoría de disponibles
            break;
          default:
            // Solo agregar a disponibles si NO tiene conflictos
            if (!custodio.conflictos_detectados) {
              categorizado.disponibles.push(custodio);
            } else {
              categorizado.noDisponibles.push(custodio);
            }
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