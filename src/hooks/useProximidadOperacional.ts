import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calcularProximidadOperacional, type CustodioConHistorial, type ServicioNuevo, type ScoringProximidad } from '@/utils/proximidadOperacional';

export interface CustodioConProximidad extends CustodioConHistorial {
  scoring_proximidad?: ScoringProximidad;
  indisponibilidades_activas?: any[];
  disponibilidad_efectiva?: string;
}

/**
 * Hook para obtener custodios con scoring de proximidad operacional
 * Usa la función get_custodios_activos_disponibles() que filtra automáticamente por:
 * - Custodios con servicios completados en últimos 90 días O custodios nuevos (no migrados)
 * - Estado activo
 * - Disponibilidad efectiva considerando indisponibilidades
 * - Excluye custodios históricos sin actividad reciente (ahora marcados como inactivo_temporal)
 */
export function useCustodiosConProximidad(servicioNuevo?: ServicioNuevo) {
  return useQuery({
    queryKey: ['custodios-con-proximidad', servicioNuevo],
    queryFn: async () => {
      console.log('🔍 Obteniendo custodios con proximidad operacional...');
      
      // Usar la función segura que filtra custodios con actividad reciente (90 días)
      const { data: custodiosDisponibles, error } = await supabase
        .rpc('get_custodios_activos_disponibles');

      if (error) {
        console.error('❌ Error al obtener custodios disponibles:', error);
        throw error;
      }

      if (!custodiosDisponibles || custodiosDisponibles.length === 0) {
        console.log('⚠️ No se encontraron custodios disponibles');
        return [];
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

      // Procesar custodios y agregar scoring de proximidad
      const custodiosConProximidad: CustodioConProximidad[] = custodiosDisponibles.map(custodio => {
        const custodioProcessed: CustodioConProximidad = {
          ...custodio,
          fuente: 'custodios_operativos' as const,
          indisponibilidades_activas: custodio.indisponibilidades_activas || [],
          disponibilidad_efectiva: custodio.disponibilidad_efectiva
        };

        // Calcular scoring de proximidad solo si hay servicio nuevo
        if (servicioNuevo) {
          try {
            const scoring = calcularProximidadOperacional(
              custodioProcessed,
              servicioNuevo,
              serviciosProximos
            );
            custodioProcessed.scoring_proximidad = scoring;
          } catch (error) {
            console.error('❌ Error calculando proximidad para', custodio.nombre, error);
            // Scoring por defecto en caso de error
            custodioProcessed.scoring_proximidad = {
              score_total: 50,
              score_temporal: 50,
              score_geografico: 50,
              score_operacional: 50,
              detalles: {
                razones: ['Error en cálculo de proximidad']
              }
            };
          }
        }

        return custodioProcessed;
      });

      // Filtrar custodios temporalmente indisponibles
      const custodiosActivos = custodiosConProximidad.filter(custodio => 
        custodio.disponibilidad_efectiva !== 'temporalmente_indisponible'
      );

      // Ordenar por scoring de proximidad si existe, si no por score total operativo
      if (servicioNuevo) {
        custodiosActivos.sort((a, b) => {
          const scoreA = a.scoring_proximidad?.score_total || 0;
          const scoreB = b.scoring_proximidad?.score_total || 0;
          
          if (Math.abs(scoreB - scoreA) > 5) {
            return scoreB - scoreA; // Por proximidad
          }
          
          // Tiebreaker por score operativo total
          return (b.score_total || 0) - (a.score_total || 0);
        });
      } else {
        // Sin servicio específico, ordenar por score operativo
        custodiosActivos.sort((a, b) => (b.score_total || 0) - (a.score_total || 0));
      }

      console.log(`✅ Procesados ${custodiosActivos.length} custodios activos con proximidad`);
      return custodiosActivos;
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
}