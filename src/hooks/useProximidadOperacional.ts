import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calcularProximidadOperacional, type CustodioConHistorial, type ServicioNuevo, type ScoringProximidad, type FactorEquidad } from '@/utils/proximidadOperacional';

export interface CustodioConProximidad extends CustodioConHistorial {
  scoring_proximidad?: ScoringProximidad;
  indisponibilidades_activas?: any[];
  disponibilidad_efectiva?: string;
  categoria_disponibilidad?: 'libre' | 'parcialmente_ocupado' | 'ocupado_disponible' | 'no_disponible';
  datos_equidad?: FactorEquidad;
  
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
  disponibles: CustodioConProximidad[];      // 0-1 servicios hoy
  parcialmenteOcupados: CustodioConProximidad[]; // 2 servicios hoy  
  ocupados: CustodioConProximidad[];         // 2+ servicios pero disponibles
  noDisponibles: CustodioConProximidad[];    // Conflictos horarios o límites
}

/**
 * Hook para obtener custodios con scoring de proximidad operacional equitativo
 * Aplica algoritmo balanceado que considera:
 * - Proximidad operacional (60%)
 * - Factor de equidad/workload (25%) 
 * - Factor de oportunidad/rotación (15%)
 */
export function useCustodiosConProximidad(servicioNuevo?: ServicioNuevo) {
  return useQuery({
    queryKey: ['custodios-con-proximidad-equitativo', servicioNuevo],
    queryFn: async (): Promise<CustodiosCategorizados> => {
      console.log('🔍 Obteniendo custodios con algoritmo equitativo...');
      
      // Usar la función segura que filtra custodios con actividad reciente (90 días)
      const { data: custodiosDisponibles, error } = await supabase
        .rpc('get_custodios_activos_disponibles');

      if (error) {
        console.error('❌ Error al obtener custodios disponibles:', error);
        throw error;
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
            const { data: disponibilidadEquitativa } = await supabase.rpc('verificar_disponibilidad_equitativa_custodio', {
              p_custodio_id: custodio.id,
              p_custodio_nombre: custodio.nombre,
              p_fecha_servicio: servicioNuevo.fecha_programada,
              p_hora_inicio: servicioNuevo.hora_ventana_inicio,
              p_duracion_estimada_horas: 4
            });

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
              custodioProcessed.categoria_disponibilidad = factorEquidad.categoria_disponibilidad;

              // Si no está disponible, marcar como tal
              if (!disponibilidadEquitativa.disponible) {
                custodioProcessed.disponibilidad_efectiva = 'temporalmente_indisponible';
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

      // NUEVO: Separar en categorías según disponibilidad
      const categorizado: CustodiosCategorizados = {
        disponibles: [],
        parcialmenteOcupados: [],
        ocupados: [],
        noDisponibles: []
      };

      for (const custodio of custodiosProcessed) {
        // Filtrar completamente indisponibles
        if (custodio.disponibilidad_efectiva === 'temporalmente_indisponible') {
          categorizado.noDisponibles.push(custodio);
          continue;
        }

        // Categorizar por disponibilidad
        switch (custodio.categoria_disponibilidad) {
          case 'libre':
            categorizado.disponibles.push(custodio);
            break;
          case 'parcialmente_ocupado':
            categorizado.parcialmenteOcupados.push(custodio);
            break;
          case 'ocupado_disponible':
            categorizado.ocupados.push(custodio);
            break;
          default:
            categorizado.disponibles.push(custodio); // Fallback
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